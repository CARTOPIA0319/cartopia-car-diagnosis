const BUY_MENU_ID = "richmenu-e5d740b020ec4b2a55a6a074b502a608";

const buyQuickReply = {
  items: [
    {
      type: "action",
      action: {
        type: "message",
        label: "車種が決まっている人は？",
        text: "車種が決まっている人は？",
      },
    },
    {
      type: "action",
      action: {
        type: "message",
        label: "ざっくり診断とは？",
        text: "ざっくり診断とは？",
      },
    },
    {
      type: "action",
      action: {
        type: "message",
        label: "ぴったり診断とは？",
        text: "ぴったり診断とは？",
      },
    },
  ],
};

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
    if (!event.replyToken) continue;

    const text =
      event.type === "message" && event.message?.type === "text"
        ? event.message.text
        : "";

    const postbackData =
      event.type === "postback" ? event.postback?.data : "";

    const isBuy =
      text === "くるまを買う" ||
      postbackData === "switch-to-car-search-menu";

    if (isBuy) {
      console.log("USER_ID:", event.source.userId);
      console.log("BUY_MENU_ID:", BUY_MENU_ID);

      await linkRichMenu(event.source.userId, BUY_MENU_ID);

      await replyMessage(event.replyToken, [
        {
          type: "text",
          text: "気になる項目を選んでください",
          quickReply: buyQuickReply,
        },
      ]);
      continue;
    }

    if (text === "車種が決まっている人は？") {
      await replyMessage(event.replyToken, [
        {
          type: "text",
          text:
            "欲しい車種が決まっている方へ\n\n" +
            "そのまま車種名を送ってください。\n\n" +
            "例えば…\n" +
            "・アルファード\n" +
            "・N-BOX\n" +
            "・シエンタ\n" +
            "・ヴェゼル\n\n" +
            "など、何でも大丈夫です。",
          quickReply: buyQuickReply,
        },
      ]);
      continue;
    }

    if (text === "ざっくり診断とは？") {
      await replyMessage(event.replyToken, [
        {
          type: "text",
          text:
            "ざっくり診断（約10秒）\n\n" +
            "「まだ何に乗るか決まってない」\n\n" +
            "そんな方はこちら！\n\n" +
            "いくつかの質問に答えるだけで、\n" +
            "あなたに合いそうな車のタイプをご提案します。",
          quickReply: buyQuickReply,
        },
      ]);
      continue;
    }

    if (text === "ぴったり診断とは？") {
      await replyMessage(event.replyToken, [
        {
          type: "text",
          text:
            "AIぴったり診断（約5分）\n\n" +
            "家族構成\n" +
            "使い方\n" +
            "ご予算\n" +
            "将来のライフスタイル\n\n" +
            "まで考えて、\n" +
            "あなたにぴったりな車種をご提案します。\n\n" +
            "「後悔しない車選び」をしたい方におすすめです。",
          quickReply: buyQuickReply,
        },
      ]);
      continue;
    }
  }

  return Response.json({ ok: true });
}

async function replyMessage(replyToken, messages) {
  const res = await fetch("https://api.line.me/v2/bot/message/reply", {
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

  const result = await res.text();
  console.log("REPLY_STATUS:", res.status);
  console.log("REPLY_RESULT:", result);
}

async function linkRichMenu(userId, richMenuId) {
  const res = await fetch(
    `https://api.line.me/v2/bot/user/${userId}/richmenu/${richMenuId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
      },
    }
  );

  const result = await res.text();
  console.log("LINK_RICH_MENU_STATUS:", res.status);
  console.log("LINK_RICH_MENU_RESULT:", result);
}
