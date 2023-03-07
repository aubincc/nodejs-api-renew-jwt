/**
 * utils.lowerKeys(object)
 * @param {*} obj object to lowercase the keys of
 * @description returns the object with all keys lowercased
 */
const lowerKeys = (obj) => {
  var key,
    keys = Object.keys(obj);
  var n = keys.length;
  var newObj = {};
  while (n--) {
    key = keys[n];
    newObj[key.toLowerCase()] = obj[key];
  }
  return newObj;
};

/**
 * utils.secondsToDhms(seconds)
 *
 * @param {Number} d number of seconds to convert to string of days, hours, minutes, seconds
 * @description returns the string
 */
const secondsToDhms = (d) => {
  d = Number(d);
  const days = Math.floor(d / 86400);
  const hours = Math.floor((d % 86400) / 3600);
  const minutes = Math.floor(((d % 86400) % 3600) / 60);
  const seconds = Math.floor(((d % 86400) % 3600) % 60);
  let result = "";

  if (days > 2) {
    return `${days} days`;
  } else if (days > 0) {
    result = `${days} day${days > 1 ? "s" : ""}, `;
    if (hours > 2) {
      return result + `${hours} hours`;
    } else if (hours > 0) {
      result += `${hours} hour${hours > 1 ? "s" : ""}, `;
      if (minutes > 2) {
        return result + `${minutes} minutes`;
      } else if (minutes > 0) {
        result += `${minutes} minute${minutes > 1 ? "s" : ""}, `;
        if (seconds > 2) {
          return result + `${seconds} seconds`;
        } else if (seconds > 0) {
          result += `${seconds} second${seconds > 1 ? "s" : ""}`;
        }
      }
    }
  }
  return result;
};

const permissionValues = {
  // 0: "no right",
  1: "read",
  2: "create",
  4: "update",
  8: "delete",
};

/**
 * Removes all negative, null, and non-numeric values from an array and turns them into numbers above 0.
 *
 * @param {Array} arr - The input array to clean.
 * @returns {Array} The cleaned array with positive numbers only.
 * @throws {Error} If the input is not an array.
 */
const cleanArray = (arr) => {
  try {
    if (!Array.isArray(arr)) {
      throw { code: "NOT_ACCEPTABLE", message: "Invalid body format for this route (not array)." };
    }

    return arr.filter((val) => Number(val) > 0 && !isNaN(Number(val)));
  } catch (error) {
    throw error;
  }
};

/**
 * Removes all common entries from two arrays.
 *
 * @param {Array} addArray - The first array.
 * @param {Array} delArray - The second array.
 * @returns {Array} An array containing the cleaned arrays.
 */
const cleanCompare = (addArray, delArray) => {
  return [addArray.filter((val) => !delArray.includes(val)), delArray.filter((val) => !addArray.includes(val))];
};

/**
 * Updates a current array based on two other arrays.
 *
 * @param {Array} currentArray - The array to update.
 * @param {Array} addArray - The array of items to add.
 * @param {Array} delArray - The array of items to remove.
 * @returns {Array} The updated array.
 */
const updateArray = (currentArray, addArray, delArray) => {
  const newArray = [...currentArray];
  addArray.forEach((val) => {
    if (!newArray.includes(val)) {
      newArray.push(val);
    }
  });
  delArray.forEach((val) => {
    const index = newArray.indexOf(val);
    if (index !== -1) {
      newArray.splice(index, 1);
    }
  });
  return newArray;
};

/**
 * Converts a decimal number to its corresponding array of strings representing permissions
 *
 * @param {number} value - A decimal number representing the permissions (e.g. 5)
 * @returns {string[]} - The corresponding array of strings representing the permissions (e.g. ['read', 'update'])
 */
