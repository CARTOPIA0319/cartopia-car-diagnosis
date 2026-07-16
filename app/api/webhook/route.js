import inventory from "../../../data/inventory.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUY_MENU_ID = "richmenu-45b4781911f21f5d5632ec63e211b449";
const TOP_MENU_ID = "richmenu-19859bd6bf80b802dfc2171536ac089e";
const VEHICLES_PER_PAGE = 9;
const PERFECT_CAROUSEL_SIZE = 10;
const PERFECT_MAX_VEHICLES = 40;
const PERFECT_INVENTORY_REQUEST_PREFIX = "【ぴったり診断・在庫検索】";

const MAKER_ALIASES = {
  トヨタ: ["TOYOTA", "トヨタ"],
  レクサス: ["LEXUS", "レクサス"],
  ホンダ: ["HONDA", "ホンダ"],
  日産: ["NISSAN", "ニッサン", "日産"],
  マツダ: ["MAZDA", "マツダ"],
  スバル: ["SUBARU", "スバル"],
  三菱: ["MITSUBISHI", "ミツビシ", "三菱"],
  スズキ: ["SUZUKI", "スズキ"],
  ダイハツ: ["DAIHATSU", "ダイハツ"],
  BMW: ["BMW"],
  メルセデスベンツ: [
    "MERCEDESBENZ",
    "MERCEDES",
    "BENZ",
    "メルセデスベンツ",
    "ベンツ",
  ],
  アウディ: ["AUDI", "アウディ"],
  フォルクスワーゲン: [
    "VOLKSWAGEN",
    "VW",
    "フォルクスワーゲン",
  ],
  ボルボ: ["VOLVO", "ボルボ"],
  ミニ: ["MINI", "ミニ"],
  ジープ: ["JEEP", "ジープ"],
  プジョー: ["PEUGEOT", "プジョー"],
  シトロエン: ["CITROEN", "シトロエン"],
  ルノー: ["RENAULT", "ルノー"],
  フィアット: ["FIAT", "フィアット"],
  ポルシェ: ["PORSCHE", "ポルシェ"],
  ジャガー: ["JAGUAR", "ジャガー"],
  ランドローバー: ["LANDROVER", "ランドローバー"],
};

const IMPORT_MAKERS = new Set([
  "BMW",
  "メルセデスベンツ",
  "アウディ",
  "フォルクスワーゲン",
  "ボルボ",
  "ミニ",
  "ジープ",
  "プジョー",
  "シトロエン",
  "ルノー",
  "フィアット",
  "ポルシェ",
  "ジャガー",
  "ランドローバー",
]);

const MODEL_TO_MAKER = {
  アクア: "トヨタ",
  プリウス: "トヨタ",
  ヤリス: "トヨタ",
  ヴィッツ: "トヨタ",
  パッソ: "トヨタ",
  ルーミー: "トヨタ",
  タンク: "トヨタ",
  シエンタ: "トヨタ",
  ノア: "トヨタ",
  ヴォクシー: "トヨタ",
  エスクァイア: "トヨタ",
  アルファード: "トヨタ",
  ヴェルファイア: "トヨタ",
  ハリアー: "トヨタ",
  ライズ: "トヨタ",
  RAV4: "トヨタ",
  ランドクルーザー: "トヨタ",
  クラウン: "トヨタ",
  カローラ: "トヨタ",
  プロボックス: "トヨタ",
  ハイエース: "トヨタ",

  NBOX: "ホンダ",
  NWGN: "ホンダ",
  NONE: "ホンダ",
  NVAN: "ホンダ",
  フィット: "ホンダ",
  フリード: "ホンダ",
  ヴェゼル: "ホンダ",
  ステップワゴン: "ホンダ",
  オデッセイ: "ホンダ",
  シビック: "ホンダ",
  シャトル: "ホンダ",

  デイズ: "日産",
  ルークス: "日産",
  モコ: "日産",
  サクラ: "日産",
  ノート: "日産",
  セレナ: "日産",
  エクストレイル: "日産",
  キックス: "日産",
  エルグランド: "日産",
  スカイライン: "日産",
  リーフ: "日産",
  NV100: "日産",
  キャラバン: "日産",

  デミオ: "マツダ",
  MAZDA2: "マツダ",
  MAZDA3: "マツダ",
  MAZDA6: "マツダ",
  CX3: "マツダ",
  CX5: "マツダ",
  CX8: "マツダ",
  CX30: "マツダ",
  ロードスター: "マツダ",
  フレア: "マツダ",

  ステラ: "スバル",
  プレオ: "スバル",
  シフォン: "スバル",
  インプレッサ: "スバル",
  レヴォーグ: "スバル",
  フォレスター: "スバル",
  アウトバック: "スバル",
  クロストレック: "スバル",
  BRZ: "スバル",

  EK: "三菱",
  デリカ: "三菱",
  アウトランダー: "三菱",
  エクリプスクロス: "三菱",
  RVR: "三菱",
  パジェロ: "三菱",
  ミニキャブ: "三菱",

  スペーシア: "スズキ",
  ワゴンR: "スズキ",
  ハスラー: "スズキ",
  アルト: "スズキ",
  ラパン: "スズキ",
  ジムニー: "スズキ",
  ソリオ: "スズキ",
  スイフト: "スズキ",
  エブリイ: "スズキ",
  キャリイ: "スズキ",
  クロスビー: "スズキ",

  タント: "ダイハツ",
  ムーヴ: "ダイハツ",
  ムーブ: "ダイハツ",
  ミライース: "ダイハツ",
  タフト: "ダイハツ",
  ロッキー: "ダイハツ",
  トール: "ダイハツ",
  アトレー: "ダイハツ",
  ハイゼット: "ダイハツ",
  ウェイク: "ダイハツ",
  コペン: "ダイハツ",
  キャスト: "ダイハツ",
};

