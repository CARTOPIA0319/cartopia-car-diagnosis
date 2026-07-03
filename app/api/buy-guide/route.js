export async function GET() {
  return Response.json({
    status: "ok",
    name: "CARTOPIA buy-guide webhook",
  });
}

export async function POST(request) {
  const body = await request.json();
  const events = body.events || [];

  for (const event of events) {
    if (
      event.type === "postback" &&
      event.postback?.data === "switch-to-car-search-menu"
    ) {
      await replyMessage(event.replyToken, [
        {
          type: "text",
          text:
            "車種が決まっている方は、そのまま車種名を入力してください🚗\n\n" +
            "例：\n" +
            "・ヴォクシー\n" +
            "・N-BOX\n" +
            "・ハリアー\n\n" +
            "まだ車種が決まっていない方は、下の2つの診断から選べます。\n\n" +
            "【ざっくり診断】\n" +
            "いくつかの簡単な質問から、大まかに合いそうな車のタイプを探します。\n\n" +
            "【ぴったり診断】\n" +
            "家族構成・使い方・予算・雪道・将来の生活変化まで含めて、より細かく合う車を一緒に考えます。"
        }
      ]);
    }
  }

  return Response.json({ ok: true });
}

async function replyMessage(replyToken, messages) {
  await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      replyToken,
      messages,
    }),
  });
}
