import {
  INVENTORY_SEARCH_RESULT_TYPES,
  searchInventoryData,
  selectSimilarInventoryData,
} from "../_lib/inventorySearch.js";

const INVENTORY_URL =
  "https://raw.githubusercontent.com/CARTOPIA0319/cartopia-car-diagnosis/main/data/inventory.json";

const BUY_MENU_ID = "richmenu-56fd19decbbef45a951a3bfa4e57b10d";
const TOP_MENU_ID = "richmenu-19859bd6bf80b802dfc2171536ac089e";
const VEHICLES_PER_PAGE = 9;
const PREVIEW_HEIGHT = "86px";

const FALLBACK_EXTRA_INFO = "詳細装備はスタッフまでお問い合わせください";

function makeMessageAction(label, text = label) {
  return {
    type: "action",
    action: {
      type: "message",
      label,
      text,
    },
  };
}

function makePostbackAction(label, data, displayText = label) {
  return {
    type: "action",
    action: {
      type: "postback",
      label,
      data,
      displayText,
    },
  };
}

const topQuickReply = {
  items: [
    makeMessageAction("「買う」でできること"),
    makeMessageAction("「売る」でできること"),
    makeMessageAction("「予約」でできること"),
  ],
};

const buyQuickReply = {
  items: [
    makeMessageAction("ざっくり診断とは？"),
    makeMessageAction("ぴったり診断とは？"),
    makeMessageAction("車種が決まっている人は？"),
  ],
};

const roughSizeQuickReply = {
  items: [makeMessageAction("軽自動車"), makeMessageAction("普通車")],
};

const lightTypeQuickReply = {
  items: [
    makeMessageAction("スライドドア", "軽自動車 スライドドア"),
    makeMessageAction("スタンダード", "軽自動車 スタンダード"),
    makeMessageAction("SUV", "軽自動車 SUV"),
    makeMessageAction("トラック", "軽自動車 トラック"),
    makeMessageAction("スポーティ", "軽自動車 スポーティ"),
    makeMessageAction("こだわりなし", "軽自動車 こだわりなし"),
    makeMessageAction("ひとつ戻る", "ざっくり診断"),
  ],
};

const normalTypeQuickReply = {
  items: [
    makeMessageAction("コンパクトカー", "普通車 コンパクトカー"),
    makeMessageAction("ミニバン", "普通車 ミニバン"),
    makeMessageAction("SUV", "普通車 SUV"),
    makeMessageAction("セダン", "普通車 セダン"),
    makeMessageAction("ステーションワゴン", "普通車 ステーションワゴン"),
    makeMessageAction("低燃費・HV", "普通車 低燃費・ハイブリッド"),
    makeMessageAction("スポーティ", "普通車 スポーティ"),
    makeMessageAction("バン・トラック", "普通車 バン・トラック"),
    makeMessageAction("ひとつ戻る", "ざっくり診断"),
  ],
};

async function loadInventory() {
  const response = await fetch(`${INVENTORY_URL}?t=${Date.now()}`, {
    cache: "no-store",
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });

  if (!response.ok) {
    throw new Error(`最新在庫データの取得に失敗しました: ${response.status}`);
  }

  const inventory = await response.json();

  if (!inventory || !Array.isArray(inventory.vehicles)) {
    throw new Error("最新在庫データの形式が正しくありません");
  }

  return inventory;
}

export async function GET() {
  return Response.json({
    status: "ok",
    name: "CARTOPIA main webhook",
    inventoryMode: "dynamic-github-json",
    displayVersion: "vehicle-card-v2",
  });
}

export async function POST(request) {
  const body = await request.json();
  const events = body.events || [];

  for (const event of events) {
    if (!event.replyToken) continue;

    try {
      await handleEvent(event);
    } catch (error) {
      console.error("WEBHOOK_EVENT_ERROR:", error);

      await replyMessage(event.replyToken, [
        {
          type: "text",
          text:
            "在庫情報の読み込みに失敗しました。" +
            "少し時間を置いて、もう一度お試しください🙇‍♀️",
        },
      ]);
    }
  }

  return Response.json({
    ok: true,
  });
}

