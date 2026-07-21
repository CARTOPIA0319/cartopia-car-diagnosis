// app/api/direct-input/route.js

import { classifyDirectInput } from "./classify";
import { findFaq } from "./faqMatcher";
import { judgeByAI } from "./aiJudge";
import { buildConfirmation } from "./buildConfirmation";
import {
  buildFaqReply,
  buildReservationReply,
  buildAiConfirmationReply,
} from "./replyBuilder";

export const runtime = "nodejs";

function json(data, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type":
          "application/json; charset=utf-8",
      },
    },
  );
}

export async function POST(request) {
  try {
    const body =
      await request.json();

    const text = String(
      body.text ?? "",
    ).trim();

    if (!text) {
      return json(
        {
          ok: false,
          message:
            "text is required",
        },
        400,
      );
    }

    // FAQ
    const faq = findFaq(text);

    if (faq) {
      return json({
        ok: true,
        route: "faq",
        reply:
          buildFaqReply(faq),
      });
    }

    // 一次分類
    const classification =
      classifyDirectInput(text);

    // AI判定
    if (classification.useAi) {
      const ai =
        await judgeByAI(text);

      if (
        ai.success &&
        ai.matched
      ) {
        return json({
          ok: true,
          route: "ai",
          classification,
          ai,
          reply:
            buildAiConfirmationReply(
              ai,
            ),
        });
      }

      return json({
        ok: true,
        route: "unknown",
        classification,
        ai,
        reply: {
          type: "text",
          text: "申し訳ありません。内容を理解できませんでした。別の言い方でもう一度お試しください。",
        },
      });
    }

    // 通常分岐
    if (
      classification.type ===
      "reservation"
    ) {
      return json({
        ok: true,
        route: "reservation",
        classification,
        reply:
          buildReservationReply(),
      });
    }

    return json({
      ok: true,
      route: "confirmation",
      classification,
      reply:
        buildConfirmation(
          text,
          classification,
        ),
    });
  } catch (error) {
    console.error(error);

    return json(
      {
        ok: false,
        message:
          "Internal Server Error",
      },
      500,
    );
  }
}
