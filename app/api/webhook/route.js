import inventory from "../../../data/inventory.json";

const BUY_MENU_ID = "richmenu-45b4781911f21f5d5632ec63e211b449";
const TOP_MENU_ID = "richmenu-19859bd6bf80b802dfc2171536ac089e";

const topQuickReply = {
  items: [
    { type: "action", action: { type: "message", label: "「買う」でできること", text: "「買う」でできること" } },
    { type: "action", action: { type: "message", label: "「売る」でできること", text: "「売る」でできること" } },
    { type: "action", action: { type: "message", label: "「予約」でできること", text: "「予約」でできること" } },
  ],
};

const buyQuickReply = {
  items: [
    { type: "action", action: { type: "message", label: "ざっくり診断とは？", text: "ざっくり診断とは？" } },
    { type: "action", action: { type: "message", label: "ぴったり診断とは？", text: "ぴったり診断とは？" } },
    { type: "action", action: { type: "message", label: "車種が決まっている人は？", text: "車種が決まっている人は？" } },
  ],
};

const roughSizeQuickReply = {
  items: [
    { type: "action", action: { type: "message", label: "軽自動車", text: "軽自動車" } },
    { type: "action", action: { type: "message", label: "普通車", text: "普通車" } },
  ],
};

const lightTypeQuickReply = {
  items: [
    { type: "action", action: { type: "message", label: "スライドドア", text: "軽自動車 スライドドア" } },
    { type: "action", action: { type: "message", label: "スタンダード", text: "軽自動車 スタンダード" } },
    { type: "action", action: { type: "message", label: "SUV", text: "軽自動車 SUV" } },
    { type: "action", action: { type: "message", label: "トラック", text: "軽自動車 トラック" } },
    { type: "action", action: { type: "message", label: "スポーティ", text: "軽自動車 スポーティ" } },
    { type: "action", action: { type: "message", label: "こだわりなし", text: "軽自動車 こだわりなし" } },
    { type: "action", action: { type: "message", label: "ひとつ戻る", text: "ざっくり診断" } },
  ],
};

const normalTypeQuickReply = {
  items: [
    { type: "action", action: { type: "message", label: "コンパクトカー", text: "普通車 コンパクトカー" } },
    { type: "action", action: { type: "message", label: "ミニバン", text: "普通車 ミニバン" } },
    { type: "action", action: { type: "message", label: "SUV", text: "普通車 SUV" } },
    { type: "action", action: { type: "message", label: "セダン", text: "普通車 セダン" } },
    { type: "action", action: { type: "message", label: "ステーションワゴン", text: "普通車 ステーションワゴン" } },
    { type: "action", action: { type: "message", label: "低燃費・HV", text: "普通車 低燃費・ハイブリッド" } },
    { type: "action", action: { type: "message", label: "スポーティ", text: "普通車 スポーティ" } },
    { type: "action", action: { type: "message", label: "バン・トラック", text: "普通車 バン・トラック" } },
    { type: "action", action: { type: "message", label: "ひとつ戻る", text: "ざっくり診断" } },
  ],
};

