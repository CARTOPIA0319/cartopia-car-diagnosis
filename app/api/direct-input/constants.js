// app/api/direct-input/constants.js

export const SEARCH_TYPE = Object.freeze({
  MAKER: "maker",
  BRAND: "brand",
  MODEL: "model",
  CATEGORY: "category",
  PURPOSE: "purpose",
  UNKNOWN: "unknown",
});

export const ROUTE = Object.freeze({
  FAQ: "faq",
  SEARCH: "search",
  RESERVATION: "reservation",
  CONFIRMATION: "confirmation",
  UNKNOWN: "unknown",
});

export const REPLY_TYPE = Object.freeze({
  TEXT: "text",
  BUTTONS: "buttons",
  FLEX: "flex",
});

export const PIPELINE_REASON = Object.freeze({
  EMPTY_INPUT: "EMPTY_INPUT",
  NO_MATCH: "NO_MATCH",
  AI_ERROR: "AI_ERROR",
  INTERNAL_SERVER_ERROR:
    "INTERNAL_SERVER_ERROR",
});

export const CONFIDENCE = Object.freeze({
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
});
