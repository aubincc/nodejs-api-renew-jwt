import { authJwt } from "../middleware/index.js";
import controller from "../controllers/permission.controller.js";

const groupRoutes = (app) => {
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Headers", "Authorization, Origin, Content-Type, Accept");
    next();
  });

  /**
   * @openapi
   * /permission:
   *   get:
   *     summary: to show the list of available permissions
   *     tags:
   *       - permission
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Successfully retrieved list of available permissions.
   *       403:
   *         description: Forbidden! JWT not valid!
   *       401:
   *         description: Unauthorized! JWT expired!
   */
  app.get(
    "/permission",
    [authJwt.verifyJwt, authJwt.hasPermission([{ PERMISSION: "read" }])],
    controller.permissionList
  );
};

export default groupRoutes;
