import inventory from "../../../data/inventory.json";

const BUY_MENU_ID = "richmenu-45b4781911f21f5d5632ec63e211b449";
const TOP_MENU_ID = "richmenu-19859bd6bf80b802dfc2171536ac089e";
const VEHICLES_PER_PAGE = 9;
const PREVIEW_HEIGHT = "86px";

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

    if (postbackData.startsWith("more|")) {
      const [, size, rawType, offsetText] = postbackData.split("|");
      const offset = Number(offsetText || "0");
      const results = findVehicles(size, normalizeType(rawType));

      if (!results.length || offset >= results.length) {
        await replyMessage(event.replyToken, [
          {
            type: "text",
            text: "表示できる在庫はここまでです😊",
          },
        ]);
        continue;
      }

      await replyMessage(event.replyToken, [
        makeVehiclePageCarouselMessage(results, size, rawType, offset),
      ]);
      continue;
    }

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
        { type: "text", text: "😊 次は何する？\n\n気になるメニューを選んでね🚗", quickReply: topQuickReply },
      ]);
      continue;
    }

    if (text === "ざっくり診断") {
      await replyMessage(event.replyToken, [
        { type: "text", text: "⚡ ざっくり診断を開始😊\n\nまずは車のサイズは軽？普通車？🚗", quickReply: roughSizeQuickReply },
      ]);
      continue;
    }

    if (text === "軽自動車") {
      await replyMessage(event.replyToken, [
        { type: "text", text: "軽自動車ね😊\n\nどんなタイプの軽を探してるの？🔍😊", quickReply: lightTypeQuickReply },
      ]);
      continue;
    }

    if (text === "普通車") {
      await replyMessage(event.replyToken, [
        { type: "text", text: "普通車ね😊\n\n次はどんなタイプか選んでね🚗", quickReply: normalTypeQuickReply },
      ]);
      continue;
    }

    if (isRoughSearchText(text)) {
      const [size, rawType] = text.split(" ");
      const results = findVehicles(size, normalizeType(rawType));

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

      await replyMessage(event.replyToken, [
        {
          type: "text",
          text:
            `${size}・${rawType}のおすすめ在庫です😊\n\n` +
            `展示販売中の車から先に、支払総額が高い順で${results.length}台あります🚗`,
        },
        makeVehiclePageCarouselMessage(results, size, rawType, 0),
      ]);
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
  return text.startsWith("軽自動車 ") || text.startsWith("普通車 ");
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
      if (!vehicle) return false;

      const keys = [...(vehicle.types || []), ...(vehicle.typeKeys || [])];

      const hasSize = keys.includes(size);
      const hasType =
        type === "特にこだわりはない"
          ? keys.includes("特にこだわりはない")
          : keys.includes(type);

      return hasSize && hasType;
    })
    .sort((a, b) => {
      const statusA = statusPriority(a);
      const statusB = statusPriority(b);
      if (statusA !== statusB) return statusA - statusB;
      return priceNumber(b.totalPrice) - priceNumber(a.totalPrice);
    });
}

function statusPriority(vehicle) {
  return vehicle?.sourceStatus === "掲載在庫" ? 0 : 1;
}

function priceNumber(priceText) {
  if (!priceText) return 0;
  const match = String(priceText).match(/([\d.]+)/);
  return match ? Number(match[1]) : 0;
}

function makeVehiclePageCarouselMessage(results, size, rawType, offset) {
  const pageVehicles = results.slice(offset, offset + VEHICLES_PER_PAGE);
  const nextOffset = offset + VEHICLES_PER_PAGE;
  const hasMore = nextOffset < results.length;

  const contents = pageVehicles.map(makeVehicleBubble);

  if (hasMore) {
    contents.push(makeMoreBubble(results, nextOffset, size, rawType));
  }

  return {
    type: "flex",
    altText: `${size}・${rawType}のおすすめ在庫`,
    contents: {
      type: "carousel",
      contents,
    },
  };
}

function makeMoreBubble(results, nextOffset, size, rawType) {
  const remaining = results.length - nextOffset;
  const previewVehicles = results.slice(nextOffset, nextOffset + VEHICLES_PER_PAGE);
  const nextCount = previewVehicles.length;

  return {
    type: "bubble",
    size: "mega",
    body: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      backgroundColor: "#F8F5EF",
      paddingAll: "14px",
      contents: [
        {
          type: "box",
          layout: "vertical",
          backgroundColor: "#0B1F3A",
          cornerRadius: "lg",
          paddingAll: "12px",
          contents: [
            {
              type: "text",
              text: `他に該当車が${remaining}台あるよ😊`,
              weight: "bold",
              size: remaining >= 10 ? "md" : "lg",
              color: "#FFFFFF",
              align: "center",
              wrap: true,
            },
            {
              type: "text",
              text: "次に表示される車はこちら💁",
              size: "sm",
              color: "#E5D08A",
              align: "center",
              wrap: true,
              margin: "xs",
            },
          ],
        },
        {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: makePreviewRows(previewVehicles, size, rawType, nextOffset, nextCount),
        },
      ],
    },
  };
}

