// app/api/direct-input/route.js

import { handleDirectInput } from "./index";

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

    const result =
      await handleDirectInput(
        body.text,
      );

    return json(
      result,
      result.ok ? 200 : 400,
    );
  } catch (error) {
    console.error(
      "[direct-input]",
      error,
    );

    return json(
      {
        ok: false,
        reason:
          "INTERNAL_SERVER_ERROR",
      },
      500,
    );
  }
}

export async function GET(request) {
  const { searchParams } =
    new URL(request.url);

  const text =
    searchParams.get("text");

  if (!text) {
    return json({
      ok: true,
      service:
        "direct-input",
      status: "ready",
      usage:
        "/api/direct-input?text=アルファード",
    });
  }

  const result =
    await handleDirectInput(
      text,
    );

  return json(
    result,
    result.ok ? 200 : 400,
  );
}
