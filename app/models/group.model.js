import { db } from "./index.js";

export const groupModel = (database, Sequelize, options) => {
  const Group = database.define(
    "group",
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING(42),
        allowNull: false,
      },
      system: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      alias: {
        type: Sequelize.STRING(10),
        allowNull: true,
        defaultValue: null,
      },
    },
    { paranoid: true, ...options }
  );

  Group.prototype.listUser = async function () {
    try {
      const users = await this.getUsers();

      let usersList = users.map((user) => {
        return { id: user.id, email: user.email }; //.toLowerCase();
      });

      return usersList;
    } catch (error) {
      return error;
    }
  };

  Group.prototype.listPermission = async function () {
    const { resource: Resource } = db;

    let list = [];
    const permissions = await this.getPermissions({
      include: [
        {
          model: Resource,
          as: "resource",
        },
      ],
    });
    list = [
      ...permissions.map((permission) => ({
        resource: permission.resource.name,
        action: permission.action,
      })),
    ];

    const permissionsByResource = list.reduce((acc, curr) => {
      if (!acc[curr.resource]) {
        acc[curr.resource] = [];
      }
      acc[curr.resource].push(curr.action);
      return acc;
    }, {});

    return permissionsByResource;
  };

  return Group;
};
