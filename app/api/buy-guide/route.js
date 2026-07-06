export async function GET() {
  return Response.json({
    status: "ok",
    name: "CARTOPIA buy-guide webhook test",
  });
}

export async function POST(request) {
  const body = await request.json();
  const events = body.events || [];

  for (const event of events) {
    if (!event.replyToken) continue;

    await replyMessage(event.replyToken, [
      {
        type: "text",
        text: "Webhookテスト成功です。買うボタンからVercelに届いています。",
      },
    ]);
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
