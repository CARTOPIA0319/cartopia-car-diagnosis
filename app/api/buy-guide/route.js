const BUY_MENU_ID = "richmenu-3525919a10364ad419aec24b0d9a3cd7";
const TOP_MENU_ID = "richmenu-19859bd6bf80b802dfc2171536ac089e";

const buyQuickReply = {
  items: [
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
    {
      type: "action",
      action: {
        type: "message",
        label: "車種が決まっている人は？",
        text: "車種が決まっている人は？",
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
      await linkRichMenu(event.source.userId, BUY_MENU_ID);

      await replyMessage(event.replyToken, [
        {
          type: "text",
          text: "気になる項目を選んでください😊",
          quickReply: buyQuickReply,
        },
      ]);
      continue;
    }

    if (text === "トップへ戻る") {
      await linkRichMenu(event.source.userId, TOP_MENU_ID);

      await replyMessage(event.replyToken, [
        {
          type: "text",
          text: "トップメニューに戻りました😊",
        },
      ]);
      continue;
    }

    if (text === "車種が決まっている人は？") {
      await replyMessage(event.replyToken, [
        {
          type: "text",
          text:
            "🚗 欲しい車種がある方へ\n\n" +
            "車種名をそのまま送ってください😊\n\n" +
            "例えば…\n" +
            "・アルファード\n" +
            "・N-BOX\n" +
            "・シエンタ\n" +
            "・ヴェゼル\n\n" +
            "こんな感じで大丈夫です✨",
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
            "🚙 ざっくり診断（約10秒）\n\n" +
            "まだ何に乗るか決まっていない方におすすめです😊\n\n" +
            "いくつかの質問に答えるだけで\n" +
            "あなたに合いそうな車のタイプをご提案します✨",
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
            "✨ AIぴったり診断（約5分）\n\n" +
            "家族構成\n" +
            "使い方\n" +
            "ご予算\n" +
            "将来のライフスタイル\n\n" +
            "ここまで考えて\n" +
            "あなたにぴったりな車種をご提案します😊\n\n" +
            "後悔しない車選びをしたい方におすすめです🚗",
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
