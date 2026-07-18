import { classifyDirectInput } from "./classify";
import { buildConfirmation } from "./buildConfirmation";

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
      message:
        "\u76f4\u63a5\u5165\u529b\u90e8\u9580\u304c\u6b63\u5e38\u306b\u7a3c\u50cd\u3057\u3066\u3044\u307e\u3059\u3002",
      usage: "?text=\u30b9\u30fc\u30d1\u30fc\u30ab\u30fc",
    });
  }

  const classification = classifyDirectInput(text);
  const confirmation = buildConfirmation(text, classification);

  return jsonResponse({
    ok: true,
    input: text,
    classification,
    confirmation,
  });
}
