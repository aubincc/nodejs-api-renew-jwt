import { db } from "../models/index.js";
import { utils } from "../middleware/index.js";
import { config } from "../config/setup.config.js";
const { group: Group, permission: Permission, group_permission: GroupPermission, resource: Resource } = db;

/**
 * Creates groups in the database based on the `groupList` array
 * @returns {Promise} Promise that resolves when all the groups have been created or found
 */
export const groupSetup = () => {
  // Map the groupList array into a series of findOrCreate operations for each group
  const { groupList } = config;
  const operations = groupList.map(({ id, name, system, alias, ...rest }) => {
    const where = alias ? { id, name, system, alias } : { id, name, system };
    return Group.findOrCreate({ where });
  });

  // Return a Promise that resolves when all the findOrCreate operations have completed
  return Promise.all(operations);
};

/**
 * Creates resources in the database based on the `resourceList` array
 * @returns {Promise} Promise that resolves when all the resources have been created or found
 */
export const resourceSetup = () => {
  // Map the resourceList array into a series of findOrCreate operations for each resource
  const { resourceList } = config;
  const operations = resourceList.map(({ id, name, ...rest }) => {
    return Resource.findOrCreate({
      where: { id, name },
    });
  });

  // Return a Promise that resolves when all the findOrCreate operations have completed
  return Promise.all(operations);
};

/**
 * Function to set up the resource permissions.
 *
 * Loops through the `resourceList` array, finds or creates the resources with `id` and `name`, and sets the allowed actions for each resource using `getPermissionsFromValue`.
 *
 * @returns {Promise} A promise that resolves when all the resources and their allowed actions have been created.
 */

export const resourcePermissionSetup = () => {
  // Loop through the resourceList array
  const { resourceList } = config;
  const resources = resourceList.map(({ id, name, available_actions, ...rest }) => {
    // Find or create a resource with id and name
    return Resource.findOrCreate({
      where: { id, name },
    }).then(([resource]) => {
      // Use getPermissionsFromValue to find the allowed actions for the resource
      const allowedActions = utils.getPermissionsFromValue(available_actions);

      // Create an array of promises to find or create each allowed action
      const operations = allowedActions.map((action) => {
        return Permission.findOrCreate({
          where: {
            action: action, // The name of the allowed action
            resource_id: resource.id, // The id of the resource
          },
        });
      });

      // Wait for all the allowed actions to be created
      return Promise.all(operations);
    });
  });

  // Wait for all the resources and their allowed actions to be created
  return Promise.all(resources);
};

/**
 * Function to set up the admin group's permissions
 * @async
 * @returns {Promise} - A promise that resolves once all permissions have been given to the administrator group.
 */
export const adminGroupPermissionSetup = async () => {
  // Find the admin group and set all permissions for it
  const adminGroup = await Group.findOne({ where: { alias: "admin" } });
  const permissions = await Permission.findAll();

  // Loop through all the permissions
  const adminPermissions = permissions.map((permission) => {
    // Give each permission to the administrator group
    return GroupPermission.findOrCreate({
      where: {
        group_id: adminGroup.id,
        permission_id: permission.id,
      },
    });
  });

  // Wait for all the permissions to be given to the administrator
  return Promise.all(adminPermissions);
};
