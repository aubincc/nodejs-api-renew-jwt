import { db } from "../models/index.js";
import { config } from "../config/auth.config.js";
import { dataValidation, utils, apiCommons } from "../middleware/index.js";
const { user: User, group: Group, renewJwt: RenewJwt, Sequelize } = db;

const userList = async (req, res) => {
  try {
    // check whether the user initiating the request is an admin or not
    const reqUser = await User.findByPk(req.user.id);
    const canSeeId = await reqUser.hasOnePermission([
      { USER: "update" },
      { USER: "delete" },
      { USER_GROUP: "read" },
      { USER_PERMISSION: "read" },
      { USER_ACTIVITY: "read" },
    ]);

    const { id, email, name, firstname } = req.query;
    const where = {};
    const allowedSortBy = ["name", "id", "firstname", "email"];
    const scope = ["noTimestamps", "noSecrets"];

    if (id && canSeeId) where.id = { [Sequelize.Op.like]: `%${id}%` };
    if (email) where.email = { [Sequelize.Op.like]: `%${email}%` };
    if (name) where.name = { [Sequelize.Op.like]: Sequelize.fn("LOWER", `%${name}%`) };
    if (firstname) where.firstname = { [Sequelize.Op.like]: Sequelize.fn("LOWER", `%${firstname}%`) };

    apiCommons.getList(req, res, User, where, allowedSortBy, scope).then((data) => {
      res.sendApiResponse("OK", data, "Successfully retrieved user list.");
    });
  } catch (error) {
    res.sendApiResponse("FATAL", null, error || "Error retrieving user list.");
  }
};

const userView = async (req, res) => {
  const reqUser = await User.findByPk(req.user.id);
  const canSeeId = await reqUser.hasOnePermission([
    { USER: "update" },
    { USER: "delete" },
    { USER_GROUP: "read" },
    { USER_PERMISSION: "read" },
    { USER_ACTIVITY: "read" },
  ]);

  try {
    const { id: userId } = req.params;
    const user = await utils.validateId(User, userId);

    return res.sendApiResponse(
      "OK",
      {
        id: canSeeId ? user.id : undefined,
        name: user.name,
        firstname: user.firstname,
        email: user.email,
      },
      "Successfully retrieved user data."
    );
  } catch (error) {
    res.sendApiResponse(error.code, null, error.message);
  }
};

const userActivity = async (req, res) => {
  try {
    const reqUser = await User.findByPk(req.user.id);
    const canSeeId = await reqUser.hasOnePermission([{ USER_ACTIVITY: "delete" }]);

    const { id: userId } = req.params;
    const user = await utils.validateId(User, userId);

    req.query.sort_order = canSeeId ? req.query.sort_order || "DESC" : "DESC";
    req.query.limit = canSeeId ? req.query.limit || "5" : "1";
    const where = { user_id: userId };
    const allowedSortBy = ["createdAt"];
    const scope = [];

    apiCommons.getList(req, res, RenewJwt, where, allowedSortBy, scope).then((response) => {
      const { list } = response;
      const _now = new Date();

      response.list = list.map((session) => {
        const active_period = new Date(_now - config.jwtMaxAge * 1000);
        const renewable_period = new Date(_now - config.renewJwtMaxAge * 1000);

        const orig = new Date(session.original_start).getTime();
        const latest = new Date(session.createdAt).getTime();

        const really_started_at = new Date(orig ? orig : latest).toLocaleString();

        const isActive = session.createdAt > active_period;
        const activeFor = utils.secondsToDhms((session.createdAt - active_period) / 1000 + config.clockTolerance);

        const isRenewable = session.createdAt > renewable_period;
        const renewableFor = utils.secondsToDhms((session.createdAt - renewable_period) / 1000 + config.clockTolerance);

        const lastActivity = !isActive
          ? utils.secondsToDhms(-((session.createdAt - active_period) / 1000 + config.clockTolerance))
          : "";

        return {
          created_at: really_started_at,
          last_activity: lastActivity,
          active: isActive,
          active_for: activeFor,
          renewable: isRenewable,
          renewable_for: renewableFor,
        };
      });

      res.sendApiResponse("OK", response, "Successfully retrieved user activity.");
    });
  } catch (error) {
    res.sendApiResponse(error.code, null, error.message);
  }
};

