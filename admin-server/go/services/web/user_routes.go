package web

import (
	"errors"
	"github.com/gin-gonic/gin"
	"tableflow/go/pkg/auth"
	"tableflow/go/pkg/db"
	"tableflow/go/pkg/util"
)

// TODO: ********** UPDATE THIS TEST FUNCTION TO ACTUALLY RETURN IF THE USER IS IN THE WORKSPACE **********
// TODO: ********** UPDATE THIS TEST FUNCTION TO ACTUALLY RETURN IF THE USER IS IN THE WORKSPACE **********
// TODO: ********** UPDATE THIS TEST FUNCTION TO ACTUALLY RETURN IF THE USER IS IN THE WORKSPACE **********
// TODO: ********** UPDATE THIS TEST FUNCTION TO ACTUALLY RETURN IF THE USER IS IN THE WORKSPACE **********
// TODO: ********** UPDATE THIS TEST FUNCTION TO ACTUALLY RETURN IF THE USER IS IN THE WORKSPACE **********
// TODO: ********** UPDATE THIS TEST FUNCTION TO ACTUALLY RETURN IF THE USER IS IN THE WORKSPACE **********
// TODO: ********** UPDATE THIS TEST FUNCTION TO ACTUALLY RETURN IF THE USER IS IN THE WORKSPACE **********
func validateUserInWorkspace(c *gin.Context, workspaceID string) (string, error) {
	if 1 == 1 {
		return "6356de69-df45-4271-ba19-e03671fe2b91", nil
	}
	if len(workspaceID) == 0 {
		return "", errors.New("Invalid workspace ID")
	}
	userID := auth.GetUserID(c)
	if len(userID) == 0 {
		return "", errors.New("User not logged in")
	}
	if authorized, err := db.IsUserInWorkspace(workspaceID, userID); !authorized {
		if err != nil {
			util.Log.Errorw("Error checking if user is in workspace", "error", err, "workspace_id", workspaceID, "user_id", userID)
		}
		return "", errors.New("User not in workspace")
	}
	return userID, nil
}