export async function GET() {
  return Response.json({ status: "ok", name: "CARTOPIA main webhook" });
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

    const postbackData = event.type === "postback" ? event.postback?.data : "";

    const isBuy =
      text === "くるまを買う" ||
      postbackData === "switch-to-car-search-menu";

    if (isBuy) {
      await linkRichMenu(event.source.userId, BUY_MENU_ID);
      await replyMessage(event.replyToken, [
        { type: "text", text: "気になる項目を選んでください😊", quickReply: buyQuickReply },
      ]);
      continue;
    }

    if (text === "トップへ戻る") {
      await linkRichMenu(event.source.userId, TOP_MENU_ID);
      await replyMessage(event.replyToken, [
        {
          type: "text",
          text: "😊 次は何する？\n\n気になるメニューを選んでね🚗",
          quickReply: topQuickReply,
        },
      ]);
      continue;
    }

    if (text === "ざっくり診断") {
      await replyMessage(event.replyToken, [
        {
          type: "text",
          text: "⚡ ざっくり診断を開始😊\n\nまずは車のサイズは軽？普通車？🚗",
          quickReply: roughSizeQuickReply,
        },
      ]);
      continue;
    }

    if (text === "軽自動車") {
      await replyMessage(event.replyToken, [
        {
          type: "text",
          text: "軽自動車ね😊\n\nどんなタイプの軽を探してるの？🔍😊",
          quickReply: lightTypeQuickReply,
        },
      ]);
      continue;
    }

    if (text === "普通車") {
      await replyMessage(event.replyToken, [
        {
          type: "text",
          text: "普通車ね😊\n\n次はどんなタイプか選んでね🚗",
          quickReply: normalTypeQuickReply,
        },
      ]);
      continue;
    }

    if (isRoughSearchText(text)) {
      const [size, rawType] = text.split(" ");
      const type = normalizeType(rawType);
      const results = findVehicles(size, type);

      if (results.length === 0) {
        await replyMessage(event.replyToken, [
          {
            type: "text",
            text:
              `${size}・${rawType}で探してみたけど、今の在庫には近い車がありませんでした🙇‍♀️\n\n` +
              "在庫にない場合も、全国からご希望に合う一台をお探しできます😊",
          },
        ]);
        continue;
      }

      const chunks = chunk(results, 12);
      const messages = [
        {
          type: "text",
          text:
            `${size}・${rawType}のおすすめ在庫です😊\n\n` +
            `支払総額が高い順に${results.length}台表示します🚗`,
        },
        ...chunks.slice(0, 4).map((vehicles, index) =>
          makeCarouselMessage(vehicles, `${size}・${rawType} ${index + 1}`)
        ),
      ];

      await replyMessage(event.replyToken, messages);

      const remainingChunks = chunks.slice(4);
      for (const vehicles of remainingChunks) {
        await pushMessage(event.source.userId, [
          makeCarouselMessage(vehicles, `${size}・${rawType}`)
        ]);
      }

      continue;
    }

    if (text === "「買う」でできること") {
      await replyMessage(event.replyToken, [
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
      ]);
      continue;
    }

    if (text === "「売る」でできること") {
      await replyMessage(event.replyToken, [
        {
          type: "text",
          text:
            "💰 「くるまを売る」では、\n" +
            "大切にしてきた愛車を、納得のいく形で手放せるようにサポートします😊\n\n" +
            "査定の流れや必要なものも、わかりやすくご案内します🚗",
          quickReply: topQuickReply,
        },
      ]);
      continue;
    }

    if (text === "「予約」でできること") {
      await replyMessage(event.replyToken, [
        {
          type: "text",
          text:
            "🔧 「予約」では、\n" +
            "車検・点検・オイル交換・修理などのご相談ができます😊\n\n" +
            "気になることがあれば、LINEからお気軽にご相談ください🚗",
          quickReply: topQuickReply,
        },
      ]);
      continue;
    }

    if (text === "車種が決まっている人は？") {
      await replyMessage(event.replyToken, [
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
      ]);
      continue;
    }

    if (text === "ざっくり診断とは？") {
      await replyMessage(event.replyToken, [
        {
          type: "text",
          text:
            "⚡ ざっくり診断（約10秒）\n\n" +
            "どんな車が自分に合うのか知りたい方へ😊\n\n" +
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
            "🤖 AIぴったり診断（約5分）\n\n" +
            "家族構成\n" +
            "使い方\n" +
            "ご予算\n" +
            "将来のライフスタイル\n\n" +
            "ここまで考えて\n" +
            "あなたにぴったりな車種をご提案します😊\n\n" +
            "ご家族やライフスタイルまで考えて、\n" +
            "本当に合う一台を見つけたい方へ🚗",
          quickReply: buyQuickReply,
        },
      ]);
      continue;
    }
  }

  return Response.json({ ok: true });
}

function isRoughSearchText(text) {
  return (
    text.startsWith("軽自動車 ") ||
    text.startsWith("普通車 ")
  );
}

