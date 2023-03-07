import { db } from "../models/index.js";
const { permission: Permission } = db;

const permissionList = async (req, res) => {
  try {
    const permissionsByResource = await Permission.getPermissionsByResource();

    res.sendApiResponse("OK", permissionsByResource, "Successfully retrieved list of available permissions.");
  } catch (error) {
    res.sendApiResponse(error.code, null, error.message || "Error retrieving permission list.");
  }
};

export default {
  permissionList,
};
