/**
 * ==========================================================
 * 車種辞書
 * ==========================================================
 *
 * 対象：
 * - 日本メーカー
 * - 日本で流通の多い欧州・アメリカメーカー
 *
 * 対象外：
 * - 中国メーカー
 * - 韓国メーカー
 *
 * カスタム、スポーツ、クロスなどが独立車種ではない場合は、
 * 元の車種のaliasesへ含める。
 */

const DICTIONARY_TYPE = "model";

const unique = (values) => {
  return [
    ...new Set(
      values
        .filter(
          (value) =>
            typeof value === "string"
        )
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ];
};

const defineModel = (
  id,
  name,
  nameEn,
  aliases,
  bodyTypes,
  status = "current",
  priority = 100,
) => ({
  id,
  name,
  nameEn,
  aliases,
  bodyTypes,
  status,
  priority,
});

const createModelEntry = ({
  id,
  name,
  nameEn,
  aliases = [],
  makerId,
  brandId = null,
  bodyTypes = [],
  status = "current",
  priority = 100,
}) => {
  const keywords = unique([
    name,
    nameEn,
    ...aliases,
  ]);

  return Object.freeze({
    id,
    type: DICTIONARY_TYPE,
    name,
    nameEn,
    aliases: unique(aliases),
    keywords,

    parent: brandId || makerId,
    category:
      bodyTypes[0] || "unknown",

    tags: unique([
      ...bodyTypes,
      status,
      `maker:${makerId}`,
      brandId
        ? `brand:${brandId}`
        : null,
    ]),

    priority,
    makerId,
    brandId,
    bodyTypes: unique(bodyTypes),
    status,
  });
};

const modelGroups = [
  // ========================================================
  // トヨタ
  // ========================================================

  {
    makerId: "toyota",
    brandId: null,

    models: [
      defineModel(
        "toyota-aqua",
        "アクア",
        "Aqua",
        ["AQUA"],
        ["compact", "hatchback", "hybrid"],
        "current",
        10,
      ),

      defineModel(
        "toyota-prius",
        "プリウス",
        "Prius",
        [
          "PRIUS",
          "プリウスPHV",
          "PRIUS PHV",
          "プリウスPHEV",
          "PRIUS PHEV",
        ],
        ["hatchback", "sedan", "hybrid"],
        "current",
        10,
      ),

      defineModel(
        "toyota-prius-alpha",
        "プリウスα",
        "Prius Alpha",
        [
          "PRIUS ALPHA",
          "プリウスアルファ",
          "プリウスA",
          "プリウスα",
        ],
        ["wagon", "minivan", "hybrid"],
        "legacy",
        15,
      ),

      defineModel(
        "toyota-yaris",
        "ヤリス",
        "Yaris",
        ["YARIS"],
        ["compact", "hatchback"],
        "current",
        10,
      ),

      defineModel(
        "toyota-yaris-cross",
        "ヤリスクロス",
        "Yaris Cross",
        [
          "YARIS CROSS",
          "ヤリス クロス",
        ],
        ["suv", "compact"],
        "current",
        10,
      ),

      defineModel(
        "toyota-vitz",
        "ヴィッツ",
        "Vitz",
        [
          "VITZ",
          "ビッツ",
        ],
        ["compact", "hatchback"],
        "legacy",
        15,
      ),

      defineModel(
        "toyota-passo",
        "パッソ",
        "Passo",
        [
          "PASSO",
          "パッソモーダ",
          "PASSO MODA",
        ],
        ["compact", "hatchback"],
        "current",
        15,
      ),

      defineModel(
        "toyota-corolla",
        "カローラ",
        "Corolla",
        [
          "COROLLA",
          "カローラアクシオ",
          "COROLLA AXIO",
          "アクシオ",
        ],
        ["sedan"],
        "current",
        15,
      ),

      defineModel(
        "toyota-corolla-sport",
        "カローラスポーツ",
        "Corolla Sport",
        [
          "COROLLA SPORT",
          "カローラ スポーツ",
        ],
        ["hatchback"],
        "current",
        10,
      ),

      defineModel(
        "toyota-corolla-touring",
        "カローラツーリング",
        "Corolla Touring",
        [
          "COROLLA TOURING",
          "カローラ ツーリング",
          "カローラフィールダー",
          "COROLLA FIELDER",
          "フィールダー",
        ],
        ["wagon"],
        "current",
        10,
      ),

      defineModel(
        "toyota-corolla-cross",
        "カローラクロス",
        "Corolla Cross",
        [
          "COROLLA CROSS",
          "カローラ クロス",
        ],
        ["suv"],
        "current",
        10,
      ),

      defineModel(
        "toyota-roomy",
        "ルーミー",
        "Roomy",
        [
          "ROOMY",
          "ルーミーカスタム",
          "ROOMY CUSTOM",
        ],
        ["compact", "tall-wagon"],
        "current",
        10,
      ),

      defineModel(
        "toyota-tank",
        "タンク",
        "Tank",
        [
          "TANK",
          "タンクカスタム",
          "TANK CUSTOM",
        ],
        ["compact", "tall-wagon"],
        "legacy",
        15,
      ),

      defineModel(
        "toyota-porte",
        "ポルテ",
        "Porte",
        ["PORTE"],
        ["compact", "tall-wagon"],
        "legacy",
        20,
      ),

      defineModel(
        "toyota-spade",
        "スペイド",
        "Spade",
        ["SPADE"],
        ["compact", "tall-wagon"],
        "legacy",
        20,
      ),

      defineModel(
        "toyota-bb",
        "bB",
        "Toyota bB",
        [
          "BB",
          "B B",
          "トヨタBB",
          "トヨタbB",
        ],
        ["compact", "tall-wagon"],
        "legacy",
        20,
      ),

      defineModel(
        "toyota-raize",
        "ライズ",
        "Raize",
        ["RAIZE"],
        ["suv", "compact"],
        "current",
        10,
      ),

      defineModel(
        "toyota-chr",
        "C-HR",
        "Toyota C-HR",
        [
          "CHR",
          "C HR",
          "シーエイチアール",
          "トヨタC-HR",
        ],
        ["suv"],
        "current",
        10,
      ),

      defineModel(
        "toyota-harrier",
        "ハリアー",
        "Harrier",
        [
          "HARRIER",
          "ハリアーハイブリッド",
          "HARRIER HYBRID",
          "ハリアーPHEV",
        ],
        ["suv"],
        "current",
        10,
      ),

      defineModel(
        "toyota-rav4",
        "RAV4",
        "Toyota RAV4",
        [
          "RAV 4",
          "ラブフォー",
          "ラヴフォー",
          "トヨタRAV4",
          "RAV4 PHV",
          "RAV4 PHEV",
        ],
        ["suv"],
        "current",
        10,
      ),

      defineModel(
        "toyota-kluger",
        "クルーガー",
        "Kluger",
        [
          "KLUGER",
          "クルーガーハイブリッド",
        ],
        ["suv"],
        "legacy",
        15,
      ),

      defineModel(
        "toyota-land-cruiser",
        "ランドクルーザー",
        "Land Cruiser",
        [
          "LAND CRUISER",
          "LANDCRUISER",
          "ランクル",
          "ランドクルーザー300",
          "ランクル300",
          "LC300",
        ],
        ["suv", "off-road"],
        "current",
        10,
      ),

      defineModel(
        "toyota-land-cruiser-prado",
        "ランドクルーザープラド",
        "Land Cruiser Prado",
        [
          "LAND CRUISER PRADO",
          "LANDCRUISER PRADO",
          "ランドクルーザー プラド",
          "ランクルプラド",
          "プラド",
          "LC150",
        ],
        ["suv", "off-road"],
        "legacy",
        10,
      ),

      defineModel(
        "toyota-land-cruiser-250",
        "ランドクルーザー250",
        "Land Cruiser 250",
        [
          "LAND CRUISER 250",
          "LANDCRUISER 250",
          "ランクル250",
          "LC250",
        ],
        ["suv", "off-road"],
        "current",
        10,
      ),

      defineModel(
        "toyota-land-cruiser-70",
        "ランドクルーザー70",
        "Land Cruiser 70",
        [
          "LAND CRUISER 70",
          "LANDCRUISER 70",
          "ランクル70",
          "ナナマル",
          "LC70",
        ],
        ["suv", "off-road"],
        "current",
        15,
      ),

      defineModel(
        "toyota-fj-cruiser",
        "FJクルーザー",
        "FJ Cruiser",
        [
          "FJ CRUISER",
          "FJCRUISER",
          "エフジェイクルーザー",
        ],
        ["suv", "off-road"],
        "legacy",
        15,
      ),

      defineModel(
        "toyota-sienta",
        "シエンタ",
        "Sienta",
        ["SIENTA"],
        ["minivan", "compact"],
        "current",
        10,
      ),

      defineModel(
        "toyota-noah",
        "ノア",
        "Noah",
        [
          "NOAH",
          "ノアハイブリッド",
          "ノアS-Z",
          "NOAH SZ",
        ],
        ["minivan"],
        "current",
        10,
      ),

      defineModel(
        "toyota-voxy",
        "ヴォクシー",
        "Voxy",
        [
          "VOXY",
          "ボクシー",
          "ヴォクシーハイブリッド",
          "VOXY HYBRID",
        ],
        ["minivan"],
        "current",
        10,
      ),

      defineModel(
        "toyota-esquire",
        "エスクァイア",
        "Esquire",
        [
          "ESQUIRE",
          "エスクワイア",
        ],
        ["minivan"],
        "legacy",
        15,
      ),

      defineModel(
        "toyota-alphard",
        "アルファード",
        "Alphard",
        [
          "ALPHARD",
          "アルファードハイブリッド",
          "ALPHARD HYBRID",
          "アルファードエグゼクティブラウンジ",
          "エグゼクティブラウンジ",
        ],
        ["minivan", "luxury"],
        "current",
        10,
      ),

      defineModel(
        "toyota-vellfire",
        "ヴェルファイア",
        "Vellfire",
        [
          "VELLFIRE",
          "ベルファイア",
          "ヴェルファイアハイブリッド",
          "VELLFIRE HYBRID",
        ],
        ["minivan", "luxury"],
        "current",
        10,
      ),

      defineModel(
        "toyota-estima",
        "エスティマ",
        "Estima",
        [
          "ESTIMA",
          "エスティマハイブリッド",
          "ESTIMA HYBRID",
        ],
        ["minivan"],
        "legacy",
        15,
      ),

      defineModel(
        "toyota-wish",
        "ウィッシュ",
        "Wish",
        [
          "WISH",
          "ウイッシュ",
        ],
        ["minivan", "wagon"],
        "legacy",
        20,
      ),

      defineModel(
        "toyota-isis",
        "アイシス",
        "Isis",
        ["ISIS"],
        ["minivan"],
        "legacy",
        20,
      ),

      defineModel(
        "toyota-crown",
        "クラウン",
        "Crown",
        [
          "CROWN",
          "クラウンアスリート",
          "CROWN ATHLETE",
          "クラウンロイヤル",
          "CROWN ROYAL",
          "クラウンマジェスタ",
          "CROWN MAJESTA",
          "クラウンハイブリッド",
        ],
        ["sedan", "luxury"],
        "current",
        10,
      ),

      defineModel(
        "toyota-crown-crossover",
        "クラウンクロスオーバー",
        "Crown Crossover",
        [
          "CROWN CROSSOVER",
          "クラウン クロスオーバー",
        ],
        ["sedan", "suv"],
        "current",
        10,
      ),

      defineModel(
        "toyota-crown-sport",
        "クラウンスポーツ",
        "Crown Sport",
        [
          "CROWN SPORT",
          "クラウン スポーツ",
        ],
        ["suv"],
        "current",
        10,
      ),

      defineModel(
        "toyota-crown-estate",
        "クラウンエステート",
        "Crown Estate",
        [
          "CROWN ESTATE",
          "クラウン エステート",
        ],
        ["suv", "wagon"],
        "current",
        10,
      ),

      defineModel(
        "toyota-camry",
        "カムリ",
        "Camry",
        [
          "CAMRY",
          "カムリハイブリッド",
        ],
        ["sedan"],
        "legacy",
        15,
      ),

      defineModel(
        "toyota-mark-x",
        "マークX",
        "Mark X",
        [
          "MARK X",
          "MARKX",
          "マークエックス",
        ],
        ["sedan"],
        "legacy",
        15,
      ),

      defineModel(
        "toyota-century",
        "センチュリー",
        "Century",
        ["CENTURY"],
        ["sedan", "luxury"],
        "current",
        20,
      ),

      defineModel(
        "toyota-86",
        "86",
        "Toyota 86",
        [
          "ハチロク",
          "TOYOTA 86",
          "トヨタ86",
        ],
        ["coupe", "sports"],
        "legacy",
        15,
      ),

      defineModel(
        "toyota-gr86",
        "GR86",
        "Toyota GR86",
        [
          "GR 86",
          "GRハチロク",
          "ジーアール86",
          "トヨタGR86",
        ],
        ["coupe", "sports"],
        "current",
        10,
      ),

      defineModel(
        "toyota-supra",
        "スープラ",
        "Supra",
        [
          "SUPRA",
          "GRスープラ",
          "GR SUPRA",
        ],
        ["coupe", "sports"],
        "current",
        10,
      ),

      defineModel(
        "toyota-probox",
        "プロボックス",
        "Probox",
        [
          "PROBOX",
          "プロボックスバン",
        ],
        ["wagon", "commercial-van"],
        "current",
        15,
      ),

      defineModel(
        "toyota-succeed",
        "サクシード",
        "Succeed",
        [
          "SUCCEED",
          "サクシードバン",
        ],
        ["wagon", "commercial-van"],
        "legacy",
        20,
      ),

      defineModel(
        "toyota-hiace",
        "ハイエース",
        "Hiace",
        [
          "HIACE",
          "ハイエースバン",
          "ハイエースワゴン",
          "ハイエースコミューター",
          "200系ハイエース",
        ],
        ["commercial-van", "minivan"],
        "current",
        10,
      ),

      defineModel(
        "toyota-regiusace",
        "レジアスエース",
        "RegiusAce",
        [
          "REGIUSACE",
          "REGIUS ACE",
          "レジアスエースバン",
        ],
        ["commercial-van"],
        "legacy",
        20,
      ),

      defineModel(
        "toyota-townace",
        "タウンエース",
        "TownAce",
        [
          "TOWNACE",
          "TOWN ACE",
          "タウンエースバン",
          "タウンエーストラック",
        ],
        ["commercial-van", "truck"],
        "current",
        20,
      ),

      defineModel(
        "toyota-pixis-epoch",
        "ピクシスエポック",
        "Pixis Epoch",
        [
          "PIXIS EPOCH",
          "ピクシス エポック",
        ],
        ["kei", "hatchback"],
        "current",
        20,
      ),

      defineModel(
        "toyota-pixis-mega",
        "ピクシスメガ",
        "Pixis Mega",
        [
          "PIXIS MEGA",
          "ピクシス メガ",
        ],
        ["kei", "tall-wagon"],
        "legacy",
        20,
      ),

      defineModel(
        "toyota-pixis-joy",
        "ピクシスジョイ",
        "Pixis Joy",
        [
          "PIXIS JOY",
          "ピクシス ジョイ",
        ],
        ["kei", "hatchback"],
        "legacy",
        25,
      ),

      defineModel(
        "toyota-pixis-van",
        "ピクシスバン",
        "Pixis Van",
        [
          "PIXIS VAN",
          "ピクシス バン",
        ],
        ["kei", "commercial-van"],
        "current",
        20,
      ),

      defineModel(
        "toyota-pixis-truck",
        "ピクシストラック",
        "Pixis Truck",
        [
          "PIXIS TRUCK",
          "ピクシス トラック",
        ],
        ["kei", "truck"],
        "current",
        20,
      ),
    ],
  },

  // ========================================================
  // レクサス
  // ========================================================

  {
    makerId: "toyota",
    brandId: "lexus",

    models: [
      defineModel(
        "lexus-lbx",
        "LBX",
        "Lexus LBX",
        [
          "レクサスLBX",
          "LEXUS LBX",
        ],
        ["suv", "compact", "luxury"],
        "current",
        10,
      ),

      defineModel(
        "lexus-ux",
        "UX",
        "Lexus UX",
        [
          "レクサスUX",
          "LEXUS UX",
          "UX250H",
          "UX300H",
          "UX300E",
        ],
        ["suv", "compact", "luxury"],
        "current",
        10,
      ),

      defineModel(
        "lexus-nx",
        "NX",
        "Lexus NX",
        [
          "レクサスNX",
          "LEXUS NX",
          "NX200T",
          "NX250",
          "NX300",
          "NX300H",
          "NX350",
          "NX350H",
          "NX450H",
          "NX450H+",
        ],
        ["suv", "luxury"],
        "current",
        10,
      ),

      defineModel(
        "lexus-rx",
        "RX",
        "Lexus RX",
        [
          "レクサスRX",
          "LEXUS RX",
          "RX200T",
          "RX270",
          "RX300",
          "RX350",
          "RX350H",
          "RX450H",
          "RX450H+",
          "RX500H",
        ],
        ["suv", "luxury"],
        "current",
        10,
      ),

      defineModel(
        "lexus-rz",
        "RZ",
        "Lexus RZ",
        [
          "レクサスRZ",
          "LEXUS RZ",
          "RZ450E",
          "RZ300E",
        ],
        ["suv", "ev", "luxury"],
        "current",
        15,
      ),

      defineModel(
        "lexus-gx",
        "GX",
        "Lexus GX",
        [
          "レクサスGX",
          "LEXUS GX",
          "GX550",
        ],
        ["suv", "off-road", "luxury"],
        "current",
        15,
      ),

      defineModel(
        "lexus-lx",
        "LX",
        "Lexus LX",
        [
          "レクサスLX",
          "LEXUS LX",
          "LX570",
          "LX600",
        ],
        ["suv", "off-road", "luxury"],
        "current",
        10,
      ),

      defineModel(
        "lexus-ct",
        "CT",
        "Lexus CT",
        [
          "レクサスCT",
          "LEXUS CT",
          "CT200H",
        ],
        ["hatchback", "hybrid", "luxury"],
        "legacy",
        15,
      ),

      defineModel(
        "lexus-is",
        "IS",
        "Lexus IS",
        [
          "レクサスIS",
          "LEXUS IS",
          "IS250",
          "IS300",
          "IS300H",
          "IS350",
          "IS500",
        ],
        ["sedan", "luxury"],
        "current",
        10,
      ),

      defineModel(
        "lexus-es",
        "ES",
        "Lexus ES",
        [
          "レクサスES",
          "LEXUS ES",
          "ES300H",
        ],
        ["sedan", "luxury"],
        "current",
        10,
      ),

      defineModel(
        "lexus-gs",
        "GS",
        "Lexus GS",
        [
          "レクサスGS",
          "LEXUS GS",
          "GS250",
          "GS300",
          "GS300H",
          "GS350",
          "GS450H",
          "GS F",
        ],
        ["sedan", "luxury"],
        "legacy",
        15,
      ),

      defineModel(
        "lexus-ls",
        "LS",
        "Lexus LS",
        [
          "レクサスLS",
          "LEXUS LS",
          "LS460",
          "LS500",
          "LS500H",
          "LS600H",
        ],
        ["sedan", "luxury"],
        "current",
        10,
      ),

      defineModel(
        "lexus-hs",
        "HS",
        "Lexus HS",
        [
          "レクサスHS",
          "LEXUS HS",
          "HS250H",
        ],
        ["sedan", "hybrid", "luxury"],
        "legacy",
        20,
      ),

      defineModel(
        "lexus-rc",
        "RC",
        "Lexus RC",
        [
          "レクサスRC",
          "LEXUS RC",
          "RC300",
          "RC300H",
          "RC350",
          "RC F",
        ],
        ["coupe", "luxury"],
        "current",
        15,
      ),

      defineModel(
        "lexus-lc",
        "LC",
        "Lexus LC",
        [
          "レクサスLC",
          "LEXUS LC",
          "LC500",
          "LC500H",
          "LCコンバーチブル",
        ],
        ["coupe", "convertible", "luxury"],
        "current",
        15,
      ),

      defineModel(
        "lexus-lm",
        "LM",
        "Lexus LM",
        [
          "レクサスLM",
          "LEXUS LM",
          "LM500H",
          "LM350",
        ],
        ["minivan", "luxury"],
        "current",
        10,
      ),
    ],
  },

  // ========================================================
  // ホンダ
  // ========================================================

  {
    makerId: "honda",
    brandId: null,

    models: [
      defineModel(
        "honda-n-box",
        "N-BOX",
        "Honda N-BOX",
        [
          "NBOX",
          "N BOX",
          "エヌボックス",
          "N-BOXカスタム",
          "NBOXカスタム",
          "N BOX CUSTOM",
          "N-BOX JOY",
          "NBOXジョイ",
          "N-BOXスラッシュ",
          "NBOXスラッシュ",
        ],
        ["kei", "tall-wagon"],
        "current",
        10,
      ),

      defineModel(
        "honda-n-wgn",
        "N-WGN",
        "Honda N-WGN",
        [
          "NWGN",
          "N WGN",
          "エヌワゴン",
          "N-WGNカスタム",
          "NWGNカスタム",
        ],
        ["kei", "hatchback"],
        "current",
        10,
      ),

      defineModel(
        "honda-n-one",
        "N-ONE",
        "Honda N-ONE",
        [
          "NONE",
          "N ONE",
          "エヌワン",
          "N-ONE RS",
        ],
        ["kei", "hatchback"],
        "current",
        15,
      ),

      defineModel(
        "honda-n-van",
        "N-VAN",
        "Honda N-VAN",
        [
          "NVAN",
          "N VAN",
          "エヌバン",
          "N-VAN E:",
        ],
        ["kei", "commercial-van"],
        "current",
        15,
      ),

      defineModel(
        "honda-life",
        "ライフ",
        "Life",
        [
          "HONDA LIFE",
          "ライフディーバ",
          "LIFE DIVA",
        ],
        ["kei", "hatchback"],
        "legacy",
        15,
      ),

      defineModel(
        "honda-zest",
        "ゼスト",
        "Zest",
        [
          "ZEST",
          "ゼストスパーク",
          "ZEST SPARK",
        ],
        ["kei", "hatchback"],
        "legacy",
        20,
      ),

      defineModel(
        "honda-vamos",
        "バモス",
        "Vamos",
        [
          "VAMOS",
          "バモスホビオ",
          "VAMOS HOBIO",
        ],
        ["kei", "commercial-van"],
        "legacy",
        15,
      ),

      defineModel(
        "honda-acty",
        "アクティ",
        "Acty",
        [
          "ACTY",
          "アクティバン",
          "アクティトラック",
        ],
        ["kei", "commercial-van", "truck"],
        "legacy",
        20,
      ),

      defineModel(
        "honda-fit",
        "フィット",
        "Fit",
        [
          "FIT",
          "フィットハイブリッド",
          "FIT HYBRID",
          "フィットRS",
          "FIT RS",
        ],
        ["compact", "hatchback"],
        "current",
        10,
      ),

      defineModel(
        "honda-shuttle",
        "シャトル",
        "Shuttle",
        [
          "SHUTTLE",
          "フィットシャトル",
          "FIT SHUTTLE",
          "シャトルハイブリッド",
        ],
        ["wagon"],
        "legacy",
        15,
      ),

      defineModel(
        "honda-freed",
        "フリード",
        "Freed",
        [
          "FREED",
          "フリードハイブリッド",
          "FREED HYBRID",
          "フリードプラス",
          "フリード+",
          "FREED+",
          "フリードクロスター",
        ],
        ["minivan", "compact"],
        "current",
        10,
      ),

      defineModel(
        "honda-freed-spike",
        "フリードスパイク",
        "Freed Spike",
        [
          "FREED SPIKE",
          "フリード スパイク",
        ],
        ["minivan", "compact"],
        "legacy",
        20,
      ),

      defineModel(
        "honda-stepwgn",
        "ステップワゴン",
        "Step WGN",
        [
          "STEPWGN",
          "STEP WGN",
          "ステップWGN",
          "ステップワゴンスパーダ",
          "STEP WGN SPADA",
          "ステップワゴンエアー",
          "ステップワゴンAIR",
        ],
        ["minivan"],
        "current",
        10,
      ),

      defineModel(
        "honda-odyssey",
        "オデッセイ",
        "Odyssey",
        [
          "ODYSSEY",
          "オデッセイアブソルート",
          "ODYSSEY ABSOLUTE",
        ],
        ["minivan"],
        "current",
        10,
      ),

      defineModel(
        "honda-vezel",
        "ヴェゼル",
        "Vezel",
        [
          "VEZEL",
          "ベゼル",
          "ヴェゼルハイブリッド",
          "VEZEL E:HEV",
        ],
        ["suv", "compact"],
        "current",
        10,
      ),

      defineModel(
        "honda-zrv",
        "ZR-V",
        "Honda ZR-V",
        [
          "ZRV",
          "ZR V",
          "ゼットアールブイ",
          "ホンダZR-V",
        ],
        ["suv"],
        "current",
        10,
      ),

      defineModel(
        "honda-wrv",
        "WR-V",
        "Honda WR-V",
        [
          "WRV",
          "WR V",
          "ダブリューアールブイ",
          "ホンダWR-V",
        ],
        ["suv", "compact"],
        "current",
        15,
      ),

      defineModel(
        "honda-crv",
        "CR-V",
        "Honda CR-V",
        [
          "CRV",
          "CR V",
          "シーアールブイ",
          "ホンダCR-V",
        ],
        ["suv"],
        "legacy",
        15,
      ),

      defineModel(
        "honda-civic",
        "シビック",
        "Civic",
        [
          "CIVIC",
          "シビックタイプR",
          "CIVIC TYPE R",
          "シビックハッチバック",
          "シビックセダン",
          "シビックE:HEV",
        ],
        ["hatchback", "sedan", "sports"],
        "current",
        10,
      ),

      defineModel(
        "honda-accord",
        "アコード",
        "Accord",
        [
          "ACCORD",
          "アコードハイブリッド",
        ],
        ["sedan"],
        "current",
        15,
      ),

      defineModel(
        "honda-insight",
        "インサイト",
        "Insight",
        [
          "INSIGHT",
          "インサイトエクスクルーシブ",
        ],
        ["sedan", "hatchback", "hybrid"],
        "legacy",
        15,
      ),

      defineModel(
        "honda-crz",
        "CR-Z",
        "Honda CR-Z",
        [
          "CRZ",
          "CR Z",
          "シーアールゼット",
        ],
        ["coupe", "hybrid", "sports"],
        "legacy",
        20,
      ),

      defineModel(
        "honda-integra",
        "インテグラ",
        "Integra",
        [
          "INTEGRA",
          "インテグラタイプR",
          "INTEGRA TYPE R",
        ],
        ["coupe", "sedan", "sports"],
        "legacy",
        20,
      ),

      defineModel(
        "honda-s2000",
        "S2000",
        "Honda S2000",
        [
          "S 2000",
          "エスニセン",
          "ホンダS2000",
        ],
        ["convertible", "sports"],
        "legacy",
        15,
      ),

      defineModel(
        "honda-nsx",
        "NSX",
        "Honda NSX",
        [
          "エヌエスエックス",
          "ホンダNSX",
        ],
        ["coupe", "sports"],
        "legacy",
        15,
      ),
    ],
  },

  // ========================================================
  // 日産
  // ========================================================

  {
    makerId: "nissan",
    brandId: null,

    models: [
      defineModel(
        "nissan-sakura",
        "サクラ",
        "Nissan Sakura",
        [
          "SAKURA",
          "日産サクラ",
        ],
        ["kei", "ev"],
        "current",
        10,
      ),

      defineModel(
        "nissan-dayz",
        "デイズ",
        "Nissan Dayz",
        [
          "DAYZ",
          "デイズハイウェイスター",
          "DAYZ HIGHWAY STAR",
        ],
        ["kei", "hatchback"],
        "current",
        10,
      ),

      defineModel(
        "nissan-dayz-roox",
        "デイズルークス",
        "Nissan Dayz Roox",
        [
          "DAYZ ROOX",
          "デイズ ルークス",
          "デイズルークスハイウェイスター",
        ],
        ["kei", "tall-wagon"],
        "legacy",
        15,
      ),

      defineModel(
        "nissan-roox",
        "ルークス",
        "Nissan Roox",
        [
          "ROOX",
          "ルークスハイウェイスター",
          "ROOX HIGHWAY STAR",
          "ルークスオーテック",
        ],
        ["kei", "tall-wagon"],
        "current",
        10,
      ),

      defineModel(
        "nissan-moco",
        "モコ",
        "Nissan Moco",
        [
          "MOCO",
          "モコドルチェ",
        ],
        ["kei", "hatchback"],
        "legacy",
        15,
      ),

      defineModel(
        "nissan-otti",
        "オッティ",
        "Nissan Otti",
        ["OTTI"],
        ["kei", "hatchback"],
        "legacy",
        20,
      ),

      defineModel(
        "nissan-march",
        "マーチ",
        "Nissan March",
        [
          "MARCH",
          "マーチニスモ",
          "MARCH NISMO",
        ],
        ["compact", "hatchback"],
        "legacy",
        15,
      ),

      defineModel(
        "nissan-note",
        "ノート",
        "Nissan Note",
        [
          "NOTE",
          "ノートe-POWER",
          "NOTE E-POWER",
          "ノートニスモ",
          "NOTE NISMO",
          "ノートオーテック",
        ],
        ["compact", "hatchback"],
        "current",
        10,
      ),

      defineModel(
        "nissan-note-aura",
        "ノートオーラ",
        "Nissan Note Aura",
        [
          "NOTE AURA",
          "オーラ",
          "AURA",
          "日産オーラ",
          "オーラニスモ",
          "AURA NISMO",
        ],
        ["compact", "hatchback"],
        "current",
        10,
      ),

      defineModel(
        "nissan-cube",
        "キューブ",
        "Nissan Cube",
        [
          "CUBE",
          "キューブキュービック",
        ],
        ["compact", "tall-wagon"],
        "legacy",
        15,
      ),

      defineModel(
        "nissan-leaf",
        "リーフ",
        "Nissan Leaf",
        [
          "LEAF",
          "日産リーフ",
          "リーフニスモ",
        ],
        ["hatchback", "ev"],
        "current",
        10,
      ),

      defineModel(
        "nissan-ariya",
        "アリア",
        "Nissan Ariya",
        [
          "ARIYA",
          "日産アリア",
          "アリアニスモ",
        ],
        ["suv", "ev"],
        "current",
        10,
      ),

      defineModel(
        "nissan-kicks",
        "キックス",
        "Nissan Kicks",
        [
          "KICKS",
          "キックスe-POWER",
          "KICKS E-POWER",
        ],
        ["suv", "compact"],
        "current",
        10,
      ),

      defineModel(
        "nissan-juke",
        "ジューク",
        "Nissan Juke",
        [
          "JUKE",
          "ジュークニスモ",
        ],
        ["suv", "compact"],
        "legacy",
        15,
      ),

      defineModel(
        "nissan-x-trail",
        "エクストレイル",
        "Nissan X-Trail",
        [
          "X-TRAIL",
          "XTRAIL",
          "X TRAIL",
          "エクストレイルe-POWER",
          "エクストレイルハイブリッド",
        ],
        ["suv"],
        "current",
        10,
      ),

      defineModel(
        "nissan-dualis",
        "デュアリス",
        "Nissan Dualis",
        ["DUALIS"],
        ["suv", "compact"],
        "legacy",
        20,
      ),

      defineModel(
        "nissan-murano",
        "ムラーノ",
        "Nissan Murano",
        ["MURANO"],
        ["suv"],
        "legacy",
        20,
      ),

      defineModel(
        "nissan-serena",
        "セレナ",
        "Nissan Serena",
        [
          "SERENA",
          "セレナe-POWER",
          "SERENA E-POWER",
          "セレナハイウェイスター",
          "セレナオーテック",
        ],
        ["minivan"],
        "current",
        10,
      ),

      defineModel(
        "nissan-elgrand",
        "エルグランド",
        "Nissan Elgrand",
        [
          "ELGRAND",
          "エルグランドハイウェイスター",
          "エルグランドライダー",
        ],
        ["minivan", "luxury"],
        "current",
        10,
      ),

      defineModel(
        "nissan-lafesta",
        "ラフェスタ",
        "Nissan Lafesta",
        [
          "LAFESTA",
          "ラフェスタハイウェイスター",
        ],
        ["minivan"],
        "legacy",
        20,
      ),

      defineModel(
        "nissan-skyline",
        "スカイライン",
        "Nissan Skyline",
        [
          "SKYLINE",
          "スカイラインGT",
          "スカイラインGT-R",
          "スカイラインハイブリッド",
          "スカイライン400R",
        ],
        ["sedan", "coupe", "sports"],
        "current",
        10,
      ),

      defineModel(
        "nissan-gt-r",
        "GT-R",
        "Nissan GT-R",
        [
          "GTR",
          "GT R",
          "日産GT-R",
          "ニッサンGT-R",
          "R35",
        ],
        ["coupe", "sports"],
        "current",
        10,
      ),

      defineModel(
        "nissan-fairlady-z",
        "フェアレディZ",
        "Nissan Fairlady Z",
        [
          "FAIRLADY Z",
          "フェアレディーZ",
          "FAIRLADYZ",
          "Z34",
          "RZ34",
        ],
        ["coupe", "sports"],
        "current",
        10,
      ),

      defineModel(
        "nissan-fuga",
        "フーガ",
        "Nissan Fuga",
        [
          "FUGA",
          "フーガハイブリッド",
        ],
        ["sedan", "luxury"],
        "legacy",
        15,
      ),

      defineModel(
        "nissan-cima",
        "シーマ",
        "Nissan Cima",
        [
          "CIMA",
          "シーマハイブリッド",
        ],
        ["sedan", "luxury"],
        "legacy",
        20,
      ),

      defineModel(
        "nissan-caravan",
        "キャラバン",
        "Nissan Caravan",
        [
          "CARAVAN",
          "NV350キャラバン",
          "NV350 CARAVAN",
          "キャラバンバン",
        ],
        ["commercial-van"],
        "current",
        10,
      ),

      defineModel(
        "nissan-nv200-vanette",
        "NV200バネット",
        "Nissan NV200 Vanette",
        [
          "NV200 VANETTE",
          "NV200",
          "NV200バネッテ",
        ],
        ["commercial-van", "minivan"],
        "current",
        15,
      ),

      defineModel(
        "nissan-clipper",
        "クリッパー",
        "Nissan Clipper",
        [
          "CLIPPER",
          "NV100クリッパー",
          "NV100 CLIPPER",
          "クリッパーバン",
          "クリッパートラック",
        ],
        ["kei", "commercial-van", "truck"],
        "current",
        15,
      ),

      defineModel(
        "nissan-clipper-rio",
        "クリッパーリオ",
        "Nissan Clipper Rio",
        [
          "CLIPPER RIO",
          "NV100クリッパーリオ",
          "NV100 CLIPPER RIO",
        ],
        ["kei", "tall-wagon"],
        "current",
        15,
      ),
    ],
  },

  // ========================================================
  // 三菱
  // ========================================================

  {
    makerId: "mitsubishi-motors",
    brandId: null,

    models: [
      defineModel(
        "mitsubishi-ek-wagon",
        "eKワゴン",
        "Mitsubishi eK Wagon",
        [
          "EKワゴン",
          "EK WAGON",
          "イーケーワゴン",
        ],
        ["kei", "hatchback"],
        "current",
        10,
      ),

      defineModel(
        "mitsubishi-ek-space",
        "eKスペース",
        "Mitsubishi eK Space",
        [
          "EKスペース",
          "EK SPACE",
          "イーケースペース",
          "EKスペースカスタム",
        ],
        ["kei", "tall-wagon"],
        "current",
        10,
      ),

      defineModel(
        "mitsubishi-ek-cross",
        "eKクロス",
        "Mitsubishi eK X",
        [
          "EKクロス",
          "EK X",
          "イーケークロス",
        ],
        ["kei", "suv"],
        "current",
        10,
      ),

      defineModel(
        "mitsubishi-ek-cross-space",
        "eKクロススペース",
        "Mitsubishi eK X Space",
        [
          "EKクロススペース",
          "EK X SPACE",
          "イーケークロススペース",
        ],
        ["kei", "tall-wagon", "suv"],
        "legacy",
        15,
      ),

      defineModel(
        "mitsubishi-delica-mini",
        "デリカミニ",
        "Mitsubishi Delica Mini",
        [
          "DELICA MINI",
          "デリカ ミニ",
        ],
        ["kei", "tall-wagon", "suv"],
        "current",
        10,
      ),

      defineModel(
        "mitsubishi-delica-d5",
        "デリカD:5",
        "Mitsubishi Delica D:5",
        [
          "デリカD5",
          "DELICA D:5",
          "DELICA D5",
          "デリカ ディーファイブ",
        ],
        ["minivan", "suv"],
        "current",
        10,
      ),

      defineModel(
        "mitsubishi-delica-d2",
        "デリカD:2",
        "Mitsubishi Delica D:2",
        [
          "デリカD2",
          "DELICA D:2",
          "DELICA D2",
        ],
        ["compact", "tall-wagon"],
        "current",
        15,
      ),

      defineModel(
        "mitsubishi-outlander",
        "アウトランダー",
        "Mitsubishi Outlander",
        [
          "OUTLANDER",
          "アウトランダーPHEV",
          "OUTLANDER PHEV",
        ],
        ["suv", "plug-in-hybrid"],
        "current",
        10,
      ),

      defineModel(
        "mitsubishi-eclipse-cross",
        "エクリプスクロス",
        "Mitsubishi Eclipse Cross",
        [
          "ECLIPSE CROSS",
          "エクリプス クロス",
          "エクリプスクロスPHEV",
        ],
        ["suv"],
        "current",
        10,
      ),

      defineModel(
        "mitsubishi-rvr",
        "RVR",
        "Mitsubishi RVR",
        [
          "アールブイアール",
          "三菱RVR",
        ],
        ["suv", "compact"],
        "current",
        15,
      ),

      defineModel(
        "mitsubishi-pajero",
        "パジェロ",
        "Mitsubishi Pajero",
        [
          "PAJERO",
          "パジェロロング",
          "パジェロショート",
        ],
        ["suv", "off-road"],
        "legacy",
        10,
      ),

      defineModel(
        "mitsubishi-pajero-mini",
        "パジェロミニ",
        "Mitsubishi Pajero Mini",
        [
          "PAJERO MINI",
          "パジェロ ミニ",
        ],
        ["kei", "suv", "off-road"],
        "legacy",
        10,
      ),

      defineModel(
        "mitsubishi-triton",
        "トライトン",
        "Mitsubishi Triton",
        ["TRITON"],
        ["truck", "off-road"],
        "current",
        15,
      ),

      defineModel(
        "mitsubishi-lancer-evolution",
        "ランサーエボリューション",
        "Mitsubishi Lancer Evolution",
        [
          "LANCER EVOLUTION",
          "ランエボ",
          "ランサーエボ",
          "LANCER EVO",
          "エボ10",
          "エボX",
        ],
        ["sedan", "sports"],
        "legacy",
        15,
      ),

      defineModel(
        "mitsubishi-colt",
        "コルト",
        "Mitsubishi Colt",
        [
          "COLT",
          "コルトラリーアート",
          "コルトプラス",
        ],
        ["compact", "hatchback"],
        "legacy",
        20,
      ),

      defineModel(
        "mitsubishi-mirage",
        "ミラージュ",
        "Mitsubishi Mirage",
        ["MIRAGE"],
        ["compact", "hatchback"],
        "current",
        20,
      ),

      defineModel(
        "mitsubishi-minicab",
        "ミニキャブ",
        "Mitsubishi Minicab",
        [
          "MINICAB",
          "ミニキャブバン",
          "ミニキャブトラック",
          "ミニキャブミーブ",
          "MINICAB MIEV",
        ],
        ["kei", "commercial-van", "truck", "ev"],
        "current",
        20,
      ),

      defineModel(
        "mitsubishi-town-box",
        "タウンボックス",
        "Mitsubishi Town Box",
        [
          "TOWN BOX",
          "タウン ボックス",
        ],
        ["kei", "tall-wagon"],
        "current",
        20,
      ),
    ],
  },

  // ========================================================
  // SUBARU
  // ========================================================

  {
    makerId: "subaru",
    brandId: null,

    models: [
      defineModel(
        "subaru-stella",
        "ステラ",
        "Subaru Stella",
        [
          "STELLA",
          "ステラカスタム",
        ],
        ["kei", "hatchback"],
        "current",
        10,
      ),

      defineModel(
        "subaru-pleo",
        "プレオ",
        "Subaru Pleo",
        [
          "PLEO",
          "プレオプラス",
          "PLEO PLUS",
        ],
        ["kei", "hatchback"],
        "current",
        15,
      ),

      defineModel(
        "subaru-sambar",
        "サンバー",
        "Subaru Sambar",
        [
          "SAMBAR",
          "サンバーバン",
          "サンバートラック",
          "サンバーディアス",
        ],
        ["kei", "commercial-van", "truck"],
        "current",
        10,
      ),

      defineModel(
        "subaru-chiffon",
        "シフォン",
        "Subaru Chiffon",
        [
          "CHIFFON",
          "シフォンカスタム",
        ],
        ["kei", "tall-wagon"],
        "current",
        15,
      ),

      defineModel(
        "subaru-justy",
        "ジャスティ",
        "Subaru Justy",
        [
          "JUSTY",
          "ジャスティカスタム",
        ],
        ["compact", "tall-wagon"],
        "current",
        20,
      ),

      defineModel(
        "subaru-impreza",
        "インプレッサ",
        "Subaru Impreza",
        [
          "IMPREZA",
          "インプレッサスポーツ",
          "IMPREZA SPORT",
          "インプレッサG4",
          "IMPREZA G4",
          "インプレッサWRX",
        ],
        ["hatchback", "sedan"],
        "current",
        10,
      ),

      defineModel(
        "subaru-wrx",
        "WRX",
        "Subaru WRX",
        [
          "スバルWRX",
          "WRX STI",
          "WRX S4",
          "ダブリューアールエックス",
        ],
        ["sedan", "sports"],
        "current",
        10,
      ),

      defineModel(
        "subaru-levorg",
        "レヴォーグ",
        "Subaru Levorg",
        [
          "LEVORG",
          "レボーグ",
          "レヴォーグSTIスポーツ",
          "レイバック",
          "LEVORG LAYBACK",
        ],
        ["wagon"],
        "current",
        10,
      ),

      defineModel(
        "subaru-legacy",
        "レガシィ",
        "Subaru Legacy",
        [
          "LEGACY",
          "レガシー",
          "レガシィB4",
          "LEGACY B4",
          "レガシィツーリングワゴン",
        ],
        ["sedan", "wagon"],
        "legacy",
        10,
      ),

      defineModel(
        "subaru-outback",
        "レガシィアウトバック",
        "Subaru Outback",
        [
          "OUTBACK",
          "アウトバック",
          "LEGACY OUTBACK",
          "レガシーアウトバック",
        ],
        ["suv", "wagon"],
        "current",
        10,
      ),

      defineModel(
        "subaru-forester",
        "フォレスター",
        "Subaru Forester",
        [
          "FORESTER",
          "フォレスタ",
        ],
        ["suv"],
        "current",
        10,
      ),

      defineModel(
        "subaru-xv",
        "XV",
        "Subaru XV",
        [
          "スバルXV",
          "SUBARU XV",
          "エックスブイ",
        ],
        ["suv", "compact"],
        "legacy",
        10,
      ),

      defineModel(
        "subaru-crosstrek",
        "クロストレック",
        "Subaru Crosstrek",
        [
          "CROSSTREK",
          "クロス トレック",
        ],
        ["suv", "compact"],
        "current",
        10,
      ),

      defineModel(
        "subaru-exiga",
        "エクシーガ",
        "Subaru Exiga",
        [
          "EXIGA",
          "エクシーガクロスオーバー7",
          "CROSSOVER 7",
          "クロスオーバー7",
        ],
        ["minivan", "wagon"],
        "legacy",
        20,
      ),

      defineModel(
        "subaru-brz",
        "BRZ",
        "Subaru BRZ",
        [
          "スバルBRZ",
          "ビーアールゼット",
        ],
        ["coupe", "sports"],
        "current",
        10,
      ),

      defineModel(
        "subaru-solterra",
        "ソルテラ",
        "Subaru Solterra",
        ["SOLTERRA"],
        ["suv", "ev"],
        "current",
        20,
      ),
    ],
  },

  // ========================================================
  // マツダ
  // ========================================================

  {
    makerId: "mazda",
    brandId: null,

    models: [
      defineModel(
        "mazda-carol",
        "キャロル",
        "Mazda Carol",
        ["CAROL"],
        ["kei", "hatchback"],
        "current",
        15,
      ),

      defineModel(
        "mazda-flair",
        "フレア",
        "Mazda Flair",
        [
          "FLAIR",
          "フレアカスタムスタイル",
        ],
        ["kei", "hatchback"],
        "current",
        15,
      ),

      defineModel(
        "mazda-flair-wagon",
        "フレアワゴン",
        "Mazda Flair Wagon",
        [
          "FLAIR WAGON",
          "フレア ワゴン",
          "フレアワゴンカスタムスタイル",
          "フレアワゴンタフスタイル",
        ],
        ["kei", "tall-wagon"],
        "current",
        15,
      ),

      defineModel(
        "mazda-flair-crossover",
        "フレアクロスオーバー",
        "Mazda Flair Crossover",
        [
          "FLAIR CROSSOVER",
          "フレア クロスオーバー",
        ],
        ["kei", "suv"],
        "current",
        15,
      ),

      defineModel(
        "mazda-scrum",
        "スクラム",
        "Mazda Scrum",
        [
          "SCRUM",
          "スクラムバン",
          "スクラムトラック",
          "スクラムワゴン",
        ],
        ["kei", "commercial-van", "truck"],
        "current",
        15,
      ),

      defineModel(
        "mazda-demio",
        "デミオ",
        "Mazda Demio",
        [
          "DEMIO",
          "デミオディーゼル",
        ],
        ["compact", "hatchback"],
        "legacy",
        10,
      ),

      defineModel(
        "mazda-mazda2",
        "MAZDA2",
        "Mazda2",
        [
          "マツダ2",
          "MAZDA 2",
        ],
        ["compact", "hatchback"],
        "current",
        10,
      ),

      defineModel(
        "mazda-axela",
        "アクセラ",
        "Mazda Axela",
        [
          "AXELA",
          "アクセラスポーツ",
          "アクセラセダン",
          "アクセラハイブリッド",
        ],
        ["hatchback", "sedan"],
        "legacy",
        10,
      ),

      defineModel(
        "mazda-mazda3",
        "MAZDA3",
        "Mazda3",
        [
          "マツダ3",
          "MAZDA 3",
          "MAZDA3ファストバック",
          "MAZDA3セダン",
        ],
        ["hatchback", "sedan"],
        "current",
        10,
      ),

      defineModel(
        "mazda-atenza",
        "アテンザ",
        "Mazda Atenza",
        [
          "ATENZA",
          "アテンザワゴン",
          "アテンザセダン",
        ],
        ["sedan", "wagon"],
        "legacy",
        10,
      ),

      defineModel(
        "mazda-mazda6",
        "MAZDA6",
        "Mazda6",
        [
          "マツダ6",
          "MAZDA 6",
          "MAZDA6ワゴン",
          "MAZDA6セダン",
        ],
        ["sedan", "wagon"],
        "legacy",
        10,
      ),

      defineModel(
        "mazda-premacy",
        "プレマシー",
        "Mazda Premacy",
        ["PREMACY"],
        ["minivan"],
        "legacy",
        15,
      ),

      defineModel(
        "mazda-biante",
        "ビアンテ",
        "Mazda Biante",
        ["BIANTE"],
        ["minivan"],
        "legacy",
        15,
      ),

      defineModel(
        "mazda-mpv",
        "MPV",
        "Mazda MPV",
        [
          "マツダMPV",
          "エムピーブイ",
        ],
        ["minivan"],
        "legacy",
        15,
      ),

      defineModel(
        "mazda-cx3",
        "CX-3",
        "Mazda CX-3",
        [
          "CX3",
          "CX 3",
          "マツダCX-3",
        ],
        ["suv", "compact"],
        "current",
        10,
      ),

      defineModel(
        "mazda-cx30",
        "CX-30",
        "Mazda CX-30",
        [
          "CX30",
          "CX 30",
          "マツダCX-30",
        ],
        ["suv", "compact"],
        "current",
        10,
      ),

      defineModel(
        "mazda-cx5",
        "CX-5",
        "Mazda CX-5",
        [
          "CX5",
          "CX 5",
          "マツダCX-5",
        ],
        ["suv"],
        "current",
        10,
      ),

      defineModel(
        "mazda-cx60",
        "CX-60",
        "Mazda CX-60",
        [
          "CX60",
          "CX 60",
          "マツダCX-60",
        ],
        ["suv"],
        "current",
        10,
      ),

      defineModel(
        "mazda-cx8",
        "CX-8",
        "Mazda CX-8",
        [
          "CX8",
          "CX 8",
          "マツダCX-8",
        ],
        ["suv"],
        "legacy",
        10,
      ),

      defineModel(
        "mazda-cx80",
        "CX-80",
        "Mazda CX-80",
        [
          "CX80",
          "CX 80",
          "マツダCX-80",
        ],
        ["suv"],
        "current",
        10,
      ),

      defineModel(
        "mazda-mx30",
        "MX-30",
        "Mazda MX-30",
        [
          "MX30",
          "MX 30",
          "マツダMX-30",
          "MX-30 EV",
          "MX-30ロータリーEV",
        ],
        ["suv", "ev"],
        "current",
        15,
      ),

      defineModel(
        "mazda-roadster",
        "ロードスター",
        "Mazda Roadster",
        [
          "ROADSTER",
          "MX-5",
          "MX5",
          "ユーノスロードスター",
          "ロードスターRF",
        ],
        ["convertible", "sports"],
        "current",
        10,
      ),

      defineModel(
        "mazda-rx7",
        "RX-7",
        "Mazda RX-7",
        [
          "RX7",
          "RX 7",
          "マツダRX-7",
          "FD3S",
          "FC3S",
        ],
        ["coupe", "sports"],
        "legacy",
        15,
      ),

      defineModel(
        "mazda-rx8",
        "RX-8",
        "Mazda RX-8",
        [
          "RX8",
          "RX 8",
          "マツダRX-8",
          "SE3P",
        ],
        ["coupe", "sports"],
        "legacy",
        15,
      ),

      defineModel(
        "mazda-bongo",
        "ボンゴ",
        "Mazda Bongo",
        [
          "BONGO",
          "ボンゴバン",
          "ボンゴトラック",
          "ボンゴブローニイ",
        ],
        ["commercial-van", "truck"],
        "current",
        20,
      ),
    ],
  },

  // ========================================================
  // スズキ
  // ========================================================

  {
    makerId: "suzuki",
    brandId: null,

    models: [
      defineModel(
        "suzuki-alto",
        "アルト",
        "Suzuki Alto",
        [
          "ALTO",
          "アルトエコ",
          "アルトターボRS",
        ],
        ["kei", "hatchback"],
        "current",
        10,
      ),

      defineModel(
        "suzuki-alto-lapin",
        "アルトラパン",
        "Suzuki Alto Lapin",
        [
          "ALTO LAPIN",
          "ラパン",
          "LAPIN",
          "ラパンLC",
        ],
        ["kei", "hatchback"],
        "current",
        10,
      ),

      defineModel(
        "suzuki-alto-works",
        "アルトワークス",
        "Suzuki Alto Works",
        [
          "ALTO WORKS",
          "ワークス",
        ],
        ["kei", "hatchback", "sports"],
        "legacy",
        10,
      ),

      defineModel(
        "suzuki-wagon-r",
        "ワゴンR",
        "Suzuki Wagon R",
        [
          "WAGON R",
          "WAGONR",
          "ワゴンアール",
          "ワゴンRスティングレー",
          "WAGON R STINGRAY",
          "スティングレー",
        ],
        ["kei", "hatchback"],
        "current",
        10,
      ),

      defineModel(
        "suzuki-wagon-r-smile",
        "ワゴンRスマイル",
        "Suzuki Wagon R Smile",
        [
          "WAGON R SMILE",
          "WAGONR SMILE",
          "ワゴンアールスマイル",
        ],
        ["kei", "tall-wagon"],
        "current",
        10,
      ),

      defineModel(
        "suzuki-mr-wagon",
        "MRワゴン",
        "Suzuki MR Wagon",
        [
          "MR WAGON",
          "MRWAGON",
          "エムアールワゴン",
          "MRワゴンWIT",
        ],
        ["kei", "hatchback"],
        "legacy",
        15,
      ),

      defineModel(
        "suzuki-spacia",
        "スペーシア",
        "Suzuki Spacia",
        [
          "SPACIA",
          "スペーシアカスタム",
          "SPACIA CUSTOM",
        ],
        ["kei", "tall-wagon"],
        "current",
        10,
      ),

      defineModel(
        "suzuki-spacia-gear",
        "スペーシアギア",
        "Suzuki Spacia Gear",
        [
          "SPACIA GEAR",
          "スペーシア ギア",
        ],
        ["kei", "tall-wagon", "suv"],
        "current",
        10,
      ),

      defineModel(
        "suzuki-spacia-base",
        "スペーシアベース",
        "Suzuki Spacia Base",
        [
          "SPACIA BASE",
          "スペーシア ベース",
        ],
        ["kei", "commercial-van"],
        "current",
        15,
      ),

      defineModel(
        "suzuki-hustler",
        "ハスラー",
        "Suzuki Hustler",
        [
          "HUSTLER",
          "ハスラータフワイルド",
          "HUSTLER TOUGH WILD",
        ],
        ["kei", "suv"],
        "current",
        10,
      ),

      defineModel(
        "suzuki-jimny",
        "ジムニー",
        "Suzuki Jimny",
        [
          "JIMNY",
          "ジムニーXC",
          "ジムニーランドベンチャー",
        ],
        ["kei", "suv", "off-road"],
        "current",
        10,
      ),

      defineModel(
        "suzuki-jimny-sierra",
        "ジムニーシエラ",
        "Suzuki Jimny Sierra",
        [
          "JIMNY SIERRA",
          "ジムニー シエラ",
        ],
        ["suv", "off-road"],
        "current",
        10,
      ),

      defineModel(
        "suzuki-jimny-nomade",
        "ジムニーノマド",
        "Suzuki Jimny Nomade",
        [
          "JIMNY NOMADE",
          "ジムニー ノマド",
        ],
        ["suv", "off-road"],
        "current",
        10,
      ),

      defineModel(
        "suzuki-swift",
        "スイフト",
        "Suzuki Swift",
        [
          "SWIFT",
          "スイフトRS",
        ],
        ["compact", "hatchback"],
        "current",
        10,
      ),

      defineModel(
        "suzuki-swift-sport",
        "スイフトスポーツ",
        "Suzuki Swift Sport",
        [
          "SWIFT SPORT",
          "スイスポ",
          "スイフト スポーツ",
        ],
        ["compact", "hatchback", "sports"],
        "current",
        10,
      ),

      defineModel(
        "suzuki-solio",
        "ソリオ",
        "Suzuki Solio",
        [
          "SOLIO",
          "ソリオハイブリッド",
        ],
        ["compact", "tall-wagon"],
        "current",
        10,
      ),

      defineModel(
        "suzuki-solio-bandit",
        "ソリオバンディット",
        "Suzuki Solio Bandit",
        [
          "SOLIO BANDIT",
          "ソリオ バンディット",
          "バンディット",
        ],
        ["compact", "tall-wagon"],
        "current",
        10,
      ),

      defineModel(
        "suzuki-xbee",
        "クロスビー",
        "Suzuki Xbee",
        [
          "XBEE",
          "X BEE",
          "スズキクロスビー",
        ],
        ["suv", "compact"],
        "current",
        10,
      ),

      defineModel(
        "suzuki-ignis",
        "イグニス",
        "Suzuki Ignis",
        ["IGNIS"],
        ["suv", "compact"],
        "legacy",
        15,
      ),

      defineModel(
        "suzuki-escudo",
        "エスクード",
        "Suzuki Escudo",
        [
          "ESCUDO",
          "グランドエスクード",
        ],
        ["suv"],
        "legacy",
        15,
      ),

      defineModel(
        "suzuki-fronx",
        "フロンクス",
        "Suzuki Fronx",
        ["FRONX"],
        ["suv", "compact"],
        "current",
        10,
      ),

      defineModel(
        "suzuki-landy",
        "ランディ",
        "Suzuki Landy",
        ["LANDY"],
        ["minivan"],
        "current",
        20,
      ),

      defineModel(
        "suzuki-every",
        "エブリイ",
        "Suzuki Every",
        [
          "EVERY",
          "エブリィ",
          "エブリイバン",
          "エブリーバン",
        ],
        ["kei", "commercial-van"],
        "current",
        10,
      ),

      defineModel(
        "suzuki-every-wagon",
        "エブリイワゴン",
        "Suzuki Every Wagon",
        [
          "EVERY WAGON",
          "エブリィワゴン",
          "エブリーワゴン",
        ],
        ["kei", "tall-wagon"],
        "current",
        10,
      ),

      defineModel(
        "suzuki-carry",
        "キャリイ",
        "Suzuki Carry",
        [
          "CARRY",
          "キャリー",
          "キャリイトラック",
          "スーパーキャリイ",
          "SUPER CARRY",
        ],
        ["kei", "truck"],
        "current",
        10,
      ),
    ],
  },

  // ========================================================
  // ダイハツ
  // ========================================================

  {
    makerId: "daihatsu",
    brandId: null,

    models: [
      defineModel(
        "daihatsu-mira",
        "ミラ",
        "Daihatsu Mira",
        [
          "MIRA",
          "ミラカスタム",
          "ミラアヴィ",
        ],
        ["kei", "hatchback"],
        "legacy",
        10,
      ),

      defineModel(
        "daihatsu-mira-es",
        "ミライース",
        "Daihatsu Mira e:S",
        [
          "MIRA ES",
          "MIRA E:S",
          "ミラ イース",
        ],
        ["kei", "hatchback"],
        "current",
        10,
      ),

      defineModel(
        "daihatsu-mira-cocoa",
        "ミラココア",
        "Daihatsu Mira Cocoa",
        [
          "MIRA COCOA",
          "ミラ ココア",
        ],
        ["kei", "hatchback"],
        "legacy",
        15,
      ),

      defineModel(
        "daihatsu-mira-tocot",
        "ミラトコット",
        "Daihatsu Mira Tocot",
        [
          "MIRA TOCOT",
          "ミラ トコット",
        ],
        ["kei", "hatchback"],
        "legacy",
        20,
      ),

      defineModel(
        "daihatsu-move",
        "ムーヴ",
        "Daihatsu Move",
        [
          "MOVE",
          "ムーブ",
          "ムーヴカスタム",
          "ムーブカスタム",
          "MOVE CUSTOM",
        ],
        ["kei", "hatchback"],
        "current",
        10,
      ),

      defineModel(
        "daihatsu-move-conte",
        "ムーヴコンテ",
        "Daihatsu Move Conte",
        [
          "MOVE CONTE",
          "ムーブコンテ",
          "ムーヴ コンテ",
        ],
        ["kei", "hatchback"],
        "legacy",
        15,
      ),

      defineModel(
        "daihatsu-move-canbus",
        "ムーヴキャンバス",
        "Daihatsu Move Canbus",
        [
          "MOVE CANBUS",
          "ムーブキャンバス",
          "ムーヴ キャンバス",
          "キャンバス",
        ],
        ["kei", "tall-wagon"],
        "current",
        10,
      ),

      defineModel(
        "daihatsu-tanto",
        "タント",
        "Daihatsu Tanto",
        [
          "TANTO",
          "タントカスタム",
          "TANTO CUSTOM",
          "タントファンクロス",
          "TANTO FUN CROSS",
        ],
        ["kei", "tall-wagon"],
        "current",
        10,
      ),

      defineModel(
        "daihatsu-tanto-exe",
        "タントエグゼ",
        "Daihatsu Tanto Exe",
        [
          "TANTO EXE",
          "タント エグゼ",
          "タントエグゼカスタム",
        ],
        ["kei", "hatchback"],
        "legacy",
        20,
      ),

      defineModel(
        "daihatsu-taft",
        "タフト",
        "Daihatsu Taft",
        ["TAFT"],
        ["kei", "suv"],
        "current",
        10,
      ),

      defineModel(
        "daihatsu-cast",
        "キャスト",
        "Daihatsu Cast",
        [
          "CAST",
          "キャストスタイル",
          "キャストアクティバ",
          "キャストスポーツ",
        ],
        ["kei", "hatchback", "suv"],
        "legacy",
        15,
      ),

      defineModel(
        "daihatsu-wake",
        "ウェイク",
        "Daihatsu Wake",
        [
          "WAKE",
          "ウエイク",
        ],
        ["kei", "tall-wagon"],
        "legacy",
        10,
      ),

      defineModel(
        "daihatsu-atrai",
        "アトレー",
        "Daihatsu Atrai",
        [
          "ATRAI",
          "アトレーワゴン",
          "ATRAI WAGON",
          "アトレーデッキバン",
        ],
        ["kei", "commercial-van", "tall-wagon"],
        "current",
        10,
      ),

      defineModel(
        "daihatsu-hijet",
        "ハイゼット",
        "Daihatsu Hijet",
        [
          "HIJET",
          "ハイゼットカーゴ",
          "HIJET CARGO",
          "ハイゼットトラック",
          "HIJET TRUCK",
          "ハイゼットデッキバン",
        ],
        ["kei", "commercial-van", "truck"],
        "current",
        10,
      ),

      defineModel(
        "daihatsu-thor",
        "トール",
        "Daihatsu Thor",
        [
          "THOR",
          "トールカスタム",
        ],
        ["compact", "tall-wagon"],
        "current",
        15,
      ),

      defineModel(
        "daihatsu-boon",
        "ブーン",
        "Daihatsu Boon",
        [
          "BOON",
          "ブーンシルク",
        ],
        ["compact", "hatchback"],
        "legacy",
        20,
      ),

      defineModel(
        "daihatsu-rocky",
        "ロッキー",
        "Daihatsu Rocky",
        [
          "ROCKY",
          "ロッキーハイブリッド",
        ],
        ["suv", "compact"],
        "current",
        10,
      ),

      defineModel(
        "daihatsu-terios-kid",
        "テリオスキッド",
        "Daihatsu Terios Kid",
        [
          "TERIOS KID",
          "テリオス キッド",
        ],
        ["kei", "suv"],
        "legacy",
        15,
      ),

      defineModel(
        "daihatsu-copen",
        "コペン",
        "Daihatsu Copen",
        [
          "COPEN",
          "コペンローブ",
          "コペンセロ",
          "コペンエクスプレイ",
          "コペンGRスポーツ",
        ],
        ["kei", "convertible", "sports"],
        "current",
        10,
      ),
    ],
  },

  // ========================================================
  // いすゞ・日野・三菱ふそう・UD
  // ========================================================

  {
    makerId: "isuzu",
    brandId: null,

    models: [
      defineModel(
        "isuzu-elf",
        "エルフ",
        "Isuzu Elf",
        [
          "ELF",
          "いすゞエルフ",
        ],
        ["truck"],
        "current",
        15,
      ),

      defineModel(
        "isuzu-forward",
        "フォワード",
        "Isuzu Forward",
        [
          "FORWARD",
          "いすゞフォワード",
        ],
        ["truck"],
        "current",
        20,
      ),

      defineModel(
        "isuzu-giga",
        "ギガ",
        "Isuzu Giga",
        [
          "GIGA",
          "いすゞギガ",
        ],
        ["truck"],
        "current",
        20,
      ),

      defineModel(
        "isuzu-bighorn",
        "ビッグホーン",
        "Isuzu Bighorn",
        [
          "BIGHORN",
          "いすゞビッグホーン",
        ],
        ["suv", "off-road"],
        "legacy",
        25,
      ),
    ],
  },

  {
    makerId: "hino",
    brandId: null,

    models: [
      defineModel(
        "hino-dutro",
        "デュトロ",
        "Hino Dutro",
        ["DUTRO"],
        ["truck"],
        "current",
        20,
      ),

      defineModel(
        "hino-ranger",
        "レンジャー",
        "Hino Ranger",
        ["RANGER"],
        ["truck"],
        "current",
        20,
      ),

      defineModel(
        "hino-profia",
        "プロフィア",
        "Hino Profia",
        ["PROFIA"],
        ["truck"],
        "current",
        20,
      ),
    ],
  },

  {
    makerId: "mitsubishi-fuso",
    brandId: null,

    models: [
      defineModel(
        "fuso-canter",
        "キャンター",
        "Mitsubishi Fuso Canter",
        [
          "CANTER",
          "ふそうキャンター",
        ],
        ["truck"],
        "current",
        20,
      ),

      defineModel(
        "fuso-fighter",
        "ファイター",
        "Mitsubishi Fuso Fighter",
        [
          "FIGHTER",
          "ふそうファイター",
        ],
        ["truck"],
        "current",
        20,
      ),

      defineModel(
        "fuso-super-great",
        "スーパーグレート",
        "Mitsubishi Fuso Super Great",
        [
          "SUPER GREAT",
          "ふそうスーパーグレート",
        ],
        ["truck"],
        "current",
        20,
      ),
    ],
  },

  {
    makerId: "ud-trucks",
    brandId: null,

    models: [
      defineModel(
        "ud-condor",
        "コンドル",
        "UD Condor",
        [
          "CONDOR",
          "UDコンドル",
        ],
        ["truck"],
        "current",
        25,
      ),

      defineModel(
        "ud-quon",
        "クオン",
        "UD Quon",
        [
          "QUON",
          "UDクオン",
        ],
        ["truck"],
        "current",
        20,
      ),
    ],
  },

  // ========================================================
  // BMW
  // ========================================================

  {
    makerId: "bmw",
    brandId: null,

    models: [
      defineModel(
        "bmw-1-series",
        "1シリーズ",
        "BMW 1 Series",
        [
          "1 SERIES",
          "BMW1シリーズ",
          "BMW 1シリーズ",
          "116I",
          "118I",
          "118D",
          "120I",
          "M135I",
        ],
        ["hatchback"],
        "current",
        15,
      ),

      defineModel(
        "bmw-2-series",
        "2シリーズ",
        "BMW 2 Series",
        [
          "2 SERIES",
          "BMW2シリーズ",
          "BMW 2シリーズ",
          "218I",
          "218D",
          "220I",
          "M235I",
          "2シリーズアクティブツアラー",
          "2シリーズグランツアラー",
          "2シリーズグランクーペ",
        ],
        ["coupe", "minivan", "sedan"],
        "current",
        15,
      ),

      defineModel(
        "bmw-3-series",
        "3シリーズ",
        "BMW 3 Series",
        [
          "3 SERIES",
          "BMW3シリーズ",
          "BMW 3シリーズ",
          "318I",
          "320I",
          "320D",
          "330I",
          "330E",
          "340I",
          "M340I",
          "3シリーズツーリング",
        ],
        ["sedan", "wagon"],
        "current",
        10,
      ),

      defineModel(
        "bmw-4-series",
        "4シリーズ",
        "BMW 4 Series",
        [
          "4 SERIES",
          "BMW4シリーズ",
          "BMW 4シリーズ",
          "420I",
          "430I",
          "440I",
          "M440I",
          "4シリーズグランクーペ",
          "4シリーズカブリオレ",
        ],
        ["coupe", "sedan", "convertible"],
        "current",
        15,
      ),

      defineModel(
        "bmw-5-series",
        "5シリーズ",
        "BMW 5 Series",
        [
          "5 SERIES",
          "BMW5シリーズ",
          "BMW 5シリーズ",
          "523I",
          "523D",
          "530I",
          "530E",
          "540I",
          "5シリーズツーリング",
        ],
        ["sedan", "wagon"],
        "current",
        10,
      ),

      defineModel(
        "bmw-7-series",
        "7シリーズ",
        "BMW 7 Series",
        [
          "7 SERIES",
          "BMW7シリーズ",
          "BMW 7シリーズ",
          "740I",
          "740D",
          "750I",
          "760I",
        ],
        ["sedan", "luxury"],
        "current",
        15,
      ),

      defineModel(
        "bmw-x1",
        "X1",
        "BMW X1",
        [
          "BMWX1",
          "BMW X1",
          "BMWエックスワン",
        ],
        ["suv", "compact"],
        "current",
        10,
      ),

      defineModel(
        "bmw-x2",
        "X2",
        "BMW X2",
        [
          "BMWX2",
          "BMW X2",
          "BMWエックスツー",
        ],
        ["suv", "compact"],
        "current",
        15,
      ),

      defineModel(
        "bmw-x3",
        "X3",
        "BMW X3",
        [
          "BMWX3",
          "BMW X3",
          "BMWエックススリー",
        ],
        ["suv"],
        "current",
        10,
      ),

      defineModel(
        "bmw-x4",
        "X4",
        "BMW X4",
        [
          "BMWX4",
          "BMW X4",
          "BMWエックスフォー",
        ],
        ["suv", "coupe"],
        "current",
        15,
      ),

      defineModel(
        "bmw-x5",
        "X5",
        "BMW X5",
        [
          "BMWX5",
          "BMW X5",
          "BMWエックスファイブ",
        ],
        ["suv", "luxury"],
        "current",
        10,
      ),

      defineModel(
        "bmw-x6",
        "X6",
        "BMW X6",
        [
          "BMWX6",
          "BMW X6",
          "BMWエックスシックス",
        ],
        ["suv", "coupe", "luxury"],
        "current",
        15,
      ),

      defineModel(
        "bmw-x7",
        "X7",
        "BMW X7",
        [
          "BMWX7",
          "BMW X7",
          "BMWエックスセブン",
        ],
        ["suv", "luxury"],
        "current",
        15,
      ),

      defineModel(
        "bmw-z4",
        "Z4",
        "BMW Z4",
        [
          "BMWZ4",
          "BMW Z4",
          "BMWゼットフォー",
        ],
        ["convertible", "sports"],
        "current",
        15,
      ),

      defineModel(
        "bmw-m2",
        "M2",
        "BMW M2",
        [
          "BMWM2",
          "BMW M2",
        ],
        ["coupe", "sports"],
        "current",
        15,
      ),

      defineModel(
        "bmw-m3",
        "M3",
        "BMW M3",
        [
          "BMWM3",
          "BMW M3",
        ],
        ["sedan", "sports"],
        "current",
        15,
      ),

      defineModel(
        "bmw-m4",
        "M4",
        "BMW M4",
        [
          "BMWM4",
          "BMW M4",
        ],
        ["coupe", "sports"],
        "current",
        15,
      ),

      defineModel(
        "bmw-m5",
        "M5",
        "BMW M5",
        [
          "BMWM5",
          "BMW M5",
        ],
        ["sedan", "sports"],
        "current",
        15,
      ),

      defineModel(
        "bmw-ix",
        "iX",
        "BMW iX",
        [
          "BMWIX",
          "BMW IX",
          "BMWアイエックス",
        ],
        ["suv", "ev"],
        "current",
        20,
      ),
    ],
  },

  // ========================================================
  // MINI
  // ========================================================

  {
    makerId: "bmw",
    brandId: "mini",

    models: [
      defineModel(
        "mini-hatch",
        "MINI",
        "MINI Hatch",
        [
          "ミニ",
          "ミニクーパー",
          "MINI COOPER",
          "MINI 3ドア",
          "MINI 5ドア",
          "MINI HATCH",
        ],
        ["hatchback", "compact"],
        "current",
        10,
      ),

      defineModel(
        "mini-clubman",
        "MINIクラブマン",
        "MINI Clubman",
        [
          "CLUBMAN",
          "ミニクラブマン",
          "MINI CLUBMAN",
        ],
        ["wagon"],
        "legacy",
        10,
      ),

      defineModel(
        "mini-countryman",
        "MINIカントリーマン",
        "MINI Countryman",
        [
          "COUNTRYMAN",
          "ミニカントリーマン",
          "MINI COUNTRYMAN",
          "MINIクロスオーバー",
          "ミニクロスオーバー",
          "MINI CROSSOVER",
        ],
        ["suv"],
        "current",
        10,
      ),

      defineModel(
        "mini-convertible",
        "MINIコンバーチブル",
        "MINI Convertible",
        [
          "MINI CONVERTIBLE",
          "ミニコンバーチブル",
          "ミニカブリオレ",
        ],
        ["convertible", "compact"],
        "current",
        15,
      ),
    ],
  },

  // ========================================================
  // メルセデス・ベンツ
  // ========================================================

  {
    makerId: "mercedes-benz",
    brandId: null,

    models: [
      defineModel(
        "mercedes-a-class",
        "Aクラス",
        "Mercedes-Benz A-Class",
        [
          "A-CLASS",
          "A CLASS",
          "ベンツAクラス",
          "メルセデスAクラス",
          "A180",
          "A200",
          "A250",
          "A35",
          "A45",
        ],
        ["hatchback", "sedan"],
        "current",
        10,
      ),

      defineModel(
        "mercedes-b-class",
        "Bクラス",
        "Mercedes-Benz B-Class",
        [
          "B-CLASS",
          "B CLASS",
          "ベンツBクラス",
          "B180",
          "B200",
        ],
        ["hatchback", "minivan"],
        "current",
        15,
      ),

      defineModel(
        "mercedes-c-class",
        "Cクラス",
        "Mercedes-Benz C-Class",
        [
          "C-CLASS",
          "C CLASS",
          "ベンツCクラス",
          "C180",
          "C200",
          "C220D",
          "C250",
          "C300",
          "C43",
          "C63",
          "Cクラスステーションワゴン",
          "Cクラスクーペ",
        ],
        ["sedan", "wagon", "coupe"],
        "current",
        10,
      ),

      defineModel(
        "mercedes-e-class",
        "Eクラス",
        "Mercedes-Benz E-Class",
        [
          "E-CLASS",
          "E CLASS",
          "ベンツEクラス",
          "E200",
          "E220D",
          "E250",
          "E300",
          "E350",
          "E400",
          "E450",
          "E53",
          "E63",
          "Eクラスステーションワゴン",
        ],
        ["sedan", "wagon", "coupe"],
        "current",
        10,
      ),

      defineModel(
        "mercedes-s-class",
        "Sクラス",
        "Mercedes-Benz S-Class",
        [
          "S-CLASS",
          "S CLASS",
          "ベンツSクラス",
          "S400",
          "S450",
          "S500",
          "S550",
          "S560",
          "S580",
          "S600",
          "S63",
        ],
        ["sedan", "luxury"],
        "current",
        10,
      ),

      defineModel(
        "mercedes-cla",
        "CLA",
        "Mercedes-Benz CLA",
        [
          "ベンツCLA",
          "CLA180",
          "CLA200D",
          "CLA250",
          "CLA35",
          "CLA45",
          "CLAシューティングブレーク",
        ],
        ["sedan", "wagon", "coupe"],
        "current",
        10,
      ),

      defineModel(
        "mercedes-cls",
        "CLS",
        "Mercedes-Benz CLS",
        [
          "ベンツCLS",
          "CLS220D",
          "CLS350",
          "CLS450",
          "CLS53",
        ],
        ["sedan", "coupe", "luxury"],
        "current",
        15,
      ),

      defineModel(
        "mercedes-gla",
        "GLA",
        "Mercedes-Benz GLA",
        [
          "ベンツGLA",
          "GLA180",
          "GLA200D",
          "GLA250",
          "GLA35",
          "GLA45",
        ],
        ["suv", "compact"],
        "current",
        10,
      ),

      defineModel(
        "mercedes-glb",
        "GLB",
        "Mercedes-Benz GLB",
        [
          "ベンツGLB",
          "GLB180",
          "GLB200D",
          "GLB250",
          "GLB35",
        ],
        ["suv"],
        "current",
        10,
      ),

      defineModel(
        "mercedes-glc",
        "GLC",
        "Mercedes-Benz GLC",
        [
          "ベンツGLC",
          "GLC220D",
          "GLC250",
          "GLC300",
          "GLC350E",
          "GLC43",
          "GLC63",
          "GLCクーペ",
        ],
        ["suv"],
        "current",
        10,
      ),

      defineModel(
        "mercedes-gle",
        "GLE",
        "Mercedes-Benz GLE",
        [
          "ベンツGLE",
          "GLE300D",
          "GLE350D",
          "GLE400D",
          "GLE450",
          "GLE53",
          "GLE63",
          "GLEクーペ",
          "Mクラス",
          "ML350",
        ],
        ["suv", "luxury"],
        "current",
        10,
      ),

      defineModel(
        "mercedes-gls",
        "GLS",
        "Mercedes-Benz GLS",
        [
          "ベンツGLS",
          "GLS350D",
          "GLS400D",
          "GLS550",
          "GLS580",
          "GLS600",
          "GLS63",
          "GLクラス",
        ],
        ["suv", "luxury"],
        "current",
        10,
      ),

      defineModel(
        "mercedes-g-class",
        "Gクラス",
        "Mercedes-Benz G-Class",
        [
          "G-CLASS",
          "G CLASS",
          "ゲレンデ",
          "ゲレンデヴァーゲン",
          "ベンツGクラス",
          "G350D",
          "G400D",
          "G500",
          "G550",
          "G63",
        ],
        ["suv", "off-road", "luxury"],
        "current",
        10,
      ),

      defineModel(
        "mercedes-v-class",
        "Vクラス",
        "Mercedes-Benz V-Class",
        [
          "V-CLASS",
          "V CLASS",
          "ベンツVクラス",
          "V220D",
          "ビアノ",
          "VIANO",
        ],
        ["minivan", "luxury"],
        "current",
        15,
      ),

      defineModel(
        "mercedes-slk",
        "SLK",
        "Mercedes-Benz SLK",
        [
          "ベンツSLK",
          "SLK200",
          "SLK350",
          "SLC",
          "SLC180",
          "SLC43",
        ],
        ["convertible", "sports"],
        "legacy",
        20,
      ),

      defineModel(
        "mercedes-sl",
        "SL",
        "Mercedes-AMG SL",
        [
          "ベンツSL",
          "SL350",
          "SL400",
          "SL500",
          "SL550",
          "SL63",
        ],
        ["convertible", "sports", "luxury"],
        "current",
        15,
      ),

      defineModel(
        "mercedes-amg-gt",
        "AMG GT",
        "Mercedes-AMG GT",
        [
          "MERCEDES AMG GT",
          "メルセデスAMG GT",
          "AMGGT",
          "GT43",
          "GT53",
          "GT63",
        ],
        ["coupe", "sedan", "sports"],
        "current",
        15,
      ),
    ],
  },

  // ========================================================
  // Audi
  // ========================================================

  {
    makerId: "audi",
    brandId: null,

    models: [
      defineModel(
        "audi-a1",
        "A1",
        "Audi A1",
        [
          "AUDI A1",
          "アウディA1",
          "A1スポーツバック",
        ],
        ["hatchback", "compact"],
        "current",
        15,
      ),

      defineModel(
        "audi-a3",
        "A3",
        "Audi A3",
        [
          "AUDI A3",
          "アウディA3",
          "A3スポーツバック",
          "A3セダン",
        ],
        ["hatchback", "sedan"],
        "current",
        10,
      ),

      defineModel(
        "audi-a4",
        "A4",
        "Audi A4",
        [
          "AUDI A4",
          "アウディA4",
          "A4アバント",
          "A4オールロード",
        ],
        ["sedan", "wagon"],
        "current",
        10,
      ),

      defineModel(
        "audi-a5",
        "A5",
        "Audi A5",
        [
          "AUDI A5",
          "アウディA5",
          "A5スポーツバック",
          "A5カブリオレ",
        ],
        ["coupe", "sedan", "convertible"],
        "current",
        15,
      ),

      defineModel(
        "audi-a6",
        "A6",
        "Audi A6",
        [
          "AUDI A6",
          "アウディA6",
          "A6アバント",
          "A6オールロード",
        ],
        ["sedan", "wagon"],
        "current",
        10,
      ),

      defineModel(
        "audi-a7",
        "A7",
        "Audi A7",
        [
          "AUDI A7",
          "アウディA7",
          "A7スポーツバック",
        ],
        ["sedan", "coupe"],
        "current",
        15,
      ),

      defineModel(
        "audi-a8",
        "A8",
        "Audi A8",
        [
          "AUDI A8",
          "アウディA8",
          "A8L",
        ],
        ["sedan", "luxury"],
        "current",
        15,
      ),

      defineModel(
        "audi-q2",
        "Q2",
        "Audi Q2",
        [
          "AUDI Q2",
          "アウディQ2",
        ],
        ["suv", "compact"],
        "current",
        10,
      ),

      defineModel(
        "audi-q3",
        "Q3",
        "Audi Q3",
        [
          "AUDI Q3",
          "アウディQ3",
          "Q3スポーツバック",
        ],
        ["suv", "compact"],
        "current",
        10,
      ),

      defineModel(
        "audi-q5",
        "Q5",
        "Audi Q5",
        [
          "AUDI Q5",
          "アウディQ5",
          "Q5スポーツバック",
        ],
        ["suv"],
        "current",
        10,
      ),

      defineModel(
        "audi-q7",
        "Q7",
        "Audi Q7",
        [
          "AUDI Q7",
          "アウディQ7",
        ],
        ["suv", "luxury"],
        "current",
        10,
      ),

      defineModel(
        "audi-q8",
        "Q8",
        "Audi Q8",
        [
          "AUDI Q8",
          "アウディQ8",
          "Q8 E-TRON",
        ],
        ["suv", "luxury"],
        "current",
        15,
      ),

      defineModel(
        "audi-tt",
        "TT",
        "Audi TT",
        [
          "AUDI TT",
          "アウディTT",
          "TTクーペ",
          "TTロードスター",
          "TTS",
          "TT RS",
        ],
        ["coupe", "convertible", "sports"],
        "legacy",
        10,
      ),

      defineModel(
        "audi-r8",
        "R8",
        "Audi R8",
        [
          "AUDI R8",
          "アウディR8",
        ],
        ["coupe", "sports"],
        "legacy",
        15,
      ),
    ],
  },

  // ========================================================
  // Volkswagen
  // ========================================================

  {
    makerId: "volkswagen",
    brandId: null,

    models: [
      defineModel(
        "volkswagen-up",
        "up!",
        "Volkswagen up!",
        [
          "UP",
          "VW UP",
          "フォルクスワーゲンUP",
          "アップ",
        ],
        ["compact", "hatchback"],
        "legacy",
        15,
      ),

      defineModel(
        "volkswagen-polo",
        "ポロ",
        "Volkswagen Polo",
        [
          "POLO",
          "VW POLO",
          "ポロGTI",
        ],
        ["compact", "hatchback"],
        "current",
        10,
      ),

      defineModel(
        "volkswagen-golf",
        "ゴルフ",
        "Volkswagen Golf",
        [
          "GOLF",
          "VW GOLF",
          "ゴルフGTI",
          "GOLF GTI",
          "ゴルフR",
          "GOLF R",
          "ゴルフヴァリアント",
          "GOLF VARIANT",
        ],
        ["hatchback", "wagon"],
        "current",
        10,
      ),

      defineModel(
        "volkswagen-golf-touran",
        "ゴルフトゥーラン",
        "Volkswagen Golf Touran",
        [
          "GOLF TOURAN",
          "ゴルフ トゥーラン",
          "トゥーラン",
        ],
        ["minivan"],
        "current",
        10,
      ),

      defineModel(
        "volkswagen-t-cross",
        "T-Cross",
        "Volkswagen T-Cross",
        [
          "TCROSS",
          "T CROSS",
          "ティークロス",
          "VW T-CROSS",
        ],
        ["suv", "compact"],
        "current",
        10,
      ),

      defineModel(
        "volkswagen-t-roc",
        "T-Roc",
        "Volkswagen T-Roc",
        [
          "TROC",
          "T ROC",
          "ティーロック",
          "VW T-ROC",
        ],
        ["suv", "compact"],
        "current",
        10,
      ),

      defineModel(
        "volkswagen-tiguan",
        "ティグアン",
        "Volkswagen Tiguan",
        [
          "TIGUAN",
          "VW TIGUAN",
        ],
        ["suv"],
        "current",
        10,
      ),

      defineModel(
        "volkswagen-touareg",
        "トゥアレグ",
        "Volkswagen Touareg",
        [
          "TOUAREG",
          "VW TOUAREG",
        ],
        ["suv", "luxury"],
        "legacy",
        15,
      ),

      defineModel(
        "volkswagen-passat",
        "パサート",
        "Volkswagen Passat",
        [
          "PASSAT",
          "VW PASSAT",
          "パサートヴァリアント",
          "PASSAT VARIANT",
        ],
        ["sedan", "wagon"],
        "current",
        15,
      ),

      defineModel(
        "volkswagen-arteon",
        "アルテオン",
        "Volkswagen Arteon",
        [
          "ARTEON",
          "アルテオンシューティングブレーク",
        ],
        ["sedan", "wagon", "coupe"],
        "current",
        15,
      ),

      defineModel(
        "volkswagen-beetle",
        "ザ・ビートル",
        "Volkswagen The Beetle",
        [
          "THE BEETLE",
          "ビートル",
          "BEETLE",
          "ニュービートル",
          "NEW BEETLE",
        ],
        ["hatchback", "coupe"],
        "legacy",
        10,
      ),

      defineModel(
        "volkswagen-id4",
        "ID.4",
        "Volkswagen ID.4",
        [
          "ID4",
          "ID 4",
          "VW ID4",
          "フォルクスワーゲンID4",
        ],
        ["suv", "ev"],
        "current",
        15,
      ),
    ],
  },

  // ========================================================
  // Porsche
  // ========================================================

  {
    makerId: "porsche",
    brandId: null,

    models: [
      defineModel(
        "porsche-911",
        "911",
        "Porsche 911",
        [
          "ポルシェ911",
          "カレラ",
          "911カレラ",
          "911ターボ",
          "911GT3",
        ],
        ["coupe", "convertible", "sports"],
        "current",
        10,
      ),

      defineModel(
        "porsche-boxster",
        "ボクスター",
        "Porsche Boxster",
        [
          "BOXSTER",
          "718ボクスター",
          "718 BOXSTER",
        ],
        ["convertible", "sports"],
        "current",
        10,
      ),

      defineModel(
        "porsche-cayman",
        "ケイマン",
        "Porsche Cayman",
        [
          "CAYMAN",
          "718ケイマン",
          "718 CAYMAN",
        ],
        ["coupe", "sports"],
        "current",
        10,
      ),

      defineModel(
        "porsche-macan",
        "マカン",
        "Porsche Macan",
        [
          "MACAN",
          "マカンS",
          "マカンGTS",
          "マカンターボ",
        ],
        ["suv"],
        "current",
        10,
      ),

      defineModel(
        "porsche-cayenne",
        "カイエン",
        "Porsche Cayenne",
        [
          "CAYENNE",
          "カイエンクーペ",
          "カイエンS",
          "カイエンGTS",
          "カイエンターボ",
        ],
        ["suv", "luxury"],
        "current",
        10,
      ),

      defineModel(
        "porsche-panamera",
        "パナメーラ",
        "Porsche Panamera",
        [
          "PANAMERA",
          "パナメーラスポーツツーリスモ",
        ],
        ["sedan", "luxury", "sports"],
        "current",
        10,
      ),

      defineModel(
        "porsche-taycan",
        "タイカン",
        "Porsche Taycan",
        [
          "TAYCAN",
          "タイカンクロスツーリスモ",
        ],
        ["sedan", "wagon", "ev"],
        "current",
        10,
      ),
    ],
  },

  // ========================================================
  // Volvo
  // ========================================================

  {
    makerId: "volvo-cars",
    brandId: "volvo-brand",

    models: [
      defineModel(
        "volvo-v40",
        "V40",
        "Volvo V40",
        [
          "VOLVO V40",
          "ボルボV40",
          "V40クロスカントリー",
        ],
        ["hatchback", "wagon"],
        "legacy",
        10,
      ),

      defineModel(
        "volvo-v60",
        "V60",
        "Volvo V60",
        [
          "VOLVO V60",
          "ボルボV60",
          "V60クロスカントリー",
        ],
        ["wagon"],
        "current",
        10,
      ),

      defineModel(
        "volvo-v70",
        "V70",
        "Volvo V70",
        [
          "VOLVO V70",
          "ボルボV70",
        ],
        ["wagon"],
        "legacy",
        15,
      ),

      defineModel(
        "volvo-v90",
        "V90",
        "Volvo V90",
        [
          "VOLVO V90",
          "ボルボV90",
          "V90クロスカントリー",
        ],
        ["wagon", "luxury"],
        "current",
        15,
      ),

      defineModel(
        "volvo-s60",
        "S60",
        "Volvo S60",
        [
          "VOLVO S60",
          "ボルボS60",
        ],
        ["sedan"],
        "current",
        15,
      ),

      defineModel(
        "volvo-s90",
        "S90",
        "Volvo S90",
        [
          "VOLVO S90",
          "ボルボS90",
        ],
        ["sedan", "luxury"],
        "current",
        20,
      ),

      defineModel(
        "volvo-xc40",
        "XC40",
        "Volvo XC40",
        [
          "VOLVO XC40",
          "ボルボXC40",
          "XC40リチャージ",
        ],
        ["suv", "compact"],
        "current",
        10,
      ),

      defineModel(
        "volvo-xc60",
        "XC60",
        "Volvo XC60",
        [
          "VOLVO XC60",
          "ボルボXC60",
        ],
        ["suv"],
        "current",
        10,
      ),

      defineModel(
        "volvo-xc90",
        "XC90",
        "Volvo XC90",
        [
          "VOLVO XC90",
          "ボルボXC90",
        ],
        ["suv", "luxury"],
        "current",
        10,
      ),

      defineModel(
        "volvo-ex30",
        "EX30",
        "Volvo EX30",
        [
          "VOLVO EX30",
          "ボルボEX30",
        ],
        ["suv", "compact", "ev"],
        "current",
        15,
      ),
    ],
  },

  // ========================================================
  // Jaguar・Land Rover
  // ========================================================

  {
    makerId: "jaguar-land-rover",
    brandId: "jaguar",

    models: [
      defineModel(
        "jaguar-xe",
        "XE",
        "Jaguar XE",
        [
          "JAGUAR XE",
          "ジャガーXE",
        ],
        ["sedan"],
        "current",
        15,
      ),

      defineModel(
        "jaguar-xf",
        "XF",
        "Jaguar XF",
        [
          "JAGUAR XF",
          "ジャガーXF",
          "XFスポーツブレイク",
        ],
        ["sedan", "wagon"],
        "current",
        15,
      ),

      defineModel(
        "jaguar-xj",
        "XJ",
        "Jaguar XJ",
        [
          "JAGUAR XJ",
          "ジャガーXJ",
        ],
        ["sedan", "luxury"],
        "legacy",
        15,
      ),

      defineModel(
        "jaguar-e-pace",
        "E-PACE",
        "Jaguar E-PACE",
        [
          "EPACE",
          "E PACE",
          "ジャガーE-PACE",
        ],
        ["suv", "compact"],
        "current",
        15,
      ),

      defineModel(
        "jaguar-f-pace",
        "F-PACE",
        "Jaguar F-PACE",
        [
          "FPACE",
          "F PACE",
          "ジャガーF-PACE",
        ],
        ["suv"],
        "current",
        10,
      ),

      defineModel(
        "jaguar-f-type",
        "F-TYPE",
        "Jaguar F-TYPE",
        [
          "FTYPE",
          "F TYPE",
          "ジャガーF-TYPE",
        ],
        ["coupe", "convertible", "sports"],
        "legacy",
        15,
      ),
    ],
  },

  {
    makerId: "jaguar-land-rover",
    brandId: "land-rover",

    models: [
      defineModel(
        "land-rover-range-rover",
        "レンジローバー",
        "Range Rover",
        [
          "RANGE ROVER",
          "LAND ROVER RANGE ROVER",
        ],
        ["suv", "luxury", "off-road"],
        "current",
        10,
      ),

      defineModel(
        "land-rover-range-rover-sport",
        "レンジローバースポーツ",
        "Range Rover Sport",
        [
          "RANGE ROVER SPORT",
          "レンジローバー スポーツ",
        ],
        ["suv", "luxury"],
        "current",
        10,
      ),

      defineModel(
        "land-rover-range-rover-evoque",
        "レンジローバーイヴォーク",
        "Range Rover Evoque",
        [
          "RANGE ROVER EVOQUE",
          "レンジローバーイボーク",
          "イヴォーク",
          "イボーク",
          "EVOQUE",
        ],
        ["suv", "compact", "luxury"],
        "current",
        10,
      ),

      defineModel(
        "land-rover-range-rover-velar",
        "レンジローバーヴェラール",
        "Range Rover Velar",
        [
          "RANGE ROVER VELAR",
          "レンジローバーベラール",
          "ヴェラール",
          "ベラール",
          "VELAR",
        ],
        ["suv", "luxury"],
        "current",
        15,
      ),

      defineModel(
        "land-rover-defender",
        "ディフェンダー",
        "Land Rover Defender",
        [
          "DEFENDER",
          "LAND ROVER DEFENDER",
          "ディフェンダー90",
          "ディフェンダー110",
          "ディフェンダー130",
        ],
        ["suv", "off-road"],
        "current",
        10,
      ),

      defineModel(
        "land-rover-discovery",
        "ディスカバリー",
        "Land Rover Discovery",
        [
          "DISCOVERY",
          "LAND ROVER DISCOVERY",
        ],
        ["suv", "off-road"],
        "current",
        15,
      ),

      defineModel(
        "land-rover-discovery-sport",
        "ディスカバリースポーツ",
        "Land Rover Discovery Sport",
        [
          "DISCOVERY SPORT",
          "ディスカバリー スポーツ",
        ],
        ["suv"],
        "current",
        15,
      ),
    ],
  },

  // ========================================================
  // Jeep・Ford・GM・Tesla
  // ========================================================

  {
    makerId: "stellantis",
    brandId: "jeep",

    models: [
      defineModel(
        "jeep-renegade",
        "レネゲード",
        "Jeep Renegade",
        [
          "RENEGADE",
          "ジープレネゲード",
        ],
        ["suv", "compact"],
        "current",
        10,
      ),

      defineModel(
        "jeep-compass",
        "コンパス",
        "Jeep Compass",
        [
          "COMPASS",
          "ジープコンパス",
        ],
        ["suv"],
        "current",
        10,
      ),

      defineModel(
        "jeep-cherokee",
        "チェロキー",
        "Jeep Cherokee",
        [
          "CHEROKEE",
          "ジープチェロキー",
        ],
        ["suv", "off-road"],
        "legacy",
        10,
      ),

      defineModel(
        "jeep-grand-cherokee",
        "グランドチェロキー",
        "Jeep Grand Cherokee",
        [
          "GRAND CHEROKEE",
          "グランド チェロキー",
          "ジープグランドチェロキー",
        ],
        ["suv", "luxury", "off-road"],
        "current",
        10,
      ),

      defineModel(
        "jeep-wrangler",
        "ラングラー",
        "Jeep Wrangler",
        [
          "WRANGLER",
          "ジープラングラー",
          "ラングラーアンリミテッド",
          "WRANGLER UNLIMITED",
        ],
        ["suv", "off-road"],
        "current",
        10,
      ),

      defineModel(
        "jeep-commander",
        "コマンダー",
        "Jeep Commander",
        [
          "COMMANDER",
          "ジープコマンダー",
        ],
        ["suv"],
        "current",
        15,
      ),

      defineModel(
        "jeep-gladiator",
        "グラディエーター",
        "Jeep Gladiator",
        [
          "GLADIATOR",
          "ジープグラディエーター",
        ],
        ["truck", "off-road"],
        "current",
        20,
      ),
    ],
  },

  {
    makerId: "ford-motor",
    brandId: null,

    models: [
      defineModel(
        "ford-mustang",
        "マスタング",
        "Ford Mustang",
        [
          "MUSTANG",
          "ムスタング",
          "フォードマスタング",
        ],
        ["coupe", "convertible", "sports"],
        "current",
        10,
      ),

      defineModel(
        "ford-explorer",
        "エクスプローラー",
        "Ford Explorer",
        [
          "EXPLORER",
          "フォードエクスプローラー",
        ],
        ["suv"],
        "current",
        10,
      ),

      defineModel(
        "ford-kuga",
        "クーガ",
        "Ford Kuga",
        [
          "KUGA",
          "フォードクーガ",
        ],
        ["suv"],
        "legacy",
        20,
      ),

      defineModel(
        "ford-focus",
        "フォーカス",
        "Ford Focus",
        [
          "FOCUS",
          "フォードフォーカス",
        ],
        ["hatchback", "wagon"],
        "legacy",
        20,
      ),

      defineModel(
        "ford-fiesta",
        "フィエスタ",
        "Ford Fiesta",
        [
          "FIESTA",
          "フォードフィエスタ",
        ],
        ["compact", "hatchback"],
        "legacy",
        20,
      ),

      defineModel(
        "ford-bronco",
        "ブロンコ",
        "Ford Bronco",
        [
          "BRONCO",
          "フォードブロンコ",
        ],
        ["suv", "off-road"],
        "current",
        20,
      ),

      defineModel(
        "ford-f150",
        "F-150",
        "Ford F-150",
        [
          "F150",
          "F 150",
          "フォードF150",
        ],
        ["truck"],
        "current",
        20,
      ),
    ],
  },

  {
    makerId: "general-motors",
    brandId: "chevrolet",

    models: [
      defineModel(
        "chevrolet-camaro",
        "カマロ",
        "Chevrolet Camaro",
        [
          "CAMARO",
          "シボレーカマロ",
        ],
        ["coupe", "convertible", "sports"],
        "current",
        10,
      ),

      defineModel(
        "chevrolet-corvette",
        "コルベット",
        "Chevrolet Corvette",
        [
          "CORVETTE",
          "シボレーコルベット",
          "C7コルベット",
          "C8コルベット",
        ],
        ["coupe", "convertible", "sports"],
        "current",
        10,
      ),

      defineModel(
        "chevrolet-captiva",
        "キャプティバ",
        "Chevrolet Captiva",
        [
          "CAPTIVA",
          "シボレーキャプティバ",
        ],
        ["suv"],
        "legacy",
        20,
      ),

      defineModel(
        "chevrolet-tahoe",
        "タホ",
        "Chevrolet Tahoe",
        [
          "TAHOE",
          "シボレータホ",
        ],
        ["suv", "luxury"],
        "current",
        20,
      ),
    ],
  },

  {
    makerId: "general-motors",
    brandId: "cadillac",

    models: [
      defineModel(
        "cadillac-ats",
        "ATS",
        "Cadillac ATS",
        [
          "CADILLAC ATS",
          "キャデラックATS",
        ],
        ["sedan"],
        "legacy",
        20,
      ),

      defineModel(
        "cadillac-cts",
        "CTS",
        "Cadillac CTS",
        [
          "CADILLAC CTS",
          "キャデラックCTS",
        ],
        ["sedan"],
        "legacy",
        15,
      ),

      defineModel(
        "cadillac-ct5",
        "CT5",
        "Cadillac CT5",
        [
          "CADILLAC CT5",
          "キャデラックCT5",
        ],
        ["sedan"],
        "current",
        20,
      ),

      defineModel(
        "cadillac-xt4",
        "XT4",
        "Cadillac XT4",
        [
          "CADILLAC XT4",
          "キャデラックXT4",
        ],
        ["suv", "compact"],
        "current",
        20,
      ),

      defineModel(
        "cadillac-xt5",
        "XT5",
        "Cadillac XT5",
        [
          "CADILLAC XT5",
          "キャデラックXT5",
        ],
        ["suv"],
        "current",
        15,
      ),

      defineModel(
        "cadillac-escalade",
        "エスカレード",
        "Cadillac Escalade",
        [
          "ESCALADE",
          "キャデラックエスカレード",
        ],
        ["suv", "luxury"],
        "current",
        10,
      ),
    ],
  },

  {
    makerId: "general-motors",
    brandId: "hummer",

    models: [
      defineModel(
        "hummer-h1",
        "ハマーH1",
        "HUMMER H1",
        [
          "HUMMER H1",
          "H1",
        ],
        ["suv", "off-road"],
        "legacy",
        20,
      ),

      defineModel(
        "hummer-h2",
        "ハマーH2",
        "HUMMER H2",
        [
          "HUMMER H2",
          "H2",
        ],
        ["suv", "off-road"],
        "legacy",
        15,
      ),

      defineModel(
        "hummer-h3",
        "ハマーH3",
        "HUMMER H3",
        [
          "HUMMER H3",
          "H3",
        ],
        ["suv", "off-road"],
        "legacy",
        20,
      ),
    ],
  },

  {
    makerId: "tesla",
    brandId: null,

    models: [
      defineModel(
        "tesla-model-3",
        "モデル3",
        "Tesla Model 3",
        [
          "MODEL 3",
          "MODEL3",
          "テスラモデル3",
        ],
        ["sedan", "ev"],
        "current",
        10,
      ),

      defineModel(
        "tesla-model-y",
        "モデルY",
        "Tesla Model Y",
        [
          "MODEL Y",
          "MODELY",
          "テスラモデルY",
        ],
        ["suv", "ev"],
        "current",
        10,
      ),

      defineModel(
        "tesla-model-s",
        "モデルS",
        "Tesla Model S",
        [
          "MODEL S",
          "MODELS",
          "テスラモデルS",
        ],
        ["sedan", "ev", "luxury"],
        "current",
        15,
      ),

      defineModel(
        "tesla-model-x",
        "モデルX",
        "Tesla Model X",
        [
          "MODEL X",
          "MODELX",
          "テスラモデルX",
        ],
        ["suv", "ev", "luxury"],
        "current",
        15,
      ),
    ],
  },

  // ========================================================
  // フランス・イタリア
  // ========================================================

  {
    makerId: "stellantis",
    brandId: "peugeot",

    models: [
      defineModel(
        "peugeot-208",
        "208",
        "Peugeot 208",
        [
          "プジョー208",
          "PEUGEOT 208",
          "E-208",
        ],
        ["compact", "hatchback"],
        "current",
        10,
      ),

      defineModel(
        "peugeot-308",
        "308",
        "Peugeot 308",
        [
          "プジョー308",
          "PEUGEOT 308",
          "308SW",
        ],
        ["hatchback", "wagon"],
        "current",
        10,
      ),

      defineModel(
        "peugeot-2008",
        "2008",
        "Peugeot 2008",
        [
          "プジョー2008",
          "PEUGEOT 2008",
          "E-2008",
        ],
        ["suv", "compact"],
        "current",
        10,
      ),

      defineModel(
        "peugeot-3008",
        "3008",
        "Peugeot 3008",
        [
          "プジョー3008",
          "PEUGEOT 3008",
        ],
        ["suv"],
        "current",
        10,
      ),

      defineModel(
        "peugeot-5008",
        "5008",
        "Peugeot 5008",
        [
          "プジョー5008",
          "PEUGEOT 5008",
        ],
        ["suv"],
        "current",
        10,
      ),

      defineModel(
        "peugeot-rifter",
        "リフター",
        "Peugeot Rifter",
        [
          "RIFTER",
          "プジョーリフター",
        ],
        ["minivan", "commercial-van"],
        "current",
        15,
      ),
    ],
  },

  {
    makerId: "stellantis",
    brandId: "citroen",

    models: [
      defineModel(
        "citroen-c3",
        "C3",
        "Citroen C3",
        [
          "CITROEN C3",
          "CITROËN C3",
          "シトロエンC3",
          "C3エアクロス",
        ],
        ["compact", "hatchback", "suv"],
        "current",
        10,
      ),

      defineModel(
        "citroen-c4",
        "C4",
        "Citroen C4",
        [
          "CITROEN C4",
          "CITROËN C4",
          "シトロエンC4",
          "C4カクタス",
        ],
        ["hatchback", "suv"],
        "current",
        15,
      ),

      defineModel(
        "citroen-c5-aircross",
        "C5エアクロス",
        "Citroen C5 Aircross",
        [
          "C5 AIRCROSS",
          "シトロエンC5エアクロス",
        ],
        ["suv"],
        "current",
        15,
      ),

      defineModel(
        "citroen-berlingo",
        "ベルランゴ",
        "Citroen Berlingo",
        [
          "BERLINGO",
          "シトロエンベルランゴ",
        ],
        ["minivan", "commercial-van"],
        "current",
        10,
      ),
    ],
  },

  {
    makerId: "renault",
    brandId: null,

    models: [
      defineModel(
        "renault-twingo",
        "トゥインゴ",
        "Renault Twingo",
        [
          "TWINGO",
          "トインゴ",
          "ルノートゥインゴ",
        ],
        ["compact", "hatchback"],
        "current",
        10,
      ),

      defineModel(
        "renault-lutecia",
        "ルーテシア",
        "Renault Lutecia",
        [
          "LUTECIA",
          "CLIO",
          "クリオ",
          "ルノールーテシア",
        ],
        ["compact", "hatchback"],
        "current",
        10,
      ),

      defineModel(
        "renault-captur",
        "キャプチャー",
        "Renault Captur",
        [
          "CAPTUR",
          "ルノーキャプチャー",
        ],
        ["suv", "compact"],
        "current",
        10,
      ),

      defineModel(
        "renault-kangoo",
        "カングー",
        "Renault Kangoo",
        [
          "KANGOO",
          "ルノーカングー",
        ],
        ["minivan", "commercial-van"],
        "current",
        10,
      ),

      defineModel(
        "renault-megane",
        "メガーヌ",
        "Renault Megane",
        [
          "MEGANE",
          "ルノーメガーヌ",
          "メガーヌRS",
        ],
        ["hatchback", "wagon", "sports"],
        "current",
        15,
      ),

      defineModel(
        "renault-arkana",
        "アルカナ",
        "Renault Arkana",
        [
          "ARKANA",
          "ルノーアルカナ",
        ],
        ["suv", "coupe"],
        "current",
        15,
      ),
    ],
  },

  {
    makerId: "stellantis",
    brandId: "fiat",

    models: [
      defineModel(
        "fiat-500",
        "フィアット500",
        "Fiat 500",
        [
          "FIAT 500",
          "500",
          "チンクエチェント",
          "500E",
        ],
        ["compact", "hatchback", "ev"],
        "current",
        10,
      ),

      defineModel(
        "fiat-500x",
        "フィアット500X",
        "Fiat 500X",
        [
          "FIAT 500X",
          "500X",
        ],
        ["suv", "compact"],
        "current",
        15,
      ),

      defineModel(
        "fiat-panda",
        "パンダ",
        "Fiat Panda",
        [
          "FIAT PANDA",
          "フィアットパンダ",
        ],
        ["compact", "hatchback"],
        "current",
        15,
      ),

      defineModel(
        "fiat-doblo",
        "ドブロ",
        "Fiat Doblo",
        [
          "DOBLO",
          "FIAT DOBLO",
          "フィアットドブロ",
        ],
        ["minivan", "commercial-van"],
        "current",
        20,
      ),
    ],
  },

  {
    makerId: "stellantis",
    brandId: "abarth",

    models: [
      defineModel(
        "abarth-595",
        "アバルト595",
        "Abarth 595",
        [
          "ABARTH 595",
          "595",
          "アバルト500",
          "ABARTH 500",
        ],
        ["compact", "hatchback", "sports"],
        "current",
        10,
      ),

      defineModel(
        "abarth-695",
        "アバルト695",
        "Abarth 695",
        [
          "ABARTH 695",
          "695",
        ],
        ["compact", "hatchback", "sports"],
        "current",
        15,
      ),

      defineModel(
        "abarth-124-spider",
        "アバルト124スパイダー",
        "Abarth 124 Spider",
        [
          "ABARTH 124 SPIDER",
          "124スパイダー",
        ],
        ["convertible", "sports"],
        "legacy",
        20,
      ),
    ],
  },

  {
    makerId: "stellantis",
    brandId: "alfa-romeo",

    models: [
      defineModel(
        "alfa-romeo-mito",
        "ミト",
        "Alfa Romeo MiTo",
        [
          "MITO",
          "アルファロメオミト",
        ],
        ["compact", "hatchback"],
        "legacy",
        20,
      ),

      defineModel(
        "alfa-romeo-giulietta",
        "ジュリエッタ",
        "Alfa Romeo Giulietta",
        [
          "GIULIETTA",
          "アルファロメオジュリエッタ",
        ],
        ["hatchback"],
        "legacy",
        15,
      ),

      defineModel(
        "alfa-romeo-giulia",
        "ジュリア",
        "Alfa Romeo Giulia",
        [
          "GIULIA",
          "アルファロメオジュリア",
        ],
        ["sedan", "sports"],
        "current",
        15,
      ),

      defineModel(
        "alfa-romeo-stelvio",
        "ステルヴィオ",
        "Alfa Romeo Stelvio",
        [
          "STELVIO",
          "アルファロメオステルヴィオ",
        ],
        ["suv"],
        "current",
        15,
      ),
    ],
  },

  // ========================================================
  // その他の高級・スポーツメーカー
  // ========================================================

  {
    makerId: "maserati",
    brandId: null,

    models: [
      defineModel(
        "maserati-ghibli",
        "ギブリ",
        "Maserati Ghibli",
        [
          "GHIBLI",
          "マセラティギブリ",
        ],
        ["sedan", "luxury", "sports"],
        "current",
        10,
      ),

      defineModel(
        "maserati-quattroporte",
        "クアトロポルテ",
        "Maserati Quattroporte",
        [
          "QUATTROPORTE",
          "マセラティクアトロポルテ",
        ],
        ["sedan", "luxury"],
        "current",
        15,
      ),

      defineModel(
        "maserati-levante",
        "レヴァンテ",
        "Maserati Levante",
        [
          "LEVANTE",
          "レバンテ",
          "マセラティレヴァンテ",
        ],
        ["suv", "luxury"],
        "current",
        10,
      ),

      defineModel(
        "maserati-grecale",
        "グレカーレ",
        "Maserati Grecale",
        [
          "GRECALE",
          "マセラティグレカーレ",
        ],
        ["suv", "luxury"],
        "current",
        15,
      ),
    ],
  },

  {
    makerId: "ferrari",
    brandId: null,

    models: [
      defineModel(
        "ferrari-458",
        "458イタリア",
        "Ferrari 458 Italia",
        [
          "458 ITALIA",
          "FERRARI 458",
          "フェラーリ458",
        ],
        ["coupe", "sports"],
        "legacy",
        20,
      ),

      defineModel(
        "ferrari-488",
        "488GTB",
        "Ferrari 488 GTB",
        [
          "488 GTB",
          "FERRARI 488",
          "フェラーリ488",
          "488スパイダー",
        ],
        ["coupe", "convertible", "sports"],
        "legacy",
        20,
      ),

      defineModel(
        "ferrari-f8",
        "F8トリブート",
        "Ferrari F8 Tributo",
        [
          "F8 TRIBUTO",
          "FERRARI F8",
          "フェラーリF8",
        ],
        ["coupe", "sports"],
        "legacy",
        20,
      ),

      defineModel(
        "ferrari-roma",
        "ローマ",
        "Ferrari Roma",
        [
          "ROMA",
          "FERRARI ROMA",
          "フェラーリローマ",
        ],
        ["coupe", "sports", "luxury"],
        "current",
        20,
      ),
    ],
  },

  {
    makerId: "lamborghini",
    brandId: null,

    models: [
      defineModel(
        "lamborghini-huracan",
        "ウラカン",
        "Lamborghini Huracan",
        [
          "HURACAN",
          "ランボルギーニウラカン",
        ],
        ["coupe", "convertible", "sports"],
        "current",
        15,
      ),

      defineModel(
        "lamborghini-aventador",
        "アヴェンタドール",
        "Lamborghini Aventador",
        [
          "AVENTADOR",
          "アベンタドール",
          "ランボルギーニアヴェンタドール",
        ],
        ["coupe", "convertible", "sports"],
        "legacy",
        15,
      ),

      defineModel(
        "lamborghini-urus",
        "ウルス",
        "Lamborghini Urus",
        [
          "URUS",
          "ランボルギーニウルス",
        ],
        ["suv", "luxury", "sports"],
        "current",
        10,
      ),
    ],
  },

  {
    makerId: "bentley",
    brandId: null,

    models: [
      defineModel(
        "bentley-continental-gt",
        "コンチネンタルGT",
        "Bentley Continental GT",
        [
          "CONTINENTAL GT",
          "ベントレーコンチネンタルGT",
        ],
        ["coupe", "convertible", "luxury"],
        "current",
        10,
      ),

      defineModel(
        "bentley-flying-spur",
        "フライングスパー",
        "Bentley Flying Spur",
        [
          "FLYING SPUR",
          "ベントレーフライングスパー",
        ],
        ["sedan", "luxury"],
        "current",
        15,
      ),

      defineModel(
        "bentley-bentayga",
        "ベンテイガ",
        "Bentley Bentayga",
        [
          "BENTAYGA",
          "ベントレーベンテイガ",
        ],
        ["suv", "luxury"],
        "current",
        10,
      ),
    ],
  },

  {
    makerId: "rolls-royce",
    brandId: null,

    models: [
      defineModel(
        "rolls-royce-ghost",
        "ゴースト",
        "Rolls-Royce Ghost",
        [
          "ROLLS-ROYCE GHOST",
          "ロールスロイスゴースト",
        ],
        ["sedan", "luxury"],
        "current",
        15,
      ),

      defineModel(
        "rolls-royce-phantom",
        "ファントム",
        "Rolls-Royce Phantom",
        [
          "ROLLS-ROYCE PHANTOM",
          "ロールスロイスファントム",
        ],
        ["sedan", "luxury"],
        "current",
        15,
      ),

      defineModel(
        "rolls-royce-cullinan",
        "カリナン",
        "Rolls-Royce Cullinan",
        [
          "CULLINAN",
          "ロールスロイスカリナン",
        ],
        ["suv", "luxury"],
        "current",
        15,
      ),
    ],
  },
];

/**
 * 車種辞書の全項目。
 */
export const vehicleModels =
  Object.freeze(
    modelGroups.flatMap(
      ({
        makerId,
        brandId,
        models: groupModels,
      }) =>
        groupModels.map((model) =>
          createModelEntry({
            ...model,
            makerId,
            brandId,
          }),
        ),
    ),
  );

/**
 * modelsという名前でも利用できるようにする。
 */
export const models = vehicleModels;

/**
 * 入力文字列を車種比較用に正規化する。
 *
 * 例：
 * N-BOX
 * N BOX
 * nbox
 *
 * 上記を同じ形式へ近づける。
 */
export function normalizeModelText(
  value,
) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase("ja-JP")
    .replace(/[®™©]/g, "")
    .replace(/[\s\u3000]/g, "")
    .replace(
      /[・･.,，。'’"`´:：;+＋!！?？]/g,
      "",
    )
    .replace(
      /[()[\]{}【】「」『』〈〉《》]/g,
      "",
    )
    .replace(/[\/\\|]/g, "")
    .replace(
      /[-‐-‒–—―ー]/g,
      "",
    );
}

const entryById = new Map();

const entriesByNormalizedKeyword =
  new Map();

for (const entry of vehicleModels) {
  entryById.set(entry.id, entry);

  for (const keyword of entry.keywords) {
    const normalizedKeyword =
      normalizeModelText(keyword);

    if (!normalizedKeyword) {
      continue;
    }

    const currentEntries =
      entriesByNormalizedKeyword.get(
        normalizedKeyword,
      ) || [];

    entriesByNormalizedKeyword.set(
      normalizedKeyword,
      [...currentEntries, entry].sort(
        (first, second) => {
          if (
            first.priority !==
            second.priority
          ) {
            return (
              first.priority -
              second.priority
            );
          }

          return first.name.localeCompare(
            second.name,
            "ja",
          );
        },
      ),
    );
  }
}

/**
 * 正規表現用の文字をエスケープする。
 */
function escapeRegExp(value) {
  return String(value).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );
}