function makePreviewRows(vehicles, size, rawType, nextOffset, nextCount) {
  const previewItems = vehicles.map(makePreviewImageBox);

  previewItems.push(makePreviewButtonBox(size, rawType, nextOffset, nextCount));

  const rows = [];

  for (let i = 0; i < previewItems.length; i += 2) {
    const rowItems = previewItems.slice(i, i + 2);

    if (rowItems.length === 1) {
      rowItems.push(makePreviewSpacerBox());
    }

    rows.push({
      type: "box",
      layout: "horizontal",
      spacing: "sm",
      contents: rowItems,
    });
  }

  return rows;
}

function makePreviewImageBox(vehicle) {
  const imageUrl = validImageUrl(vehicle?.imageUrl);

  if (!imageUrl) {
    return {
      type: "box",
      layout: "vertical",
      flex: 1,
      height: PREVIEW_HEIGHT,
      backgroundColor: "#F8F5EF",
      cornerRadius: "md",
      contents: [
        {
          type: "text",
          text: " ",
          size: "xxs",
          color: "#F8F5EF",
        },
      ],
    };
  }

  return {
    type: "box",
    layout: "vertical",
    flex: 1,
    height: PREVIEW_HEIGHT,
    cornerRadius: "md",
    contents: [
      {
        type: "image",
        url: imageUrl,
        size: "full",
        aspectRatio: "16:9",
        aspectMode: "cover",
      },
    ],
  };
}

function makePreviewSpacerBox() {
  return {
    type: "box",
    layout: "vertical",
    flex: 1,
    height: PREVIEW_HEIGHT,
    backgroundColor: "#F8F5EF",
    contents: [
      {
        type: "text",
        text: " ",
        size: "xxs",
        color: "#F8F5EF",
      },
    ],
  };
}

function makePreviewButtonBox(size, rawType, nextOffset, nextCount) {
  return {
    type: "box",
    layout: "vertical",
    flex: 1,
    height: PREVIEW_HEIGHT,
    backgroundColor: "#0B1F3A",
    cornerRadius: "md",
    justifyContent: "center",
    alignItems: "center",
    action: {
      type: "postback",
      data: `more|${size}|${rawType}|${nextOffset}`,
      displayText: `次の${nextCount}台を見る`,
    },
    contents: [
      {
        type: "text",
        text: `次の${nextCount}台`,
        color: "#FFFFFF",
        weight: "bold",
        size: "md",
        align: "center",
      },
      {
        type: "text",
        text: "を見る",
        color: "#E5D08A",
        weight: "bold",
        size: "md",
        align: "center",
        margin: "none",
      },
    ],
  };
}

function displayStatus(vehicle) {
  const status = safeText(vehicle?.sourceStatus, "-");

  if (status === "掲載在庫") return "展示販売中";
  if (status === "一時保存") return "販売可・未仕上げ";

  return status;
}

function makeVehicleBubble(vehicle) {
  const imageUrl = validImageUrl(vehicle?.imageUrl);
  const isPublicVehicle = vehicle?.sourceStatus === "掲載在庫";
  const gooUrl = isPublicVehicle ? validUrl(vehicle?.gooUrl) : "";

  return {
    type: "bubble",
    size: "mega",
    body: {
      type: "box",
      layout: "vertical",
      spacing: "none",
      paddingAll: "0px",
      contents: [
        ...(imageUrl ? [makeHeroImage(imageUrl, vehicle, gooUrl)] : []),
        makeVehicleTitleBox(vehicle),
        {
          type: "box",
          layout: "vertical",
          paddingStart: "14px",
          paddingEnd: "14px",
          paddingTop: "10px",
          paddingBottom: "10px",
          spacing: "xs",
          contents: [
            {
              type: "text",
              text: `支払総額 ${safeText(vehicle?.totalPrice, "お問い合わせ")}`,
              weight: "bold",
              size: "xl",
              color: "#D97706",
              wrap: true,
            },
            {
              type: "text",
              text: `車両本体価格 ${safeText(vehicle?.bodyPrice, "お問い合わせ")}`,
              size: "xs",
              color: "#666666",
              wrap: true,
              margin: "none",
            },
            makeGradeExtraBox(vehicle),
            makeInfoRow(vehicle),
            ...(gooUrl
              ? [
                  {
                    type: "text",
                    text: "タップで詳細を見る ↗",
                    size: "xs",
                    color: "#888888",
                    align: "center",
                    margin: "xs",
                  },
                ]
              : []),
            makeConsultButton(vehicle),
          ],
        },
      ],
    },
  };
}

