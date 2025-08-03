// Pagination helper function
function getPaginationParams(req) {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
  const offset = (page - 1) * limit;
  
  return { page, limit, offset };
}

// Create pagination response
function createPaginatedResponse(articles, totalCount, page, limit, req) {
  const totalPages = Math.ceil(totalCount / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  
  // Build base URL for pagination links
  const baseUrl = `${req.protocol}://${req.get('host')}${req.path}`;
  const queryParams = new URLSearchParams(req.query);
  
  // Remove page from query params for link building
  queryParams.delete('page');
  const baseQuery = queryParams.toString();
  
  return {
    data: articles,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      limit,
      hasNext,
      hasPrev,
      nextPage: hasNext ? page + 1 : null,
      prevPage: hasPrev ? page - 1 : null,
      links: {
        first: `${baseUrl}?${baseQuery ? baseQuery + '&' : ''}page=1`,
        last: `${baseUrl}?${baseQuery ? baseQuery + '&' : ''}page=${totalPages}`,
        next: hasNext ? `${baseUrl}?${baseQuery ? baseQuery + '&' : ''}page=${page + 1}` : null,
        prev: hasPrev ? `${baseUrl}?${baseQuery ? baseQuery + '&' : ''}page=${page - 1}` : null
      }
    }
  };
}

module.exports = {
  getPaginationParams,
  createPaginatedResponse
}; 