/**
 * RX、NX、A3、X5など短い英数字車種を文章内から検出する。
 *
 * 例：
 * RXありますか
 * BMW X5を探しています
 */
function containsShortAsciiKeyword(
  sourceText,
  keyword,
) {
  const normalizedKeyword =
    String(keyword ?? "")
      .normalize("NFKC")
      .trim();

  if (
    !/^[a-z0-9]{1,2}$/i.test(
      normalizedKeyword,
    )
  ) {
    return false;
  }

  const pattern = new RegExp(
    `(^|[^a-z0-9])${escapeRegExp(
      normalizedKeyword,
    )}([^a-z0-9]|$)`,
    "i",
  );

  return pattern.test(
    String(sourceText ?? "").normalize(
      "NFKC",
    ),
  );
}

/**
 * IDから車種を取得する。
 */
export function getModelById(id) {
  if (!id) {
    return null;
  }

  return (
    entryById.get(String(id)) || null
  );
}

/**
 * 入力と完全一致する最優先の車種を返す。
 */
export function findModelByExactText(
  text,
) {
  const normalizedText =
    normalizeModelText(text);

  if (!normalizedText) {
    return null;
  }

  const matches =
    entriesByNormalizedKeyword.get(
      normalizedText,
    ) || [];

  return matches[0] || null;
}