const userEdit = async (req, res) => {
  try {
    const { id: userId } = req.params;
    const user = await utils.validateId(User, userId);

    let userNewData = utils.lowerKeys(req.body);
    let unwantedKeys = ["id", "password", "uuid", "createdAt", "updatedAt", "deletedAt"];
    unwantedKeys.forEach((key) => delete userNewData[key]);

    if (userNewData.email && !dataValidation.checkEmail(userNewData.email)) {
      throw { code: "NOT_ACCEPTABLE", message: `Failed! Email address '${userNewData.email}' not accepted.` };
    }

    if (!Object.keys(userNewData).length) {
      throw { code: "BAD_REQUEST" };
    }

    await user.update(userNewData);

    const updatedUser = await User.scope("noSecrets", "noTimestamps").findByPk(userId);

    res.sendApiResponse("OK", updatedUser, "Successfully edited user.");
  } catch (error) {
    res.sendApiResponse(error.code, null, error.message);
  }
};

const userGroup = async (req, res) => {
  try {
    const { id: userId } = req.params;
    const user = await utils.validateId(User, userId);

    const groupList = await user.listGroup();
    res.sendApiResponse("OK", { list: groupList }, "Successfully retrieved user's group list.");
  } catch (error) {
    res.sendApiResponse(error.code, null, error.message);
  }
};

const userPermission = async (req, res) => {
  try {
    const { id: userId } = req.params;
    const user = await utils.validateId(User, userId);

    const permissionList = await user.listPermission();
    res.sendApiResponse("OK", permissionList, "Successfully retrieved user's permission list.");
  } catch (error) {
    res.sendApiResponse(error.code, null, error.message);
  }
};

/**
 * Set groups for a user
 *
 * @function
 * @async
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @throws {Object} - Express error object with error code and message
 * @returns {Object} - Express response object with data and message
 */
const userSetGroup = async (req, res) => {
  try {
    const { id: reqUserId } = req.user;
    const { id: modUserId } = req.params;

    if (reqUserId == modUserId) {
      throw { code: "FORBIDDEN", message: "Forbidden! You cannot edit yourself!" };
    }

    const [reqUser, modUser] = await Promise.all([
      utils.validateId(User, reqUserId, {
        include: [
          {
            model: Group,
            as: "groups",
            attributes: ["id"],
            through: { attributes: [] },
          },
        ],
      }),
      utils.validateId(User, modUserId, {
        include: [
          {
            model: Group,
            as: "groups",
            attributes: ["id"],
            through: { attributes: [] },
          },
        ],
        attributes: { include: ["protected"] },
      }),
    ]);

    const [userGroup, adminGroup] = await Promise.all([
      Group.findOne({ where: { alias: "user" } }),
      Group.findOne({ where: { alias: "admin" } }),
    ]);

    // Return clean add and del arrays
    const addChanges = req.body?.groups?.add;
    const delChanges = req.body?.groups?.del;
    let [requestedGroupAddIds, requestedGroupDelIds] = [utils.cleanArray(addChanges), utils.cleanArray(delChanges)];

    [requestedGroupAddIds, requestedGroupDelIds] = utils.cleanCompare(requestedGroupAddIds, requestedGroupDelIds);

    // Verify the existence of the provided groupids in both arrays
    const validatedGroupAddIds = await Promise.all(
      requestedGroupAddIds.map(async (id) => {
        const group = await utils.validateId(Group, id);
        return group ? parseInt(id) : null;
      })
    );

    const validatedGroupDelIds = await Promise.all(
      requestedGroupDelIds.map(async (id) => {
        const group = await utils.validateId(Group, id);
        return group ? parseInt(id) : null;
      })
    );

    // Build ground for savedIds based on current groups, added groups and removed groups
    const updatedUserArray = utils.updateArray(
      modUser.groups.map((group) => group.id),
      validatedGroupAddIds,
      validatedGroupDelIds
    );

    // Make sure the admin right stays in place when legitimate
    const reqUserIsAdmin = reqUser.groups.some((group) => group.id === adminGroup.id);
    const modUserIsAdmin = modUser.groups.some((group) => group.id === adminGroup.id);
    const modUserIsProtected = modUser.protected;

    const savedIds = [...updatedUserArray];
    if (!savedIds.includes(userGroup.id)) {
      savedIds.push(userGroup.id);
    }
    if (!reqUserIsAdmin && modUserIsAdmin) {
      savedIds.push(adminGroup.id);
    }
    if (reqUserIsAdmin && modUserIsAdmin && modUserIsProtected && !savedIds.includes(adminGroup.id)) {
      savedIds.push(adminGroup.id);
    }
    // Update the user
    await modUser.setGroups(savedIds);

    const savedGroups = await Group.scope("noSystem", "noTimestamps").findAll({
      where: { id: savedIds },
    });

    res.sendApiResponse("OK", { saved: savedGroups }, "Successfully edited user groups.");
  } catch (error) {
    res.sendApiResponse(error.code, null, error.message);
  }
};

export default {
  userList,
  userView,
  userActivity,
  userEdit,
  userPermission,
  userGroup,
  userSetGroup,
};
