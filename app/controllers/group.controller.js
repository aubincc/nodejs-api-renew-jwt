import { db } from "../models/index.js";
import { apiCommons, utils } from "../middleware/index.js";
const { user: User, group: Group, Sequelize } = db;

const groupList = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    const canSeeId = await user.hasOnePermission([
      { USER: "read" },
      { GROUP: "update" },
      { GROUP: "delete" },
      { GROUP_PERMISSION: "read" },
      { GROUP_PERMISSION: "update" },
    ]);

    const { name } = req.query;
    const where = {};
    const allowedSortBy = ["id", "name"];
    const scope = ["noTimestamps", "noSystem"];

    if (name) where.name = { [Sequelize.Op.like]: Sequelize.fn("LOWER", `%${name}%`) };

    apiCommons.getList(req, res, Group, where, allowedSortBy, scope).then((data) => {
      if (!canSeeId.success) {
        data.list = data.list.map((group) => ({ name: group.name })); // group.name
      }
      res.sendApiResponse("OK", data, "Successfully retrieved group list.");
    });
  } catch (error) {
    res.sendApiResponse("FATAL", null, error || "Error retrieving group list.");
  }
};

const groupView = async (req, res) => {
  // GET /group/:id
  const reqUser = await User.findByPk(req.user.id);
  const canSeeId = await reqUser.hasOnePermission([
    { USER_GROUP: "read" },
    { USER_PERMISSION: "read" },
    { GROUP_PERMISSION: "read" },
  ]);

  try {
    const { id: groupId } = req.params;
    const group = await utils.validateId(Group, groupId);

    return res.sendApiResponse(
      "OK",
      {
        id: canSeeId ? group.id : undefined,
        name: group.name,
      },
      "Successfully retrieved group data."
    );
  } catch (error) {
    res.sendApiResponse(error.code, null, error.message);
  }
};

const groupPermission = async (req, res) => {
  // GET /group/:id/permission
  try {
    const { id: groupId } = req.params;
    const group = await utils.validateId(Group, groupId);

    const permissionList = await group.listPermission();
    res.sendApiResponse("OK", permissionList, `Successfully retrieved the '${group.name}' group's permissions list.`);
  } catch (error) {
    res.sendApiResponse(error.code, null, error.message);
  }
};

const groupPermissionSnapshot = async (req, res) => {
  // GET /group/permission
  // takes an array of group id
  // and returns the list of permissions altogether

  const { groups } = req.body;

  try {
    if (!groups || !Array.isArray(groups) || groups.length === 0) {
      throw { code: "BAD_REQUEST", message: "Please specify groups by name or id" };
    }

    let list = [];
    for (const group of groups) {
      const groupData = await utils.validateId(Group, group);

      list.push(await groupData.listPermission());
    }

    const permissionsByResource = utils.mergePermissionObjects(list);

    res.sendApiResponse("OK", permissionsByResource, "Successfully retrieved groups permission list.");
  } catch (error) {
    res.sendApiResponse(error.code, null, error.message);
  }
};

const groupUserList = async (req, res) => {
  // GET /group/:id/user
  // shows the list of users in a group
  // check whether the user initiating the request is an admin or not

  try {
    const { id: userId } = req.user;
    const user = await User.findByPk(userId);
    const canSeeId = await user.hasOnePermission([
      { USER: "update" },
      { USER: "delete" },
      { USER_GROUP: "read" },
      { USER_PERMISSION: "read" },
      { USER_ACTIVITY: "read" },
    ]);

    const { id: groupId } = req.params;
    const group = await utils.validateId(Group, groupId);

    const { id, email, name, firstname } = req.query;
    const where = {};
    const includeWhere = {};
    const allowedSortBy = ["name", "id", "firstname", "email"];
    const scope = ["noTimestamps", "noSecrets"];

    if (id && canSeeId) where.id = { [Sequelize.Op.like]: `%${id}%` };
    if (email) where.email = { [Sequelize.Op.like]: `%${email}%` };
    if (name) where.name = { [Sequelize.Op.like]: Sequelize.fn("LOWER", `%${name}%`) };
    if (firstname) where.firstname = { [Sequelize.Op.like]: Sequelize.fn("LOWER", `%${firstname}%`) };

    includeWhere.id = { [Sequelize.Op.like]: `%${groupId}%` };

    apiCommons.getListWithInclude(req, res, User, where, allowedSortBy, scope, Group, includeWhere).then((data) => {
      const { list } = data;

      const cleanList = {
        list: list.map((user) => {
          const { id, email, name, firstname } = user;
          return { id, email, name, firstname };
        }),
      };

      data.list = cleanList.list;

      res.sendApiResponse("OK", data, `Successfully retrieved the '${group.name}' group's users list.`);
    });
  } catch (error) {
    res.sendApiResponse(error.code, null, error.message || "Error retrieving group's user list.");
  }
};

