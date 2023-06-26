package auth

import (
	"errors"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/guregu/null"
	"github.com/samber/lo"
	"github.com/supertokens/supertokens-golang/ingredients/emaildelivery"
	"github.com/supertokens/supertokens-golang/recipe/dashboard"
	"github.com/supertokens/supertokens-golang/recipe/dashboard/dashboardmodels"
	"github.com/supertokens/supertokens-golang/recipe/emailpassword/epmodels"
	"github.com/supertokens/supertokens-golang/recipe/emailverification"
	"github.com/supertokens/supertokens-golang/recipe/emailverification/evmodels"
	"github.com/supertokens/supertokens-golang/recipe/session"
	"github.com/supertokens/supertokens-golang/recipe/thirdparty"
	"github.com/supertokens/supertokens-golang/recipe/thirdparty/tpmodels"
	"github.com/supertokens/supertokens-golang/recipe/thirdpartyemailpassword"
	"github.com/supertokens/supertokens-golang/recipe/thirdpartyemailpassword/tpepmodels"
	"github.com/supertokens/supertokens-golang/recipe/userroles"
	"github.com/supertokens/supertokens-golang/recipe/userroles/userrolesclaims"
	"github.com/supertokens/supertokens-golang/supertokens"
	"net/url"
	"os"
	"strconv"
	"strings"
	"tableflow/go/pkg/db"
	"tableflow/go/pkg/env"
	"tableflow/go/pkg/model"
	"tableflow/go/pkg/util"
)

// InviteGeneratorKey User accounts created with this password will trigger an email invitation.
// This can only be performed by the admin so this is not sensitive, it just needs to be something that a user
// would not normally set as their password.
var InviteGeneratorKey = "ca1d010e09be081cc85aa0b16e4ac44d"
var (
	RoleOwner           = "owner"
	RoleAdmin           = "admin"
	RoleUser            = "user"
	PermUsersManage     = "users_manage"
	PermImportersRead   = "importers_read"
	PermImportersCreate = "importers_create"
	PermImportersEdit   = "importers_edit"
	PermImportersDelete = "importers_delete"
)
var defaultRoles = []model.Role{
	{
		Name:        RoleOwner,
		Permissions: []string{PermUsersManage, PermImportersRead, PermImportersCreate, PermImportersEdit, PermImportersDelete},
	},
	{
		Name:        RoleAdmin,
		Permissions: []string{PermUsersManage, PermImportersRead, PermImportersCreate, PermImportersEdit, PermImportersDelete},
	},
	{
		Name:        RoleUser,
		Permissions: []string{PermImportersRead},
	},
}
var authInitialized bool

