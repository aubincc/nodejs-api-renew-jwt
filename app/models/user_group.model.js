export const userGroupModel = (database, Sequelize, options) => {
  const UserGroup = database.define(
    "user_group",
    {
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "user",
          key: "id",
        },
      },
      group_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "group",
          key: "id",
        },
      },
    },
    { timestamps: false, ...options }
  );

  return UserGroup;
};
