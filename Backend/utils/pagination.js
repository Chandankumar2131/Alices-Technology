const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

const getPagination = (query = {}) => {
  const page = Math.max(parseInt(query.page, 10) || DEFAULT_PAGE, 1);
  const requestedLimit = parseInt(query.limit, 10) || DEFAULT_LIMIT;
  const limit = Math.min(Math.max(requestedLimit, 1), MAX_LIMIT);
  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
  };
};

const paginatedResponse = ({ page, limit, total, data }) => {
  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return {
    count: data.length,
    total,
    pagination: {
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
    data,
  };
};

module.exports = {
  getPagination,
  paginatedResponse,
};