func InitAuth() error {
	if authInitialized {
		return errors.New("auth already initialized")
	}
	authInitialized = true

	apiBasePath := "/auth"
	websiteBasePath := "/auth"
	_, websiteDomain, _ := strings.Cut(env.WebAppURL, "://")
	tpepConfig := &tpepmodels.TypeInput{
		EmailDelivery: &emaildelivery.TypeInput{
			Override: func(originalImplementation emaildelivery.EmailDeliveryInterface) emaildelivery.EmailDeliveryInterface {
				*originalImplementation.SendEmail = func(input emaildelivery.EmailType, userContext supertokens.UserContext) error {
					return sendResetOrInviteEmail(input)
				}
				return originalImplementation
			},
		},
		Override: &tpepmodels.OverrideStruct{
			APIs: func(originalImplementation tpepmodels.APIInterface) tpepmodels.APIInterface {
				originalEmailPasswordSignUpPOST := *originalImplementation.EmailPasswordSignUpPOST
				originalEmailPasswordSignInPOST := *originalImplementation.EmailPasswordSignInPOST
				originalThirdPartySignInUpPOST := *originalImplementation.ThirdPartySignInUpPOST

				// Override the email password sign up API
				*originalImplementation.EmailPasswordSignUpPOST = func(ff []epmodels.TypeFormField, i epmodels.APIOptions, uc supertokens.UserContext) (tpepmodels.SignUpPOSTResponse, error) {
					// Add pre sign up logic here
					resp, err := originalEmailPasswordSignUpPOST(ff, i, uc)
					if err != nil {
						return tpepmodels.SignUpPOSTResponse{}, err
					}
					if resp.OK != nil {
						// Add post sign up logic here
						err = postSignUpAccountSetup(resp.OK.User.ID, resp.OK.User.Email)
						if err != nil {
							return tpepmodels.SignUpPOSTResponse{}, err
						}
					}
					return resp, err
				}
				// Override the email password sign in API
				*originalImplementation.EmailPasswordSignInPOST = func(ff []epmodels.TypeFormField, o epmodels.APIOptions, uc supertokens.UserContext) (tpepmodels.SignInPOSTResponse, error) {
					// Add pre sign in logic here
					resp, err := originalEmailPasswordSignInPOST(ff, o, uc)
					if err != nil {
						return tpepmodels.SignInPOSTResponse{}, err
					}
					if resp.OK != nil {
						// Add post sign in logic here
					}
					return resp, err
				}
				// Override the thirdparty sign in/up API
				*originalImplementation.ThirdPartySignInUpPOST = func(p tpmodels.TypeProvider, code string, authCodeResponse interface{}, redirectURI string, o tpmodels.APIOptions, uc supertokens.UserContext) (tpepmodels.ThirdPartyOutput, error) {
					// Add pre sign in / up logic here
					resp, err := originalThirdPartySignInUpPOST(p, code, authCodeResponse, redirectURI, o, uc)
					if err != nil {
						return tpepmodels.ThirdPartyOutput{}, err
					}
					if resp.OK != nil {
						if resp.OK.CreatedNewUser {
							// Add post sign up logic here
							err = postSignUpAccountSetup(resp.OK.User.ID, resp.OK.User.Email)
							if err != nil {
								return tpepmodels.ThirdPartyOutput{}, err
							}
						} else {
							// Add post sign in logic here
						}
					}
					return resp, err
				}
				return originalImplementation
			},
		},
		Providers: []tpmodels.TypeProvider{},
	}
	oauthProviderGoogleClientID := os.Getenv("OAUTH_PROVIDER_GOOGLE_CLIENT_ID")
	oauthProviderGoogleClientSecret := os.Getenv("OAUTH_PROVIDER_GOOGLE_CLIENT_SECRET")
	oauthProviderGitHubClientID := os.Getenv("OAUTH_PROVIDER_GITHUB_CLIENT_ID")
	oauthProviderGitHubClientSecret := os.Getenv("OAUTH_PROVIDER_GITHUB_CLIENT_SECRET")
	if len(oauthProviderGoogleClientID) != 0 && len(oauthProviderGoogleClientSecret) != 0 {
		tpepConfig.Providers = append(tpepConfig.Providers, thirdparty.Google(tpmodels.GoogleConfig{
			ClientID:     oauthProviderGoogleClientID,
			ClientSecret: oauthProviderGoogleClientSecret,
		}))
	}
	if len(oauthProviderGitHubClientID) != 0 && len(oauthProviderGitHubClientSecret) != 0 {
		tpepConfig.Providers = append(tpepConfig.Providers, thirdparty.Github(tpmodels.GithubConfig{
			ClientID:     oauthProviderGitHubClientID,
			ClientSecret: oauthProviderGitHubClientSecret,
		}))
	}
	recipeList := []supertokens.Recipe{
		thirdpartyemailpassword.Init(tpepConfig),
		emailverification.Init(evmodels.TypeInput{
			Mode: evmodels.ModeRequired,
			EmailDelivery: &emaildelivery.TypeInput{
				Override: func(originalImplementation emaildelivery.EmailDeliveryInterface) emaildelivery.EmailDeliveryInterface {
					*originalImplementation.SendEmail = func(input emaildelivery.EmailType, userContext supertokens.UserContext) error {
						return sendEmail(emailAPIRequest{
							Email:  input.EmailVerification.User.Email,
							UserId: input.EmailVerification.User.ID,
							Link:   input.EmailVerification.EmailVerifyLink,
							Type:   "verification",
						})
					}
					return originalImplementation
				},
			},
		}),
		//emailpassword.Init(&epmodels.TypeInput{
		//EmailDelivery: &emaildelivery.TypeInput{
		//	Override: func(originalImplementation emaildelivery.EmailDeliveryInterface) emaildelivery.EmailDeliveryInterface {
		//		*originalImplementation.SendEmail = func(input emaildelivery.EmailType, userContext supertokens.UserContext) error {
		//			return sendResetOrInviteEmail(input)
		//		}
		//		return originalImplementation
		//	},
		//},
		//Override: &epmodels.OverrideStruct{
		//	APIs: func(originalImplementation epmodels.APIInterface) epmodels.APIInterface {
		//		// Disable the public facing sign up API
		//		originalImplementation.SignUpPOST = nil
		//		return originalImplementation
		//	},
		//	Functions: func(originalImplementation epmodels.RecipeInterface) epmodels.RecipeInterface {
		//		ogResetPasswordUsingToken := *originalImplementation.ResetPasswordUsingToken
		//		ogSignIn := *originalImplementation.SignIn
		//		ogUpdateEmailOrPassword := *originalImplementation.UpdateEmailOrPassword
		//		*originalImplementation.UpdateEmailOrPassword = func(userId string, email, password *string, userContext supertokens.UserContext) (epmodels.UpdateEmailOrPasswordResponse, error) {
		//			// This can be called on the backend in our own APIs
		//			if password != nil && *password == InviteGeneratorKey {
		//				return epmodels.UpdateEmailOrPasswordResponse{}, errors.New("use a different password")
		//			}
		//			return ogUpdateEmailOrPassword(userId, email, password, userContext)
		//		}
		//		*originalImplementation.ResetPasswordUsingToken = func(token, newPassword string, userContext supertokens.UserContext) (epmodels.ResetPasswordUsingTokenResponse, error) {
		//			// This is called during the password reset flow when the user enters their new password
		//			if newPassword == InviteGeneratorKey {
		//				return epmodels.ResetPasswordUsingTokenResponse{
		//					ResetPasswordInvalidTokenError: &struct{}{},
		//				}, nil
		//			}
		//			return ogResetPasswordUsingToken(token, newPassword, userContext)
		//		}
		//		*originalImplementation.SignIn = func(email, password string, userContext supertokens.UserContext) (epmodels.SignInResponse, error) {
		//			// This is called in the email password sign in API
		//			if password == InviteGeneratorKey {
		//				return epmodels.SignInResponse{
		//					WrongCredentialsError: &struct{}{},
		//				}, nil
		//			}
		//			return ogSignIn(email, password, userContext)
		//		}
		//		return originalImplementation
		//	},
		//},
		//}),
		session.Init(nil),
		userroles.Init(nil),
	}
	adminAPIKey := os.Getenv("SUPERTOKENS_ADMIN_API_KEY")
	if len(adminAPIKey) != 0 {
		recipeList = append(recipeList, dashboard.Init(&dashboardmodels.TypeInput{
			ApiKey: adminAPIKey,
		}))
	}
	config := supertokens.TypeInput{
		Supertokens: &supertokens.ConnectionInfo{
			ConnectionURI: fmt.Sprintf("%v:%v", os.Getenv("SUPERTOKENS_HOST"), os.Getenv("SUPERTOKENS_PORT")),
			APIKey:        os.Getenv("SUPERTOKENS_API_KEY"),
		},
		AppInfo: supertokens.AppInfo{
			AppName:         "TableFlow",
			APIDomain:       env.APIServerURL,
			WebsiteDomain:   websiteDomain,
			APIBasePath:     &apiBasePath,
			WebsiteBasePath: &websiteBasePath,
		},
		RecipeList: recipeList,
	}
	err := supertokens.Init(config)
	if err != nil {
		return err
	}
	err = initDefaultRoles()
	return err
}