async function handleEvent(event) {
  const text =
    event.type === "message" && event.message?.type === "text"
      ? event.message.text
      : "";

  const postbackData =
    event.type === "postback" ? event.postback?.data || "" : "";

  if (postbackData.startsWith("inventory-similar-filter|")) {
    const [, encodedQuery, vehicleClassText, modelTypeText, offsetText] =
      postbackData.split("|");

    const query = decodeURIComponent(encodedQuery || "");

    const requestedSelection = {
      vehicleClass: vehicleClassText === "-" ? "" : vehicleClassText || "",
      modelType: modelTypeText === "-" ? "" : modelTypeText || "",
    };

    const offset = Number(offsetText || "0");

    const inventory = await loadInventory();

    const searchResult = selectSimilarInventoryData(
      inventory,
      query,
      requestedSelection,
    );

    if (
      searchResult.type === INVENTORY_SEARCH_RESULT_TYPES.AMBIGUOUS &&
      searchResult.similarSelection?.axis
    ) {
      await replyMessage(event.replyToken, [
        makeSimilarSelectionMessage(searchResult),
      ]);

      return;
    }

    const hasResolvedSelection =
      searchResult.type === INVENTORY_SEARCH_RESULT_TYPES.MODEL &&
      searchResult.similarSelection?.valid &&
      !searchResult.similarSelection?.axis;

    if (!hasResolvedSelection) {
      await replyMessage(event.replyToken, [
        {
          type: "text",
          text: "選択内容を確認できなかったため、もう一度車種名を送ってください😊",
        },
      ]);

      return;
    }

    const results = prepareSearchVehicles(searchResult.similarVehicles);

    if (!results.length) {
      await replyMessage(event.replyToken, [
        {
          type: "text",
          text:
            `選んだタイプに当てはまる、${query}以外の別車種の在庫は現在ありませんでした🙇‍♀️\n\n` +
            "在庫にない場合も、全国からご希望に合う一台をお探しできます😊",
        },
      ]);

      return;
    }

    if (!Number.isFinite(offset) || offset < 0 || offset >= results.length) {
      await replyMessage(event.replyToken, [
        {
          type: "text",
          text: "在庫情報が更新されたため、もう一度車種名を送ってください😊",
        },
      ]);

      return;
    }

    const messages = [];

    if (offset === 0) {
      messages.push({
        type: "text",
        text:
          `選んだタイプで、現在ご案内できる別車種の在庫は${results.length}台です😊\n\n` +
          `※${query}ではありません。\n\n` +
          "展示販売中の車から先に、支払総額が高い順でご紹介します🚗",
      });
    }

    messages.push(
      makeSimilarVehiclePageCarouselMessage(
        results,
        query,
        offset,
        searchResult.similarSelection,
      ),
    );

    await replyMessage(event.replyToken, messages);

    return;
  }

  if (postbackData.startsWith("inventory-similar|")) {
    const [, encodedQuery, offsetText] = postbackData.split("|");

    const query = decodeURIComponent(encodedQuery || "");
    const offset = Number(offsetText || "0");
    const inventory = await loadInventory();
    const searchResult = searchInventoryData(inventory, query);
    const results = prepareSearchVehicles(searchResult.similarVehicles);

    const isModelSearch =
      searchResult.type === INVENTORY_SEARCH_RESULT_TYPES.MODEL ||
      (searchResult.type === INVENTORY_SEARCH_RESULT_TYPES.NO_STOCK &&
        searchResult.targetType === INVENTORY_SEARCH_RESULT_TYPES.MODEL);

    const hasModelTarget =
      Boolean(searchResult.model) || searchResult.candidates.length > 0;

    if (
      !isModelSearch ||
      !hasModelTarget ||
      !results.length ||
      offset >= results.length
    ) {
      await replyMessage(event.replyToken, [
        {
          type: "text",
          text: "在庫情報が更新されたため、もう一度車種名を送ってください😊",
        },
      ]);

      return;
    }

    const messages = [];

    if (offset === 0) {
      const targetName = getSearchTargetName(searchResult);

      messages.push({
        type: "text",
        text:
          `${targetName}と同じタイプで、現在ご案内できる別車種の在庫は${results.length}台です😊\n\n` +
          `※${targetName}ではありません。\n\n` +
          "展示販売中の車から先に、支払総額が高い順でご紹介します🚗",
      });
    }

    messages.push(
      makeSimilarVehiclePageCarouselMessage(results, query, offset),
    );

    await replyMessage(event.replyToken, messages);
    return;
  }

  if (postbackData.startsWith("inventory-search-more|")) {
    const [, encodedQuery, offsetText] = postbackData.split("|");

    const query = decodeURIComponent(encodedQuery || "");
    const offset = Number(offsetText || "0");
    const inventory = await loadInventory();
    const searchResult = searchInventoryData(inventory, query);

    if (
      ![
        INVENTORY_SEARCH_RESULT_TYPES.MAKER,
        INVENTORY_SEARCH_RESULT_TYPES.MODEL,
        INVENTORY_SEARCH_RESULT_TYPES.CATEGORY,
      ].includes(searchResult.type)
    ) {
      await replyMessage(event.replyToken, [
        {
          type: "text",
          text: "在庫情報が更新されたため、もう一度車種名またはメーカー名を送ってください😊",
        },
      ]);

      return;
    }

    const results = prepareSearchVehicles(searchResult.vehicles);

    if (
      !results.length ||
      !Number.isFinite(offset) ||
      offset < 0 ||
      offset >= results.length
    ) {
      await replyMessage(event.replyToken, [
        {
          type: "text",
          text: "表示できる在庫はここまでです😊",
        },
      ]);

      return;
    }

    const messages = [
      makeSearchVehiclePageCarouselMessage(
        results,
        query,
        offset,
        prepareSearchVehicles(searchResult.similarVehicles),
      ),
    ];

    const isLastPage = offset + VEHICLES_PER_PAGE >= results.length;

    if (isLastPage && searchResult.similarSelection?.axis) {
      messages.push(makeSimilarSelectionMessage(searchResult));
    }

    await replyMessage(event.replyToken, messages);
    return;
  }

  if (postbackData.startsWith("more|")) {
    const [, size, rawType, offsetText] = postbackData.split("|");
    const offset = Number(offsetText || "0");
    const results = await findVehicles(size, normalizeType(rawType));

    if (!results.length || offset >= results.length) {
      await replyMessage(event.replyToken, [
        {
          type: "text",
          text: "表示できる在庫はここまでです😊",
        },
      ]);

      return;
    }

    await replyMessage(event.replyToken, [
      makeVehiclePageCarouselMessage(results, size, rawType, offset),
    ]);

    return;
  }

  const isBuy =
    text === "くるまを買う" || postbackData === "switch-to-car-search-menu";

  if (isBuy) {
    await linkRichMenu(event.source.userId, BUY_MENU_ID);

    await replyMessage(event.replyToken, [
      {
        type: "text",
        text: "気になる項目を選んでください😊",
        quickReply: buyQuickReply,
      },
    ]);

    return;
  }

  if (text === "トップへ戻る") {
    await linkRichMenu(event.source.userId, TOP_MENU_ID);

    await replyMessage(event.replyToken, [
      {
        type: "text",
        text: "😊 次は何する？\n\n" + "気になるメニューを選んでね🚗",
        quickReply: topQuickReply,
      },
    ]);

    return;
  }

  if (text === "ざっくり診断") {
    await replyMessage(event.replyToken, [
      {
        type: "text",
        text:
          "⚡ ざっくり診断を開始😊\n\n" + "まずは車のサイズは軽？普通車？🚗",
        quickReply: roughSizeQuickReply,
      },
    ]);

    return;
  }

  if (text === "軽自動車") {
    await replyMessage(event.replyToken, [
      {
        type: "text",
        text: "軽自動車ね😊\n\n" + "どんなタイプの軽を探してるの？🔍😊",
        quickReply: lightTypeQuickReply,
      },
    ]);

    return;
  }

  if (text === "普通車") {
    await replyMessage(event.replyToken, [
      {
        type: "text",
        text: "普通車ね😊\n\n" + "次はどんなタイプか選んでね🚗",
        quickReply: normalTypeQuickReply,
      },
    ]);

    return;
  }

  if (isRoughSearchText(text)) {
    const [size, rawType] = text.split(" ");
    const results = await findVehicles(size, normalizeType(rawType));

    if (results.length === 0) {
      await replyMessage(event.replyToken, [
        {
          type: "text",
          text:
            `${size}・${rawType}で探してみたけど、` +
            "今の在庫には近い車がありませんでした🙇‍♀️\n\n" +
            "在庫にない場合も、全国からご希望に合う一台をお探しできます😊",
        },
      ]);

      return;
    }

    await replyMessage(event.replyToken, [
      {
        type: "text",
        text:
          `${size}・${rawType}のおすすめ在庫です😊\n\n` +
          "展示販売中の車から先に、" +
          `支払総額が高い順で${results.length}台あります🚗`,
      },
      makeVehiclePageCarouselMessage(results, size, rawType, 0),
    ]);

    return;
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

    return;
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

    return;
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

    return;
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

    return;
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

    return;
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

    return;
  }

  if (!text) {
    return;
  }

  const inventory = await loadInventory();
  const searchResult = searchInventoryData(inventory, text);

  await replyInventorySearchResult(event.replyToken, searchResult);
}