/**
 * Creates a new group with the given name and saves it to the database.
 * Requires the "create" permission for the "GROUP" resource.
 *
 * @async
 * @function groupCreate
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @returns {Promise<void>} A Promise that resolves with void when the operation completes.
 * @throws {Error} If the group name is missing or invalid, or if the user doesn't have the required permissions.
 */
const groupCreate = async (req, res) => {
  try {
    // Get the group name from the request body
    const { name } = req.body;

    if (!name) {
      throw { code: "ERROR", message: "Group name is required." };
    }

    // Check if a group with the same name already exists
    const existingGroup = await Group.findOne({ where: { name } });

    if (existingGroup) {
      throw { code: "ERROR", message: "A group with that name already exists." };
    }

    // Create and save the new group
    const newGroup = await Group.create({ name });

    // Filter new group data shown to user
    const newGroupData = { id: newGroup.id, name: newGroup.name };

    res.sendApiResponse("OK", newGroupData, "Successfully created group.");
  } catch (error) {
    res.sendApiResponse("FATAL", null, error || "Error creating group.");
  }
};

const groupRename = async (req, res) => {
  const { id: userId } = req.user;
  const user = await User.findByPk(userId);
  const canEditGroup = await user.hasOnePermission([{ GROUP: "update" }]);

  try {
    // Get the group name from the request body
    const { name } = req.body;

    if (!name) {
      throw { code: "ERROR", message: "Group name is required." };
    }

    if (!canEditGroup.success) {
      throw { code: "ERROR", message: "You do not have the permission to update groups." };
    }

    const { id: groupId } = req.params;
    const group = await utils.validateId(Group, groupId);

    if (group.system) {
      throw { code: "ERROR", message: "You cannot modify a system group." };
    }

    if (group.name === name) {
      throw { code: "NO_CHANGE", message: "No change." };
    }

    // Check if a group with the same name already exists
    const existingGroup = await Group.findOne({ where: { name } });

    if (existingGroup) {
      throw { code: "ERROR", message: "A group with that name already exists." };
    }

    const updatedGroup = await group.update({ name });

    // Filter updated group data shown to user
    const updatedGroupData = { id: updatedGroup.id, name: updatedGroup.name };

    res.sendApiResponse("OK", updatedGroupData, "Successfully updated group.");
  } catch (error) {
    res.sendApiResponse(error.code, null, error.message || "Error updating group.");
  }
};

/**
 * Set users for a group
 *
 * @function
 * @async
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @throws {Object} - Express error object with error code and message
 * @returns {Object} - Express response object with data and message
 */
const groupSetUser = async (req, res) => {
  try {
    const { id: reqUserId } = req.user;
    const { id: groupId } = req.params;
    const group = await utils.validateId(Group, groupId);

    const reqUserIsAdmin = group.alias === "admin" ? await group.hasUser(req.user) : false;

    let existingUsers = await group.listUser();

    // Return clean add and del arrays
    const { add: addChanges = [], del: delChanges = [] } = req.body?.users ?? {};
    let [requestedUserAddIds, requestedUserDelIds] = [utils.cleanArray(addChanges), utils.cleanArray(delChanges)];
    [requestedUserAddIds, requestedUserDelIds] = utils.cleanCompare(requestedUserAddIds, requestedUserDelIds);

    // Abort if one of the arrays contains the id of the requesting user
    if (requestedUserAddIds.includes(reqUserId) || requestedUserDelIds.includes(reqUserId)) {
      throw { code: "FORBIDDEN", message: "Forbidden! You cannot edit yourself!" };
    }

    // Verify the existence of the provided userids in both arrays
    const validatedUserAddIds = await Promise.all(
      Array.from(requestedUserAddIds, async (id) => {
        const user = await utils.validateId(User, id);
        return user ? parseInt(id) : null;
      })
    );

    const validatedUserDelIds = await Promise.all(
      Array.from(requestedUserDelIds, async (id) => {
        const user = await utils.validateId(User, id, {
          attributes: { include: ["protected"] },
        });

        // if user is protected and group is admin, ignore from del request
        if (group.alias === "admin" && (user.protected || !reqUserIsAdmin)) {
          return null;
        } else {
          return user ? parseInt(id) : null;
        }
      })
    );

    if (!validatedUserAddIds.length && !validatedUserDelIds.length) {
      throw { code: "NO_CHANGE", message: "No change was made" };
    }

    // Remove existing users
    const existingUserIds = existingUsers.map((user) => user.id);
    const deleteUserIds = validatedUserDelIds.filter((id) => existingUserIds.includes(id));
    if (deleteUserIds.length) {
      await group.removeUsers(deleteUserIds);
    }

    // Add missing users
    const addUserIds = validatedUserAddIds.filter((id) => !existingUserIds.includes(id));
    if (addUserIds.length) {
      await group.addUsers(addUserIds);
    }

    // Get updated user list
    const updatedUsers = await group.listUser();

    res.sendApiResponse("MODIFIED", { saved: updatedUsers }, "Successfully edited group users.");
  } catch (error) {
    res.sendApiResponse(error.code, null, error.message);
  }
};