func postSignUpAccountSetup(userID, email string) error {
	// Assign owner role to user
	addRoleResult, err := userroles.AddRoleToUser(userID, RoleOwner, nil)
	if err != nil {
		util.Log.Errorw("Error adding owner role to user after signup", "user_id", userID)
		return err
	}
	if addRoleResult.UnknownRoleError != nil {
		util.Log.Errorw("Owner role does not exist trying to add role after signup", "user_id", userID)
		return err
	}
	// Create organization and workspace
	user := model.User{ID: model.ParseID(userID)}
	organization := &model.Organization{
		ID:        model.NewID(),
		Name:      "My Organization",
		CreatedBy: user.ID,
		UpdatedBy: user.ID,
	}
	workspace := &model.Workspace{
		ID:             model.NewID(),
		OrganizationID: organization.ID,
		Name:           "My Workspace",
		CreatedBy:      user.ID,
		UpdatedBy:      user.ID,
	}
	workspaceLimit := &model.WorkspaceLimit{
		ID:              model.NewID(),
		WorkspaceID:     workspace.ID,
		Users:           null.IntFromPtr(nil),
		Importers:       null.IntFromPtr(nil),
		Files:           null.IntFrom(100),
		Rows:            null.IntFromPtr(nil),
		RowsPerImport:   null.IntFrom(10000),
		ProcessedValues: null.IntFromPtr(nil),
	}
	importer := &model.Importer{
		ID:          model.NewID(),
		WorkspaceID: workspace.ID,
		Name:        "Example Importer",
		CreatedBy:   user.ID,
		UpdatedBy:   user.ID,
		Template:    nil,
	}
	template := &model.Template{
		ID:          model.NewID(),
		WorkspaceID: workspace.ID,
		ImporterID:  importer.ID,
		Name:        "Default Template",
		CreatedBy:   user.ID,
		UpdatedBy:   user.ID,
	}
	templateColumns := &[]*model.TemplateColumn{
		{
			ID:         model.NewID(),
			TemplateID: template.ID,
			Name:       "First Name",
			Key:        "first_name",
			Required:   false,
			CreatedBy:  user.ID,
			UpdatedBy:  user.ID,
		},
		{
			ID:         model.NewID(),
			TemplateID: template.ID,
			Name:       "Last Name",
			Key:        "last_name",
			Required:   false,
			CreatedBy:  user.ID,
			UpdatedBy:  user.ID,
		},
		{
			ID:         model.NewID(),
			TemplateID: template.ID,
			Name:       "Email",
			Key:        "email",
			Required:   true,
			CreatedBy:  user.ID,
			UpdatedBy:  user.ID,
		},
	}
	err = db.DB.Create(organization).Error
	if err != nil {
		util.Log.Errorw("Error creating organization after sign up", "user_id", userID, "organization_id", organization.ID)
		return err
	}
	err = db.DB.Create(workspace).Error
	if err != nil {
		util.Log.Errorw("Error creating workspace after sign up", "user_id", userID, "workspace_id", workspace.ID)
		return err
	}
	err = db.DB.Create(workspaceLimit).Error
	if err != nil {
		util.Log.Errorw("Error creating workspace limit after sign up", "user_id", userID, "workspace_id", workspace.ID)
		return err
	}
	err = db.DB.Exec("insert into organization_users (organization_id, user_id) values (?, ?);", organization.ID, user.ID).Error
	if err != nil {
		util.Log.Errorw("Error adding user to organization after sign up", "user_id", userID, "organization_id", organization.ID)
		return err
	}
	err = db.DB.Exec("insert into workspace_users (workspace_id, user_id) values (?, ?);", workspace.ID, user.ID).Error
	if err != nil {
		util.Log.Errorw("Error adding user to workspace after sign up", "user_id", userID, "workspace_id", workspace.ID)
		return err
	}
	err = db.DB.Create(importer).Error
	if err != nil {
		util.Log.Errorw("Error creating importer after sign up", "user_id", userID, "workspace_id", workspace.ID)
		return err
	}
	err = db.DB.Create(template).Error
	if err != nil {
		util.Log.Errorw("Error creating template after sign up", "user_id", userID, "workspace_id", workspace.ID)
		return err
	}
	err = db.DB.Create(templateColumns).Error
	if err != nil {
		util.Log.Errorw("Error creating template columns after sign up", "user_id", userID, "workspace_id", workspace.ID)
		return err
	}

	// TODO: Update to check if env is production instead
	if env.APIServerURL == "https://api.tableflow.com" {
		util.SendSlackMessage(util.SlackChannelNewUsers, fmt.Sprintf(":tada: New User :tada: \nEmail: %s\nUser ID: %s", email, userID))
	}
	return nil
}

