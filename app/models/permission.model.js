import { db } from "./index.js";

export const permissionModel = (database, Sequelize, options) => {
  const Permission = database.define(
    "permission",
    {
      action: {
        type: Sequelize.ENUM("read", "create", "update", "delete"),
        allowNull: false,
      },
      resource_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "resource",
          key: "id",
        },
      },
    },
    { timestamps: false, ...options }
  );

  Permission.getPermissionsByResource = async () => {
    const { resource: Resource } = db;
    try {
      const permissions = await Permission.findAll({
        include: [
          {
            model: Resource,
            as: "resource",
          },
        ],
      });

      const permissionsByResource = permissions.reduce((acc, permission) => {
        const resourceName = permission.resource.name;
        const action = permission.action;

        if (!acc[resourceName]) {
          acc[resourceName] = [];
        }
        acc[resourceName].push(action);
        return acc;
      }, {});

      return permissionsByResource;
    } catch (error) {
      return error;
    }
  };

  return Permission;
};