function isRoughSearchText(text) {
  return text.startsWith("軽自動車 ") || text.startsWith("普通車 ");
}

function normalizeType(type) {
  if (type === "こだわりなし") {
    return "特にこだわりはない";
  }

  if (type === "低燃費・ハイブリッド") {
    return "EV・HV";
  }

  return type;
}

async function findVehicles(size, type) {
  const inventory = await loadInventory();
  const vehicles = inventory.vehicles || [];

  return vehicles
    .filter((vehicle) => {
      if (!vehicle) {
        return false;
      }

      const keys = [...(vehicle.types || []), ...(vehicle.typeKeys || [])];
      const hasSize = keys.includes(size);

      const hasType =
        type === "特にこだわりはない"
          ? keys.includes("特にこだわりはない")
          : keys.includes(type);

      return hasSize && hasType;
    })
    .map(normalizeVehicleForDisplay)
    .sort((first, second) => {
      const firstStatus = statusPriority(first);
      const secondStatus = statusPriority(second);

      if (firstStatus !== secondStatus) {
        return firstStatus - secondStatus;
      }

      return priceNumber(second.totalPrice) - priceNumber(first.totalPrice);
    });
}

function normalizeVehicleForDisplay(vehicle) {
  const carName = cleanDisplayText(
    vehicle?.carName ||
      deriveCarNameFromTitle(vehicle?.title) ||
      vehicle?.title,
  );

  const gradeName = chooseGradeName(vehicle, carName);
  const gradeExtraInfo = chooseGradeExtraInfo(vehicle, carName, gradeName);

  return {
    ...vehicle,
    carName: carName || "車両情報",
    gradeName,
    gradeExtraInfo,
  };
}

