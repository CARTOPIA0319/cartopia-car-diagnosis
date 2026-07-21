// app/api/direct-input/index.js

import { findFaq } from "./faqMatcher";
import { classifyDirectInput } from "./classify";
import { judgeByAI } from "./aiJudge";
import searchPipeline from "./searchPipeline";

import {
  buildFaqReply,
  buildReservationReply,
  buildAiConfirmationReply,
} from "./replyBuilder";

import { buildConfirmation } from "./buildConfirmation";

export async function handleDirectInput(
  text,
) {
  const input = String(
    text ?? "",
  ).trim();

  if (!input) {
    return {
      ok: false,
      reason: "EMPTY_INPUT",
    };
  }

  // FAQ
  const faq = findFaq(input);

  if (faq) {
    return {
      ok: true,
      route: "faq",
      reply:
        buildFaqReply(faq),
    };
  }

  // 一次分類
  const classification =
    classifyDirectInput(input);

  // AI検索ルート
  if (classification.useAi) {
    const result =
      await searchPipeline(
        input,
      );

    if (!result.success) {
      return {
        ok: true,
        route: "unknown",
        classification,
        ai:
          result.aiResult ??
          null,
        reply: {
          type: "text",
          text: "申し訳ありません。内容を理解できませんでした。",
        },
      };
    }

    return {
      ok: true,
      route: "search",
      classification,
      ai: result.aiResult,
      search:
        result.search,
      execution:
        result.execution,
      message:
        result.message,
      reply:
        buildAiConfirmationReply(
          result.aiResult,
        ),
    };
  }

  // 予約
  if (
    classification.type ===
    "reservation"
  ) {
    return {
      ok: true,
      route: "reservation",
      classification,
      reply:
        buildReservationReply(),
    };
  }

  // その他
  return {
    ok: true,
    route: "confirmation",
    classification,
    reply:
      buildConfirmation(
        input,
        classification,
      ),
  };
}

export default handleDirectInput;
