global.ver = "1.0.0";

import express from "express";
import rateLimit from "express-rate-limit";
import cors from "cors";
import * as cron from "node-cron";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

import { db } from "./app/models/index.js";
import { prettyResponse } from "./app/middleware/index.js";
import { authRoutes, userRoutes, groupRoutes, permissionRoutes } from "./app/routes/index.js";
import { css } from "./app/config/swagger.config.js";
import * as initiate from "./app/setup/index.js";
const { renewJwt: RenewJwt } = db;

import dotenv from "dotenv";
dotenv.config();

/**
 * ##
 * EXPRESS: app setup
 * ##
 */
const app = express();

// CORS : Configure through which hosts communication with the API can be made (frontend IPs or hosts)
const corsOptions = {
  origin: [
    "https://your.website.tld",
    "http://mirror-of.website.tld:8090"
  ],
};

app.use(cors(corsOptions));

// format responses in a pretty manner
// this is calling a custom module meant to normalise exchanges
app.use(prettyResponse);

// parse requests of content-type - application/json
app.use(express.json());

// return error response if parse failed
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    res.sendApiResponse("NOT_ACCEPTABLE", null, "Invalid body format");
  } else {
    // additional error handling required when this occurs :)
    console.error("---\nUNCAUGHT ERROR!!\n", error, "\n---\n");
    res.sendApiResponse("FATAL", null, "UNCAUGHT ERROR");
  }
  next();
});

// RATE-LIMIT : limit requests of each IP
app.use(
  rateLimit({
    windowMs: (parseInt(process.env.REQUEST_LIMIT_ALL_WINDOW) || 5) * 60 * 1000, // 5 minutes in milliseconds or env setting
    max: parseInt(process.env.REQUEST_LIMIT_ALL_MAX) || 100, // 100 requests or env setting
    handler: (req, res) => {
      res.sendApiResponse("TOO_MANY_REQUESTS");
    },
  })
);

// parse requests of content-type - application/x-www-form-urlencoded
// this is used for reading params passed in the URL, usually in GET requests when listing elements
app.use(express.urlencoded({ extended: true }));

/**
 * ##
 * MySQL: Connect to database and configure if first connection
 * ##
 */

db.database
  .sync()
  .then(async () => {
    await initiate.groupSetup();
    await initiate.resourceSetup();
    await initiate.resourcePermissionSetup();
    await initiate.adminGroupPermissionSetup();
  })
  .catch((err) => {
    console.error("Database connection failed.", err);
  });

/**
 * ##
 * SWAGGER: Generate a swagger compatible documentation from all JSDoc annotated routes
 * ##
 */

const [API_NAME, API_DESCRIPTION, API_VERSION, API_CREATOR] = [
  process.env.API_NAME,
  process.env.API_DESCRIPTION,
  global.ver,
  process.env.API_CREATOR,
];
const swg = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: API_NAME,
      description: API_DESCRIPTION,
      version: API_VERSION,
      contact: {
        email: API_CREATOR,
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./index.js", "./app/routes/*.routes.js"], // files containing annotations as below (GET /)
};

const swgOptions = {
  customCss: css,
};

/**
 * ##
 * ROUTING: Declare the routes available on the API
 * ##
 */

/**
 * @openapi
 * /:
 *   get:
 *     summary: to confirm the API runs (it does if you can see this)
 *     tags:
 *        - _
 *     responses:
 *       200:
 *         description: Returns a confirmation message.
 */
app.get("/", (req, res) => {
  res.sendApiResponse("RUNNING");
});

// API functional routes
authRoutes(app);
userRoutes(app);
groupRoutes(app);
permissionRoutes(app);

// Swagger documentation page (turned off, please check .env file at project root)
if (parseInt(process.env.SWAGGER_DOC_AVAILABLE)) {
  app.use(process.env.SWAGGER_DOC_ENDPOINT, swaggerUi.serve, swaggerUi.setup(swaggerJsdoc(swg), swgOptions));
  console.log(`Swagger documentation available at endpoint '${process.env.SWAGGER_DOC_ENDPOINT}'`);
}

// Fallback route
app.all("*", (req, res) => {
  res.sendApiResponse("DAFUQ");
});

/**
 * ##
 * RUN: Make the API reachable on the specified port
 * ##
 */
const PORT = parseInt(process.env.API_PORT) || 8080;
app.listen(PORT, () => {
  console.log(`The API is now running on port '${PORT}'`);
});

/**
 * ##
 * FLUSH: Delete expired renew tokens older than 90 days every night at 2 a.m.
 * ##
 */
const FLUSHRENEW_CRON = process.env.DB_FLUSH_RENEWJWT_CRON;
const FLUSHRENEW_AFTER = parseInt(process.env.DB_FLUSH_RENEWJWT_AFTER);
cron.schedule(FLUSHRENEW_CRON, () => {
  RenewJwt.flushExpiredTokens(FLUSHRENEW_AFTER);
});