function cleanDisplayText(value) {
  return String(value || "")
    .replace(/\u3000/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeComparable(value) {
  return cleanDisplayText(value)
    .replace(/[・･：:／/\-ー＿_()（）[\]【】\s]/g, "")
    .toLowerCase();
}

function isInvalidShortValue(value) {
  const text = cleanDisplayText(value);

  if (!text) {
    return true;
  }

  if (/^(?:-|―|ー|なし|無し|null|undefined|未設定|不明)$/i.test(text)) {
    return true;
  }

  if (/^[0-9０-９]+(?:\.[0-9０-９]+)?$/.test(text)) {
    return true;
  }

  if (/^(?:true|false|on|off)$/i.test(text)) {
    return true;
  }

  return false;
}

function deriveCarNameFromTitle(title) {
  const text = cleanDisplayText(title);

  if (!text) {
    return "";
  }

  return text.split(" ")[0] || "";
}

function chooseGradeName(vehicle, carName) {
  const candidates = [
    vehicle?.gradeName,
    deriveGradeFromSource(vehicle?.title, carName),
    deriveGradeFromSource(vehicle?.description, carName),
  ];

  for (const candidate of candidates) {
    const grade = cleanDisplayText(candidate);

    if (!isUsefulGradeName(grade, carName)) {
      continue;
    }

    return grade;
  }

  return "";
}

function isUsefulGradeName(value, carName) {
  const text = cleanDisplayText(value);

  if (isInvalidShortValue(text)) {
    return false;
  }

  if (normalizeComparable(text) === normalizeComparable(carName)) {
    return false;
  }

  if (text.length > 80) {
    return false;
  }

  if (looksLikeEquipmentText(text)) {
    return false;
  }

  return true;
}

function deriveGradeFromSource(source, carName) {
  let text = cleanDisplayText(source);
  const normalizedCarName = cleanDisplayText(carName);

  if (!text) {
    return "";
  }

  if (normalizedCarName && text.startsWith(normalizedCarName)) {
    text = cleanDisplayText(text.slice(normalizedCarName.length));
  }

  text = text.replace(/^[・･：:／/\-ー＿_\s]+/, "");

  const equipmentStart = text.search(
    /\s(?:2WD|4WD|４ＷＤ|二駆|四駆|ハイブリッド|ターボ|ワンオーナー|禁煙車|純正|社外|両側|片側|電動|衝突|フルセグ|ナビ|バックカメラ|Ｂカメラ|ETC|ＥＴＣ|サンルーフ|本革|レザー|シート|クルコン|アラウンド|パワー|LED|ＬＥＤ|ドラレコ|寒冷地|オプション|新品|車検|切替式)(?:\s|$)/i,
  );

  if (equipmentStart >= 0) {
    text = cleanDisplayText(text.slice(0, equipmentStart));
  }

  return text;
}

function looksLikeEquipmentText(value) {
  const text = cleanDisplayText(value);

  const equipmentWords = text.match(
    /(4WD|４ＷＤ|ハイブリッド|ターボ|ナビ|カメラ|ETC|ＥＴＣ|シート|クルーズ|ドラレコ|パワースライド|サンルーフ|ワンオーナー|純正|社外)/gi,
  );

  return Boolean(equipmentWords && equipmentWords.length >= 2);
}

function chooseGradeExtraInfo(vehicle, carName, gradeName) {
  const direct = cleanDisplayText(vehicle?.gradeExtraInfo);

  if (isUsefulExtraInfo(direct, carName, gradeName)) {
    return direct;
  }

  const derived = deriveExtraInfoFromDescription(
    vehicle?.description,
    vehicle?.title,
    carName,
    gradeName,
  );

  if (isUsefulExtraInfo(derived, carName, gradeName)) {
    return derived;
  }

  return FALLBACK_EXTRA_INFO;
}

function isUsefulExtraInfo(value, carName, gradeName) {
  const text = cleanDisplayText(value);

  if (isInvalidShortValue(text)) {
    return false;
  }

  if (text.length < 4) {
    return false;
  }

  const comparable = normalizeComparable(text);

  if (comparable === normalizeComparable(carName)) {
    return false;
  }

  if (comparable === normalizeComparable(gradeName)) {
    return false;
  }

  if (comparable === normalizeComparable(`${carName} ${gradeName}`)) {
    return false;
  }

  return true;
}

function deriveExtraInfoFromDescription(
  description,
  title,
  carName,
  gradeName,
) {
  let text = cleanDisplayText(description);

  if (!text) {
    return "";
  }

  const prefixes = [
    cleanDisplayText(title),
    cleanDisplayText(`${carName} ${gradeName}`),
    cleanDisplayText(carName),
    cleanDisplayText(gradeName),
  ]
    .filter(Boolean)
    .sort((first, second) => second.length - first.length);

  for (const prefix of prefixes) {
    if (text.startsWith(prefix)) {
      text = cleanDisplayText(text.slice(prefix.length));
      break;
    }
  }

  text = text.replace(/^[・･：:／/\-ー＿_\s]+/, "");

  if (gradeName && text.startsWith(gradeName)) {
    text = cleanDisplayText(text.slice(gradeName.length));
  }

  return text;
}

function statusPriority(vehicle) {
  return vehicle?.sourceStatus === "掲載在庫" ? 0 : 1;
}

function priceNumber(priceText) {
  if (!priceText) {
    return 0;
  }

  const match = String(priceText).match(/([\d.]+)/);

  return match ? Number(match[1]) : 0;
}

function prepareSearchVehicles(vehicles) {
  return [...vehicles].map(normalizeVehicleForDisplay).sort((first, second) => {
    const firstStatus = statusPriority(first);
    const secondStatus = statusPriority(second);

    if (firstStatus !== secondStatus) {
      return firstStatus - secondStatus;
    }

    return priceNumber(second.totalPrice) - priceNumber(first.totalPrice);
  });
}

async function replyInventorySearchResult(replyToken, searchResult) {
  if (
    searchResult.type === INVENTORY_SEARCH_RESULT_TYPES.MAKER ||
    searchResult.type === INVENTORY_SEARCH_RESULT_TYPES.MODEL ||
    searchResult.type === INVENTORY_SEARCH_RESULT_TYPES.CATEGORY
  ) {
    const results = prepareSearchVehicles(searchResult.vehicles);
    const similarResults = prepareSearchVehicles(searchResult.similarVehicles);
    const targetName = getSearchTargetName(searchResult);

    const isCategorySearch =
      searchResult.type === INVENTORY_SEARCH_RESULT_TYPES.CATEGORY;

    const resultText = isCategorySearch
      ? `${targetName}で見つかった在庫は${results.length}台です😊\n\n` +
        "展示販売中の車から先に、支払総額が高い順でご紹介します🚗\n\n" +
        "ほかのタイプの軽も、下のボタンからざっくり探せます🔍"
      : `${targetName}で見つかった在庫は${results.length}台です😊\n\n` +
        "展示販売中の車から先に、支払総額が高い順でご紹介します🚗";

    const carouselMessage = makeSearchVehiclePageCarouselMessage(
      results,
      searchResult.query,
      0,
      similarResults,
    );

    if (isCategorySearch) {
      carouselMessage.quickReply = lightTypeQuickReply;
    }

    const messages = [
      {
        type: "text",
        text: resultText,
      },
      carouselMessage,
    ];

    if (
      results.length <= VEHICLES_PER_PAGE &&
      searchResult.similarSelection?.axis
    ) {
      messages.push(makeSimilarSelectionMessage(searchResult));
    }

    await replyMessage(replyToken, messages);
    return;
  }

  if (searchResult.type === INVENTORY_SEARCH_RESULT_TYPES.NO_STOCK) {
    const targetName = getSearchTargetName(searchResult);
    const similarResults = prepareSearchVehicles(searchResult.similarVehicles);

    if (
      searchResult.targetType === INVENTORY_SEARCH_RESULT_TYPES.MODEL &&
      searchResult.similarSelection?.axis
    ) {
      await replyMessage(replyToken, [
        {
          type: "text",
          text:
            `${targetName}の在庫は現在ありませんでした🙇‍♀️\n\n` +
            `代わりに、${targetName}と近いタイプの別車種をご案内できます😊`,
        },
        makeSimilarSelectionMessage(searchResult),
      ]);

      return;
    }

    if (similarResults.length) {
      await replyMessage(replyToken, [
        {
          type: "text",
          text:
            `${targetName}の在庫は現在ありませんでした🙇‍♀️\n\n` +
            `代わりに、同じタイプの別車種の在庫が${similarResults.length}台あります😊\n` +
            "別車種はこちらです🚗",
        },
        makeSimilarVehiclePageCarouselMessage(
          similarResults,
          searchResult.query,
          0,
        ),
      ]);

      return;
    }

    const isCategorySearch =
      searchResult.targetType === INVENTORY_SEARCH_RESULT_TYPES.CATEGORY;

    const recognizedTypeName =
      searchResult.targetType === INVENTORY_SEARCH_RESULT_TYPES.MAKER
        ? "メーカー"
        : isCategorySearch
          ? "車のタイプ"
          : "車種";

    const noStockMessage = {
      type: "text",
      text:
        `${targetName || searchResult.query}は${recognizedTypeName}として確認できましたが、現在の在庫にはありませんでした🙇‍♀️\n\n` +
        "在庫にない場合も、全国からご希望に合う一台をお探しできます😊",
    };

    if (isCategorySearch) {
      noStockMessage.text +=
        "\n\nほかのタイプの軽は、下のボタンからざっくり探せます🔍";
      noStockMessage.quickReply = lightTypeQuickReply;
    }

    await replyMessage(replyToken, [noStockMessage]);
    return;
  }

  if (searchResult.type === INVENTORY_SEARCH_RESULT_TYPES.AMBIGUOUS) {
    const candidateNames = searchResult.candidates
      .map((candidate) => candidate.modelName)
      .slice(0, 13);

    await replyMessage(replyToken, [
      {
        type: "text",
        text:
          "候補が複数見つかりました😊\n\n" + "探している車種を選んでください🚗",
        quickReply: {
          items: candidateNames.map((name) => makeMessageAction(name)),
        },
      },
    ]);

    return;
  }

  await replyMessage(replyToken, [
    {
      type: "text",
      text:
        "メーカー名または車種名として確認できませんでした🙇‍♀️\n\n" +
        "「トヨタ」「アルファード」「N-BOX」のように送ってください😊",
    },
  ]);
}

function getSearchTargetName(searchResult) {
  if (
    searchResult.type === INVENTORY_SEARCH_RESULT_TYPES.MAKER ||
    searchResult.targetType === INVENTORY_SEARCH_RESULT_TYPES.MAKER
  ) {
    return searchResult.maker?.makerName || searchResult.query;
  }

  if (
    searchResult.type === INVENTORY_SEARCH_RESULT_TYPES.CATEGORY ||
    searchResult.targetType === INVENTORY_SEARCH_RESULT_TYPES.CATEGORY
  ) {
    return searchResult.category?.displayName || searchResult.query;
  }

  return (
    searchResult.displayName ||
    searchResult.model?.modelName ||
    searchResult.query
  );
}

function makeSimilarSelectionPostbackData(
  query,
  vehicleClass,
  modelType,
  offset = 0,
) {
  return (
    "inventory-similar-filter|" +
    `${encodeURIComponent(query)}|` +
    `${vehicleClass || "-"}|` +
    `${modelType || "-"}|` +
    `${offset}`
  );
}

function makeSimilarSelectionMessage(searchResult) {
  const targetName = getSearchTargetName(searchResult);
  const selection = searchResult.similarSelection;

  const isVehicleClassSelection = selection?.axis === "vehicleClass";

  const question = isVehicleClassSelection
    ? "別車種の候補は、軽自動車と普通車のどちらから探しますか？🚗"
    : "別車種の候補は、どのタイプから探しますか？🚗";

  const items = (selection?.options || []).slice(0, 13).map((option) => {
    const vehicleClass = isVehicleClassSelection
      ? option.key
      : selection.vehicleClass;

    const modelType = isVehicleClassSelection
      ? selection.modelType
      : option.key;

    return makePostbackAction(
      option.label,
      makeSimilarSelectionPostbackData(
        searchResult.query,
        vehicleClass,
        modelType,
        0,
      ),
      `${targetName}：${option.label}`,
    );
  });

  return {
    type: "text",
    text:
      question +
      `\n\n選んだ条件に合う、${targetName}以外の別車種をご紹介します😊`,
    quickReply: {
      items,
    },
  };
}

function makeSearchVehiclePageCarouselMessage(
  results,
  query,
  offset,
  similarResults = [],
) {
  const pageVehicles = results.slice(offset, offset + VEHICLES_PER_PAGE);
  const nextOffset = offset + VEHICLES_PER_PAGE;
  const hasMore = nextOffset < results.length;
  const contents = pageVehicles.map(makeVehicleBubble);

  if (hasMore) {
    contents.push(makeSearchMoreBubble(results, query, nextOffset));
  } else if (similarResults.length) {
    contents.push(makeSimilarSearchBubble(similarResults, query));
  }

  return {
    type: "flex",
    altText: `${query}の在庫検索結果`,
    contents: {
      type: "carousel",
      contents,
    },
  };
}

function makeSearchMoreBubble(results, query, nextOffset) {
  const remaining = results.length - nextOffset;

  const previewVehicles = results.slice(
    nextOffset,
    nextOffset + VEHICLES_PER_PAGE,
  );

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
          contents: makeSearchPreviewRows(
            previewVehicles,
            query,
            nextOffset,
            nextCount,
          ),
        },
      ],
    },
  };
}

