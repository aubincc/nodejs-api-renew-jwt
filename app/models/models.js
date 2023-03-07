import Sequelize from "sequelize";
import { database } from "./db.js";
import { userModel } from "./user.model.js";
import { groupModel } from "./group.model.js";
import { userGroupModel } from "./user_group.model.js";
import { renewJwtModel } from "./renewJwt.model.js";
import { resourceModel } from "./resource.model.js";
import { permissionModel } from "./permission.model.js";
import { groupPermissionModel } from "./group_permission.model.js";

const options = {
  freezeTableName: true,
  defaultScope: {
    attributes: { include: [], exclude: [] },
  },
  scopes: {
    withTimestamps: {
      attributes: { include: ["createdAt", "updatedAt"] },
    },
    withAllTimestamps: {
      attributes: { include: ["createdAt", "updatedAt", "deletedAt"] },
    },
    noTimestamps: {
      attributes: { exclude: ["createdAt", "updatedAt", "deletedAt"] },
    },
    withSecrets: {
      attributes: { include: ["password", "uuid"] },
    },
    noSecrets: {
      attributes: { exclude: ["password", "uuid", "protected"] },
    },
    noId: {
      attributes: { exclude: ["id"] },
    },
    noSystem: {
      attributes: { exclude: ["system", "alias"] },
    },
  },
};

export const db = {
  Sequelize: Sequelize,
  database: database,
  user: userModel(database, Sequelize, options),
  group: groupModel(database, Sequelize, options),
  user_group: userGroupModel(database, Sequelize, options),
  renewJwt: renewJwtModel(database, Sequelize, options),
  resource: resourceModel(database, Sequelize, options),
  permission: permissionModel(database, Sequelize, options),
  group_permission: groupPermissionModel(database, Sequelize, options),
};
