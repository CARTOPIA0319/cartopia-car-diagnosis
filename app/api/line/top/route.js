const topQuickReply = {
  items: [
    {
      type: "action",
      action: {
        type: "message",
        label: "「買う」でできること",
        text: "「買う」でできること",
      },
    },
    {
      type: "action",
      action: {
        type: "message",
        label: "「売る」でできること",
        text: "「売る」でできること",
      },
    },
    {
      type: "action",
      action: {
        type: "message",
        label: "「予約」でできること",
        text: "「予約」でできること",
      },
    },
  ],
};

export async function GET() {
  return Response.json({
    status: "ok",
    name: "CARTOPIA LINE top guide",
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const events = Array.isArray(body.events) ? body.events : [];

    for (const event of events) {
      if (!event?.replyToken) continue;

      const text =
        event.type === "message" && event.message?.type === "text"
          ? event.message.text
          : "";

      const messages = makeTopGuideMessages(text);

      if (!messages) continue;

      await replyMessage(event.replyToken, messages);
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("TOP_GUIDE_ERROR:", error);

    return Response.json(
      {
        ok: false,
        error: error.message || String(error),
      },
      { status: 500 }
    );
  }
}

function makeTopGuideMessages(text) {
  if (text === "「買う」でできること") {
    return [
      {
        type: "text",
        text:
          "🚗 「くるまを買う」では、\n" +
          "あなたに合った3つの探し方をご用意しています😊\n\n" +
          "⚡ ざっくり診断（約10秒）\n" +
          "2つの質問に答えると、\n" +
          "カーとぴあの在庫からおすすめのお車をご紹介します🚗\n\n" +
          "🤖 AIぴったり診断（約5分）\n" +
          "家族構成や使い方など、\n" +
          "12項目の質問からAIがあなたにぴったりな車種をご提案します😊\n\n" +
          "🔎 ご希望の車種が決まっている方\n" +
          "車種名を送るだけ😊\n" +
          "カーとぴあの在庫から近いお車をご紹介します🚗\n\n" +
          "在庫にない場合も、\n" +
          "全国からご希望に合う一台をお探しできます😊",
        quickReply: topQuickReply,
      },
    ];
  }

  if (text === "「売る」でできること") {
    return [
      {
        type: "text",
        text:
          "💰 「くるまを売る」では、\n" +
          "大切にしてきた愛車を、納得のいく形で手放せるようにサポートします😊\n\n" +
          "査定の流れや必要なものも、わかりやすくご案内します🚗",
        quickReply: topQuickReply,
      },
    ];
  }

  if (text === "「予約」でできること") {
    return [
      {
        type: "text",
        text:
          "🔧 「予約」では、\n" +
          "車検・点検・オイル交換・修理などのご相談ができます😊\n\n" +
          "気になることがあれば、LINEからお気軽にご相談ください🚗",
        quickReply: topQuickReply,
      },
    ];
  }

  return null;
}

async function replyMessage(replyToken, messages) {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("LINE_CHANNEL_ACCESS_TOKEN is not set");
  }

  const response = await fetch(
    "https://api.line.me/v2/bot/message/reply",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        replyToken,
        messages,
      }),
    }
  );

  const result = await response.text();

  console.log("TOP_GUIDE_REPLY_STATUS:", response.status);
  console.log("TOP_GUIDE_REPLY_RESULT:", result);

  if (!response.ok) {
    throw new Error(
      `LINE reply failed: ${response.status} ${result}`
    );
  }
}
