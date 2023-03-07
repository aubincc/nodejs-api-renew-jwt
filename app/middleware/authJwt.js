import jsonwebtoken from "jsonwebtoken";
import { config } from "../config/auth.config.js";
import { db } from "../models/index.js";
const { user: User } = db;

const { TokenExpiredError, JsonWebTokenError, NotBeforeError } = jsonwebtoken;

const tokenError = (err, res) => {
  if (err instanceof TokenExpiredError) {
    return res.sendApiResponse("UNAUTHORIZED", null, "Unauthorized! JWT expired!");
  } else if (err instanceof JsonWebTokenError) {
    return res.sendApiResponse("FORBIDDEN", null, "Forbidden! JWT not valid!");
  } else if (err instanceof NotBeforeError) {
    return res.sendApiResponse("BAD_REQUEST", null, "Stop! Something went wrong!");
  } else {
    return res.sendApiResponse(err.code, null, err.message);
  }
};

const verifyJwt = async (req, res, next) => {
  const { headers } = req;
  const { authorization } = headers;

  if (!authorization) {
    return res.sendApiResponse("NOT_ACCEPTABLE", null, "No JWT provided!");
  }

  const jwt = authorization.replace("Bearer ", "");

  if (!jwt) {
    return res.sendApiResponse("NOT_ACCEPTABLE", null, "No JWT provided!");
  }

  try {
    const decoded = jsonwebtoken.decode(jwt);
    const user = await User.findByPk(decoded.id);
    if (!user) {
      throw { code: "NOT_FOUND", message: "User not found." };
    } else {
      req.user = user;
    }
    jsonwebtoken.verify(jwt, req.user.uuid + config.jwtSecret, {
      algorithms: ["HS512"],
      clockTolerance: config.clockTolerance,
    });
    next();
  } catch (err) {
    return tokenError(err, res);
  }
};

/**
 * Check whether user is accessing data for themselves
 * @param {*} requiredPermissions array of permissions required altogether
 * @param {*} res response
 * @param {*} next continue
 */
const hasPermission = (requiredPermissions) => {
  return async (req, res, next) => {
    const user = await User.findByPk(req.user.id);
    const result = await user.hasPermission(requiredPermissions);
    const { success } = result;
    if (success) {
      next();
      return;
    } else {
      res.sendApiResponse("UNAUTHORIZED", { list: result.missingPermissions }, "Missing permission(s)!");
    }
  };
};

/**
 * Check whether user is accessing data for themselves
 */
const isSelf = async (req, res, next) => {
  if (Number(req.params.id) === req.user.id) {
    // the user is either editing their own data
    next();
  } else {
    res.sendApiResponse("UNAUTHORIZED", null, "This is not you!");
  }
};

const isSelfOrHasPermission = (requiredPermissions) => {
  return async (req, res, next) => {
    const user = await User.findByPk(req.user.id);
    const hasPermission = await user.hasPermission(requiredPermissions);
    const isSelf = Number(req.params.id) === req.user.id;
    if (hasPermission || isSelf) {
      next();
      return;
    }
    if (!hasPermission) {
      res.sendApiResponse("UNAUTHORIZED", { list: hasPermission.missingPermissions }, "Missing permission(s)!");
      return;
    }
    if (!isSelf) {
      res.sendApiResponse("UNAUTHORIZED", null, "This is not you!");
      return;
    }
  };
};

export const authJwt = {
  hasPermission,
  isSelf,
  isSelfOrHasPermission,
  verifyJwt,
  tokenError,
};
