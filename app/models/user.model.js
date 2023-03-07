import { utils } from "../middleware/utils.js";

export const userModel = (database, Sequelize, options) => {
  const User = database.define(
    "user",
    {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      email: {
        type: Sequelize.STRING(100),
      },
      name: {
        type: Sequelize.STRING(42),
      },
      firstname: {
        type: Sequelize.STRING(42),
      },
      password: {
        type: Sequelize.STRING(100),
      },
      uuid: {
        type: Sequelize.STRING(36),
      },
      protected: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    { paranoid: true, ...options }
  );

  User.prototype.listGroup = async function () {
    try {
      const groups = await this.getGroups();

      let groupsList = groups.map((group) => {
        return { id: group.id, name: group.name }; //.toLowerCase();
      });

      return groupsList;
    } catch (error) {
      return error;
    }
  };

  User.prototype.listPermission = async function () {
    const groups = await this.getGroups();

    let list = [];
    for (const group of groups) {
      list.push(await group.listPermission());
    }

    const permissionsByResource = utils.mergePermissionObjects(list);

    return permissionsByResource;
  };

  User.prototype.hasPermission = async function (requiredPermissions) {
    try {
      const list = await this.listPermission();

      const missingPermissions = [];
      for (const permission of requiredPermissions) {
        const [resource, requiredPermissions] = Object.entries(permission)[0];
        if (!list[resource] || !list[resource].includes(requiredPermissions)) {
          missingPermissions.push({ [resource]: requiredPermissions });
        }
      }
      return missingPermissions.length > 0 ? { success: false, missingPermissions } : { success: true };
    } catch (error) {
      return false;
    }
  };

  User.prototype.hasOnePermission = async function (requiredPermissions) {
    try {
      const list = await this.listPermission();

      for (const permission of requiredPermissions) {
        const [resource, requiredAction] = Object.entries(permission)[0];
        if (list[resource] && list[resource].includes(requiredAction)) {
          return { success: true };
        }
      }
      return { success: false, missingPermissions: requiredPermissions };
    } catch (error) {
      return false;
    }
  };

  return User;
};
