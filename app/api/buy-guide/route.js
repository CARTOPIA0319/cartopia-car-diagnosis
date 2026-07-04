const BUY_MENU_ID = "richmenu-b2543561652413fbd851daf95d8fd162";

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
    if (event.type === "postback" && event.postback?.data === "switch-to-car-search-menu") {
      await linkRichMenu(event.source.userId, BUY_MENU_ID);

      await replyMessage(event.replyToken, [
        {
          type: "text",
          text: "気になる項目を選んでください。",
          quickReply: {
            items: [
              {
                type: "action",
                action: {
                  type: "message",
                  label: "車種が決まっている人は？",
                  text: "車種が決まっている人は？"
                }
              },
              {
                type: "action",
                action: {
                  type: "message",
                  label: "ざっくり診断とは？",
                  text: "ざっくり診断とは？"
                }
              },
              {
                type: "action",
                action: {
                  type: "message",
                  label: "ぴったり診断とは？",
                  text: "ぴったり診断とは？"
                }
              }
            ]
          }
        }
      ]);
    }

    if (event.type === "message" && event.message?.type === "text") {
      const text = event.message.text;

      if (text === "車種が決まっている人は？") {
        await replyMessage(event.replyToken, [
          {
            type: "text",
            text: "欲しい車種が決まっている方は、そのまま車種名を入力してください。\n\n例：\n・アルファード\n・N-BOX\n・シエンタ"
          }
        ]);
      }

      if (text === "ざっくり診断とは？") {
        await replyMessage(event.replyToken, [
          {
            type: "text",
            text: "ざっくり診断は、まだ車種がはっきり決まっていない方向けです。\n\n軽自動車・普通車・SUV・ミニバンなど、大まかな希望から合いそうな方向性を探します。"
          }
        ]);
      }

      if (text === "ぴったり診断とは？") {
        await replyMessage(event.replyToken, [
          {
            type: "text",
            text: "ぴったり診断は、ご家族構成・使い方・ご予算・雪道・将来の生活変化まで含めて、AIが合いそうな車を考える診断です。"
          }
        ]);
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
