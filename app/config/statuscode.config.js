export const config = [
  // API is running
  {
    error: 0,
    state: "ok",
    code: "RUNNING",
    message: "API is running",
    status: 200,
  },
  // data is readable
  {
    error: 0,
    state: "ok",
    code: "OK",
    message: "Accepted",
    status: 200,
  },
  // no change was made
  {
    error: 0,
    state: "ok",
    code: "NO_CHANGE",
    message: "No change",
    status: 200,
  },
  // item or items successfully created
  {
    error: 0,
    state: "ok",
    code: "CREATED",
    message: "Item created as requested",
    status: 201,
  },
  // item or items successfully updated
  {
    error: 0,
    state: "ok",
    code: "MODIFIED",
    message: "Item updated as requested",
    status: 202,
  },
  // item or items successfully deleted
  {
    error: 0,
    state: "ok",
    code: "DELETED",
    message: "Item deleted as requested",
    status: 202,
  },
  // form not as it should
  {
    error: 1,
    state: "error",
    code: "BAD_REQUEST",
    message: "Request does not meet the expectations",
    status: 400,
  },
  // missing, invalid or expired credentials
  {
    error: 1,
    state: "error",
    code: "UNAUTHORIZED",
    message: "Unauthorized Access",
    status: 401,
  },
  // valid credentials but not where the user should be
  {
    error: 1,
    state: "error",
    code: "FORBIDDEN",
    message: "Forbidden Access",
    status: 403,
  },
  // item or items not found
  {
    error: 1,
    state: "error",
    code: "NOT_FOUND",
    message: "Requested item does not exist",
    status: 404,
  },
  // file not found
  {
    error: 1,
    state: "error",
    code: "FILE_MISSING",
    message: "File not found",
    status: 404,
  },
  // missing or invalid negociation headers (encoding, language)
  {
    error: 1,
    state: "error",
    code: "NOT_ACCEPTABLE",
    message: "Not acceptable",
    status: 406,
  },
  // response to a funny attempt on a valid route
  {
    error: -1,
    state: "unknown",
    code: "EMPTY_REQUEST",
    message: "You are what my status is...",
    status: 418,
  },
  // response to a non existing route
  {
    error: 1,
    state: "error",
    code: "DAFUQ",
    message: "Dafuq!",
    status: 420,
  },
  // response on a valid route which is being spammed (for limiting middleware)
  {
    error: 1,
    state: "error",
    code: "BUSY",
    message: "It looks like somebody is repeatingly repeating",
    status: 425,
  },
    // response on a valid route which is being spammed (for limiting middleware)
    {
      error: 1,
      state: "error",
      code: "TOO_MANY_REQUESTS",
      message: "Too many requests",
      status: 429,
    },
  // response on any uncaught error
  {
    error: 1,
    state: "error",
    code: "FATAL",
    message: "Fatal error.",
    status: 500,
  },
];
