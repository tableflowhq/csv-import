package web

import (
	"github.com/gin-gonic/gin"
	"github.com/supertokens/supertokens-golang/recipe/session"
	"github.com/supertokens/supertokens-golang/recipe/session/claims"
	"github.com/supertokens/supertokens-golang/recipe/session/sessmodels"
	"github.com/supertokens/supertokens-golang/recipe/userroles/userrolesclaims"
	"github.com/supertokens/supertokens-golang/supertokens"
	"net/http"
)

func initializeAdminRoutes(router *gin.Engine) {

	/* ---------------------------  Admin routes  ---------------------------- */

	v1 := router.Group("/admin/v1")
	v1.Use(verifySession(nil))

	/* User Management */
	//v1.POST("/user", allow(auth.PermUsersManage), createUser)
	//v1.GET("/user/:id", allow(auth.PermUsersManage), getUser)
	//v1.POST("/users", allow(auth.PermUsersManage), createUsers)
	//v1.GET("/users", allow(auth.PermUsersManage), getUsers)
	//v1.POST("/user/:id", allow(auth.PermUsersManage), editUser)
	//v1.DELETE("/user/:id", allow(auth.PermUsersManage), deleteUser)
	//v1.GET("/roles", allow(auth.PermUsersManage), getRoles)

	/* Organization */
	v1.GET("/organization-workspaces", getOrganizationWorkspaces)

	/* Workspace */
	v1.GET("/workspace/:id/api-key", getWorkspaceAPIKey)
	v1.POST("/workspace/:id/api-key", regenerateWorkspaceAPIKey)
	v1.GET("/workspace/:id/usage", getWorkspaceUsage)

	/* Importer */
	v1.POST("/importer", createImporter)
	v1.GET("/importer/:id", getImporter)
	v1.POST("/importer/:id", editImporter)
	v1.GET("/importers/:workspace-id", getImporters)

	/* Template */
	v1.GET("/template/:id", getTemplate)
	v1.POST("/template-column", createTemplateColumn)
	v1.DELETE("/template-column/:id", deleteTemplateColumn)

	/* Import */
	v1.GET("/import/:id", getImport)
	v1.GET("/imports/:workspace-id", getImports)

	/* Upload */
	v1.GET("/upload/:id", getUpload)
}

func allow(permission string) gin.HandlerFunc {
	verifySessionOptions := sessmodels.VerifySessionOptions{
		OverrideGlobalClaimValidators: func(gcv []claims.SessionClaimValidator, sc sessmodels.SessionContainer, uc supertokens.UserContext) ([]claims.SessionClaimValidator, error) {
			gcv = append(gcv, userrolesclaims.PermissionClaimValidators.Includes(permission, nil, nil))
			return gcv, nil
		},
	}
	return verifySession(&verifySessionOptions)
}

func verifySession(options *sessmodels.VerifySessionOptions) gin.HandlerFunc {
	return func(c *gin.Context) {
		session.VerifySession(options, func(rw http.ResponseWriter, r *http.Request) {
			c.Request = c.Request.WithContext(r.Context())
			c.Next()
		})(c.Writer, c.Request)
		// Call Abort so that the next handler in the chain is not called, unless Next is called explicitly
		c.Abort()
	}
}
