export const config = {
  groupList: [
    { id: 1, name: "User", system: 1, alias: "user" },
    { id: 2, name: "Users Manager", system: 1 },
    { id: 3, name: "Administrator", system: 1, alias: "admin" },
  ],
  resourceList: [
    { id: 1, name: "USER", available_actions: 13 }, // 1+4+8
    { id: 2, name: "USER_ACTIVITY", available_actions: 9 }, // 1+8
    { id: 3, name: "USER_PERMISSION", available_actions: 1 }, // 1
    { id: 5, name: "USER_GROUP", available_actions: 5 }, // 1+4
    { id: 4, name: "GROUP", available_actions: 15 }, //1+2+4+8
    { id: 6, name: "GROUP_PERMISSION", available_actions: 5 }, // 1+4
    { id: 7, name: "PERMISSION", available_actions: 1 }, // 1
  ],
};
