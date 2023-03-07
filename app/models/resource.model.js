export const resourceModel = (database, Sequelize, options) => {
  const Resource = database.define(
    "resource",
    {
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
    },
    { paranoid: true, ...options }
  );

  return Resource;
};
