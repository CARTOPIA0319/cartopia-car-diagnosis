// app/api/direct-input/searchPipeline.js

import { judgeByAI } from "./aiJudge";
import searchService from "./searchService";

export async function searchPipeline(input) {
  const text = String(input ?? "").trim();

  if (!text) {
    return {
      success: false,
      reason: "EMPTY_INPUT",
    };
  }

  const aiResult = await judgeByAI(text);

  if (!aiResult.success) {
    return {
      success: false,
      reason: "AI_ERROR",
      aiResult,
    };
  }

  if (!aiResult.matched) {
    return {
      success: false,
      reason: "NO_MATCH",
      aiResult,
    };
  }

  const result = await searchService(aiResult);

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    aiResult,
    search: result.search,
    execution: result.execution,
    message: result.message,
  };
}

export default searchPipeline;