//type UserRequest struct {
//	Email string `json:"email" example:"test@example.com"`
//	Role  string `json:"role" example:"user"`
//}
//
//type UsersRequest struct {
//	Users []UserRequest `json:"users"`
//}
//
//// createUser
////
////	@Summary		Create user
////	@Description	Create a user
////	@Tags			User
////	@Success		200	{object}	model.User
////	@Failure		400	{object}	Res
////	@Router			/admin/v1/user [post]
////	@Param			body	body	UserRequest	true	"Request body"
//func createUser(c *gin.Context) {
//	req := UserRequest{}
//	if err := c.BindJSON(&req); err != nil {
//		util.Log.Warnw("Could not bind JSON", "error", err)
//		c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: err.Error()})
//		return
//	}
//	// Basic validation
//	if !util.IsEmailValid(req.Email) {
//		c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: "Invalid email"})
//		return
//	}
//	user, err := CreateUser(req.Email, req.Role)
//	if err != nil {
//		c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: err.Error()})
//		return
//	}
//	c.JSON(http.StatusOK, *user)
//}
//
//// getUser
////
////	@Summary		Get user
////	@Description	Get a single user
////	@Tags			User
////	@Success		200	{object}	model.User
////	@Failure		400	{object}	Res
////	@Router			/admin/v1/user/{id} [get]
////	@Param			id	path	string	true	"User ID"
//func getUser(c *gin.Context) {
//	id := c.Param("id")
//	if len(id) == 0 {
//		c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: "No User ID provided"})
//		return
//	}
//	user, err := db.GetUser(id)
//	if err != nil {
//		c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: err.Error()})
//		return
//	}
//	c.JSON(http.StatusOK, user)
//}
//
//// createUsers
////
////	@Summary		Create users
////	@Description	Create multiple users
////	@Tags			User
////	@Success		200	{object}	[]model.User
////	@Failure		400	{object}	Res
////	@Router			/admin/v1/users [post]
////	@Param			body	body	UsersRequest	true	"Request body"
//func createUsers(c *gin.Context) {
//	req := UsersRequest{}
//	if err := c.BindJSON(&req); err != nil {
//		util.Log.Warnw("Could not bind JSON", "error", err)
//		c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: err.Error()})
//		return
//	}
//	type emailErr struct {
//		email string
//		err   error
//	}
//	users := make([]model.User, 0)
//	errArr := make([]emailErr, 0)
//	for _, userReq := range req.Users {
//		if !util.IsEmailValid(userReq.Email) {
//			errArr = append(errArr, emailErr{email: userReq.Email, err: errors.New("Invalid email")})
//			continue
//		}
//		user, err := CreateUser(userReq.Email, userReq.Role)
//		if err != nil {
//			errArr = append(errArr, emailErr{email: userReq.Email, err: err})
//			continue
//		}
//		users = append(users, *user)
//	}
//	if len(errArr) != 0 {
//		errCsv := strings.Join(lo.Map(errArr, func(e emailErr, _ int) string {
//			return fmt.Sprintf("%v: %v", e.email, e.err.Error())
//		}), " \n")
//		c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: errCsv})
//		return
//	}
//	c.JSON(http.StatusOK, users)
//}
//
//// getUsers
////
////	@Summary		Get users
////	@Description	Get a list of users
////	@Tags			User
////	@Success		200	{object}	[]model.User
////	@Failure		400	{object}	Res
////	@Router			/admin/v1/users [get]
//func getUsers(c *gin.Context) {
//	users, err := db.GetUsers()
//	if err != nil {
//		c.AbortWithStatusJSON(http.StatusBadGateway, Res{Err: err.Error()})
//		return
//	}
//	c.JSON(http.StatusOK, users)
//}
//
//// editUser
////
////	@Summary		Edit user
////	@Description	Edit a user
////	@Tags			User
////	@Success		200	{object}	model.User
////	@Failure		400	{object}	Res
////	@Router			/admin/v1/user/{id} [post]
////	@Param			id		path	string		true	"User ID"
////	@Param			body	body	UserRequest	true	"Request body"
//// TODO: Update this to use pointers on request object to determine if fields exist, check editImporter
//func editUser(c *gin.Context) {
//	id := c.Param("id")
//	if len(id) == 0 {
//		c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: "No User ID provided"})
//		return
//	}
//	req := UserRequest{}
//	if err := c.BindJSON(&req); err != nil {
//		util.Log.Warnw("Could not bind JSON", "error", err)
//		c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: err.Error()})
//		return
//	}
//	user, err := db.GetUser(id)
//	if err != nil {
//		c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: err.Error()})
//		return
//	}
//	role := user.Role
//
//	// TODO: Update logic for editing so if multiple fields are being changed it will rollback if a later update fails
//
//	// Change any field that exists on the request and are different
//	if len(req.Role) != 0 && req.Role != role {
//		if req.Role == auth.RoleOwner {
//			c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: "Cannot change role to owner"})
//			return
//		}
//		if role == auth.RoleOwner {
//			c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: "Owner role cannot be changed"})
//			return
//		}
//		addResp, err := userroles.AddRoleToUser(id, req.Role, nil)
//		if err != nil {
//			util.Log.Warnw("Could not add role to user", "error", err)
//			c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: "Could not add role to user"})
//			return
//		}
//		if addResp.UnknownRoleError != nil {
//			c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: fmt.Sprintf("Role %v does not exist", req.Role)})
//			return
//		}
//		removeResp, err := userroles.RemoveUserRole(id, role, nil)
//		if err != nil {
//			util.Log.Warnw("Could not remove existing user role", "error", err)
//			c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: "Could not remove existing user role"})
//			return
//		}
//		if removeResp.UnknownRoleError != nil {
//			c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: fmt.Sprintf("Existing user role %v does not exist", role)})
//			return
//		}
//		role = req.Role
//	}
//
//	email := user.Email
//	if len(req.Email) != 0 && req.Email != user.Email {
//		if !util.IsEmailValid(req.Email) {
//			c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: "Invalid email"})
//			return
//		}
//		updateResp, err := emailpassword.UpdateEmailOrPassword(user.ID.String(), &req.Email, nil, nil)
//		if err != nil {
//			c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: err.Error()})
//			return
//		}
//		if updateResp.EmailAlreadyExistsError != nil {
//			c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: "Email already exists"})
//			return
//		}
//		email = req.Email
//	}
//	c.JSON(http.StatusOK, model.User{
//		ID:         user.ID,
//		Email:      email,
//		Role:       role,
//		TimeJoined: user.TimeJoined,
//	})
//}
//
//// deleteUser
////
////	@Summary		Delete user
////	@Description	Delete a user
////	@Tags			User
////	@Success		200	{object}	Res
////	@Failure		400	{object}	Res
////	@Router			/admin/v1/user/{id} [delete]
////	@Param			id	path	string	true	"User ID"
//func deleteUser(c *gin.Context) {
//	id := c.Param("id")
//	if len(id) == 0 {
//		c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: "No User ID provided"})
//		return
//	}
//	user, err := db.GetUser(id)
//	if err != nil {
//		c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: err.Error()})
//		return
//	}
//	// Don't allow the user to delete themselves
//	if user.ID.String() == auth.GetUserID(c) {
//		c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: "Cannot delete your own user"})
//		return
//	}
//	// Don't allow the owner to be deleted
//	if user.Role == auth.RoleOwner {
//		c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: "The account owner cannot be deleted"})
//		return
//	}
//	err = supertokens.DeleteUser(id)
//	if err != nil {
//		util.Log.Warnw("Could not delete user", "error", err)
//		c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: err.Error()})
//		return
//	}
//	c.JSON(http.StatusOK, Res{Message: "ok"})
//}
//
//// response
////
////	@Summary		Get roles
////	@Description	Get user roles
////	@Tags			User
////	@Success		200	{object}	[]model.Role
////	@Router			/admin/v1/roles [get]
//func getRoles(c *gin.Context) {
//	rolesResp, err := userroles.GetAllRoles(nil)
//	if err != nil {
//		c.AbortWithStatusJSON(http.StatusInternalServerError, Res{Err: err.Error()})
//		return
//	}
//	if rolesResp.OK == nil {
//		c.AbortWithStatusJSON(http.StatusInternalServerError, Res{Err: "Could not load roles"})
//		return
//	}
//	roles := lo.Map(rolesResp.OK.Roles, func(r string, _ int) model.Role {
//		role := model.Role{Name: r}
//		permResp, err := userroles.GetPermissionsForRole(r, nil)
//		if err != nil || permResp.OK == nil {
//			util.Log.Warnw("Could not get permissions for role", "error", err, "role", r)
//			return role
//		}
//		role.Permissions = permResp.OK.Permissions
//		return role
//	})
//	c.JSON(http.StatusOK, roles)
//}
//
//func CreateUser(email, role string) (*model.User, error) {
//	signUpResult, err := emailpassword.SignUp(email, auth.InviteGeneratorKey)
//	if err != nil {
//		util.Log.Warnw("Could not sign user up", "error", err)
//		return nil, err
//	}
//	if signUpResult.EmailAlreadyExistsError != nil {
//		return nil, errors.New(fmt.Sprintf("A user already exists with the email %s", email))
//	}
//	// Assign role to user
//	if len(role) == 0 {
//		// If not role is provided, assign the user role
//		role = auth.RoleUser
//	}
//	addRoleResult, err := userroles.AddRoleToUser(signUpResult.OK.User.ID, role, nil)
//	if err != nil {
//		return nil, err
//	}
//	if addRoleResult.UnknownRoleError != nil {
//		return nil, errors.New(fmt.Sprintf("Role does not exist %s", role))
//	}
//	// We successfully created the user, now send them an invitation link
//	passwordResetToken, err := emailpassword.CreateResetPasswordToken(signUpResult.OK.User.ID)
//	if err != nil {
//		util.Log.Warnw("Could not create reset password token", "error", err)
//		return nil, err
//	}
//	inviteLink := fmt.Sprintf("%s/auth/reset-password?token=%s&invite=true", env.WebAppURL, passwordResetToken.OK.Token)
//	err = emailpassword.SendEmail(emaildelivery.EmailType{
//		PasswordReset: &emaildelivery.PasswordResetType{
//			User: emaildelivery.User{
//				ID:    signUpResult.OK.User.ID,
//				Email: signUpResult.OK.User.Email,
//			},
//			PasswordResetLink: inviteLink,
//		},
//	})
//	if err != nil {
//		util.Log.Warnw("Could not send invite link", "error", err)
//		return nil, err
//	}
//	return &model.User{
//		ID:         model.ParseID(signUpResult.OK.User.ID),
//		Email:      signUpResult.OK.User.Email,
//		Role:       role,
//		TimeJoined: signUpResult.OK.User.TimeJoined,
//	}, nil
//}
