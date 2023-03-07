export const groupPermissionModel = (database, Sequelize, options) => {
  const GroupPermission = database.define(
    "group_permission",
    {
      group_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "group",
          key: "id",
        },
      },
      permission_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "permission",
          key: "id",
        },
      },
    },
    { timestamps: false, ...options }
  );

  return GroupPermission;
};