const LEXUS_MODEL_CODES = [
  "LS",
  "ES",
  "IS",
  "GS",
  "LC",
  "RC",
  "RX",
  "NX",
  "UX",
  "LX",
  "GX",
  "LBX",
];

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

const roughSizeQuickReply = {
  items: [
    {
      type: "action",
      action: {
        type: "message",
        label: "軽自動車",
        text: "軽自動車",
      },
    },
    {
      type: "action",
      action: {
        type: "message",
        label: "普通車",
        text: "普通車",
      },
    },
  ],
};

const lightTypeQuickReply = {
  items: [
    {
      type: "action",
      action: {
        type: "message",
        label: "スライドドア",
        text: "軽自動車 スライドドア",
      },
    },
    {
      type: "action",
      action: {
        type: "message",
        label: "スタンダード",
        text: "軽自動車 スタンダード",
      },
    },
    {
      type: "action",
      action: {
        type: "message",
        label: "SUV",
        text: "軽自動車 SUV",
      },
    },
    {
      type: "action",
      action: {
        type: "message",
        label: "トラック",
        text: "軽自動車 トラック",
      },
    },
    {
      type: "action",
      action: {
        type: "message",
        label: "スポーティ",
        text: "軽自動車 スポーティ",
      },
    },
    {
      type: "action",
      action: {
        type: "message",
        label: "こだわりなし",
        text: "軽自動車 こだわりなし",
      },
    },
    {
      type: "action",
      action: {
        type: "message",
        label: "ひとつ戻る",
        text: "ざっくり診断",
      },
    },
  ],
};

const normalTypeQuickReply = {
  items: [
    {
      type: "action",
      action: {
        type: "message",
        label: "コンパクトカー",
        text: "普通車 コンパクトカー",
      },
    },
    {
      type: "action",
      action: {
        type: "message",
        label: "ミニバン",
        text: "普通車 ミニバン",
      },
    },
    {
      type: "action",
      action: {
        type: "message",
        label: "SUV",
        text: "普通車 SUV",
      },
    },
    {
      type: "action",
      action: {
        type: "message",
        label: "セダン",
        text: "普通車 セダン",
      },
    },
    {
      type: "action",
      action: {
        type: "message",
        label: "ステーションワゴン",
        text: "普通車 ステーションワゴン",
      },
    },
    {
      type: "action",
      action: {
        type: "message",
        label: "低燃費・HV",
        text: "普通車 低燃費・ハイブリッド",
      },
    },
    {
      type: "action",
      action: {
        type: "message",
        label: "スポーティ",
        text: "普通車 スポーティ",
      },
    },
    {
      type: "action",
      action: {
        type: "message",
        label: "バン・トラック",
        text: "普通車 バン・トラック",
      },
    },
    {
      type: "action",
      action: {
        type: "message",
        label: "ひとつ戻る",
        text: "ざっくり診断",
      },
    },
  ],
};