/**
 * 入力と完全一致する車種をすべて返す。
 */
export function findAllModelsByExactText(
  text,
) {
  const normalizedText =
    normalizeModelText(text);

  if (!normalizedText) {
    return [];
  }

  return (
    entriesByNormalizedKeyword.get(
      normalizedText,
    ) || []
  );
}

/**
 * メーカーIDに属する車種を返す。
 */
export function getModelsByMaker(
  makerId,
) {
  const normalizedMakerId =
    String(makerId ?? "").trim();

  if (!normalizedMakerId) {
    return [];
  }

  return vehicleModels.filter(
    (entry) =>
      entry.makerId ===
      normalizedMakerId,
  );
}

/**
 * ブランドIDに属する車種を返す。
 */
export function getModelsByBrand(
  brandId,
) {
  const normalizedBrandId =
    String(brandId ?? "").trim();

  if (!normalizedBrandId) {
    return [];
  }

  return vehicleModels.filter(
    (entry) =>
      entry.brandId ===
      normalizedBrandId,
  );
}

/**
 * ボディタイプに属する車種を返す。
 */
export function getModelsByBodyType(
  bodyType,
) {
  const normalizedBodyType =
    String(bodyType ?? "").trim();

  if (!normalizedBodyType) {
    return [];
  }

  return vehicleModels.filter(
    (entry) =>
      entry.bodyTypes.includes(
        normalizedBodyType,
      ),
  );
}