func initDefaultRoles() error {
	for _, role := range defaultRoles {
		resp, err := userroles.CreateNewRoleOrAddPermissions(role.Name, role.Permissions, nil)
		if err != nil {
			util.Log.Errorw("Error creating role", "error", err)
			return err
		}
		if resp.OK.CreatedNewRole == false {
			// The role already exists
			continue
		}
	}
	return nil
}

type emailAPIRequest struct {
	Email      string `json:"email"`
	UserId     string `json:"user_id"`
	InstanceId string `json:"instance_id"`
	Link       string `json:"link"`
	Type       string `json:"type"`
}

func sendResetOrInviteEmail(input emaildelivery.EmailType) error {
	u, err := url.ParseRequestURI(input.PasswordReset.PasswordResetLink)
	if err != nil {
		util.Log.Errorw("Could not parse email link URL", "error", err)
		return err
	}
	q := u.Query()
	inviteKey := "invite"
	isUserInvite := false
	if q.Has(inviteKey) {
		isUserInvite, _ = strconv.ParseBool(q.Get(inviteKey))
		q.Del(inviteKey) // TODO: If you want to use a different form on the frontend when invitations are implements, keep this param?
		u.RawQuery = q.Encode()
	}
	input.PasswordReset.PasswordResetLink = u.String()

	request := emailAPIRequest{
		Email:  input.PasswordReset.User.Email,
		UserId: input.PasswordReset.User.ID,
		Link:   input.PasswordReset.PasswordResetLink,
		Type:   lo.Ternary(isUserInvite, "invite", "reset"),
	}
	return sendEmail(request)
}

