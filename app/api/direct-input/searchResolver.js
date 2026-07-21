// app/api/direct-input/searchResolver.js

export function resolveSearchTarget(ai = {}) {
  if (!ai?.matched) {
    return {
      searchType: "unknown",
      query: "",
    };
  }

  switch (ai.type) {
    case "maker":
      return {
        searchType: "maker",
        query: ai.normalized,
        makerId: ai.makerId || null,
      };

    case "brand":
      return {
        searchType: "brand",
        query: ai.normalized,
        brandId: ai.brandId || null,
      };

    case "model":
      return {
        searchType: "model",
        query: ai.normalized,
        makerId: ai.makerId || null,
        brandId: ai.brandId || null,
      };

    case "category":
      return {
        searchType: "category",
        query: ai.normalized,
      };

    case "purpose":
      return {
        searchType: "purpose",
        query: ai.normalized,
      };

    default:
      return {
        searchType: "unknown",
        query: "",
      };
  }
}

export default resolveSearchTarget;
