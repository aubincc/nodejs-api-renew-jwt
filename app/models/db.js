import Sequelize from "sequelize";
import { config } from "../config/db.config.js";

export const database = new Sequelize(config.DB, config.USER, config.PASSWORD, {
  host: config.HOST,
  port: config.PORT,
  dialect: config.dialect,
  logging: (sql, queryObject) => {
    parseInt(config.LOGS) ? sqlLogsFilterToConsole(sql, queryObject) : null;
  },
  pool: config.pool,
});

const sqlLogsFilterToConsole = (sql, queryObject) => {
  // Optionally use the `sql` query here to pass it to Elasticsearch
  if (["SELECT", "UPDATE", "DELETE", "INSERT", "CREATE", "ALTER", "DROP"].includes(queryObject.type)) {
    console.info(":SQL:", sql.slice(10));
  }
};