func sendEmail(request emailAPIRequest) error {
	instanceID, err := db.GetInstanceID()
	if err != nil {
		// Non-fatal, move on
		util.Log.Errorw("Could not retrieve instance ID", "error", err)
	}
	request.InstanceId = instanceID
	util.Log.Debugw("Sending email", "type", request.Type, "email", request.Email, "user_id", request.UserId)
	err = util.HTTPRequest("https://mail.tableflow.com/v1/email", "POST", request, map[string]string{"x-api-key": env.EmailServiceAPIKey})
	if err != nil {
		util.Log.Errorw("Error sending account email", "error", err)
		return err
	}
	return nil
}

func GetUserID(c *gin.Context) string {
	sessionContainer := session.GetSessionFromRequestContext(c.Request.Context())
	if sessionContainer == nil {
		return ""
	}
	return sessionContainer.GetUserID()
}

func GetUserRole(userID string) (string, error) {
	roles, err := userroles.GetRolesForUser(userID, nil)
	if err != nil {
		util.Log.Warnw("Could not retrieve user roles", "error", err)
		return "", errors.New("Could not retrieve user roles")
	}
	if roles.OK == nil || len(roles.OK.Roles) == 0 {
		return "", errors.New("No existing roles found for user")
	}
	if len(roles.OK.Roles) > 1 {
		return "", errors.New("User attached to multiple roles")
	}
	return roles.OK.Roles[0], nil
}

func HasPermission(c *gin.Context, permission string) bool {
	sessionContainer := session.GetSessionFromRequestContext(c.Request.Context())
	permissionClaimValue, err := session.GetClaimValue(sessionContainer.GetHandle(), userrolesclaims.PermissionClaim)
	if err != nil {
		util.Log.Errorw("Error retrieving permission claim value", "error", err)
		return false
	}
	if permissionClaimValue.OK == nil || permissionClaimValue.OK.Value == nil {
		util.Log.Warnw("No permission claim values present")
		return false
	}
	if perms, ok := permissionClaimValue.OK.Value.([]interface{}); ok {
		var perm interface{}
		perm = permission
		return lo.Contains(perms, perm)
	}
	return false
}