function normalizeType(type) {
  if (type === "こだわりなし") return "特にこだわりはない";
  if (type === "低燃費・ハイブリッド") return "EV・HV";
  return type;
}

function findVehicles(size, type) {
  const vehicles = inventory.vehicles || [];

  return vehicles
    .filter((vehicle) => {
      const keys = [...(vehicle.types || []), ...(vehicle.typeKeys || [])];

      const hasSize = keys.includes(size);
      const hasType =
        type === "特にこだわりはない"
          ? keys.includes("特にこだわりはない")
          : keys.includes(type);

      return hasSize && hasType;
    })
    .sort((a, b) => priceNumber(b.totalPrice) - priceNumber(a.totalPrice));
}

function priceNumber(priceText) {
  if (!priceText) return 0;
  const match = String(priceText).match(/([\d.]+)/);
  return match ? Number(match[1]) : 0;
}

function chunk(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

function makeCarouselMessage(vehicles, altText) {
  return {
    type: "flex",
    altText: `${altText}のおすすめ在庫`,
    contents: {
      type: "carousel",
      contents: vehicles.map(makeVehicleBubble),
    },
  };
}

function makeVehicleBubble(vehicle) {
  const imageUrl = validImageUrl(vehicle.imageUrl);
  const detailUrl = validUrl(vehicle.detailUrl) || validUrl(vehicle.gooUrl);

  const bubble = {
    type: "bubble",
    size: "mega",
    body: {
      type: "box",
      layout: "vertical",
      spacing: "md",
      contents: [
        {
          type: "text",
          text: vehicle.carName || vehicle.title || "車両情報",
          weight: "bold",
          size: "xl",
          wrap: true,
        },
        {
          type: "text",
          text: vehicle.gradeName || vehicle.description || "",
          size: "sm",
          color: "#555555",
          wrap: true,
          maxLines: 3,
        },
        {
          type: "text",
          text: `支払総額 ${vehicle.totalPrice || "お問い合わせ"}`,
          weight: "bold",
          size: "lg",
          color: "#D97706",
          wrap: true,
        },
        {
          type: "box",
          layout: "vertical",
          spacing: "xs",
          contents: [
            { type: "text", text: `年式：${vehicle.year || "-"}`, size: "sm", color: "#555555" },
            { type: "text", text: `走行距離：${vehicle.mileage || "-"}`, size: "sm", color: "#555555" },
            { type: "text", text: `色：${vehicle.color || "-"}`, size: "sm", color: "#555555", wrap: true },
            { type: "text", text: `状態：${vehicle.sourceStatus || "-"}`, size: "sm", color: "#555555" },
          ],
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: [
        {
          type: "button",
          style: "primary",
          color: "#0B1F3A",
          action: {
            type: "message",
            label: "この車について相談する",
            text: `この車について相談したい：${vehicle.carName || vehicle.title}`,
          },
        },
      ],
    },
  };

  if (imageUrl) {
    bubble.hero = {
      type: "image",
      url: imageUrl,
      size: "full",
      aspectRatio: "16:9",
      aspectMode: "cover",
    };
  }

  if (detailUrl) {
    bubble.footer.contents.unshift({
      type: "button",
      style: "secondary",
      action: {
        type: "uri",
        label: "詳細を見る",
        uri: detailUrl,
      },
    });
  }

  return bubble;
}

function validImageUrl(url) {
  if (!url) return "";
  const text = String(url);
  return text.startsWith("https://") ? text : "";
}

function validUrl(url) {
  if (!url) return "";
  const text = String(url);
  return text.startsWith("https://") || text.startsWith("http://") ? text : "";
}

async function replyMessage(replyToken, messages) {
  const res = await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ replyToken, messages }),
  });

  const result = await res.text();
  console.log("REPLY_STATUS:", res.status);
  console.log("REPLY_RESULT:", result);
}

async function pushMessage(userId, messages) {
  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      to: userId,
      messages,
    }),
  });

  const result = await res.text();
  console.log("PUSH_STATUS:", res.status);
  console.log("PUSH_RESULT:", result);
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
