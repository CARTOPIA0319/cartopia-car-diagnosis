const BUY_MENU_ID = "richmenu-e5d740b020ec4b2a55a6a074b502a608";

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

    const isBuyPostback =
      event.type === "postback" &&
      event.postback?.data === "switch-to-car-search-menu";

    const isBuyMessage =
      event.type === "message" &&
      event.message?.type === "text" &&
      event.message.text === "くるまを買う";

    if (isBuyPostback || isBuyMessage) {
      await linkRichMenu(event.source.userId, BUY_MENU_ID);

      await replyMessage(event.replyToken, [
        {
          type: "text",
          text: "気になる項目を選んでください😊",
          quickReply: {
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
          },
        },
      ]);

      continue;
    }

    if (event.type === "message" && event.message?.type === "text") {
      const text = event.message.text;

      if (text === "車種が決まっている人は？") {
        await replyMessage(event.replyToken, [
          {
            type: "text",
            text:
              "🚗 欲しい車種が決まっている方へ\n\n" +
              "そのまま車種名を送ってください😊\n\n" +
              "例えば…\n" +
              "・アルファード\n" +
              "・N-BOX\n" +
              "・シエンタ\n" +
              "・ヴェゼル\n\n" +
              "など、何でも大丈夫です✨",
          },
        ]);

        continue;
      }

      if (text === "ざっくり診断とは？") {
        await replyMessage(event.replyToken, [
          {
            type: "text",
            text:
              "🔍 ざっくり診断（約10秒）\n\n" +
              "「まだ何に乗るか決まってない🤔」\n\n" +
              "そんな方はこちら！\n\n" +
              "いくつかの質問に答えるだけで、\n" +
              "あなたに合いそうな車のタイプをご提案します😊",
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
              "家族構成👨‍👩‍👧\n" +
              "使い方🚗\n" +
              "ご予算💰\n" +
              "将来のライフスタイル🌱\n\n" +
              "まで考えて、\n" +
              "あなたにぴったりな車種をご提案します😊\n\n" +
              "「後悔しない車選び」をしたい方におすすめです✨",
          },
        ]);

        continue;
      }
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

async function linkRichMenu(userId, richMenuId) {
  await fetch(`https://api.line.me/v2/bot/user/${userId}/richmenu/${richMenuId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
    },
  });
}
