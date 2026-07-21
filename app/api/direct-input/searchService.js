// app/api/direct-input/searchService.js

import resolveSearchTarget from "./searchResolver";
import executeSearch from "./searchExecutor";
import { buildSearchMessage } from "./searchMessageBuilder";

export async function searchService(aiResult) {
  if (!aiResult?.matched) {
    return {
      success: false,
      reason: "NO_MATCH",
    };
  }

  const search =
    resolveSearchTarget(aiResult);

  const execution =
    executeSearch(search);

  const message =
    buildSearchMessage(execution);

  return {
    success: true,
    search,
    execution,
    message,
  };
}

export default searchService;
