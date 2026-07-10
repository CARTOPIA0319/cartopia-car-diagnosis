const BUY_MENU_ID = "richmenu-45b4781911f21f5d5632ec63e211b449";

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
    name: "CARTOPIA LINE buy guide",
  });
}

export async function POST(request) {
  try {
    const body = await request.json();

    const events = Array.isArray(body.events)
      ? body.events
      : body.event
        ? [body.event]
        : [];

    let handledCount = 0;

    for (const event of events) {
      if (!event?.replyToken) continue;

      const text =
        event.type === "message" && event.message?.type === "text"
          ? event.message.text
          : "";

      const postbackData =
        event.type === "postback" ? event.postback?.data || "" : "";

      const isBuyMenuRequest =
        text === "くるまを買う" ||
        postbackData === "switch-to-car-search-menu";

      if (isBuyMenuRequest) {
        if (event.source?.userId) {
          await linkRichMenu(event.source.userId, BUY_MENU_ID);
        }

        await replyMessage(event.replyToken, [
          {
            type: "text",
            text: "気になる項目を選んでください😊",
            quickReply: buyQuickReply,
          },
        ]);

        handledCount += 1;
        continue;
      }

      const messages = makeBuyGuideMessages(text);

      if (!messages) continue;

      await replyMessage(event.replyToken, messages);
      handledCount += 1;
    }

    return Response.json({
      ok: true,
      handledCount,
    });
  } catch (error) {
    console.error("BUY_GUIDE_ERROR:", error);

    return Response.json(
      {
        ok: false,
        error: error.message || String(error),
      },
      { status: 500 }
    );
  }
}

function makeBuyGuideMessages(text) {
  if (text === "車種が決まっている人は？") {
    return [
      {
        type: "text",
        text:
          "🚗 ご希望の車種を教えてください😊\n\n" +
          "車種名をそのまま送るだけで大丈夫です✨\n\n" +
          "例えば…\n" +
          "・アルファード\n" +
          "・N-BOX\n" +
          "・シエンタ\n" +
          "・ヴェゼル\n\n" +
          "など、何でもお気軽にどうぞ😊",
        quickReply: buyQuickReply,
      },
    ];
  }

  if (text === "ざっくり診断とは？") {
    return [
      {
        type: "text",
        text:
          "⚡ ざっくり診断（約10秒）\n\n" +
          "どんな車が自分に合うのか知りたい方へ😊\n\n" +
          "いくつかの質問に答えるだけで、\n" +
          "あなたに合いそうな車のタイプをご提案します✨",
        quickReply: buyQuickReply,
      },
    ];
  }

  if (text === "ぴったり診断とは？") {
    return [
      {
        type: "text",
        text:
          "🤖 AIぴったり診断（約5分）\n\n" +
          "家族構成\n" +
          "使い方\n" +
          "ご予算\n" +
          "将来のライフスタイル\n\n" +
          "ここまで考えて、\n" +
          "あなたにぴったりな車種をご提案します😊\n\n" +
          "ご家族やライフスタイルまで考えて、\n" +
          "本当に合う一台を見つけたい方へ🚗",
        quickReply: buyQuickReply,
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

  console.log("BUY_GUIDE_REPLY_STATUS:", response.status);
  console.log("BUY_GUIDE_REPLY_RESULT:", result);

  if (!response.ok) {
    throw new Error(
      `LINE reply failed: ${response.status} ${result}`
    );
  }
}

async function linkRichMenu(userId, richMenuId) {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("LINE_CHANNEL_ACCESS_TOKEN is not set");
  }

  const response = await fetch(
    `https://api.line.me/v2/bot/user/${userId}/richmenu/${richMenuId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const result = await response.text();

  console.log("BUY_GUIDE_MENU_STATUS:", response.status);
  console.log("BUY_GUIDE_MENU_RESULT:", result);

  if (!response.ok) {
    throw new Error(
      `LINE rich menu link failed: ${response.status} ${result}`
    );
  }
}