function makeHeroImage(imageUrl, vehicle, gooUrl) {
  return {
    type: "box",
    layout: "vertical",
    height: "176px",
    ...(gooUrl ? { action: { type: "uri", uri: gooUrl } } : {}),
    contents: [
      {
        type: "image",
        url: imageUrl,
        size: "full",
        aspectRatio: "16:9",
        aspectMode: "cover",
      },
      makeStatusRibbon(vehicle),
    ],
  };
}

function makeStatusRibbon(vehicle) {
  const status = displayStatus(vehicle);
  const isLong = status.length >= 7;

  return {
    type: "box",
    layout: "horizontal",
    position: "absolute",
    offsetTop: "0px",
    offsetStart: "0px",
    width: isLong ? "138px" : "104px",
    height: "32px",
    backgroundColor: "#0B1F3A",
    paddingStart: "8px",
    paddingEnd: "8px",
    justifyContent: "center",
    alignItems: "center",
    contents: [
      {
        type: "text",
        text: status,
        size: isLong ? "xxs" : "xs",
        color: "#E5D08A",
        weight: "bold",
        align: "center",
        wrap: false,
      },
    ],
  };
}

function makeVehicleTitleBox(vehicle) {
  return {
    type: "box",
    layout: "vertical",
    backgroundColor: "#0B1F3A",
    paddingStart: "14px",
    paddingEnd: "14px",
    paddingTop: "10px",
    paddingBottom: "10px",
    contents: [
      {
        type: "text",
        text: safeText(vehicle?.carName || vehicle?.title, "車両情報"),
        weight: "bold",
        size: "lg",
        color: "#E5D08A",
        wrap: true,
      },
      {
        type: "text",
        text: safeText(vehicle?.gradeName || vehicle?.description, ""),
        size: "sm",
        color: "#FFFFFF",
        wrap: true,
        margin: "xs",
      },
    ],
  };
}

function makeGradeExtraBox(vehicle) {
  return {
    type: "box",
    layout: "vertical",
    height: "66px",
    margin: "sm",
    contents: [
      {
        type: "text",
        text: safeText(vehicle?.gradeExtraInfo, ""),
        size: "xxs",
        color: "#333333",
        wrap: true,
        maxLines: 4,
      },
    ],
  };
}

function makeInfoRow(vehicle) {
  return {
    type: "box",
    layout: "horizontal",
    spacing: "xs",
    margin: "sm",
    contents: [
      makeInfoBox("初度登録", formatRegistrationYear(vehicle?.year), "normal"),
      makeInfoBox("走行距離", formatMileage(vehicle?.mileage), "normal"),
      makeInfoBox("車体色", formatColorName(vehicle?.color), "color"),
    ],
  };
}

function makeInfoBox(label, value, kind) {
  const valueText = safeText(value, "-");
  const isColor = kind === "color";
  const valueSize = getInfoValueSize(valueText, kind);

  return {
    type: "box",
    layout: "vertical",
    flex: 1,
    height: "64px",
    backgroundColor: "#F3F4F6",
    cornerRadius: "md",
    paddingAll: "6px",
    contents: [
      {
        type: "text",
        text: label,
        size: "xxs",
        color: "#777777",
        align: "center",
        wrap: false,
      },
      {
        type: "box",
        layout: "vertical",
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        contents: [
          {
            type: "text",
            text: valueText,
            size: valueSize,
            color: "#222222",
            weight: "bold",
            align: "center",
            wrap: true,
            maxLines: isColor ? 3 : 3,
          },
        ],
      },
    ],
  };
}

function getInfoValueSize(valueText, kind) {
  if (kind !== "color") return "xs";

  const plain = String(valueText || "").replace(/\n/g, "");

  if (plain.length <= 6) return "xs";
  return "xxs";
}

function formatColorName(colorText) {
  const text = String(colorText || "")
    .replace(/\s+/g, "")
    .trim();

  if (!text) return "-";

  const maxLines = 3;
  const maxCharsPerLine = 7;
  const tokens = splitColorIntoTokens(text);
  const lines = packTokensIntoLines(tokens, maxCharsPerLine);

  if (lines.length <= maxLines) {
    return lines.join("\n");
  }

  const visibleLines = lines.slice(0, maxLines);
  const hiddenText = lines.slice(maxLines).join("");
  const lastLine = visibleLines[maxLines - 1] + hiddenText;

  visibleLines[maxLines - 1] = truncateText(lastLine, maxCharsPerLine);

  return visibleLines.join("\n");
}

