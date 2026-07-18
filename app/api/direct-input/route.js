import { classifyDirectInput } from "./classify";

export const runtime = "nodejs";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get("text") ?? "";

  if (!text) {
    const data = {
      ok: true,
      department: "direct-input",
      status: "ready",
      message:
        "\u76f4\u63a5\u5165\u529b\u90e8\u9580\u304c\u6b63\u5e38\u306b\u7a3c\u50cd\u3057\u3066\u3044\u307e\u3059\u3002",
      usage: "?text=\u8eca\u691c\u4e88\u7d04\u3057\u305f\u3044",
    };

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  }

  const result = classifyDirectInput(text);

  const data = {
    ok: true,
    input: text,
    result,
  };

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