function makeSearchPreviewRows(vehicles, query, nextOffset, nextCount) {
  const previewItems = vehicles.map(makePreviewImageBox);
  previewItems.push(makeSearchPreviewButtonBox(query, nextOffset, nextCount));

  const rows = [];

  for (let index = 0; index < previewItems.length; index += 2) {
    const rowItems = previewItems.slice(index, index + 2);

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

function makeSearchPreviewButtonBox(query, nextOffset, nextCount) {
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
      data: `inventory-search-more|${encodeURIComponent(query)}|${nextOffset}`,
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

function makeSimilarSearchBubble(results, query) {
  const previewVehicles = results.slice(0, VEHICLES_PER_PAGE);

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
              text: `同じタイプの車が${results.length}台あるよ😊`,
              weight: "bold",
              size: results.length >= 10 ? "md" : "lg",
              color: "#FFFFFF",
              align: "center",
              wrap: true,
            },
            {
              type: "text",
              text: "似た車はこちら💁",
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
          contents: makeSimilarPreviewRows(previewVehicles, query),
        },
      ],
    },
  };
}

function makeSimilarPreviewRows(vehicles, query) {
  const previewItems = vehicles.map(makePreviewImageBox);
  previewItems.push(makeSimilarPreviewButtonBox(query));

  const rows = [];

  for (let index = 0; index < previewItems.length; index += 2) {
    const rowItems = previewItems.slice(index, index + 2);

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

function makeSimilarPreviewButtonBox(query) {
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
      data: `inventory-similar|${encodeURIComponent(query)}|0`,
      displayText: "同じタイプの車を見る",
    },
    contents: [
      {
        type: "text",
        text: "同じタイプの車",
        color: "#FFFFFF",
        weight: "bold",
        size: "sm",
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

function makeSimilarVehiclePageCarouselMessage(
  results,
  query,
  offset,
  similarSelection = null,
) {
  const pageVehicles = results.slice(offset, offset + VEHICLES_PER_PAGE);
  const nextOffset = offset + VEHICLES_PER_PAGE;
  const hasMore = nextOffset < results.length;
  const contents = pageVehicles.map(makeVehicleBubble);

  if (hasMore) {
    contents.push(
      makeSimilarMoreBubble(results, query, nextOffset, similarSelection),
    );
  }

  return {
    type: "flex",
    altText: `${query}と同じタイプの在庫`,
    contents: {
      type: "carousel",
      contents,
    },
  };
}

function makeSimilarMoreBubble(results, query, nextOffset, similarSelection) {
  const remaining = results.length - nextOffset;

  const previewVehicles = results.slice(
    nextOffset,
    nextOffset + VEHICLES_PER_PAGE,
  );

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
          contents: makeSimilarPagePreviewRows(
            previewVehicles,
            query,
            nextOffset,
            nextCount,
            similarSelection,
          ),
        },
      ],
    },
  };
}

