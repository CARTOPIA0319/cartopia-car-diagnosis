const BUY_MENU_ID = "richmenu-b2543561652413fbd851daf95d8fd162";

export async function GET() {
  return Response.json({
    status: "ok",
    name: "CARTOPIA buy-guide webhook",
  });
}

export async function POST(request) {
  const body = await request.json();
  console.log("BODY:", JSON.stringify(body));

  const events = body.events || [];

  for (const event of events) {
    console.log("EVENT_TYPE:", event.type);
    console.log("EVENT:", JSON.stringify(event));

    const isBuyPostback =
      event.type === "postback" &&
      event.postback?.data === "switch-to-car-search-menu";

    const isBuyMessage =
      event.type === "message" &&
      event.message?.type === "text" &&
      event.message.text === "くるまを買う";

    console.log("isBuyPostback:", isBuyPostback);
    console.log("isBuyMessage:", isBuyMessage);

    if (isBuyPostback || isBuyMessage) {
      await showBuyGuide(event);
      continue;
    }

    if (event.type === "message" && event.message?.type === "text") {
      const text = event.message.text;

      if (text === "車種が決まっている人は？") {
        await replyMessage(event.replyToken, [
          {
            type: "text",
            text:
              "欲しい車種が決まっている方は、そのまま車種名を入力してください。\n\n" +
              "例：\n" +
              "・アルファード\n" +
              "・N-BOX\n" +
              "・シエンタ",
          },
        ]);
        continue;
      }

      if (text === "ざっくり診断とは？") {
        await replyMessage(event.replyToken, [
          {
            type: "text",
            text:
              "ざっくり診断は、所要時間約10秒！まだ車種がはっきり決まっていない方向けです。\n\n" +
              "軽自動車・普通車・SUV・ミニバンなど、大まかな希望から合いそうな方向性を探します。",
          },
        ]);
        continue;
      }

      if (text === "ぴったり診断とは？") {
        await replyMessage(event.replyToken, [
          {
            type: "text",
            text:
              "ぴったり診断は、所要時間5分前後かかりますが、家族構成・使い方・予算・将来の生活変化まで含めて、AIが合いそうな車を考える診断です。",
          },
        ]);
        continue;
      }
    }
  }

  return Response.json({ ok: true });
}

async function showBuyGuide(event) {
  console.log("SHOW_BUY_GUIDE_START");

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

  console.log("SHOW_BUY_GUIDE_END");
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

  const text = await res.text();
  console.log("REPLY_STATUS:", res.status);
  console.log("REPLY_RESPONSE:", text);
}

async function linkRichMenu(userId, richMenuId) {
  const res = await fetch(`https://api.line.me/v2/bot/user/${userId}/richmenu/${richMenuId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
    },
  });

  const text = await res.text();
  console.log("LINK_MENU_STATUS:", res.status);
  console.log("LINK_MENU_RESPONSE:", text);
}
