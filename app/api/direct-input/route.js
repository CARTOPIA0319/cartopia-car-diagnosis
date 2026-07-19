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
  const text = searchParams.get("text") ?? "";

  if (!text.trim()) {
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
    const reply = buildFaqReply(faq);

    return jsonResponse({
      ok: true,
      input: text,
      classification: {
        type: "faq",
        confidence: "high",
        useAi: false,
      },
      reply,
    });
  }

  const classification = classifyDirectInput(text);

  if (classification.useAi === true) {
    const aiJudgement = await judgeByAI(text);
    const reply = buildAiConfirmationReply();

    return jsonResponse({
      ok: true,
      input: text,
      classification,
      aiJudgement,
      reply,
    });
  }

  const confirmation = buildConfirmation(text, classification);

  let reply = confirmation;

  if (classification.type === "reservation") {
    reply = buildReservationReply();
  }

  return jsonResponse({
    ok: true,
    input: text,
    classification,
    reply,
  });
}
