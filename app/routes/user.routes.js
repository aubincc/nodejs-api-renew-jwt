import { authJwt } from "../middleware/index.js";
import controller from "../controllers/user.controller.js";

const userRoutes = (app) => {
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Headers", "Authorization, Origin, Content-Type, Accept");
    next();
  });

  /**
   * @openapi
   * /user/{id}:
   *   post:
   *     summary: to edit a user's information
   *     tags:
   *       - user
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: The user ID
   *         example: 1
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             properties:
   *               email:
   *                 type: string
   *                 description: The user's new email
   *                 example: a.new.email@address.com
   *                 required: false
   *               name:
   *                 type: string
   *                 description: The user's new name
   *                 example: Doe
   *                 required: false
   *               firstname:
   *                 type: string
   *                 description: The user's new firstname
   *                 example: John
   *                 required: false
   *     responses:
   *       200:
   *         description: Successfully edited user.
   *       403:
   *         description: Forbidden! JWT not valid!
   *       401:
   *         description: Unauthorized! JWT expired!
   */
  app.post("/user/:id", [authJwt.verifyJwt, authJwt.isSelfOrHasPermission([{ USER: "update" }])], controller.userEdit);

  /**
   * @openapi
   * /user/{id}/group:
   *   post:
   *     summary: to edit a user's groups list
   *     tags:
   *       - user
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: The user ID
   *         example: 2
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             properties:
   *               groups:
   *                 type: object
   *                 description: The groups to add the user to and remove from the user from
   *                 properties:
   *                   add:
   *                     type: array
   *                     description: The group IDs to add the user to
   *                     example: [1]
   *                   del:
   *                     type: array
   *                     description: The group IDs to remove the user from
   *                     example: [3, 2]
   *     responses:
   *       200:
   *         description: Successfully edited users's groups list.
   *       403:
   *         description: Forbidden! JWT not valid!
   *       401:
   *         description: Unauthorized! JWT expired!
   */
  app.post(
    "/user/:id/group",
    [authJwt.verifyJwt, authJwt.hasPermission([{ USER_GROUP: "update" }])],
    controller.userSetGroup
  );

  /**
   * @openapi
   * /user:
   *   get:
   *     summary: to retrieve the user list
   *     tags:
   *       - user
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 20
   *         description: The number of items to return per page
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: The page number to show
   *       - in: query
   *         name: email
   *         schema:
   *           type: string
   *           default:
   *         description: To filter by email
   *       - in: query
   *         name: name
   *         schema:
   *           type: string
   *           default:
   *         description: To filter by name
   *       - in: query
   *         name: firstname
   *         schema:
   *           type: string
   *           default:
   *         description: To filter by firstname
   *       - in: query
   *         name: id
   *         schema:
   *           type: integer
   *           default:
   *         description: To filter by id (only for the admins)
   *       - in: query
   *         name: sort_by
   *         schema:
   *           type: string
   *           default: name
   *         description: To sort by name, firstname, email
   *       - in: query
   *         name: sort_order
   *         schema:
   *           type: string
   *           default: DESC
   *         description: To sort ASC or DESC
   *     responses:
   *       200:
   *         description: User list successfully retrieved
   *       403:
   *         description: Forbidden! JWT not valid!
   *       401:
   *         description: Unauthorized! JWT expired!
   */
  app.get("/user", [authJwt.verifyJwt, authJwt.hasPermission([{ USER: "read" }])], controller.userList);

  /**
   * @openapi
   * /user/{id}:
   *   get:
   *     summary: to retrieve a user's data
   *     tags:
   *       - user
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: The user ID
   *         example: 1
   *     responses:
   *       200:
   *         description: Successfully retrieved user data.
   *       403:
   *         description: Forbidden! JWT not valid!
   *       401:
   *         description: Unauthorized! JWT expired!
   */
  app.get("/user/:id", [authJwt.verifyJwt, authJwt.isSelfOrHasPermission([{ USER: "read" }])], controller.userView);

  /**
   * @openapi
   * /user/{id}/activity:
   *   get:
   *     summary: to show a user's known activity
   *     tags:
   *       - user
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: The user ID
   *         example: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 5
   *         description: The number of items to return per page (1 only for non-admins)
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: The page number to show (page 1 only for non-admins)
   *       - in: query
   *         name: sort_order
   *         schema:
   *           type: string
   *           default: ASC
   *         description: To sort ASC or DESC (DESC only for non-admins)
   *     responses:
   *       200:
   *         description: Successfully retrieved user activity.
   *       403:
   *         description: Forbidden! JWT not valid!
   *       401:
   *         description: Unauthorized! JWT expired!
   */
  app.get(
    "/user/:id/activity",
    [authJwt.verifyJwt, authJwt.hasPermission([{ USER_ACTIVITY: "read" }])],
    controller.userActivity
  );

  /**
   * @openapi
   * /user/{id}/permission:
   *   get:
   *     summary: to show a user's resource permissions
   *     tags:
   *       - user
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Successfully retrieved user permissions.
   *       403:
   *         description: Forbidden! JWT not valid!
   *       401:
   *         description: Unauthorized! JWT expired!
   */
  app.get(
    "/user/:id/permission",
    [authJwt.verifyJwt, authJwt.hasPermission([{ USER_PERMISSION: "read" }])],
    controller.userPermission
  );

  /**
   * @openapi
   * /user/{id}/group:
   *   get:
   *     summary: to show a user's groups
   *     tags:
   *       - user
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Successfully retrieved user groups.
   *       403:
   *         description: Forbidden! JWT not valid!
   *       401:
   *         description: Unauthorized! JWT expired!
   */
  app.get(
    "/user/:id/group",
    [authJwt.verifyJwt, authJwt.hasPermission([{ USER_GROUP: "read" }])],
    controller.userGroup
  );
};

export default userRoutes;