function makeSimilarPagePreviewRows(
  vehicles,
  query,
  nextOffset,
  nextCount,
  similarSelection,
) {
  const previewItems = vehicles.map(makePreviewImageBox);

  previewItems.push(
    makeSimilarPagePreviewButtonBox(
      query,
      nextOffset,
      nextCount,
      similarSelection,
    ),
  );

  const rows = [];

  for (let index = 0; index < previewItems.length; index += 2) {
    const rowItems = previewItems.slice(index, index + 2);

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

function makeSimilarPagePreviewButtonBox(
  query,
  nextOffset,
  nextCount,
  similarSelection,
) {
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
      data: similarSelection
        ? makeSimilarSelectionPostbackData(
            query,
            similarSelection.vehicleClass,
            similarSelection.modelType,
            nextOffset,
          )
        : `inventory-similar|${encodeURIComponent(query)}|${nextOffset}`,
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

  const previewVehicles = results.slice(
    nextOffset,
    nextOffset + VEHICLES_PER_PAGE,
  );

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
          contents: makePreviewRows(
            previewVehicles,
            size,
            rawType,
            nextOffset,
            nextCount,
          ),
        },
      ],
    },
  };
}

function makePreviewRows(vehicles, size, rawType, nextOffset, nextCount) {
  const previewItems = vehicles.map(makePreviewImageBox);
  previewItems.push(makePreviewButtonBox(size, rawType, nextOffset, nextCount));

  const rows = [];

  for (let index = 0; index < previewItems.length; index += 2) {
    const rowItems = previewItems.slice(index, index + 2);

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
      contents: [{ type: "filler" }],
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
    contents: [{ type: "filler" }],
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

  if (status === "掲載在庫") {
    return "展示販売中";
  }

  if (status === "一時保存") {
    return "販売可・未仕上げ";
  }

  return status;
}

function makeVehicleBubble(vehicle) {
  const imageUrl = validImageUrl(vehicle?.imageUrl);
  const isPublicVehicle = vehicle?.sourceStatus === "掲載在庫";
  const gooUrl = isPublicVehicle ? validUrl(vehicle?.gooUrl) : "";

  const gradeExtraInfo = safeText(vehicle?.gradeExtraInfo, FALLBACK_EXTRA_INFO);

  const expensePrice = calculateExpensePrice(
    vehicle?.totalPrice,
    vehicle?.bodyPrice,
  );

  const bodyContents = [
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
      text: `車両本体価格 ${safeText(
        vehicle?.bodyPrice,
        "お問い合わせ",
      )}＋諸経費 ${expensePrice}`,
      size: "xs",
      color: "#666666",
      wrap: true,
      margin: "none",
    },
    makeGradeExtraBox(gradeExtraInfo, isPublicVehicle),
    makeInfoRow(vehicle),
  ];

  if (gooUrl) {
    bodyContents.push({
      type: "text",
      text: "詳細は写真をタップ ↗",
      size: "xs",
      color: "#888888",
      align: "center",
      margin: "xs",
    });
  }

  bodyContents.push(makeConsultButton(vehicle));

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
          contents: bodyContents,
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
    ...(gooUrl
      ? {
          action: {
            type: "uri",
            uri: gooUrl,
          },
        }
      : {}),
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
  const title = safeText(vehicle?.carName || vehicle?.title, "車両情報");
  const subTitle = optionalText(vehicle?.gradeName);

  return {
    type: "box",
    layout: "vertical",
    backgroundColor: "#0B1F3A",
    height: "96px",
    justifyContent: "center",
    paddingStart: "14px",
    paddingEnd: "14px",
    paddingTop: "10px",
    paddingBottom: "10px",
    contents: [
      {
        type: "text",
        text: title,
        weight: "bold",
        size: "lg",
        color: "#E5D08A",
        wrap: true,
      },
      {
        type: "text",
        text: subTitle || "　",
        size: "sm",
        color: "#FFFFFF",
        weight: "regular",
        wrap: true,
        maxLines: 2,
        margin: "xs",
      },
    ],
  };
}

