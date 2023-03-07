import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { verifyRegister, authJwt } from "../middleware/index.js";
import controller from "../controllers/auth.controller.js";

dotenv.config();

const authRoutes = (app) => {
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Headers", "Authorization, Origin, Content-Type, Accept");
    next();
  });

  // RATE-LIMIT : limit requests of each IP
  app.use(
    "/auth/register",
    rateLimit({
      windowMs: (parseInt(process.env.REQUEST_LIMIT_REGISTER_WINDOW) || 60) * 60 * 1000, // 60 minutes in milliseconds or env setting
      max: parseInt(process.env.REQUEST_LIMIT_REGISTER_MAX) || 2, // 2 requests or env setting
      handler: (req, res) => {
        res.sendApiResponse(
          "TOO_MANY_REQUESTS",
          null,
          "Too many accounts created from this IP, please try again after an hour"
        );
      },
    })
  );

  /**
   * @openapi
   * /auth/register:
   *   post:
   *     summary: to register a new user
   *     tags:
   *        - auth
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             properties:
   *               email:
   *                 type: string
   *                 description: desc
   *                 example: my-email@address.com
   *                 required: true
   *               password:
   *                 type: string
   *                 description: 8 characters with special ones and digits
   *                 example: A1b2-C3d4!
   *                 required: true
   *     responses:
   *       201:
   *         description: User registered successfully!
   *       406:
   *         description: Email in use, Email not accepted, Password not accepted
   */
  app.post(
    "/auth/register",
    [verifyRegister.emailValid, verifyRegister.passwordValid, verifyRegister.emailNotDuplicate],
    controller.register
  );

  /**
   * @openapi
   * /auth/login:
   *   post:
   *     summary: to login
   *     tags:
   *        - auth
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             properties:
   *               email:
   *                 type: string
   *                 description: desc
   *                 example: my-email@address.com
   *                 required: true
   *               password:
   *                 type: string
   *                 description: 8 characters with special ones and digits
   *                 example: A1b2-C3d4!
   *                 required: true
   *     responses:
   *       200:
   *         description: Successfully logged in.
   *       401:
   *         description: Invalid Password!
   *       404:
   *         description: User not found.
   */
  app.post("/auth/login", controller.login);

  /**
   * @openapi
   * /auth/renew:
   *   post:
   *     summary: to renew the session's json web token
   *     tags:
   *        - auth
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             properties:
   *               renewJwt:
   *                 type: string
   *                 description: the renew token
   *                 example: eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNjc0ODU5ODQyLCJleHAiOjE2NzQ4NjM0NDJ9.Et50U9iARChbJMmCBRQmtyvhXJ65m-QC6JRL02ynLAOqLsUk0D8wkdqkQTk7DFvpPHQV7tWkll4nLsef1Tm7Tg
   *                 required: true
   *     responses:
   *       200:
   *         description: JWT renewed.
   *       406:
   *         description: Renew JWT is not known! / Renew JWT is required!
   */
  app.post("/auth/renew", controller.renewJwt);

  /**
   * @openapi
   * /auth/password:
   *   post:
   *     summary: to change the user's password
   *     tags:
   *        - auth
   *     security:
   *        - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             properties:
   *               password:
   *                 type: string
   *                 description: 8 characters with special ones and digits
   *                 example: A1b2-C3d4!
   *                 required: true
   *               newpassword:
   *                 type: string
   *                 description: 8 characters with special ones and digits
   *                 example: A2b2-C3d4!
   *                 required: true
   *     responses:
   *       200:
   *         description: User info successfully retrieved
   *       401:
   *         description: Unauthorized! JWT expired!
   *       403:
   *         description: Forbidden! JWT not valid!
   *       406:
   *         description: Something wrong with one of the passwords
   */
  app.post("/auth/password", [authJwt.verifyJwt], controller.changePassword);

  /**
   * @openapi
   * /whoami:
   *   get:
   *     summary: to retrieve the user's own information
   *     tags:
   *        - auth
   *     security:
   *        - bearerAuth: []
   *     responses:
   *       200:
   *         description: User info successfully retrieved
   *       401:
   *         description: Unauthorized! JWT expired!
   *       403:
   *         description: Forbidden! JWT not valid!
   */
  app.get("/whoami", [authJwt.verifyJwt], controller.userSelf);
};

export default authRoutes;
