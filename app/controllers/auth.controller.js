import jsonwebtoken from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";

import { config } from "../config/auth.config.js";
import { db } from "../models/index.js";
import { authJwt, dataValidation, utils } from "../middleware/index.js";

const { user: User, group: Group, renewJwt: RenewJwt } = db;

/**
 * POST /auth/register
 * @description .
 * @summary .
 */
const register = async (req, res) => {
  let userData = utils.lowerKeys(req.body);
  try {
    const { email, name, firstname, password } = userData;
    const userUUID = uuid(); //generate a new UUID for the user
    const user = await User.create({
      email,
      name: name || "",
      firstname: firstname || "",
      password: bcrypt.hashSync(password, 8),
      uuid: userUUID, // store the UUID in the user's table
    });
    const userGroup = await Group.findOne({ where: { alias: "user" } });
    await user.setGroups([userGroup]);
    res.sendApiResponse("CREATED", null, "User registered successfully!");
  } catch (err) {
    res.sendApiResponse("FATAL", null, err.message);
  }
};

/**
 * POST /auth/login
 * @description .
 * @summary .
 */
const login = async (req, res) => {
  let userData = utils.lowerKeys(req.body);
  try {
    if (!userData.email) {
      throw { code: "NOT_ACCEPTABLE", message: "Please provide an email." };
    }
    if (!userData.password) {
      throw { code: "NOT_ACCEPTABLE", message: "Please provide a password." };
    }

    const user = await User.scope("withSecrets", "withTimestamps").findOne({ where: { email: userData.email } });
    if (!user) {
      throw { code: "NOT_FOUND", message: "User not found." };
    }

    const passwordIsValid = bcrypt.compareSync(userData.password, user.password);
    if (!passwordIsValid) {
      throw { code: "UNAUTHORIZED", message: "Invalid Password!" };
    }

    const jwt = jsonwebtoken.sign({ id: user.id }, user.uuid + config.jwtSecret, {
      expiresIn: config.jwtMaxAge,
      algorithm: "HS512",
    });

    const renewJwt = await RenewJwt.createToken(user);

    const groupList = await user.listGroup();
    const permissionList = await user.listPermission();

    res.sendApiResponse(
      "OK",
      {
        // id: user.id, // up to you to show or not
        email: user.email,
        name: user.name,
        firstname: user.firstname,
        groups: groupList,
        permissions: permissionList,
        jwt: jwt,
        renewJwt: renewJwt,
      },
      "Successfully logged in."
    );
  } catch (error) {
    res.sendApiResponse(error.code, null, error.message);
  }
};

/**
 * POST /auth/renew
 * @description .
 * @summary .
 */
const renewJwt = async (req, res) => {
  try {
    const { renewJwt: requestToken } = req.body;

    if (!requestToken) {
      throw { code: "NOT_ACCEPTABLE", message: "Renew JWT is required!" };
    }

    // return renew token stored data
    const renewJwt = await RenewJwt.scope("withTimestamps").findOne({ where: { jwt: requestToken } });

    if (!renewJwt) {
      throw { code: "NOT_ACCEPTABLE", message: "Renew JWT is not known!" };
    }

    // check if provided JWT is expired before making any database request
    if (!RenewJwt.isExpired(requestToken)) {
      throw { code: "UNAUTHORIZED", message: "Unauthorized! JWT expired!" };
    }

    const user = await renewJwt.getUser();

    // Verify the renew token with the user's uuid
    jsonwebtoken.verify(requestToken, user.uuid + config.renewJwtSecret, {
      algorithms: ["HS512"],
      clockTolerance: config.clockTolerance,
    });

    const newJwt = jsonwebtoken.sign({ id: user.id }, user.uuid + config.jwtSecret, {
      expiresIn: config.jwtMaxAge,
      algorithm: "HS512",
    });

    // Save latest session's original start date
    user.renew_created_at = renewJwt.createdAt;
    user.renew_original_start = renewJwt.original_start;

    await RenewJwt.destroy({ where: { id: renewJwt.id } }); // delete renewJwt
    let newRenewJwt = await RenewJwt.createToken(user); // provide new renewJwt

    res.sendApiResponse("OK", { jwt: newJwt, renewJwt: newRenewJwt }, "JWT renewed.");
  } catch (err) {
    return authJwt.tokenError(err, res);
  }
};

/**
 * POST /auth/password
 * @description set new password
 */
const changePassword = async (req, res) => {
  let userData = utils.lowerKeys(req.body);

  try {
    const { id: UserId } = req.user;
    const { password: pw1, newpassword: pw2 } = userData;
    const user = await User.findByPk(UserId);

    if (!user) {
      throw { code: "FATAL", message: "Something went terribly wrong!" }; // user not found !?
    }
    if (!bcrypt.compareSync(pw1, user.password)) {
      throw { code: "BAD_REQUEST", message: "Old Password Invalid!" };
    }
    if (bcrypt.compareSync(pw2, user.password)) {
      throw { code: "BAD_REQUEST", message: "Old password and new password are the same!" };
    }
    if (!dataValidation.checkPassword(pw2)) {
      throw {
        code: "BAD_REQUEST",
        message: "New password invalid. (preferably 8 characters with special ones and digits)",
      };
    }
    if (!dataValidation.checkPasswordSimilarity(pw1, pw2)) {
      throw {
        code: "BAD_REQUEST",
        message: "Old password and new password are way too similar!",
      };
    }

    const encryptedPassword = bcrypt.hashSync(pw2, 8);
    const userUUID = uuid(); //generate a new UUID for the user

    // generate a new jwt and a new renewJwt to keep this session alone alive
    user.uuid = userUUID;
    const jwt = jsonwebtoken.sign({ id: user.id }, user.uuid + config.jwtSecret, {
      expiresIn: config.jwtMaxAge,
      algorithm: "HS512",
    });
    const renewJwt = await RenewJwt.createToken(user);

    // update the encryptedPassword and the userUUID in the user's table
    await user.update({ password: encryptedPassword, uuid: user.uuid });

    res.sendApiResponse(
      "MODIFIED",
      {
        jwt: jwt,
        renewJwt: renewJwt,
      },
      "Password successfully modified. All other sessions were disconnected."
    );
  } catch (error) {
    res.sendApiResponse(error.code, null, error.message);
  }
};

/**
 * GET /whoami
 * @description get user's own refreshed info
 */
const userSelf = async (req, res) => {
  try {
    const { id: UserId } = req.user;
    const user = await User.findByPk(UserId);
    if (!user) {
      throw { code: "NOT_FOUND", message: "Your account has been deleted." };
    }
    const groupList = await user.listGroup();
    const permissionList = await user.listPermission();

    res.sendApiResponse(
      "OK",
      {
        // id: user.id, // up to you to show or not
        email: user.email,
        name: user.name,
        firstname: user.firstname,
        groups: groupList,
        permissions: permissionList,
      },
      "User info successfully retrieved"
    );
  } catch (error) {
    res.sendApiResponse(error.code, null, error.message);
  }
};

export default {
  register,
  login,
  renewJwt,
  changePassword,
  userSelf,
};