function makeGradeExtraBox(gradeExtraInfo, isPublicVehicle) {
  if (!isPublicVehicle) {
    return {
      type: "box",
      layout: "vertical",
      height: "118px",
      margin: "sm",
      backgroundColor: "#FFF9EC",
      borderColor: "#D8BE72",
      borderWidth: "1px",
      cornerRadius: "md",
      contents: [
        {
          type: "image",
          url: "https://raw.githubusercontent.com/CARTOPIA0319/cartopia-car-diagnosis/main/public/preparing-vehicle.PNG",
          size: "full",
          aspectRatio: "20:7",
          aspectMode: "cover",
        },
        {
          type: "box",
          layout: "vertical",
          position: "absolute",
          width: "100%",
          height: "118px",
          paddingStart: "12px",
          paddingEnd: "12px",
          paddingTop: "9px",
          paddingBottom: "9px",
          backgroundColor: "#0B1F3AB3",
          cornerRadius: "md",
          justifyContent: "center",
          alignItems: "center",
          contents: [
            {
              type: "text",
              text: "ただいま展示に向けて\n車内清掃・ボディ研磨を進めています",
              size: "md",
              color: "#FFFFFF",
              weight: "bold",
              align: "center",
              wrap: true,
              maxLines: 2,
            },
            {
              type: "text",
              text: "販売・現車確認は可能です\nお気軽にご相談ください",
              size: "sm",
              color: "#E5D08A",
              weight: "bold",
              align: "center",
              wrap: true,
              maxLines: 2,
              margin: "sm",
            },
          ],
        },
      ],
    };
  }

  return {
    type: "box",
    layout: "vertical",
    height: "92px",
    margin: "sm",
    justifyContent: "center",
    contents: [
      {
        type: "text",
        text: gradeExtraInfo,
        size: "xxs",
        color: "#333333",
        wrap: true,
        maxLines: 4,
      },
    ],
  };
}

