// app/api/direct-input/route.js

import { classifyDirectInput } from "./classify";
import { buildConfirmation } from "./buildConfirmation";
import { findFaq } from "./faqMatcher";
import { judgeByAI } from "./aiJudge";
import {
  buildFaqReply,
  buildReservationReply,
  buildAiConfirmationReply,
} from "./replyBuilder";

export const runtime = "nodejs";

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const text = String(
    searchParams.get("text") ?? "",
  ).trim();

  if (!text) {
    return jsonResponse({
      ok: true,
      department: "direct-input",
      status: "ready",
      message: "直接入力部門が正常に稼働しています。",
      usage: "?text=何時まで",
    });
  }

  const faq = findFaq(text);

  if (faq) {
    return jsonResponse({
      ok: true,
      input: text,
      classification: {
        type: "faq",
        confidence: "high",
        useAi: false,
      },
      reply: buildFaqReply(faq),
    });
  }

  const classification =
    classifyDirectInput(text);

  if (classification.useAi) {
    const aiResult =
      await judgeByAI(text);

    if (
      aiResult.success &&
      aiResult.matched
    ) {
      return jsonResponse({
        ok: true,
        input: text,
        classification: {
          type:
            aiResult.type,
          confidence:
            aiResult.confidence,
          useAi: true,
        },
        ai: aiResult,
        reply:
          buildAiConfirmationReply(
            aiResult,
          ),
      });
    }

    return jsonResponse({
      ok: true,
      input: text,
      classification,
      ai: aiResult,
      reply: {
        type: "unknown",
        replyType: "text",
        text: "申し訳ありません。内容を理解できませんでした。もう少し詳しく入力してください。",
      },
    });
  }

  let reply =
    buildConfirmation(
      text,
      classification,
    );

  if (
    classification.type ===
    "reservation"
  ) {
    reply =
      buildReservationReply();
  }

  return jsonResponse({
    ok: true,
    input: text,
    classification,
    reply,
  });
}
