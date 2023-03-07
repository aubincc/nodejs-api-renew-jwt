import { authJwt } from "../middleware/index.js";
import controller from "../controllers/group.controller.js";

const groupRoutes = (app) => {
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Headers", "Authorization, Origin, Content-Type, Accept");
    next();
  });

  /**
   * @openapi
   * /group:
   *   get:
   *     summary: Retrieve the group list
   *     tags:
   *       - group
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
   *         name: name
   *         schema:
   *           type: string
   *           default:
   *         description: To filter by name
   *       - in: query
   *         name: sort_by
   *         schema:
   *           type: string
   *           default: name
   *         description: To sort by name
   *       - in: query
   *         name: sort_order
   *         schema:
   *           type: string
   *           default: DESC
   *         description: To sort ASC or DESC
   *     responses:
   *       200:
   *         description: Group list successfully retrieved
   *       403:
   *         description: Forbidden! JWT not valid!
   *       401:
   *         description: Unauthorized! JWT expired!
   */
  app.get("/group", [authJwt.verifyJwt, authJwt.hasPermission([{ GROUP: "read" }])], controller.groupList);

  /**
   * @openapi
   * /group/permission:
   *   get:
   *     summary: to retrieve a group's permissions list
   *     tags:
   *       - group
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: The group ID
   *         example: 1
   *     responses:
   *       200:
   *         description: Successfully retrieved groups permission list.
   *       403:
   *         description: Forbidden! JWT not valid!
   *       401:
   *         description: Unauthorized! JWT expired!
   */
  app.get(
    "/group/permission",
    [authJwt.verifyJwt, authJwt.hasPermission([{ GROUP_PERMISSION: "read" }])],
    controller.groupPermissionSnapshot
  );

  /**
   * @openapi
   * /group/{id}:
   *   get:
   *     summary: to retrieve a group's information
   *     tags:
   *       - group
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: The group ID
   *         example: 1
   *     responses:
   *       200:
   *         description: Successfully retrieved group data.
   *       403:
   *         description: Forbidden! JWT not valid!
   *       401:
   *         description: Unauthorized! JWT expired!
   */
  app.get("/group/:id", [authJwt.verifyJwt, authJwt.hasPermission([{ GROUP: "read" }])], controller.groupView);

  /**
   * @openapi
   * /group/{id}/user:
   *   get:
   *     summary: to retrieve a group's user list
   *     tags:
   *       - group
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: The group ID
   *         example: 1
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
   *         name: name
   *         schema:
   *           type: string
   *           default:
   *         description: To filter by name
   *       - in: query
   *         name: sort_by
   *         schema:
   *           type: string
   *           default: name
   *         description: To sort by name
   *       - in: query
   *         name: sort_order
   *         schema:
   *           type: string
   *           default: DESC
   *         description: To sort ASC or DESC
   *     responses:
   *       200:
   *         description: Successfully retrieved the 'group.name' group's users list.
   *       403:
   *         description: Forbidden! JWT not valid!
   *       401:
   *         description: Unauthorized! JWT expired!
   */
  app.get(
    "/group/:id/user",
    [authJwt.verifyJwt, authJwt.hasPermission([{ GROUP: "read" }, { USER_GROUP: "read" }])],
    controller.groupUserList
  );

  /**
   * @openapi
   * /group/{id}/permission:
   *   get:
   *     summary: to retrieve a group's permissions list
   *     tags:
   *       - group
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: The group ID
   *         example: 1
   *     responses:
   *       200:
   *         description: Successfully retrieved the 'group.name' group's permissions list.
   *       403:
   *         description: Forbidden! JWT not valid!
   *       401:
   *         description: Unauthorized! JWT expired!
   */
  app.get(
    "/group/:id/permission",
    [authJwt.verifyJwt, authJwt.hasPermission([{ GROUP_PERMISSION: "read" }])],
    controller.groupPermission
  );

  /**
   * @openapi
   * /group:
   *   post:
   *     summary: to create a group
   *     tags:
   *       - group
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             properties:
   *               name:
   *                 type: string
   *                 description: The group's name
   *                 example: Procrastinators
   *                 required: false
   *     responses:
   *       201:
   *         description: Successfully created group.
   *       403:
   *         description: Forbidden! JWT not valid!
   *       401:
   *         description: Unauthorized! JWT expired!
   */
  app.post("/group", [authJwt.verifyJwt, authJwt.hasPermission([{ GROUP: "create" }])], controller.groupCreate);

  /**
   * @openapi
   * /group/{id}:
   *   post:
   *     summary: to rename a group
   *     tags:
   *       - group
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: The group ID
   *         example: 1
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             properties:
   *               name:
   *                 type: string
   *                 description: The group's new name
   *                 example: Procrastinators
   *                 required: false
   *     responses:
   *       202:
   *         description: Successfully renamed group.
   *       403:
   *         description: Forbidden! JWT not valid!
   *       401:
   *         description: Unauthorized! JWT expired!
   */
  app.post("/group/:id", [authJwt.verifyJwt, authJwt.hasPermission([{ GROUP: "update" }])], controller.groupRename);

  /**
   * @openapi
   * /group/{id}/user:
   *   post:
   *     summary: to edit a group's users list
   *     tags:
   *       - group
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: The group ID
   *         example: 2
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             properties:
   *               users:
   *                 type: object
   *                 description: The users to add to the group and remove from the group
   *                 properties:
   *                   add:
   *                     type: array
   *                     description: The user IDs to add to the group
   *                     example: [3, 5]
   *                   del:
   *                     type: array
   *                     description: The user IDs to remove from the group
   *                     example: [1, 2, 4]
   *     responses:
   *       200:
   *         description: Successfully edited group's users list.
   *       403:
   *         description: Forbidden! JWT not valid!
   *       401:
   *         description: Unauthorized! JWT expired!
   */
  app.post(
    "/group/:id/user",
    [authJwt.verifyJwt, authJwt.hasPermission([{ USER_GROUP: "update" }])],
    controller.groupSetUser
  );

  /**
   * @openapi
   * /group/{id}/permission:
   *   post:
   *     summary: to edit a group's permissions
   *     tags:
   *       - group
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: The group ID
   *         example: 1
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             description: The resources and the array of permissions for each of them (read, create, update, delete)
   *             properties:
   *               USER:
   *                 type: array
   *                 description: A resource and the array of permissions for it
   *                 example: ["read"] 
   *               USER_GROUP:
   *                 type: array
   *                 description: A resource and the array of permissions for it
   *                 example: ["read", "update"] 
   *     responses:
   *       200:
   *         description: Successfully edited group's users list.
   *       403:
   *         description: Forbidden! JWT not valid!
   *       401:
   *         description: Unauthorized! JWT expired!
   */
  app.post(
    "/group/:id/permission",
    [authJwt.verifyJwt, authJwt.hasPermission([{ GROUP_PERMISSION: "update" }])],
    controller.groupSetPermission
  );

  /**
   * @openapi
   * /group/{id}:
   *   delete:
   *     summary: to delete a group
   *     tags:
   *       - group
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: The group ID
   *         example: 1
   *     responses:
   *       200:
   *         description: Group 'group.name' successfully deleted.
   *       403:
   *         description: Forbidden! JWT not valid!
   *       401:
   *         description: Unauthorized! JWT expired!
   */
  app.delete("/group/:id", [authJwt.verifyJwt, authJwt.hasPermission([{ GROUP: "delete" }])], controller.groupDelete);
};

export default groupRoutes;