/**
 * 文章から車種を検索する。
 *
 * 検索順：
 * 1. 完全一致
 * 2. 入力の先頭に車種名
 * 3. 入力文中に車種名
 * 4. 車種名の途中まで入力
 */
export function searchModelDictionary(
  text,
  {
    makerId = null,
    brandId = null,
    bodyType = null,
    limit = 10,
  } = {},
) {
  const sourceText = String(
    text ?? "",
  );

  const normalizedText =
    normalizeModelText(sourceText);

  if (!normalizedText) {
    return [];
  }

  const safeLimit = Math.max(
    1,
    Math.min(
      Number(limit) || 10,
      50,
    ),
  );

  const results = [];

  for (const entry of vehicleModels) {
    if (
      makerId &&
      entry.makerId !== makerId
    ) {
      continue;
    }

    if (
      brandId &&
      entry.brandId !== brandId
    ) {
      continue;
    }

    if (
      bodyType &&
      !entry.bodyTypes.includes(
        bodyType,
      )
    ) {
      continue;
    }

    let bestScore = 0;
    let matchedKeyword = null;

    for (const keyword of entry.keywords) {
      const normalizedKeyword =
        normalizeModelText(keyword);

      if (!normalizedKeyword) {
        continue;
      }

      if (
        normalizedText ===
        normalizedKeyword
      ) {
        const score =
          10000 -
          entry.priority +
          normalizedKeyword.length;

        if (score > bestScore) {
          bestScore = score;
          matchedKeyword = keyword;
        }

        continue;
      }

      if (
        normalizedKeyword.length < 3
      ) {
        if (
          containsShortAsciiKeyword(
            sourceText,
            keyword,
          )
        ) {
          const score =
            6500 -
            entry.priority +
            normalizedKeyword.length;

          if (score > bestScore) {
            bestScore = score;
            matchedKeyword = keyword;
          }
        }

        continue;
      }

      if (
        normalizedText.startsWith(
          normalizedKeyword,
        )
      ) {
        const score =
          7000 -
          entry.priority +
          normalizedKeyword.length;

        if (score > bestScore) {
          bestScore = score;
          matchedKeyword = keyword;
        }

        continue;
      }

      if (
        normalizedText.includes(
          normalizedKeyword,
        )
      ) {
        const score =
          5000 -
          entry.priority +
          normalizedKeyword.length;

        if (score > bestScore) {
          bestScore = score;
          matchedKeyword = keyword;
        }

        continue;
      }

      if (
        normalizedText.length >= 3 &&
        normalizedKeyword.startsWith(
          normalizedText,
        )
      ) {
        const score =
          3000 -
          entry.priority +
          normalizedText.length;

        if (score > bestScore) {
          bestScore = score;
          matchedKeyword = keyword;
        }
      }
    }

    if (bestScore > 0) {
      results.push({
        entry,
        score: bestScore,
        matchedKeyword,
      });
    }
  }

  return results
    .sort((first, second) => {
      if (
        first.score !== second.score
      ) {
        return (
          second.score - first.score
        );
      }

      if (
        first.entry.priority !==
        second.entry.priority
      ) {
        return (
          first.entry.priority -
          second.entry.priority
        );
      }

      return first.entry.name.localeCompare(
        second.entry.name,
        "ja",
      );
    })
    .slice(0, safeLimit);
}
