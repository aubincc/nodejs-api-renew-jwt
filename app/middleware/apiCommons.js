/**
 * List objects from database
 * @param {*} req request
 * @param {*} res response
 * @param {*} Model Available database model to list
 * @param {*} where Search options
 * @param {*} allowedSortBy Sort options ("ASC")
 * @param {*} scope Specify one of the scopes available in apps\models.js
 * @description retrieve list from a model, with 20 results per page and ASC order by default
 */
const getList = (req, res, Model, where, allowedSortBy, scope) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { page, limit, sort_by, sort_order } = req.query;
      const defaultPage = 1;
      const defaultLimit = 20;
      const parsedPage = parseInt(page) || defaultPage;
      const parsedLimit = parseInt(limit) || defaultLimit;
      const parsedSortBy = allowedSortBy.includes(sort_by) ? sort_by : allowedSortBy[0];
      const allowedSortOrder = ["ASC", "DESC"];
      const parsedSortOrder = allowedSortOrder.includes(sort_order) ? sort_order : "ASC";
      const offset = (parsedPage - 1) * parsedLimit; // calculate the offset based on the page number

      const { rows, count } = await Model.scope(scope).findAndCountAll({
        where,
        order: [[parsedSortBy, parsedSortOrder]], // defaults to [["name", "ASC"]]
        limit: parsedLimit, // defaults to 20
        offset, // defaults to 0
      });

      const pages = Math.ceil(count / parsedLimit);

      resolve({
        list: rows,
        count,
        page: parsedPage,
        pages,
        limit: parsedLimit,
      });
    } catch (err) {
      reject(err);
    }
  });
};

const getListWithInclude = (req, res, Model, where, allowedSortBy, scope, IncludeModel, IncludeWhere) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { page, limit, sort_by, sort_order } = req.query;
      const defaultPage = 1;
      const defaultLimit = 20;
      const parsedPage = parseInt(page) || defaultPage;
      const parsedLimit = parseInt(limit) || defaultLimit;
      const parsedSortBy = allowedSortBy.includes(sort_by) ? sort_by : allowedSortBy[0];
      const allowedSortOrder = ["ASC", "DESC"];
      const parsedSortOrder = allowedSortOrder.includes(sort_order) ? sort_order : "ASC";
      const offset = (parsedPage - 1) * parsedLimit; // calculate the offset based on the page number

      const { rows, count } = await Model.scope(scope).findAndCountAll({
        where,
        include: [
          {
            model: IncludeModel,
            where: IncludeWhere,
          },
        ],
        order: [[parsedSortBy, parsedSortOrder]], // defaults to [["name", "ASC"]]
        limit: parsedLimit, // defaults to 20
        offset, // defaults to 0
      });

      const pages = Math.ceil(count / parsedLimit);

      resolve({
        list: rows,
        count,
        page: parsedPage,
        pages,
        limit: parsedLimit,
      });
    } catch (err) {
      reject(err);
    }
  });
};

export const apiCommons = {
  getList,
  getListWithInclude,
};
