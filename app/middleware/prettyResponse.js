import { config } from "../config/statuscode.config.js";
import { utils } from "./index.js";

export const prettyResponse = (req, res, next) => {
  res.setHeader("X-Powered-By", "No one but me");

  /**
   * @name sendApiResponse
   * @description builds and send the response (defaults to "DAFUQ")
   * @param {*} code String is an alias of the response.status
   * @param {*} data Object is added to the response.body.data
   * @param {*} message String replaces default response.body.message
   */
  res.sendApiResponse = (code, data, message) => {
    // If no code is given, it's a wtf situation, therefore continue with DAFUQ
    code = code ? code : "DAFUQ";
    [code, message] = utils.dbConnectionErrorIn(message) ? ["FATAL", "Database connection problem"] : [code, message];
    let responseInfo = config.find((x) => x.code === code.toUpperCase()) || config.find((x) => x.code === "DAFUQ");

    // Build a pretty response
    let response = {
      v: global.ver,
      error: responseInfo.error,
      state: responseInfo.state,
      // code: responseInfo.code, // up to you to show or not
      // status: responseInfo.status, // up to you to show or not
      message: message || responseInfo.message,
      data: data ? data : undefined, // alternatively replace undefined with {} to at least have the key
    };

    // send the formatted reponse
    res.status(responseInfo.status).json(response);
  };
  next();
};