function splitColorIntoTokens(text) {
  const colorWords = [
    "クリスタルシャイン",
    "ホワイトパール",
    "スーパーブラック",
    "プレシャス",
    "ラグジュアリー",
    "クリスタル",
    "メタリック",
    "ブラック",
    "ホワイト",
    "シルバー",
    "グリーン",
    "ブルー",
    "ブラウン",
    "パープル",
    "レッド",
    "オレンジ",
    "イエロー",
    "ベージュ",
    "グレー",
    "グレイ",
    "パール",
    "マイカ",
    "ガラス",
    "フレーク",
    "シャイン",
    "アッシュ",
    "ダーク",
    "ライト",
    "クール",
    "スター",
    "チタン",
    "カッパー",
    "ブロンズ",
    "カーキ",
    "アイボリー",
    "クリーム",
    "ワイン",
    "ピンク",
    "ゴールド",
    "ネイビー",
    "ターコイズ",
  ].sort((a, b) => b.length - a.length);

  const tokens = [];
  let remaining = text;

  while (remaining.length > 0) {
    const matched = colorWords.find((word) => remaining.startsWith(word));

    if (matched) {
      tokens.push(matched);
      remaining = remaining.slice(matched.length);
      continue;
    }

    tokens.push(remaining[0]);
    remaining = remaining.slice(1);
  }

  return mergeSingleCharTokens(tokens);
}

function mergeSingleCharTokens(tokens) {
  const result = [];

  for (const token of tokens) {
    const lastIndex = result.length - 1;

    if (token.length === 1 && lastIndex >= 0 && result[lastIndex].length < 4) {
      result[lastIndex] += token;
    } else {
      result.push(token);
    }
  }

  return result;
}

function packTokensIntoLines(tokens, maxCharsPerLine) {
  const lines = [];
  let current = "";

  for (const token of tokens) {
    if (token.length > maxCharsPerLine) {
      if (current) {
        lines.push(current);
        current = "";
      }

      const pieces = splitTextByLength(token, maxCharsPerLine);
      lines.push(...pieces);
      continue;
    }

    if (!current) {
      current = token;
      continue;
    }

    if ((current + token).length <= maxCharsPerLine) {
      current += token;
    } else {
      lines.push(current);
      current = token;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function truncateText(text, maxChars) {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, Math.max(1, maxChars - 1))}…`;
}

function splitTextByLength(text, length) {
  const result = [];

  for (let i = 0; i < text.length; i += length) {
    result.push(text.slice(i, i + length));
  }

  return result;
}

function makeConsultButton(vehicle) {
  return {
    type: "button",
    style: "primary",
    height: "sm",
    color: "#0B1F3A",
    margin: "sm",
    action: {
      type: "message",
      label: "💬 この車を相談",
      text: `この車について相談したい：${safeText(vehicle?.carName || vehicle?.title, "車両情報")}`,
    },
  };
}

function formatRegistrationYear(yearText) {
  if (!yearText) return "-";

  const match = String(yearText).match(/(19|20)\d{2}/);
  if (!match) return safeText(yearText, "-");

  const year = Number(match[0]);

  if (year >= 2019) {
    const reiwa = year - 2018;
    return `令和${reiwa === 1 ? "元" : reiwa}年（${year}年）`;
  }

  if (year >= 1989) {
    const heisei = year - 1988;
    return `平成${heisei === 1 ? "元" : heisei}年（${year}年）`;
  }

  if (year >= 1926) {
    const showa = year - 1925;
    return `昭和${showa === 1 ? "元" : showa}年（${year}年）`;
  }

  return `${year}年`;
}

function formatMileage(mileageText) {
  if (!mileageText) return "-";

  const text = String(mileageText)
    .replace(/Ｋ/g, "K")
    .replace(/ｋ/g, "k")
    .replace(/,/g, "")
    .trim();

  if (text.includes("走不明")) return "走不明";

  const numberText = text.match(/[0-9]+(?:\.[0-9]+)?/)?.[0];
  if (!numberText) return safeText(mileageText, "-");

  const value = Number(numberText);
  if (!Number.isFinite(value)) return safeText(mileageText, "-");

  let km;

  if (text.includes("万K") || text.includes("万k") || text.includes("万km")) {
    km = value >= 1000 ? value : value * 10000;
  } else {
    km = value;
  }

  return `${Math.round(km).toLocaleString("ja-JP")}km`;
}

function safeText(value, fallback = "-") {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value);
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
