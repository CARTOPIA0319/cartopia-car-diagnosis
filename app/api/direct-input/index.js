// app/api/direct-input/index.js

import { findFaq } from "./faqMatcher";
import { classifyDirectInput } from "./classify";
import { judgeByAI } from "./aiJudge";
import { buildConfirmation } from "./buildConfirmation";
import resolveSearchTarget from "./searchResolver";
import executeSearch from "./searchExecutor";
import { buildSearchMessage } from "./searchMessageBuilder";

import {
  buildFaqReply,
  buildReservationReply,
  buildAiConfirmationReply,
} from "./replyBuilder";

export async function handleDirectInput(text) {
  const input = String(text ?? "").trim();

  if (!input) {
    return {
      ok: false,
      reason: "EMPTY_INPUT",
    };
  }

  const faq = findFaq(input);

  if (faq) {
    return {
      ok: true,
      route: "faq",
      reply: buildFaqReply(faq),
    };
  }

  const classification =
    classifyDirectInput(input);

  if (classification.useAi) {
    const aiResult =
      await judgeByAI(input);

    if (
      !aiResult.success ||
      !aiResult.matched
    ) {
      return {
        ok: true,
        route: "unknown",
        classification,
        ai: aiResult,
        reply: {
          type: "text",
          replyType: "text",
          text: "申し訳ありません。内容を理解できませんでした。別の言い方で入力してください。",
        },
      };
    }

    const search =
      resolveSearchTarget(aiResult);

    const execution =
      executeSearch(search);

    const message =
      buildSearchMessage(execution);

    return {
      ok: true,
      route: "search",
      classification,
      ai: aiResult,
      search,
      execution,
      message,
      reply:
        buildAiConfirmationReply(
          aiResult,
        ),
    };
  }

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
