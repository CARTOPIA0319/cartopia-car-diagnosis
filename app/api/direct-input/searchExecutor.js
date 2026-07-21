// app/api/direct-input/searchExecutor.js

export function executeSearch(search = {}) {
  switch (search.searchType) {
    case "maker":
      return {
        action: "maker-search",
        keyword: search.query,
        makerId: search.makerId ?? null,
        url: `/stock?maker=${encodeURIComponent(
          search.query,
        )}`,
      };

    case "brand":
      return {
        action: "brand-search",
        keyword: search.query,
        brandId: search.brandId ?? null,
        url: `/stock?brand=${encodeURIComponent(
          search.query,
        )}`,
      };

    case "model":
      return {
        action: "model-search",
        keyword: search.query,
        makerId: search.makerId ?? null,
        brandId: search.brandId ?? null,
        url: `/stock?model=${encodeURIComponent(
          search.query,
        )}`,
      };

    case "category":
      return {
        action: "category-search",
        keyword: search.query,
        url: `/stock?category=${encodeURIComponent(
          search.query,
        )}`,
      };

    case "purpose":
      return {
        action: "purpose-search",
        keyword: search.query,
        url: `/stock?purpose=${encodeURIComponent(
          search.query,
        )}`,
      };

    default:
      return {
        action: "unknown",
        keyword: "",
        url: null,
      };
  }
}

export default executeSearch;
