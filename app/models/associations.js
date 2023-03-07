import { db } from "./models.js";

/**
 * Users and their groups
 */

db.group.belongsToMany(db.user, {
  through: db.user_group,
  foreignKey: "group_id",
  otherKey: "user_id",
});

db.user.belongsToMany(db.group, {
  through: db.user_group,
  foreignKey: "user_id",
  otherKey: "group_id",
});

db.renewJwt.belongsTo(db.user, {
  foreignKey: "user_id",
  targetKey: "id",
});

db.user.hasOne(db.renewJwt, {
  foreignKey: "user_id",
  targetKey: "id",
});

/**
 * Groups and their permissions on resources
 */

db.group.belongsToMany(db.permission, {
  through: db.group_permission,
  foreignKey: "group_id",
  otherKey: "permission_id",
});

db.permission.belongsToMany(db.group, {
  through: db.group_permission,
  foreignKey: "permission_id",
  otherKey: "group_id",
});

db.permission.belongsTo(db.resource, {
  foreignKey: "resource_id",
  targetKey: "id",
});

db.resource.hasMany(db.permission, {
  foreignKey: "resource_id",
  sourceKey: "id",
});

db.group.belongsToMany(db.permission, { through: db.group_permission, foreignKey: "group_id", sourceKey: "id" });
db.permission.belongsToMany(db.group, { through: db.group_permission, foreignKey: "permission_id", sourceKey: "id" });
db.permission.belongsTo(db.resource, { foreignKey: "resource_id", sourceKey: "id" });
db.resource.hasMany(db.permission, { foreignKey: "resource_id", sourceKey: "id" });
