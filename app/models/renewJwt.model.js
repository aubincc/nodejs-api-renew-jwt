import jsonwebtoken from "jsonwebtoken";
import { config } from "../config/auth.config.js";

export const renewJwtModel = (database, Sequelize, options) => {
  const RenewJwt = database.define(
    "renew_jwt",
    {
      jwt: {
        type: Sequelize.STRING(767),
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "user",
          key: "id",
        },
      },
      original_start: {
        type: Sequelize.DATE,
      },
      expiry_date: {
        type: Sequelize.DATE,
      },
    },
    { ...options }
  );

  RenewJwt.createToken = async (user) => {
    let orig = user.renew_original_start;
    let crea = user.renew_created_at;
    let original_start = orig ? orig : crea;

    let expired_at = new Date();

    expired_at.setSeconds(expired_at.getSeconds() + config.renewJwtMaxAge);

    let _renewjwt = jsonwebtoken.sign({ id: user.id }, user.uuid + config.renewJwtSecret, {
      expiresIn: config.renewJwtMaxAge,
      algorithm: "HS512",
    });

    let renewJwt = await RenewJwt.create({
      jwt: _renewjwt,
      user_id: user.id,
      original_start: original_start,
      expiry_date: expired_at.getTime(),
    });

    return renewJwt.jwt;
  };

  RenewJwt.isExpired = async (jwt) => {
    const decoded = jsonwebtoken.decode(jwt);

    if (decoded.exp <= Date.now() / 1000) {
      return false;
    } else {
      return true;
    }
  };
  /**
   * @description flushExpiredTokens deletes expired renew tokens
   * @param {*} TOKEN_RETENTION_TIME_IN_DAYS number of days the expired token remains stored in the database
   */
  RenewJwt.flushExpiredTokens = async (TOKEN_RETENTION_TIME_IN_DAYS) => {
    TOKEN_RETENTION_TIME_IN_DAYS = TOKEN_RETENTION_TIME_IN_DAYS || 7; // defaults do 7 days
    const TOKENS_PER_PAGE = 50; // The number of tokens per page
    const TOKEN_RETENTION_AGE = new Date();
    TOKEN_RETENTION_AGE.setDate(TOKEN_RETENTION_AGE.getDate() - TOKEN_RETENTION_TIME_IN_DAYS);

    let page = 0;
    let expiredTokens;
    do {
      // Query the database for expired refresh tokens that expired at least 24 hours ago
      expiredTokens = await RenewJwt.findAll({
        where: { expiry_date: { [Sequelize.Op.lt]: TOKEN_RETENTION_AGE } },
        offset: page * TOKENS_PER_PAGE,
        limit: TOKENS_PER_PAGE,
      });

      // Iterate through the expired tokens and delete them
      expiredTokens.forEach(async (token) => {
        // console.log(`Deleting renew token ${token.jwt} of user ${token.user_id} expired before ${TOKEN_RETENTION_AGE}`);
        await RenewJwt.destroy({ where: { id: token.id } });
      });
      page++;
    } while (expiredTokens.length === TOKENS_PER_PAGE);
  };

  return RenewJwt;
};