/**
 * Set permissions for a group
 *
 * @function
 * @async
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @throws {Object} - Express error object with error code and message
 * @returns {Object} - Express response object with data and message
 */
const groupSetPermission = async (req, res) => {
  try {
    const { permission: Permission, resource: Resource } = db;
    const { user: reqUser } = req;
    const { id: groupId } = req.params;
    const group = await utils.validateId(Group, groupId);
    const maximumPermissions = await reqUser.listPermission();
    const availablePermissions = await Permission.getPermissionsByResource();
    const submittedPermissions = req.body;

    const adminGroup = await Group.findOne({ where: { alias: "admin" } });
    const reqUserIsAdmin = await adminGroup.hasUser(reqUser);
    const reqUserIsProtected = reqUser.protected === true;

    // Check if only a user who has the "protected" property and belongs to the group that has the "admin" alias property can set the list of permissions of the "admin" group
    if (group.alias === "admin") {
      if (!reqUserIsAdmin || !reqUserIsProtected) {
        throw {
          code: "FORBIDDEN",
          message: `Editing the '${group.name}' group's permissions is reserved to some privileged users only.`,
        };
      }
    }

    // Check if only a user who belongs to the group that has the "admin" alias property can set the list of permissions of the "user" group
    if (group.alias === "user") {
      if (!reqUserIsAdmin) {
        throw {
          code: "FORBIDDEN",
          message: `Editing the '${group.name}' group's permissions is reserved to users of the '${adminGroup.name}' group.`,
        };
      }
    }

    // Check for permissions that don't exist
    for (const [resourceName, permissions] of Object.entries(submittedPermissions)) {
      if (!availablePermissions[resourceName]) {
        throw { code: "BAD_REQUEST", message: `Permission for resource '${resourceName}' does not exist` };
      }
      for (const permissionName of permissions) {
        if (!availablePermissions[resourceName].includes(permissionName)) {
          throw {
            code: "BAD_REQUEST",
            message: `Permission '${permissionName}' for resource '${resourceName}' does not exist`,
          };
        }
      }
    }

    // Check for permissions that the user doesn't have
    for (const [resourceName, permissions] of Object.entries(submittedPermissions)) {
      for (const permissionName of permissions) {
        if (!maximumPermissions[resourceName]?.includes(permissionName)) {
          throw {
            code: "FORBIDDEN",
            message: `Permission '${permissionName}' for resource '${resourceName}' cannot be given to a group if you do not have it yourself`,
          };
        }
      }
    }

    // Remove all permissions for the group
    await group.setPermissions([]);

    // Add only the permissions which are listed in the request body
    const savedPermissions = [];
    for (const [resourceName, permissions] of Object.entries(submittedPermissions)) {
      for (const permissionName of permissions) {
        const permission = await Permission.findOne({
          where: { action: permissionName },
          include: { model: Resource, where: { name: resourceName } },
        });
        const resource = await Resource.findOne({ where: { name: resourceName } });
        await group.addPermission(permission, { through: { resourceId: resource.id } });
        savedPermissions.push({ resource: resourceName, action: permissionName });
      }
    }

    // Rearrange list of saved permissions as in Group.listPermission()
    const permissionsByResource = savedPermissions.reduce((acc, curr) => {
      if (!acc[curr.resource]) {
        acc[curr.resource] = [];
      }
      acc[curr.resource].push(curr.action);
      return acc;
    }, {});

    res.sendApiResponse("MODIFIED", { saved: permissionsByResource }, "Successfully edited group permissions.");
  } catch (error) {
    res.sendApiResponse(error.code, null, error.message);
  }
};

/**
 * Deletes a group and all associated memberships.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>}
 */
const groupDelete = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const group = await utils.validateId(Group, groupId);

    if (group.system) {
      throw { code: "ERROR", message: "You cannot delete a system group." };
    }

    // Detach all users from group before deletion
    const users = await group.getUsers();

    if (users.length > 0) {
      /**
       * The group is under "paranoid deletion", therefore, alternatively, you can :
       * - throw an error to prevent deletion if it contains users, forcing to remove them first
       * - do nothing, which allows you to set the deletedAt value to NULL and retrieve the user/group link
       * - remove all users from the group before deleting the group (this is the option chosen below)
       */
      await group.setUsers([]);
    }

    // Delete the group
    await group.destroy();

    res.sendApiResponse("OK", null, `Group '${group.name}' successfully deleted.`);
  } catch (error) {
    res.sendApiResponse(error.code, null, error.message);
  }
};

export default {
  groupList,
  groupView,
  groupUserList,
  groupPermission,
  groupPermissionSnapshot,
  groupCreate,
  groupRename,
  groupSetUser,
  groupSetPermission,
  groupDelete,
};