function calculateExpensePrice(totalPrice, bodyPrice) {
  const total = parsePriceInTenThousands(totalPrice);
  const body = parsePriceInTenThousands(bodyPrice);

  if (total === null || body === null) {
    return "お問い合わせ";
  }

  return `${Math.max(0, total - body).toFixed(1)}万円`;
}

function parsePriceInTenThousands(value) {
  const match = String(value ?? "")
    .replace(/,/g, "")
    .match(/[0-9]+(?:\.[0-9]+)?/);

  if (!match) {
    return null;
  }

  const number = Number(match[0]);
  return Number.isFinite(number) ? number : null;
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
            maxLines: 3,
          },
        ],
      },
    ],
  };
}

function getInfoValueSize(valueText, kind) {
  if (kind !== "color") {
    return "xs";
  }

  const plain = String(valueText || "").replace(/\n/g, "");
  return plain.length <= 6 ? "xs" : "xxs";
}

function formatColorName(colorText) {
  const text = String(colorText || "")
    .replace(/\s+/g, "")
    .trim();

  if (!text) {
    return "-";
  }

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
  ].sort((first, second) => second.length - first.length);

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

      lines.push(...splitTextByLength(token, maxCharsPerLine));
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
  if (text.length <= maxChars) {
    return text;
  }

  return `${text.slice(0, Math.max(1, maxChars - 1))}…`;
}

function splitTextByLength(text, length) {
  const result = [];

  for (let index = 0; index < text.length; index += length) {
    result.push(text.slice(index, index + length));
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
      text: `この車について相談したい：${safeText(
        vehicle?.carName || vehicle?.title,
        "車両情報",
      )}`,
    },
  };
}

function formatRegistrationYear(yearText) {
  if (!yearText) {
    return "-";
  }

  const match = String(yearText).match(/(19|20)\d{2}/);

  if (!match) {
    return safeText(yearText, "-");
  }

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
  if (!mileageText) {
    return "-";
  }

  const text = String(mileageText)
    .replace(/Ｋ/g, "K")
    .replace(/ｋ/g, "k")
    .replace(/,/g, "")
    .trim();

  if (text.includes("走不明")) {
    return "走不明";
  }

  const numberText = text.match(/[0-9]+(?:\.[0-9]+)?/)?.[0];

  if (!numberText) {
    return safeText(mileageText, "-");
  }

  const value = Number(numberText);

  if (!Number.isFinite(value)) {
    return safeText(mileageText, "-");
  }

  let kilometers;

  if (text.includes("万K") || text.includes("万k") || text.includes("万km")) {
    kilometers = value >= 1000 ? value : value * 10000;
  } else {
    kilometers = value;
  }

  return `${Math.round(kilometers).toLocaleString("ja-JP")}km`;
}

function safeText(value, fallback = "-") {
  if (value === undefined || value === null) {
    return fallback;
  }

  const text = String(value);
  return text.trim() === "" ? fallback : text;
}

function optionalText(value) {
  if (value === undefined || value === null) {
    return "";
  }

  const text = String(value);
  return text.trim() === "" ? "" : text;
}

function validImageUrl(url) {
  if (!url) {
    return "";
  }

  const text = String(url);
  return text.startsWith("https://") ? text : "";
}

function validUrl(url) {
  if (!url) {
    return "";
  }

  const text = String(url);
  return text.startsWith("https://") || text.startsWith("http://") ? text : "";
}

async function replyMessage(replyToken, messages) {
  const response = await fetch("https://api.line.me/v2/bot/message/reply", {
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

  const result = await response.text();

  console.log("REPLY_STATUS:", response.status);
  console.log("REPLY_RESULT:", result);
}

async function linkRichMenu(userId, richMenuId) {
  const response = await fetch(
    `https://api.line.me/v2/bot/user/${userId}/richmenu/${richMenuId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
      },
    },
  );

  const result = await response.text();

  console.log("LINK_RICH_MENU_STATUS:", response.status);
  console.log("LINK_RICH_MENU_RESULT:", result);
}