export async function GET() {
  return Response.json({
    status: "ok",
    name: "CARTOPIA main webhook",
  });
}
export async function POST(request) {
  const body = await request.json();
  const events = body.events || [];

  for (const event of events) {
    if (!event.replyToken) continue;

    const text =
      event.type === "message" &&
      event.message?.type === "text"
        ? event.message.text
        : "";

    const postbackData =
      event.type === "postback"
        ? event.postback?.data || ""
        : "";

    if (postbackData.startsWith("more|")) {
      const [, size, rawType, offsetText] =
        postbackData.split("|");

      const offset = Number(offsetText || "0");
      const type = normalizeType(rawType);
      const results = findVehicles(size, type);

      await replyMessage(event.replyToken, [
        makeVehiclePageCarouselMessage(
          results,
          size,
          rawType,
          offset
        ),
      ]);

      continue;
    }

    const perfectCriteria =
      parsePerfectInventoryRequest(text);

    if (perfectCriteria) {
      const results =
        findPerfectVehicles(perfectCriteria);

      await replyMessage(
        event.replyToken,
        makePerfectInventoryMessages(
          results,
          perfectCriteria
        )
      );

      continue;
    }

    const isBuy =
      text === "くるまを買う" ||
      postbackData ===
        "switch-to-car-search-menu";

    if (isBuy) {
      await linkRichMenu(
        event.source.userId,
        BUY_MENU_ID
      );

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
      await linkRichMenu(
        event.source.userId,
        TOP_MENU_ID
      );

      await replyMessage(event.replyToken, [
        {
          type: "text",
          text:
            "😊 次は何する？\n\n" +
            "気になるメニューを選んでね🚗",
          quickReply: topQuickReply,
        },
      ]);

      continue;
    }

    if (text === "ざっくり診断") {
      await replyMessage(event.replyToken, [
        {
          type: "text",
          text:
            "⚡ ざっくり診断を開始😊\n\n" +
            "まずは車のサイズは軽？普通車？🚗",
          quickReply: roughSizeQuickReply,
        },
      ]);

      continue;
    }

    if (text === "軽自動車") {
      await replyMessage(event.replyToken, [
        {
          type: "text",
          text:
            "軽自動車ね😊\n\n" +
            "どんなタイプの軽を探してるの？🔍😊",
          quickReply: lightTypeQuickReply,
        },
      ]);

      continue;
    }

    if (text === "普通車") {
      await replyMessage(event.replyToken, [
        {
          type: "text",
          text:
            "普通車ね😊\n\n" +
            "次はどんなタイプか選んでね🚗",
          quickReply: normalTypeQuickReply,
        },
      ]);

      continue;
    }

    if (isRoughSearchText(text)) {
      const [size, rawType] =
        text.split(" ");

      const type =
        normalizeType(rawType);

      const results =
        findVehicles(size, type);

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
        makeVehiclePageCarouselMessage(
          results,
          size,
          rawType,
          0
        ),
      ]);

      continue;
    }

    if (
      text ===
      "「買う」でできること"
    ) {
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

    if (
      text ===
      "「売る」でできること"
    ) {
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

    if (
      text ===
      "「予約」でできること"
    ) {
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

    if (
      text ===
      "車種が決まっている人は？"
    ) {
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

    if (
      text ===
      "ざっくり診断とは？"
    ) {
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

    if (
      text ===
      "ぴったり診断とは？"
    ) {
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

  return Response.json({
    ok: true,
  });
}
function parsePerfectInventoryRequest(
  text
) {
  if (
    !String(text || "").startsWith(
      PERFECT_INVENTORY_REQUEST_PREFIX
    )
  ) {
    return null;
  }

  const values = {};

  for (
    const line of String(text)
      .split("\n")
      .slice(1)
  ) {
    const separatorIndex =
      line.search(/[：:]/);

    if (separatorIndex < 0) {
      continue;
    }

    const key = line
      .slice(0, separatorIndex)
      .trim();

    const value = line
      .slice(separatorIndex + 1)
      .trim();

    values[key] = value;
  }

  return {
    requiredSeats: Math.max(
      0,
      Number(
        values["必要人数"] || 0
      )
    ),

    desiredTypes:
      splitPipeValues(
        values["希望TYPE"]
      ).map(
        normalizeCompositeType
      ),

    desiredMakers:
      splitPipeValues(
        values["希望メーカー"]
      ),

    desiredConditions:
      splitPipeValues(
        values["希望条件"]
      ),

    avoidMakers:
      splitPipeValues(
        values["避けたいメーカー"]
      ),

    avoidModels:
      splitPipeValues(
        values["避けたい車種"]
      ),

    avoidTypes:
      splitPipeValues(
        values["避けたいTYPE"]
      ).map(
        normalizeCompositeType
      ),

    avoidConditions:
      splitPipeValues(
        values["避けたい条件"]
      ),

    retainedTypes:
      splitPipeValues(
        values["世帯に残るTYPE"]
      ).map(
        normalizeCompositeType
      ),
  };
}

function splitPipeValues(value) {
  return String(value || "")
    .split(/[｜|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeCompositeType(
  value
) {
  const text =
    String(value || "").trim();

  if (!text) return "";

  if (
    text ===
      "特にこだわらない" ||
    text ===
      "特にこだわりはない"
  ) {
    return "特にこだわりはない";
  }

  const [size, ...typeParts] =
    text.split(/\s+/);

  const type =
    normalizeType(
      typeParts.join(" ")
    );

  return type
    ? `${size} ${type}`
    : size;
}

function findPerfectVehicles(
  criteria
) {
  const vehicles =
    uniqueByStockId(
      inventory.vehicles || []
    );

  return vehicles
    .map((vehicle) =>
      decorateVehicleForPerfectSearch(
        vehicle,
        criteria
      )
    )
    .filter((vehicle) =>
      vehicleMatchesRequiredSeats(
        vehicle,
        criteria.requiredSeats
      )
    )
    .filter((vehicle) =>
      vehicleMatchesAnyDesiredType(
        vehicle,
        criteria.desiredTypes
      )
    )
    .filter(
      (vehicle) =>
        !vehicleMatchesAnyMaker(
          vehicle,
          criteria.avoidMakers
        )
    )
    .filter(
      (vehicle) =>
        !vehicleMatchesAnyModel(
          vehicle,
          criteria.avoidModels
        )
    )
    .filter(
      (vehicle) =>
        !vehicleMatchesAnyType(
          vehicle,
          criteria.avoidTypes
        )
    )
    .filter(
      (vehicle) =>
        !vehicleMatchesAnyType(
          vehicle,
          criteria.retainedTypes
        )
    )
    .filter(
      (vehicle) =>
        !vehicleMatchesAnyAvoidCondition(
          vehicle,
          criteria.avoidConditions
        )
    )
    .sort((a, b) => {
      if (
        b.inventoryMatchScore !==
        a.inventoryMatchScore
      ) {
        return (
          b.inventoryMatchScore -
          a.inventoryMatchScore
        );
      }

      const statusDifference =
        statusPriority(a) -
        statusPriority(b);

      if (statusDifference !== 0) {
        return statusDifference;
      }

      return (
        priceNumber(b.totalPrice) -
        priceNumber(a.totalPrice)
      );
    });
}

function decorateVehicleForPerfectSearch(
  vehicle,
  criteria
) {
  const maker =
    detectMaker(vehicle);

  const keys =
    vehicleTypeKeys(vehicle);

  const seats =
    inferSeatCapacity(
      vehicle,
      keys
    );

  const searchText =
    vehicleSearchText(vehicle);

  const matchReasons = [];
  let score = 0;

  if (
    criteria.desiredMakers.length >
      0 &&
    vehicleMatchesAnyMaker(
      {
        ...vehicle,
        maker,
        searchText,
      },
      criteria.desiredMakers
    )
  ) {
    score += 30;

    matchReasons.push(
      "希望メーカー"
    );
  }

  for (
    const condition of
    criteria.desiredConditions
  ) {
    if (
      vehicleMatchesCondition(
        {
          ...vehicle,
          maker,
          keys,
          searchText,
        },
        condition
      )
    ) {
      score +=
        desiredConditionScore(
          condition
        );

      matchReasons.push(
        condition
      );
    }
  }

  if (
    vehicle.sourceStatus ===
    "掲載在庫"
  ) {
    score += 5;
  }

  return {
    ...vehicle,
    maker,
    keys,
    inferredSeatCapacity: seats,
    searchText,

    inventoryMatchScore:
      Math.min(99, score),

    inventoryMatchReasons:
      unique(matchReasons).slice(
        0,
        3
      ),
  };
}

function vehicleMatchesRequiredSeats(
  vehicle,
  requiredSeats
) {
  if (!requiredSeats) {
    return true;
  }

  if (
    requiredSeats >= 5 &&
    vehicle.keys.includes(
      "軽自動車"
    )
  ) {
    return false;
  }

  return (
    Number(
      vehicle.inferredSeatCapacity ||
        0
    ) >= requiredSeats
  );
}

function vehicleMatchesAnyDesiredType(
  vehicle,
  desiredTypes
) {
  const meaningfulTypes =
    (desiredTypes || [])
      .filter(Boolean);

  if (
    meaningfulTypes.length === 0
  ) {
    return true;
  }

  if (
    meaningfulTypes.includes(
      "特にこだわりはない"
    )
  ) {
    return true;
  }

  return meaningfulTypes.some(
    (type) =>
      vehicleMatchesCompositeType(
        vehicle,
        type
      )
  );
}

function vehicleMatchesAnyType(
  vehicle,
  types
) {
  return (types || [])
    .filter(Boolean)
    .some((type) =>
      vehicleMatchesCompositeType(
        vehicle,
        type
      )
    );
}

function vehicleMatchesCompositeType(
  vehicle,
  compositeType
) {
  if (
    !compositeType ||
    compositeType ===
      "特にこだわりはない"
  ) {
    return false;
  }

  const [size, ...typeParts] =
    String(compositeType)
      .split(/\s+/);

  const type =
    normalizeType(
      typeParts.join(" ")
    );

  const keys =
    vehicle.keys ||
    vehicleTypeKeys(vehicle);

  if (!type) {
    return keys.includes(
      normalizeType(size)
    );
  }

  return (
    keys.includes(
      normalizeType(size)
    ) &&
    keys.includes(type)
  );
}

function vehicleMatchesAnyMaker(
  vehicle,
  makers
) {
  const maker =
    vehicle.maker ||
    detectMaker(vehicle);

  const searchText =
    vehicle.searchText ||
    vehicleSearchText(vehicle);

  return (makers || []).some(
    (wantedMaker) => {
      const expanded =
        expandMakerTokens([
          wantedMaker,
        ]);

      if (maker) {
        return expanded.some(
          (token) =>
            includesNormalized(
              maker,
              token
            )
        );
      }

      return expanded.some(
        (token) =>
          includesNormalized(
            searchText,
            token
          )
      );
    }
  );
}

function vehicleMatchesAnyModel(
  vehicle,
  models
) {
  const searchText =
    vehicle.searchText ||
    vehicleSearchText(vehicle);

  return (models || []).some(
    (model) =>
      includesNormalized(
        searchText,
        model
      )
  );
}

function vehicleMatchesAnyAvoidCondition(
  vehicle,
  conditions
) {
  return (conditions || []).some(
    (condition) =>
      vehicleMatchesAvoidCondition(
        vehicle,
        condition
      )
  );
}

function vehicleMatchesAvoidCondition(
  vehicle,
  condition
) {
  const keys =
    vehicle.keys ||
    vehicleTypeKeys(vehicle);

  const searchText =
    vehicle.searchText ||
    vehicleSearchText(vehicle);

  const maker =
    vehicle.maker ||
    detectMaker(vehicle);

  switch (condition) {
    case "スライドドア":
      return keys.includes(
        "スライドドア"
      );

    case "大きい車":
      return (
        keys.includes(
          "ミニバン"
        ) ||
        keys.includes(
          "バン・トラック"
        ) ||
        isLargeVehicleText(
          searchText
        )
      );

    case "小さい車":
      return (
        keys.includes(
          "軽自動車"
        ) ||
        keys.includes(
          "コンパクトカー"
        )
      );

    case "車高が高い車":
      return (
        keys.includes("SUV") ||
        keys.includes(
          "ミニバン"
        ) ||
        keys.includes(
          "バン・トラック"
        )
      );

    case "車高が低い車":
      return (
        keys.includes(
          "セダン"
        ) ||
        keys.includes(
          "ステーションワゴン"
        ) ||
        keys.includes(
          "スポーティ"
        )
      );

    case "商用車っぽい車":
      return (
        keys.includes(
          "バン・トラック"
        ) ||
        /バン|トラック|ハイエース|キャラバン|プロボックス|サクシード|エブリイ|ハイゼット/.test(
          searchText
        )
      );

    case "カスタム系":
      return includesNormalized(
        searchText,
        "カスタム"
      );

    case "輸入車":
      return IMPORT_MAKERS.has(
        maker
      );

    case "ハイブリッド・EV":
      return (
        keys.includes(
          "EV・HV"
        ) ||
        /ハイブリッド|HYBRID|EV|PHEV|PHV|EPOWER/.test(
          searchText
        )
      );

    default:
      return false;
  }
}
function vehicleMatchesCondition(
  vehicle,
  condition
) {
  const keys =
    vehicle.keys ||
    vehicleTypeKeys(vehicle);

  const searchText =
    vehicle.searchText ||
    vehicleSearchText(vehicle);

  const maker =
    vehicle.maker ||
    detectMaker(vehicle);

  switch (condition) {
    case "スライドドア":
      return keys.includes(
        "スライドドア"
      );

    case "運転しやすい":
      return (
        keys.includes(
          "軽自動車"
        ) ||
        keys.includes(
          "コンパクトカー"
        )
      );

    case "乗り心地が良い":
      return (
        keys.includes(
          "セダン"
        ) ||
        keys.includes(
          "ミニバン"
        ) ||
        isLuxuryVehicle(
          maker,
          searchText
        )
      );

    case "室内が広い":
      return (
        keys.includes(
          "ミニバン"
        ) ||
        keys.includes(
          "スライドドア"
        ) ||
        keys.includes(
          "バン・トラック"
        )
      );

    case "静粛性が高い":
      return (
        keys.includes(
          "EV・HV"
        ) ||
        isLuxuryVehicle(
          maker,
          searchText
        )
      );

    case "安全性能":
      return /セーフティ|SAFETY|スマートアシスト|プロパイロット|ホンダセンシング|アイサイト/.test(
        searchText
      );

    case "4WD":
      return /4WD|AWD|四駆/.test(
        searchText
      );

    case "荷室が広い":
      return (
        keys.includes(
          "ミニバン"
        ) ||
        keys.includes(
          "ステーションワゴン"
        ) ||
        keys.includes(
          "SUV"
        ) ||
        keys.includes(
          "バン・トラック"
        )
      );

    case "加速・走り":
      return (
        keys.includes(
          "スポーティ"
        ) ||
        keys.includes(
          "EV・HV"
        ) ||
        /ターボ|TURBO|GT|GR|タイプR|TYPER/.test(
          searchText
        )
      );

    case "燃費が良い":
      return (
        keys.includes(
          "EV・HV"
        ) ||
        keys.includes(
          "軽自動車"
        ) ||
        keys.includes(
          "コンパクトカー"
        )
      );

    case "高級感":
      return isLuxuryVehicle(
        maker,
        searchText
      );

    case "かっこいい":
      return (
        keys.includes("SUV") ||
        keys.includes(
          "スポーティ"
        ) ||
        isLuxuryVehicle(
          maker,
          searchText
        )
      );

    case "スポーティ":
      return (
        keys.includes(
          "スポーティ"
        ) ||
        /ターボ|TURBO|GT|GR|タイプR|TYPER|ロードスター|BRZ/.test(
          searchText
        )
      );

    case "かわいい":
      return /ラパン|キャスト|NONE|ミラココア|ムーヴキャンバス|フィアット500/.test(
        searchText
      );

    case "アウトドア系":
      return (
        keys.includes("SUV") ||
        keys.includes(
          "バン・トラック"
        ) ||
        /4WD|AWD|四駆|ジムニー|デリカ/.test(
          searchText
        )
      );

    case "カスタム系":
      return includesNormalized(
        searchText,
        "カスタム"
      );

    case "ノーマル系":
      return !includesNormalized(
        searchText,
        "カスタム"
      );

    case "シンプル":
      return (
        !includesNormalized(
          searchText,
          "カスタム"
        ) &&
        !keys.includes(
          "スポーティ"
        )
      );

    default:
      return false;
  }
}

function desiredConditionScore(
  condition
) {
  if (
    [
      "スライドドア",
      "運転しやすい",
      "乗り心地が良い",
    ].includes(condition)
  ) {
    return 16;
  }

  if (
    [
      "室内が広い",
      "静粛性が高い",
    ].includes(condition)
  ) {
    return 14;
  }

  if (
    [
      "安全性能",
      "4WD",
      "荷室が広い",
      "加速・走り",
    ].includes(condition)
  ) {
    return 12;
  }

  return 10;
}

function vehicleTypeKeys(
  vehicle
) {
  return unique(
    [
      ...(vehicle.types || []),
      ...(vehicle.typeKeys || []),
    ].map(normalizeType)
  );
}

function vehicleSearchText(
  vehicle
) {
  return normalizeText(
    [
      vehicle.maker,
      vehicle.brand,
      vehicle.title,
      vehicle.description,
      vehicle.carName,
      vehicle.gradeName,
      vehicle.gradeExtraInfo,
      vehicle.classificationName,
      vehicle.displacement,
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function inferSeatCapacity(
  vehicle,
  keys = vehicleTypeKeys(vehicle)
) {
  const explicitValues = [
    vehicle.seatCapacity,
    vehicle.capacity,
    vehicle.ridingCapacity,
    vehicle.passengerCapacity,
    vehicle.maxSeats,
    vehicle.seats,
  ];

  for (
    const value of explicitValues
  ) {
    const number = Number(
      String(value || "")
        .match(/\d+/)?.[0] || 0
    );

    if (
      number >= 1 &&
      number <= 30
    ) {
      return number;
    }
  }

  const rawText = [
    vehicle.title,
    vehicle.description,
    vehicle.carName,
    vehicle.gradeName,
    vehicle.gradeExtraInfo,
    vehicle.classificationName,
  ]
    .filter(Boolean)
    .join(" ");

  const explicitMatch =
    rawText.match(
      /(\d{1,2})\s*(?:人乗り|名乗り|乗車定員)/
    );

  if (explicitMatch) {
    return Number(
      explicitMatch[1]
    );
  }

  const text =
    normalizeText(rawText);

  if (
    keys.includes(
      "軽自動車"
    ) &&
    keys.includes(
      "トラック"
    )
  ) {
    return 2;
  }

  if (
    /コペン|ロードスター|BRZ|GR86|S660/.test(
      text
    )
  ) {
    return 2;
  }

  if (
    keys.includes(
      "軽自動車"
    )
  ) {
    return 4;
  }

  if (
    /シエンタ|フリード/.test(
      text
    )
  ) {
    return 6;
  }

  if (
    keys.includes(
      "ミニバン"
    )
  ) {
    return 7;
  }

  if (
    keys.includes(
      "バン・トラック"
    )
  ) {
    return 2;
  }

  if (
    keys.includes(
      "普通車"
    )
  ) {
    return 5;
  }

  return 0;
}

function detectMaker(vehicle) {
  const directMaker =
    String(
      vehicle.maker ||
        vehicle.brand ||
        ""
    ).trim();

  if (directMaker) {
    return canonicalMaker(
      directMaker
    );
  }

  const carName =
    normalizeText(
      vehicle.carName ||
        vehicle.title ||
        ""
    );

  const searchText =
    vehicleSearchText(vehicle);

  if (
    LEXUS_MODEL_CODES.some(
      (code) =>
        carName === code ||
        carName.startsWith(code)
    )
  ) {
    return "レクサス";
  }

  for (
    const [model, maker] of
    Object.entries(
      MODEL_TO_MAKER
    )
  ) {
    if (
      searchText.includes(
        normalizeText(model)
      )
    ) {
      return maker;
    }
  }

  for (
    const [maker, aliases] of
    Object.entries(
      MAKER_ALIASES
    )
  ) {
    if (
      aliases.some((alias) =>
        searchText.includes(
          normalizeText(alias)
        )
      )
    ) {
      return maker;
    }
  }

  return "";
}

function canonicalMaker(value) {
  for (
    const [maker, aliases] of
    Object.entries(
      MAKER_ALIASES
    )
  ) {
    if (
      includesNormalized(
        maker,
        value
      ) ||
      aliases.some((alias) =>
        includesNormalized(
          alias,
          value
        )
      )
    ) {
      return maker;
    }
  }

  return value;
}

function expandMakerTokens(
  tokens
) {
  const expanded = [];

  for (
    const token of tokens || []
  ) {
    expanded.push(token);

    for (
      const [maker, aliases] of
      Object.entries(
        MAKER_ALIASES
      )
    ) {
      const matched =
        includesNormalized(
          maker,
          token
        ) ||
        aliases.some((alias) =>
          includesNormalized(
            alias,
            token
          )
        );

      if (matched) {
        expanded.push(
          maker,
          ...aliases
        );
      }
    }
  }

  return unique(expanded);
}

function isLuxuryVehicle(
  maker,
  searchText
) {
  return (
    maker === "レクサス" ||
    maker ===
      "メルセデスベンツ" ||
    maker === "BMW" ||
    maker === "アウディ" ||
    maker === "ボルボ" ||
    /クラウン|アルファード|ヴェルファイア|エルグランド/.test(
      searchText
    )
  );
}

function isLargeVehicleText(
  searchText
) {
  return /アルファード|ヴェルファイア|ランドクルーザー|ハイエース|キャラバン|エルグランド|デリカD5|CX8/.test(
    searchText
  );
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFKC")
    .toUpperCase()
    .replace(
      /[\s　・･―‐\-_/／,，.。()（）【】\[\]「」『』]/g,
      ""
    );
}

function includesNormalized(
  source,
  target
) {
  const normalizedSource =
    normalizeText(source);

  const normalizedTarget =
    normalizeText(target);

  if (
    !normalizedSource ||
    !normalizedTarget
  ) {
    return false;
  }

  return (
    normalizedSource.includes(
      normalizedTarget
    ) ||
    normalizedTarget.includes(
      normalizedSource
    )
  );
}

function unique(values) {
  return [
    ...new Set(
      (values || [])
        .filter(Boolean)
    ),
  ];
}

function uniqueByStockId(
  vehicles
) {
  const seen = new Set();
  const result = [];

  for (
    const vehicle of
    vehicles || []
  ) {
    const key =
      vehicle.stockId ||
      `${
        vehicle.carName ||
        vehicle.title
      }|${
        vehicle.totalPrice
      }|${
        vehicle.imageUrl
      }`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(vehicle);
  }

  return result;
}

function makePerfectInventoryMessages(
  results,
  criteria
) {
  if (results.length === 0) {
    return [
      {
        type: "text",
        text:
          "診断条件に合う在庫を探しましたが、現在の在庫には該当車がありませんでした🙇‍♀️\n\n" +
          "在庫にない場合も、全国から条件に合う一台をお探しできます。スタッフへそのままご相談ください😊",
      },
    ];
  }

  const visibleVehicles =
    results.slice(
      0,
      PERFECT_MAX_VEHICLES
    );

  const chunks =
    chunkArray(
      visibleVehicles,
      PERFECT_CAROUSEL_SIZE
    ).slice(0, 4);

  const typeText =
    criteria.desiredTypes.includes(
      "特にこだわりはない"
    )
      ? "タイプ指定なし"
      : criteria.desiredTypes
          .map((type) =>
            type.replace(
              " ",
              "・"
            )
          )
          .join("、");

  const introText =
    `診断条件に近い在庫が${results.length}台見つかりました😊\n\n` +
    `必要人数：${
      criteria.requiredSeats ||
      "指定なし"
    }\n` +
    `希望タイプ：${
      typeText ||
      "指定なし"
    }\n\n` +
    (
      results.length >
      PERFECT_MAX_VEHICLES
        ? `条件との一致度が高い順に、上位${PERFECT_MAX_VEHICLES}台を表示します🚗`
        : "条件との一致度が高い順に表示します🚗"
    );

  return [
    {
      type: "text",
      text: introText,
    },

    ...chunks.map(
      (vehicles, index) => ({
        type: "flex",

        altText:
          `ぴったり診断のおすすめ在庫 ${
            index + 1
          }`,

        contents: {
          type: "carousel",

          contents:
            vehicles.map(
              makeVehicleBubble
            ),
        },
      })
    ),
  ];
}

function chunkArray(
  values,
  size
) {
  const chunks = [];

  for (
    let index = 0;
    index < values.length;
    index += size
  ) {
    chunks.push(
      values.slice(
        index,
        index + size
      )
    );
  }

  return chunks;
}
function isRoughSearchText(
  text
) {
  return (
    text.startsWith(
      "軽自動車 "
    ) ||
    text.startsWith(
      "普通車 "
    )
  );
}

function normalizeType(type) {
  const value =
    String(type || "").trim();

  if (
    value ===
      "こだわりなし" ||
    value ===
      "特にこだわらない"
  ) {
    return "特にこだわりはない";
  }

  if (
    value ===
      "低燃費・ハイブリッド" ||
    value ===
      "低燃費・HV" ||
    value ===
      "ハイブリッド・EV"
  ) {
    return "EV・HV";
  }

  return value;
}

function findVehicles(
  size,
  type
) {
  const vehicles =
    inventory.vehicles || [];

  return uniqueByStockId(
    vehicles
  )
    .filter((vehicle) => {
      const keys =
        vehicleTypeKeys(
          vehicle
        );

      const hasSize =
        keys.includes(size);

      const hasType =
        type ===
        "特にこだわりはない"
          ? (
              keys.includes(
                "特にこだわりはない"
              ) ||
              hasSize
            )
          : keys.includes(type);

      return (
        hasSize &&
        hasType
      );
    })
    .sort((a, b) => {
      const statusA =
        statusPriority(a);

      const statusB =
        statusPriority(b);

      if (
        statusA !== statusB
      ) {
        return (
          statusA - statusB
        );
      }

      return (
        priceNumber(
          b.totalPrice
        ) -
        priceNumber(
          a.totalPrice
        )
      );
    });
}

function statusPriority(
  vehicle
) {
  return (
    vehicle.sourceStatus ===
    "掲載在庫"
      ? 0
      : 1
  );
}

function priceNumber(
  priceText
) {
  if (!priceText) {
    return 0;
  }

  const match =
    String(priceText)
      .replace(/,/g, "")
      .match(/([\d.]+)/);

  return match
    ? Number(match[1])
    : 0;
}

function makeVehiclePageCarouselMessage(
  results,
  size,
  rawType,
  offset
) {
  const pageVehicles =
    results.slice(
      offset,
      offset +
        VEHICLES_PER_PAGE
    );

  const nextOffset =
    offset +
    VEHICLES_PER_PAGE;

  const hasMore =
    nextOffset <
    results.length;

  const contents =
    pageVehicles.map(
      makeVehicleBubble
    );

  if (hasMore) {
    contents.push(
      makeMoreBubble(
        results,
        nextOffset,
        size,
        rawType
      )
    );
  }

  return {
    type: "flex",

    altText:
      `${size}・${rawType}のおすすめ在庫`,

    contents: {
      type: "carousel",
      contents,
    },
  };
}

function makeMoreBubble(
  results,
  nextOffset,
  size,
  rawType
) {
  const remaining =
    results.length -
    nextOffset;

  const previewVehicles =
    results.slice(
      nextOffset,
      nextOffset +
        VEHICLES_PER_PAGE
    );

  const nextCount =
    previewVehicles.length;

  return {
    type: "bubble",
    size: "mega",

    body: {
      type: "box",
      layout: "vertical",
      spacing: "md",
      backgroundColor:
        "#F8F5EF",

      contents: [
        {
          type: "box",
          layout: "vertical",
          backgroundColor:
            "#0B1F3A",
          cornerRadius: "lg",
          paddingAll: "14px",

          contents: [
            {
              type: "text",

              text:
                `他に該当車両が${remaining}台あります😊`,

              weight: "bold",
              size: "lg",
              color: "#FFFFFF",
              align: "center",
              wrap: true,
            },
            {
              type: "text",

              text:
                "次に表示される車はこちらです🚗",

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

          contents:
            makePreviewRows(
              previewVehicles,
              size,
              rawType,
              nextOffset,
              nextCount
            ),
        },
      ],
    },
  };
}

function makePreviewRows(
  vehicles,
  size,
  rawType,
  nextOffset,
  nextCount
) {
  const rows = [];

  for (
    let index = 0;
    index < 8;
    index += 2
  ) {
    rows.push({
      type: "box",
      layout: "horizontal",
      spacing: "sm",

      contents: [
        makePreviewImageBox(
          vehicles[index]
        ),

        makePreviewImageBox(
          vehicles[index + 1]
        ),
      ],
    });
  }

  rows.push({
    type: "box",
    layout: "horizontal",
    spacing: "sm",

    contents: [
      makePreviewImageBox(
        vehicles[8]
      ),

      makePreviewButtonBox(
        size,
        rawType,
        nextOffset,
        nextCount
      ),
    ],
  });

  return rows;
}

function makePreviewImageBox(
  vehicle
) {
  const imageUrl =
    validImageUrl(
      vehicle?.imageUrl
    );

  if (!imageUrl) {
    return {
      type: "box",
      layout: "vertical",
      flex: 1,
      height: "86px",
      backgroundColor:
        "#E5E7EB",
      cornerRadius: "md",
      justifyContent:
        "center",
      alignItems: "center",

      contents: [
        {
          type: "text",
          text: "画像準備中",
          size: "xs",
          color: "#999999",
          align: "center",
        },
      ],
    };
  }

  return {
    type: "box",
    layout: "vertical",
    flex: 1,
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

function makePreviewButtonBox(
  size,
  rawType,
  nextOffset,
  nextCount
) {
  return {
    type: "box",
    layout: "vertical",
    flex: 1,
    height: "86px",
    backgroundColor:
      "#0B1F3A",
    cornerRadius: "md",
    justifyContent:
      "center",
    alignItems: "center",

    action: {
      type: "postback",

      data:
        `more|${size}|${rawType}|${nextOffset}`,

      displayText:
        `次の${nextCount}台を見る`,
    },

    contents: [
      {
        type: "text",

        text:
          `次の${nextCount}台`,

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
      },
    ],
  };
}

function displayStatus(
  vehicle
) {
  if (
    vehicle.sourceStatus ===
    "掲載在庫"
  ) {
    return "展示販売中";
  }

  if (
    vehicle.sourceStatus ===
    "一時保存"
  ) {
    return "販売可・未仕上げ";
  }

  return (
    vehicle.sourceStatus ||
    "-"
  );
}
function makeVehicleBubble(
  vehicle
) {
  const imageUrl =
    validImageUrl(
      vehicle.imageUrl
    );

  const isPublicVehicle =
    vehicle.sourceStatus ===
    "掲載在庫";

  const gooUrl =
    isPublicVehicle
      ? validUrl(
          vehicle.gooUrl
        )
      : "";

  const detailContents = [
    {
      type: "text",

      text:
        `年式：${
          vehicle.year ||
          "-"
        }`,

      size: "sm",
      color: "#555555",
    },
    {
      type: "text",

      text:
        `走行距離：${
          vehicle.mileage ||
          "-"
        }`,

      size: "sm",
      color: "#555555",
    },
    {
      type: "text",

      text:
        `色：${
          vehicle.color ||
          "-"
        }`,

      size: "sm",
      color: "#555555",
      wrap: true,
    },
    {
      type: "text",

      text:
        `状態：${displayStatus(
          vehicle
        )}`,

      size: "sm",
      color: "#555555",
    },
  ];

  if (
    vehicle.inferredSeatCapacity
  ) {
    detailContents.push({
      type: "text",

      text:
        `乗車人数目安：${vehicle.inferredSeatCapacity}人`,

      size: "sm",
      color: "#555555",
    });
  }

  if (!isPublicVehicle) {
    detailContents.push({
      type: "text",

      text:
        "✨ 仕上げ・掲載準備中",

      size: "sm",
      color: "#D97706",
      wrap: true,
    });
  }

  const bodyContents = [
    {
      type: "text",

      text:
        vehicle.carName ||
        vehicle.title ||
        "車両情報",

      weight: "bold",
      size: "xl",
      wrap: true,
    },
    {
      type: "text",

      text:
        vehicle.gradeName ||
        vehicle.description ||
        "",

      size: "sm",
      color: "#555555",
      wrap: true,
    },
  ];

  if (
    vehicle
      .inventoryMatchReasons
      ?.length
  ) {
    bodyContents.push({
      type: "text",

      text:
        `条件一致：${vehicle.inventoryMatchReasons.join(
          "・"
        )}`,

      size: "sm",
      color: "#0B1F3A",
      weight: "bold",
      wrap: true,
    });
  }

  if (
    vehicle.gradeExtraInfo
  ) {
    bodyContents.push({
      type: "text",

      text:
        vehicle.gradeExtraInfo,

      size: "sm",
      color: "#333333",
      wrap: true,
    });
  }

  bodyContents.push(
    {
      type: "box",
      layout: "vertical",
      spacing: "xs",

      contents: [
        {
          type: "text",

          text:
            `車両本体価格 ${
              vehicle.bodyPrice ||
              "お問い合わせ"
            }`,

          size: "sm",
          color: "#555555",
          wrap: true,
        },
        {
          type: "text",

          text:
            `支払総額 ${
              vehicle.totalPrice ||
              "お問い合わせ"
            }`,

          weight: "bold",
          size: "lg",
          color: "#D97706",
          wrap: true,
        },
      ],
    },
    {
      type: "box",
      layout: "vertical",
      spacing: "xs",
      contents:
        detailContents,
    }
  );

  const bubble = {
    type: "bubble",
    size: "mega",

    body: {
      type: "box",
      layout: "vertical",
      spacing: "md",
      contents: bodyContents,
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

            label:
              "この車について相談する",

            text:
              `この車について相談したい：${
                vehicle.carName ||
                vehicle.title
              }`,
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

  if (gooUrl) {
    bubble.footer.contents.unshift({
      type: "button",
      style: "secondary",

      action: {
        type: "uri",
        label: "詳細を見る",
        uri: gooUrl,
      },
    });
  }

  return bubble;
}

function validImageUrl(url) {
  if (!url) return "";

  const text =
    String(url);

  return text.startsWith(
    "https://"
  )
    ? text
    : "";
}

function validUrl(url) {
  if (!url) return "";

  const text =
    String(url);

  return (
    text.startsWith(
      "https://"
    ) ||
    text.startsWith(
      "http://"
    )
  )
    ? text
    : "";
}

async function replyMessage(
  replyToken,
  messages
) {
  const res = await fetch(
    "https://api.line.me/v2/bot/message/reply",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",

        Authorization:
          `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
      },

      body: JSON.stringify({
        replyToken,
        messages,
      }),
    }
  );

  const result =
    await res.text();

  console.log(
    "REPLY_STATUS:",
    res.status
  );

  console.log(
    "REPLY_RESULT:",
    result
  );
}

async function linkRichMenu(
  userId,
  richMenuId
) {
  if (!userId) return;

  const res = await fetch(
    `https://api.line.me/v2/bot/user/${userId}/richmenu/${richMenuId}`,
    {
      method: "POST",

      headers: {
        Authorization:
          `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
      },
    }
  );

  const result =
    await res.text();

  console.log(
    "LINK_RICH_MENU_STATUS:",
    res.status
  );

  console.log(
    "LINK_RICH_MENU_RESULT:",
    result
  );
}
