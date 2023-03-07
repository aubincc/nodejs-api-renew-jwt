import { db } from "../models/index.js";
import { dataValidation } from "./dataValidation.js";

const { user: User } = db;

const emailValid = (req, res, next) => {
  if (!dataValidation.checkEmail(req.body.email)) {
    res.sendApiResponse("NOT_ACCEPTABLE", null, `Failed! Email address '${req.body.email}' not accepted.`);

    return;
  }

  next();
};

const passwordValid = (req, res, next) => {
  if (!dataValidation.checkPassword(req.body.password)) {
    res.sendApiResponse(
      "NOT_ACCEPTABLE",
      null,
      "Failed! Password invalid. (preferably 8 characters with special ones and digits)"
    );

    return;
  }

  next();
};

const emailNotDuplicate = (req, res, next) => {
  User.findOne({
    where: {
      email: req.body.email,
    },
  }).then((user) => {
    if (user) {
      res.sendApiResponse("NOT_ACCEPTABLE", null, "Failed! Email is already in use!");

      return;
    }
    next();
  });
};

export const verifyRegister = {
  emailValid,
  passwordValid,
  emailNotDuplicate,
};