const getPermissionsFromValue = (value) => {
  value = parseInt(value);
  value = isNaN(value) || value < 0 ? 0 : value;
  value = value > 15 ? 0 : Math.trunc(value);
  const permissions = [];
  for (const [key, name] of Object.entries(permissionValues)) {
    if (value & key) {
      permissions.push(name);
    }
  }
  return permissions;
};

/**
 * Converts an array of strings representing permissions to its corresponding decimal value
 *
 * @param {string[]} permissions - An array of strings representing the permissions (e.g. ['read', 'update'])
 * @returns {number} - The corresponding decimal value of the array of permissions
 * @throws {Error} - If input is not an array
 */
const getValueFromPermissions = (permissions) => {
  if (!Array.isArray(permissions)) {
    throw new Error("Input must be an array of permissions");
  }

  let value = 0;
  const uniquePermissions = [...new Set(permissions)];
  for (const permission of uniquePermissions) {
    for (const [key, name] of Object.entries(permissionValues)) {
      if (permission === name) {
        value += Number(key);
      }
    }
  }
  return value;
};

/**
 * Merges an array of permission objects into a single object, removing duplicates and sorting the actions.
 *
 * @param {Array.<Object>} permissionObjects - An array of permission objects to merge.
 * @returns {Object} - A merged permission object.
 */
const mergePermissionObjects = (permissionObjects) => {
  // Create an empty object to store the merged permissions
  const permissionMap = {};

  // Loop through each permission object
  permissionObjects.forEach((permissionObject) => {
    // Loop through each resource and its actions in the current permission object
    Object.entries(permissionObject).forEach(([resource, actions]) => {
      // Create an array to store the actions for this resource if it doesn't exist yet
      permissionMap[resource] = permissionMap[resource] || [];

      // Loop through each action for the current resource and add it to the permissionMap if it doesn't exist yet
      actions.forEach((action) => {
        if (!permissionMap[resource].includes(action)) {
          permissionMap[resource].push(action);
        }
      });
    });
  });

  // Loop through the permissionMap and order the actions for each resource
  const orderedPermissionMap = Object.entries(permissionMap).reduce((acc, [resource, actions]) => {
    // Create a new array with the actions sorted in the desired order
    const orderedActions = ["read", "update", "create", "delete"].filter((action) => actions.includes(action));

    // Add the ordered actions to the new permission object
    acc[resource] = orderedActions;

    // Return the new permission object
    return acc;
  }, {});

  // Remove any resources with empty arrays of actions from the permission object
  Object.keys(orderedPermissionMap).forEach((resource) => {
    if (orderedPermissionMap[resource].length === 0) {
      delete orderedPermissionMap[resource];
    }
  });

  // Return the final ordered permission object
  return orderedPermissionMap;
};

/**
 * Validate the id of a model instance
 *
 * @param {Model} model - The Sequelize model to validate the id for
 * @param {number} id - The id to validate
 * @throws {Object} - The error object with code and message properties
 * @returns {Promise<Model>} - The validated model instance
 */
const validateId = async (model, id, options) => {
  try {
    if (!Number.isInteger(+id)) {
      throw { code: "NOT_ACCEPTABLE", message: `Invalid ${model.name} id format ('${id}')` };
    }
    const result = await model.scope("noSecrets", "noTimestamps").findByPk(id, { ...options });
    if (!result) {
      throw { code: "NOT_FOUND", message: `${model.name} not found.` };
    }
    return result;
  } catch (error) {
    throw error;
  }
};

/**
 * Return true if message contains known error
 * @param {String} m
 * @returns
 */
const dbConnectionErrorIn = (m) => {
  const dbErrors = ["Access denied", "ECONNREFUSED"];
  return !m ? false : dbErrors.some((e) => m.indexOf(e) >= 0 || !m) ? true : false;
};

export const utils = {
  lowerKeys,
  secondsToDhms,
  cleanArray,
  cleanCompare,
  updateArray,
  getPermissionsFromValue,
  getValueFromPermissions,
  mergePermissionObjects,
  validateId,
  dbConnectionErrorIn,
};
