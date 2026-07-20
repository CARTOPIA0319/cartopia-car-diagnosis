/**
 * ==========================================================
 * ブランド・技術名称辞書
 * ==========================================================
 *
 * 上段：
 * - 車両ブランド
 * - 高級ブランド
 * - スポーツブランド
 * - チューニングブランド
 * - デザインブランド
 * - 過去ブランド
 *
 * 下段：
 * - ハイブリッドシステム
 * - 四輪駆動システム
 * - 安全運転支援
 * - エンジン技術
 * - 変速機
 * - インフォテインメント
 *
 * schema.jsとの整合性を保つため、
 * technologyも辞書上のtypeは「brand」とする。
 *
 * section:
 * - brand
 * - technology
 *
 * 中国・韓国メーカー関連は意図的に除外している。
 */

export const BRAND_SECTIONS = Object.freeze({
  BRAND: "brand",
  TECHNOLOGY: "technology",
});

const DICTIONARY_TYPE = "brand";

const unique = (values) => {
  return [
    ...new Set(
      values
        .filter((value) => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ];
};

const createDictionaryEntry = ({
  id,
  name,
  nameEn,
  aliases = [],
  makerId = null,
  section,
  kind,
  status = "current",
  priority = 100,
}) => {
  const keywords = unique([name, nameEn, ...aliases]);

  return Object.freeze({
    id,
    type: DICTIONARY_TYPE,
    name,
    nameEn,
    aliases: unique(aliases),
    keywords,

    // schema.jsとの共通項目
    parent: makerId,
    category: kind,
    tags: unique([
      section,
      kind,
      status,
      makerId ? `maker:${makerId}` : null,
    ]),
    priority,

    // brands.js固有項目
    makerId,
    section,
    kind,
    status,
  });
};

/**
 * 配列の順番
 *
 * 0: id
 * 1: 日本語名称
 * 2: 英語名称
 * 3: 別名・入力ゆれ
 * 4: 親メーカーID
 * 5: 種別
 * 6: 状態
 * 7: 検索優先度
 */
const brandRows = [
  // ========================================================
  // トヨタ
  // ========================================================

  [
    "lexus",
    "レクサス",
    "Lexus",
    ["LEXUS", "レクサスブランド"],
    "toyota",
    "luxury-brand",
    "current",
    10,
  ],

  [
    "lexus-f-sport",
    "F SPORT",
    "Lexus F SPORT",
    [
      "Fスポーツ",
      "F SPORT",
      "FSPORT",
      "LEXUS F SPORT",
      "レクサスFスポーツ",
    ],
    "toyota",
    "performance-line",
    "current",
    20,
  ],

  [
    "toyota-gr",
    "GR",
    "Toyota Gazoo Racing",
    [
      "GR",
      "ジーアール",
      "GAZOO RACING",
      "TOYOTA GAZOO RACING",
      "トヨタガズーレーシング",
      "ガズーレーシング",
      "TGR",
    ],
    "toyota",
    "performance-brand",
    "current",
    15,
  ],

  [
    "trd",
    "TRD",
    "Toyota Racing Development",
    [
      "TRD",
      "ティーアールディー",
      "TOYOTA RACING DEVELOPMENT",
      "トヨタレーシングデベロップメント",
    ],
    "toyota",
    "tuning-brand",
    "current",
    20,
  ],

  [
    "modellista",
    "モデリスタ",
    "MODELLISTA",
    [
      "MODELLISTA",
      "モデリスタ",
      "トヨタモデリスタ",
      "TOYOTA MODELLISTA",
    ],
    "toyota",
    "design-brand",
    "current",
    20,
  ],

  [
    "scion",
    "サイオン",
    "Scion",
    ["SCION", "サイオン"],
    "toyota",
    "historical-marque",
    "historical",
    45,
  ],

  // ========================================================
  // ホンダ
  // ========================================================

  [
    "acura",
    "アキュラ",
    "Acura",
    ["ACURA", "アキュラ"],
    "honda",
    "luxury-brand",
    "current",
    25,
  ],

  [
    "honda-type-r",
    "タイプR",
    "Honda Type R",
    [
      "タイプR",
      "TYPE R",
      "TYPER",
      "HONDA TYPE R",
      "ホンダタイプR",
    ],
    "honda",
    "performance-line",
    "current",
    15,
  ],

  [
    "mugen",
    "無限",
    "MUGEN",
    [
      "無限",
      "MUGEN",
      "ムゲン",
      "M-TEC",
      "エムテック",
      "無限MUGEN",
    ],
    "honda",
    "tuning-brand",
    "current",
    20,
  ],

  // ========================================================
  // 日産
  // ========================================================

  [
    "infiniti",
    "インフィニティ",
    "INFINITI",
    [
      "INFINITI",
      "インフィニティ",
      "インフィニティブランド",
    ],
    "nissan",
    "luxury-brand",
    "current",
    25,
  ],

  [
    "nismo",
    "NISMO",
    "Nissan Motorsports International",
    [
      "NISMO",
      "ニスモ",
      "NISSAN MOTORSPORTS",
      "NISSAN MOTORSPORTS INTERNATIONAL",
      "日産モータースポーツ",
    ],
    "nissan",
    "performance-brand",
    "current",
    15,
  ],

  [
    "autech",
    "AUTECH",
    "AUTECH",
    [
      "AUTECH",
      "オーテック",
      "オーテックジャパン",
      "AUTECH JAPAN",
    ],
    "nissan",
    "custom-brand",
    "current",
    15,
  ],

  [
    "datsun",
    "ダットサン",
    "Datsun",
    [
      "DATSUN",
      "ダットサン",
      "ダットサンブランド",
    ],
    "nissan",
    "historical-marque",
    "historical",
    35,
  ],

  [
    "impul",
    "インパル",
    "IMPUL",
    [
      "IMPUL",
      "インパル",
      "ホシノインパル",
      "HOSHINO IMPUL",
    ],
    "nissan",
    "tuning-brand",
    "current",
    30,
  ],

  // ========================================================
  // 三菱・SUBARU・マツダ・スズキ・ダイハツ
  // ========================================================

  [
    "ralliart",
    "ラリーアート",
    "RALLIART",
    [
      "RALLIART",
      "ラリーアート",
      "三菱ラリーアート",
      "MITSUBISHI RALLIART",
    ],
    "mitsubishi-motors",
    "performance-brand",
    "current",
    20,
  ],

  [
    "sti",
    "STI",
    "Subaru Tecnica International",
    [
      "STI",
      "エスティーアイ",
      "SUBARU TECNICA INTERNATIONAL",
      "スバルテクニカインターナショナル",
      "STI SPORT",
      "STIスポーツ",
    ],
    "subaru",
    "performance-brand",
    "current",
    15,
  ],

  [
    "mazdaspeed",
    "マツダスピード",
    "Mazdaspeed",
    [
      "MAZDASPEED",
      "MAZDA SPEED",
      "マツダスピード",
    ],
    "mazda",
    "performance-brand",
    "legacy",
    25,
  ],

  [
    "autoexe",
    "オートエクゼ",
    "AutoExe",
    [
      "AUTOEXE",
      "AUTO EXE",
      "オートエクゼ",
      "オートエグゼ",
    ],
    "mazda",
    "tuning-brand",
    "current",
    30,
  ],

  [
    "suzuki-sport",
    "スズキスポーツ",
    "Suzuki Sport",
    [
      "SUZUKI SPORT",
      "スズキスポーツ",
    ],
    "suzuki",
    "performance-brand",
    "legacy",
    30,
  ],

  [
    "d-sport",
    "D-SPORT",
    "D-SPORT",
    [
      "D-SPORT",
      "D SPORT",
      "ディースポーツ",
      "DSPORT",
    ],
    "daihatsu",
    "tuning-brand",
    "current",
    25,
  ],

  // ========================================================
  // BMW・MINI
  // ========================================================

  [
    "mini",
    "MINI",
    "MINI",
    [
      "MINI",
      "ミニ",
      "BMW MINI",
      "BMWミニ",
      "ミニクーパー",
    ],
    "bmw",
    "consumer-brand",
    "current",
    15,
  ],

  [
    "john-cooper-works",
    "ジョン・クーパー・ワークス",
    "John Cooper Works",
    [
      "JOHN COOPER WORKS",
      "ジョンクーパーワークス",
      "JCW",
      "MINI JCW",
      "ミニJCW",
    ],
    "bmw",
    "performance-brand",
    "current",
    20,
  ],

  [
    "bmw-m",
    "BMW M",
    "BMW M",
    [
      "BMW M",
      "BMWM",
      "BMWエム",
      "Mモデル",
      "M POWER",
      "Mパワー",
    ],
    "bmw",
    "performance-brand",
    "current",
    15,
  ],

  [
    "bmw-m-performance",
    "M Performance",
    "BMW M Performance",
    [
      "M PERFORMANCE",
      "Mパフォーマンス",
      "BMW M PERFORMANCE",
      "BMW Mパフォーマンス",
    ],
    "bmw",
    "performance-line",
    "current",
    20,
  ],

  [
    "bmw-m-sport",
    "M Sport",
    "BMW M Sport",
    [
      "M SPORT",
      "MSPORT",
      "Mスポーツ",
      "BMW M SPORT",
      "BMW Mスポーツ",
    ],
    "bmw",
    "design-line",
    "current",
    15,
  ],

  [
    "bmw-i",
    "BMW i",
    "BMW i",
    [
      "BMW I",
      "BMWI",
      "BMWアイ",
      "BMW Iシリーズ",
    ],
    "bmw",
    "electric-brand",
    "current",
    25,
  ],

  [
    "bmw-alpina",
    "BMWアルピナ",
    "BMW ALPINA",
    [
      "ALPINA",
      "アルピナ",
      "BMW ALPINA",
      "BMWアルピナ",
    ],
    "bmw",
    "luxury-performance-brand",
    "current",
    20,
  ],

  // ========================================================
  // メルセデス・ベンツ
  // ========================================================

  [
    "mercedes-amg",
    "メルセデスAMG",
    "Mercedes-AMG",
    [
      "AMG",
      "エーエムジー",
      "メルセデスAMG",
      "メルセデス AMG",
      "MERCEDES-AMG",
      "MERCEDES AMG",
      "ベンツAMG",
    ],
    "mercedes-benz",
    "performance-brand",
    "current",
    15,
  ],

  [
    "amg-line",
    "AMGライン",
    "AMG Line",
    [
      "AMG LINE",
      "AMGライン",
      "AMGラインパッケージ",
      "AMG LINE PACKAGE",
    ],
    "mercedes-benz",
    "design-line",
    "current",
    15,
  ],

  [
    "mercedes-maybach",
    "メルセデス・マイバッハ",
    "Mercedes-Maybach",
    [
      "MAYBACH",
      "マイバッハ",
      "MERCEDES-MAYBACH",
      "MERCEDES MAYBACH",
      "メルセデスマイバッハ",
    ],
    "mercedes-benz",
    "luxury-brand",
    "current",
    20,
  ],

  [
    "mercedes-eq",
    "メルセデスEQ",
    "Mercedes-EQ",
    [
      "MERCEDES-EQ",
      "MERCEDES EQ",
      "メルセデスEQ",
      "ベンツEQ",
      "EQブランド",
    ],
    "mercedes-benz",
    "electric-brand",
    "current",
    25,
  ],

  [
    "brabus",
    "ブラバス",
    "BRABUS",
    [
      "BRABUS",
      "ブラバス",
      "ブラブス",
      "BRABUS AUTOMOTIVE",
    ],
    "mercedes-benz",
    "tuning-brand",
    "current",
    30,
  ],

  // ========================================================
  // アウディ・フォルクスワーゲン・スマート
  // ========================================================

  [
    "audi-s-line",
    "S line",
    "Audi S line",
    [
      "S LINE",
      "SLINE",
      "Sライン",
      "AUDI S LINE",
      "アウディSライン",
    ],
    "audi",
    "design-line",
    "current",
    20,
  ],

  [
    "audi-sport",
    "Audi Sport",
    "Audi Sport",
    [
      "AUDI SPORT",
      "アウディスポーツ",
      "AUDI RS",
      "アウディRS",
    ],
    "audi",
    "performance-brand",
    "current",
    20,
  ],

  [
    "volkswagen-r",
    "Volkswagen R",
    "Volkswagen R",
    [
      "VOLKSWAGEN R",
      "VW R",
      "フォルクスワーゲンR",
      "ワーゲンR",
    ],
    "volkswagen",
    "performance-brand",
    "current",
    25,
  ],

  [
    "volkswagen-gti",
    "GTI",
    "Volkswagen GTI",
    [
      "GTI",
      "VW GTI",
      "VOLKSWAGEN GTI",
      "フォルクスワーゲンGTI",
      "ワーゲンGTI",
    ],
    "volkswagen",
    "performance-line",
    "current",
    20,
  ],

  [
    "volkswagen-r-line",
    "R-Line",
    "Volkswagen R-Line",
    [
      "R-LINE",
      "R LINE",
      "RLINE",
      "Rライン",
      "VW R-LINE",
      "フォルクスワーゲンRライン",
    ],
    "volkswagen",
    "design-line",
    "current",
    20,
  ],

  [
    "smart",
    "スマート",
    "smart",
    [
      "SMART",
      "スマート",
      "MERCEDES SMART",
      "メルセデススマート",
    ],
    "smart-automobile",
    "consumer-brand",
    "current",
    25,
  ],

  // ========================================================
  // フランス
  // ========================================================

  [
    "peugeot",
    "プジョー",
    "Peugeot",
    ["PEUGEOT", "プジョー"],
    "stellantis",
    "consumer-brand",
    "current",
    20,
  ],

  [
    "citroen",
    "シトロエン",
    "Citroën",
    [
      "CITROEN",
      "CITROËN",
      "シトロエン",
      "シトローエン",
    ],
    "stellantis",
    "consumer-brand",
    "current",
    20,
  ],

  [
    "ds-automobiles",
    "DSオートモビル",
    "DS Automobiles",
    [
      "DS",
      "DS AUTOMOBILES",
      "DSオートモビル",
      "DSオートモビルズ",
      "シトロエンDS",
    ],
    "stellantis",
    "luxury-brand",
    "current",
    25,
  ],

  [
    "alpine",
    "アルピーヌ",
    "Alpine",
    [
      "ALPINE",
      "アルピーヌ",
      "アルパイン",
      "RENAULT ALPINE",
      "ルノーアルピーヌ",
    ],
    "renault",
    "performance-brand",
    "current",
    25,
  ],

  [
    "renault-sport",
    "ルノー・スポール",
    "Renault Sport",
    [
      "RENAULT SPORT",
      "RENAULTSPORT",
      "ルノースポール",
      "ルノースポーツ",
    ],
    "renault",
    "performance-brand",
    "legacy",
    30,
  ],

  // ========================================================
  // イタリア・ステランティス系
  // ========================================================

  [
    "fiat",
    "フィアット",
    "FIAT",
    ["FIAT", "フィアット"],
    "stellantis",
    "consumer-brand",
    "current",
    20,
  ],

  [
    "abarth",
    "アバルト",
    "Abarth",
    [
      "ABARTH",
      "アバルト",
      "フィアットアバルト",
      "FIAT ABARTH",
    ],
    "stellantis",
    "performance-brand",
    "current",
    20,
  ],

  [
    "alfa-romeo",
    "アルファロメオ",
    "Alfa Romeo",
    [
      "ALFA ROMEO",
      "ALFAROMEO",
      "アルファロメオ",
      "アルファ ロメオ",
    ],
    "stellantis",
    "consumer-brand",
    "current",
    20,
  ],

  [
    "lancia",
    "ランチア",
    "Lancia",
    ["LANCIA", "ランチア"],
    "stellantis",
    "consumer-brand",
    "current",
    35,
  ],

  // ========================================================
  // Jeep・Chrysler・Dodge・Ram
  // ========================================================

  [
    "jeep",
    "ジープ",
    "Jeep",
    [
      "JEEP",
      "ジープ",
      "クライスラージープ",
      "CHRYSLER JEEP",
    ],
    "stellantis",
    "consumer-brand",
    "current",
    15,
  ],

  [
    "chrysler",
    "クライスラー",
    "Chrysler",
    ["CHRYSLER", "クライスラー"],
    "stellantis",
    "consumer-brand",
    "current",
    25,
  ],

  [
    "dodge",
    "ダッジ",
    "Dodge",
    [
      "DODGE",
      "ダッジ",
      "ダッヂ",
      "クライスラーダッジ",
    ],
    "stellantis",
    "consumer-brand",
    "current",
    20,
  ],

  [
    "ram",
    "ラム",
    "Ram",
    [
      "RAM",
      "RAM TRUCKS",
      "ラム",
      "ラムトラック",
      "ダッジラム",
      "DODGE RAM",
    ],
    "stellantis",
    "commercial-brand",
    "current",
    25,
  ],

  [
    "srt",
    "SRT",
    "Street and Racing Technology",
    [
      "SRT",
      "STREET AND RACING TECHNOLOGY",
      "ストリートアンドレーシングテクノロジー",
    ],
    "stellantis",
    "performance-brand",
    "current",
    30,
  ],

  [
    "mopar",
    "モパー",
    "Mopar",
    [
      "MOPAR",
      "モパー",
      "MOTOR PARTS",
    ],
    "stellantis",
    "parts-tuning-brand",
    "current",
    30,
  ],

  [
    "opel-brand",
    "オペル",
    "Opel",
    ["OPEL", "オペル"],
    "opel",
    "consumer-brand",
    "current",
    30,
  ],

  // ========================================================
  // GM
  // ========================================================

  [
    "chevrolet",
    "シボレー",
    "Chevrolet",
    [
      "CHEVROLET",
      "シボレー",
      "シェブロレー",
      "CHEVY",
      "シェビー",
    ],
    "general-motors",
    "consumer-brand",
    "current",
    15,
  ],

  [
    "cadillac",
    "キャデラック",
    "Cadillac",
    [
      "CADILLAC",
      "キャデラック",
      "キャディラック",
    ],
    "general-motors",
    "luxury-brand",
    "current",
    20,
  ],

  [
    "gmc",
    "GMC",
    "GMC",
    [
      "GMC",
      "ジーエムシー",
      "GENERAL MOTORS TRUCK COMPANY",
    ],
    "general-motors",
    "commercial-brand",
    "current",
    25,
  ],

  [
    "buick",
    "ビュイック",
    "Buick",
    [
      "BUICK",
      "ビュイック",
      "ビューイック",
    ],
    "general-motors",
    "luxury-brand",
    "current",
    30,
  ],

  [
    "hummer",
    "ハマー",
    "HUMMER",
    [
      "HUMMER",
      "ハマー",
      "GM HUMMER",
      "GMC HUMMER",
      "ハンマー",
    ],
    "general-motors",
    "off-road-brand",
    "legacy",
    15,
  ],

  [
    "pontiac",
    "ポンティアック",
    "Pontiac",
    [
      "PONTIAC",
      "ポンティアック",
      "ポンテアック",
    ],
    "general-motors",
    "historical-marque",
    "historical",
    35,
  ],

  [
    "saturn",
    "サターン",
    "Saturn",
    ["SATURN", "サターン"],
    "general-motors",
    "historical-marque",
    "historical",
    40,
  ],

  [
    "oldsmobile",
    "オールズモビル",
    "Oldsmobile",
    [
      "OLDSMOBILE",
      "オールズモビル",
      "オールズモービル",
    ],
    "general-motors",
    "historical-marque",
    "historical",
    45,
  ],

  // ========================================================
  // フォード系
  // ========================================================

  [
    "lincoln",
    "リンカーン",
    "Lincoln",
    [
      "LINCOLN",
      "リンカーン",
      "FORD LINCOLN",
      "フォードリンカーン",
    ],
    "ford-motor",
    "luxury-brand",
    "current",
    25,
  ],

  [
    "mercury",
    "マーキュリー",
    "Mercury",
    [
      "MERCURY",
      "マーキュリー",
      "フォードマーキュリー",
    ],
    "ford-motor",
    "historical-marque",
    "historical",
    35,
  ],

  [
    "ford-performance",
    "フォード・パフォーマンス",
    "Ford Performance",
    [
      "FORD PERFORMANCE",
      "フォードパフォーマンス",
      "FORD RACING",
      "フォードレーシング",
    ],
    "ford-motor",
    "performance-brand",
    "current",
    30,
  ],

  [
    "shelby",
    "シェルビー",
    "Shelby",
    [
      "SHELBY",
      "シェルビー",
      "SHELBY AMERICAN",
      "シェルビーアメリカン",
    ],
    "ford-motor",
    "performance-brand",
    "current",
    25,
  ],

  [
    "saleen",
    "サリーン",
    "Saleen",
    [
      "SALEEN",
      "サリーン",
      "サリーンオートモーティブ",
      "SALEEN AUTOMOTIVE",
    ],
    "ford-motor",
    "tuning-brand",
    "current",
    35,
  ],

  // ========================================================
  // JLR
  // ========================================================

  [
    "jaguar",
    "ジャガー",
    "Jaguar",
    [
      "JAGUAR",
      "ジャガー",
      "ジャグアー",
    ],
    "jaguar-land-rover",
    "luxury-brand",
    "current",
    15,
  ],

  [
    "land-rover",
    "ランドローバー",
    "Land Rover",
    [
      "LAND ROVER",
      "LANDROVER",
      "ランドローバー",
      "ランド ローバー",
    ],
    "jaguar-land-rover",
    "off-road-brand",
    "current",
    15,
  ],

  [
    "range-rover",
    "レンジローバー",
    "Range Rover",
    [
      "RANGE ROVER",
      "RANGEROVER",
      "レンジローバー",
      "レンジ ローバー",
    ],
    "jaguar-land-rover",
    "luxury-brand",
    "current",
    15,
  ],

  [
    "defender-brand",
    "ディフェンダー",
    "Defender",
    [
      "DEFENDER",
      "ディフェンダー",
      "ランドローバーディフェンダー",
    ],
    "jaguar-land-rover",
    "model-family-brand",
    "current",
    20,
  ],

  [
    "discovery-brand",
    "ディスカバリー",
    "Discovery",
    [
      "DISCOVERY",
      "ディスカバリー",
      "ランドローバーディスカバリー",
    ],
    "jaguar-land-rover",
    "model-family-brand",
    "current",
    20,
  ],

  [
    "jlr-sv",
    "SV",
    "JLR Special Vehicle Operations",
    [
      "JLR SV",
      "SPECIAL VEHICLE OPERATIONS",
      "SVO",
      "SVR",
      "スペシャルビークルオペレーションズ",
      "ジャガーSVR",
      "レンジローバーSVR",
    ],
    "jaguar-land-rover",
    "performance-brand",
    "current",
    25,
  ],

  // ========================================================
  // スウェーデン・スペイン・その他欧州
  // ========================================================

  [
    "volvo-brand",
    "ボルボ",
    "Volvo",
    [
      "VOLVO",
      "ボルボ",
      "VOLVO CARS",
      "ボルボカーズ",
    ],
    "volvo-cars",
    "consumer-brand",
    "current",
    15,
  ],

  [
    "polestar-engineered",
    "ポールスター・エンジニアード",
    "Polestar Engineered",
    [
      "POLESTAR ENGINEERED",
      "ポールスターエンジニアード",
      "VOLVO POLESTAR",
      "ボルボポールスター",
    ],
    "volvo-cars",
    "performance-line",
    "current",
    30,
  ],

  [
    "saab",
    "サーブ",
    "Saab",
    [
      "SAAB",
      "サーブ",
      "SAAB AUTOMOBILE",
    ],
    null,
    "historical-marque",
    "historical",
    35,
  ],

  [
    "cupra",
    "クプラ",
    "CUPRA",
    [
      "CUPRA",
      "クプラ",
      "SEAT CUPRA",
      "セアトクプラ",
    ],
    "seat",
    "performance-brand",
    "current",
    35,
  ],

  [
    "bugatti",
    "ブガッティ",
    "Bugatti",
    [
      "BUGATTI",
      "ブガッティ",
      "BUGATTI AUTOMOBILES",
    ],
    "bugatti-rimac",
    "luxury-performance-brand",
    "current",
    35,
  ],
];
const technologyRows = [
  // ========================================================
  // トヨタ
  // ========================================================

  [
    "toyota-safety-sense",
    "Toyota Safety Sense",
    "Toyota Safety Sense",
    [
      "TOYOTA SAFETY SENSE",
      "トヨタセーフティセンス",
      "セーフティセンス",
      "TSS",
      "TSSP",
      "TSS C",
      "TSS P",
    ],
    "toyota",
    "safety-system",
    "current",
    10,
  ],

  [
    "toyota-teammate",
    "Toyota Teammate",
    "Toyota Teammate",
    [
      "TOYOTA TEAMMATE",
      "トヨタチームメイト",
      "チームメイト",
      "ADVANCED DRIVE",
      "アドバンストドライブ",
      "ADVANCED PARK",
      "アドバンストパーク",
    ],
    "toyota",
    "driver-assistance",
    "current",
    25,
  ],

  [
    "toyota-hybrid-system",
    "トヨタハイブリッドシステム",
    "Toyota Hybrid System",
    [
      "TOYOTA HYBRID SYSTEM",
      "トヨタハイブリッドシステム",
      "THS",
      "THS II",
      "THS2",
      "HYBRID SYNERGY DRIVE",
      "ハイブリッドシナジードライブ",
    ],
    "toyota",
    "hybrid-system",
    "current",
    10,
  ],

  [
    "e-four",
    "E-Four",
    "E-Four",
    [
      "E-FOUR",
      "E FOUR",
      "EFOUR",
      "イーフォー",
      "電気式4WD",
    ],
    "toyota",
    "awd-system",
    "current",
    15,
  ],

  [
    "dynamic-force",
    "ダイナミックフォース",
    "Dynamic Force",
    [
      "DYNAMIC FORCE",
      "DYNAMIC FORCE ENGINE",
      "ダイナミックフォース",
      "ダイナミックフォースエンジン",
    ],
    "toyota",
    "engine-technology",
    "current",
    25,
  ],

  [
    "vvti",
    "VVT-i",
    "VVT-i",
    [
      "VVT-I",
      "VVTI",
      "VVTi",
      "ブイ・ブイ・ティー・アイ",
      "可変バルブタイミング",
    ],
    "toyota",
    "engine-technology",
    "current",
    20,
  ],

  [
    "valvematic",
    "バルブマチック",
    "VALVEMATIC",
    [
      "VALVEMATIC",
      "バルブマチック",
    ],
    "toyota",
    "engine-technology",
    "current",
    30,
  ],

  [
    "d4s",
    "D-4S",
    "D-4S",
    [
      "D-4S",
      "D4S",
      "D 4S",
      "ディーフォーエス",
    ],
    "toyota",
    "fuel-injection-technology",
    "current",
    30,
  ],

  // ========================================================
  // ホンダ
  // ========================================================

  [
    "honda-ehev",
    "e:HEV",
    "Honda e:HEV",
    [
      "E:HEV",
      "EHEV",
      "E HEV",
      "イーエイチイーブイ",
      "HONDA E:HEV",
      "ホンダEHEV",
    ],
    "honda",
    "hybrid-system",
    "current",
    10,
  ],

  [
    "honda-immd",
    "i-MMD",
    "Intelligent Multi-Mode Drive",
    [
      "I-MMD",
      "IMMD",
      "I MMD",
      "インテリジェントマルチモードドライブ",
    ],
    "honda",
    "hybrid-system",
    "legacy",
    20,
  ],

  [
    "honda-sensing",
    "Honda SENSING",
    "Honda SENSING",
    [
      "HONDA SENSING",
      "ホンダセンシング",
      "センシング",
      "HONDAセンシング",
    ],
    "honda",
    "safety-system",
    "current",
    10,
  ],

  [
    "honda-sensing-360",
    "Honda SENSING 360",
    "Honda SENSING 360",
    [
      "HONDA SENSING 360",
      "HONDA SENSING 360+",
      "HONDA SENSING 360 PLUS",
      "ホンダセンシング360",
      "ホンダセンシング360+",
      "センシング360",
    ],
    "honda",
    "safety-system",
    "current",
    20,
  ],

  [
    "vtec",
    "VTEC",
    "Variable Valve Timing and Lift Electronic Control",
    [
      "VTEC",
      "ブイテック",
      "可変バルブタイミングリフト機構",
    ],
    "honda",
    "engine-technology",
    "current",
    15,
  ],

  [
    "ivtec",
    "i-VTEC",
    "i-VTEC",
    [
      "I-VTEC",
      "IVTEC",
      "I VTEC",
      "アイブイテック",
    ],
    "honda",
    "engine-technology",
    "current",
    20,
  ],

  [
    "vtec-turbo",
    "VTEC TURBO",
    "VTEC TURBO",
    [
      "VTEC TURBO",
      "VTECターボ",
      "ブイテックターボ",
    ],
    "honda",
    "engine-technology",
    "current",
    20,
  ],

  [
    "sh-awd",
    "SH-AWD",
    "Super Handling All-Wheel Drive",
    [
      "SH-AWD",
      "SHAWD",
      "SUPER HANDLING ALL-WHEEL DRIVE",
      "スーパーハンドリングAWD",
    ],
    "honda",
    "awd-system",
    "current",
    30,
  ],

  // ========================================================
  // 日産
  // ========================================================

  [
    "nissan-epower",
    "e-POWER",
    "Nissan e-POWER",
    [
      "E-POWER",
      "EPOWER",
      "E POWER",
      "イーパワー",
      "日産E-POWER",
      "NISSAN E-POWER",
    ],
    "nissan",
    "hybrid-system",
    "current",
    10,
  ],

  [
    "propilot",
    "プロパイロット",
    "ProPILOT",
    [
      "PROPILOT",
      "PRO PILOT",
      "プロパイロット",
      "プロパイロット2.0",
      "PROPILOT 2.0",
    ],
    "nissan",
    "driver-assistance",
    "current",
    10,
  ],

  [
    "e4orce",
    "e-4ORCE",
    "e-4ORCE",
    [
      "E-4ORCE",
      "E4ORCE",
      "E 4ORCE",
      "イーフォース",
      "日産E-4ORCE",
    ],
    "nissan",
    "awd-system",
    "current",
    20,
  ],

  [
    "vc-turbo",
    "VCターボ",
    "VC-Turbo",
    [
      "VC-TURBO",
      "VC TURBO",
      "VCターボ",
      "VARIABLE COMPRESSION TURBO",
      "可変圧縮比エンジン",
    ],
    "nissan",
    "engine-technology",
    "current",
    30,
  ],

  // ========================================================
  // 三菱
  // ========================================================

  [
    "mitsubishi-sawc",
    "S-AWC",
    "Super All Wheel Control",
    [
      "S-AWC",
      "SAWC",
      "SUPER ALL WHEEL CONTROL",
      "スーパーオールホイールコントロール",
    ],
    "mitsubishi-motors",
    "awd-system",
    "current",
    15,
  ],

  [
    "mivec",
    "MIVEC",
    "Mitsubishi Innovative Valve Timing Electronic Control",
    [
      "MIVEC",
      "マイベック",
      "ミベック",
    ],
    "mitsubishi-motors",
    "engine-technology",
    "current",
    25,
  ],

  [
    "mitsubishi-e-assist",
    "e-Assist",
    "Mitsubishi e-Assist",
    [
      "E-ASSIST",
      "EASSIST",
      "イーアシスト",
      "三菱E-ASSIST",
    ],
    "mitsubishi-motors",
    "safety-system",
    "current",
    20,
  ],

  // ========================================================
  // SUBARU
  // ========================================================

  [
    "subaru-eyesight",
    "アイサイト",
    "EyeSight",
    [
      "EYESIGHT",
      "アイサイト",
      "SUBARU EYESIGHT",
      "スバルアイサイト",
    ],
    "subaru",
    "safety-system",
    "current",
    10,
  ],

  [
    "eyesight-x",
    "アイサイトX",
    "EyeSight X",
    [
      "EYESIGHT X",
      "EYESIGHTX",
      "アイサイトX",
      "アイサイトエックス",
    ],
    "subaru",
    "driver-assistance",
    "current",
    15,
  ],

  [
    "symmetrical-awd",
    "シンメトリカルAWD",
    "Symmetrical AWD",
    [
      "SYMMETRICAL AWD",
      "シンメトリカルAWD",
      "シンメトリカル4WD",
      "SUBARU AWD",
    ],
    "subaru",
    "awd-system",
    "current",
    20,
  ],

  [
    "x-mode",
    "X-MODE",
    "X-MODE",
    [
      "X-MODE",
      "XMODE",
      "Xモード",
      "エックスモード",
    ],
    "subaru",
    "traction-system",
    "current",
    20,
  ],

  [
    "subaru-boxer",
    "SUBARU BOXER",
    "Subaru Boxer Engine",
    [
      "SUBARU BOXER",
      "BOXER ENGINE",
      "ボクサーエンジン",
      "水平対向エンジン",
    ],
    "subaru",
    "engine-technology",
    "current",
    25,
  ],

  // ========================================================
  // マツダ
  // ========================================================

  [
    "skyactiv",
    "SKYACTIV",
    "SKYACTIV Technology",
    [
      "SKYACTIV",
      "SKY ACTIVE",
      "スカイアクティブ",
      "SKYACTIV TECHNOLOGY",
    ],
    "mazda",
    "technology-family",
    "current",
    10,
  ],

  [
    "skyactiv-g",
    "SKYACTIV-G",
    "SKYACTIV-G",
    [
      "SKYACTIV-G",
      "SKYACTIV G",
      "スカイアクティブG",
      "スカイアクティブガソリン",
    ],
    "mazda",
    "engine-technology",
    "current",
    15,
  ],

  [
    "skyactiv-d",
    "SKYACTIV-D",
    "SKYACTIV-D",
    [
      "SKYACTIV-D",
      "SKYACTIV D",
      "スカイアクティブD",
      "スカイアクティブディーゼル",
    ],
    "mazda",
    "engine-technology",
    "current",
    15,
  ],

  [
    "skyactiv-x",
    "SKYACTIV-X",
    "SKYACTIV-X",
    [
      "SKYACTIV-X",
      "SKYACTIV X",
      "スカイアクティブX",
    ],
    "mazda",
    "engine-technology",
    "current",
    20,
  ],

  [
    "e-skyactiv",
    "e-SKYACTIV",
    "e-SKYACTIV",
    [
      "E-SKYACTIV",
      "ESKYACTIV",
      "E SKYACTIV",
      "イースカイアクティブ",
    ],
    "mazda",
    "electrification-technology",
    "current",
    20,
  ],

  [
    "i-activ-awd",
    "i-ACTIV AWD",
    "i-ACTIV AWD",
    [
      "I-ACTIV AWD",
      "IACTIV AWD",
      "I ACTIV AWD",
      "アイアクティブAWD",
    ],
    "mazda",
    "awd-system",
    "current",
    20,
  ],

  [
    "g-vectoring-control",
    "Gベクタリングコントロール",
    "G-Vectoring Control",
    [
      "G-VECTORING CONTROL",
      "G VECTORING CONTROL",
      "Gベクタリングコントロール",
      "GVC",
      "GVC PLUS",
      "GVCプラス",
    ],
    "mazda",
    "vehicle-control-system",
    "current",
    25,
  ],

  [
    "i-activsense",
    "i-ACTIVSENSE",
    "i-ACTIVSENSE",
    [
      "I-ACTIVSENSE",
      "IACTIVSENSE",
      "I ACTIVSENSE",
      "アイアクティブセンス",
    ],
    "mazda",
    "safety-system",
    "current",
    20,
  ],

  // ========================================================
  // スズキ
  // ========================================================

  [
    "allgrip",
    "ALLGRIP",
    "ALLGRIP",
    [
      "ALLGRIP",
      "ALL GRIP",
      "オールグリップ",
      "スズキオールグリップ",
    ],
    "suzuki",
    "awd-system",
    "current",
    20,
  ],

  [
    "s-ene-charge",
    "S-エネチャージ",
    "S-ENE CHARGE",
    [
      "S-ENE CHARGE",
      "S ENE CHARGE",
      "Sエネチャージ",
      "エスエネチャージ",
    ],
    "suzuki",
    "hybrid-system",
    "legacy",
    15,
  ],

  [
    "suzuki-safety-support",
    "スズキセーフティサポート",
    "Suzuki Safety Support",
    [
      "SUZUKI SAFETY SUPPORT",
      "スズキセーフティサポート",
      "セーフティサポート",
      "スズキ安全装備",
    ],
    "suzuki",
    "safety-system",
    "current",
    15,
  ],

  [
    "dualjet",
    "デュアルジェット",
    "DUALJET",
    [
      "DUALJET",
      "DUAL JET",
      "デュアルジェット",
      "デュアルジェットエンジン",
    ],
    "suzuki",
    "engine-technology",
    "current",
    25,
  ],

  [
    "boosterjet",
    "ブースタージェット",
    "BOOSTERJET",
    [
      "BOOSTERJET",
      "BOOSTER JET",
      "ブースタージェット",
      "ブースタージェットエンジン",
    ],
    "suzuki",
    "engine-technology",
    "current",
    25,
  ],

  // ========================================================
  // ダイハツ
  // ========================================================

  [
    "smart-assist",
    "スマートアシスト",
    "Smart Assist",
    [
      "SMART ASSIST",
      "SMARTASSIST",
      "スマートアシスト",
      "スマアシ",
      "スマートアシストIII",
      "スマートアシスト3",
    ],
    "daihatsu",
    "safety-system",
    "current",
    10,
  ],

  [
    "es-technology",
    "e:Sテクノロジー",
    "e:S Technology",
    [
      "E:S TECHNOLOGY",
      "ES TECHNOLOGY",
      "E:Sテクノロジー",
      "ESテクノロジー",
      "イーステクノロジー",
    ],
    "daihatsu",
    "technology-family",
    "current",
    25,
  ],

  [
    "d-cvt",
    "D-CVT",
    "D-CVT",
    [
      "D-CVT",
      "DCVT",
      "D CVT",
      "ディーCVT",
    ],
    "daihatsu",
    "transmission",
    "current",
    25,
  ],

  // ========================================================
  // BMW・MINI
  // ========================================================

  [
    "bmw-xdrive",
    "xDrive",
    "BMW xDrive",
    [
      "XDRIVE",
      "X DRIVE",
      "エックスドライブ",
      "BMW XDRIVE",
    ],
    "bmw",
    "awd-system",
    "current",
    15,
  ],

  [
    "bmw-sdrive",
    "sDrive",
    "BMW sDrive",
    [
      "SDRIVE",
      "S DRIVE",
      "エスドライブ",
      "BMW SDRIVE",
    ],
    "bmw",
    "drive-system",
    "current",
    25,
  ],

  [
    "bmw-edrive",
    "eDrive",
    "BMW eDrive",
    [
      "EDRIVE",
      "E DRIVE",
      "イードライブ",
      "BMW EDRIVE",
    ],
    "bmw",
    "electrification-technology",
    "current",
    25,
  ],

  [
    "bmw-idrive",
    "iDrive",
    "BMW iDrive",
    [
      "IDRIVE",
      "I DRIVE",
      "アイドライブ",
      "BMW IDRIVE",
    ],
    "bmw",
    "infotainment",
    "current",
    20,
  ],

  [
    "twinpower-turbo",
    "ツインパワー・ターボ",
    "TwinPower Turbo",
    [
      "TWINPOWER TURBO",
      "TWIN POWER TURBO",
      "ツインパワーターボ",
      "BMWツインパワーターボ",
    ],
    "bmw",
    "engine-technology",
    "current",
    25,
  ],

  [
    "efficientdynamics",
    "エフィシェント・ダイナミクス",
    "EfficientDynamics",
    [
      "EFFICIENTDYNAMICS",
      "EFFICIENT DYNAMICS",
      "エフィシェントダイナミクス",
    ],
    "bmw",
    "efficiency-technology",
    "current",
    35,
  ],

  [
    "mini-all4",
    "ALL4",
    "MINI ALL4",
    [
      "ALL4",
      "ALL 4",
      "オールフォー",
      "MINI ALL4",
      "ミニALL4",
    ],
    "bmw",
    "awd-system",
    "current",
    20,
  ],

  // ========================================================
  // メルセデス・ベンツ
  // ========================================================

  [
    "mercedes-4matic",
    "4MATIC",
    "Mercedes-Benz 4MATIC",
    [
      "4MATIC",
      "4 MATIC",
      "フォーマチック",
      "MERCEDES 4MATIC",
      "ベンツ4MATIC",
    ],
    "mercedes-benz",
    "awd-system",
    "current",
    15,
  ],

  [
    "mercedes-bluetec",
    "BlueTEC",
    "Mercedes-Benz BlueTEC",
    [
      "BLUETEC",
      "BLUE TEC",
      "ブルーテック",
      "ベンツブルーテック",
    ],
    "mercedes-benz",
    "diesel-technology",
    "legacy",
    20,
  ],

  [
    "mercedes-blueefficiency",
    "BlueEFFICIENCY",
    "Mercedes-Benz BlueEFFICIENCY",
    [
      "BLUEEFFICIENCY",
      "BLUE EFFICIENCY",
      "ブルーエフィシェンシー",
    ],
    "mercedes-benz",
    "efficiency-technology",
    "legacy",
    30,
  ],

  [
    "mbux",
    "MBUX",
    "Mercedes-Benz User Experience",
    [
      "MBUX",
      "エムビューエックス",
      "MERCEDES-BENZ USER EXPERIENCE",
      "メルセデスベンツユーザーエクスペリエンス",
    ],
    "mercedes-benz",
    "infotainment",
    "current",
    15,
  ],

  [
    "eq-boost",
    "EQ Boost",
    "EQ Boost",
    [
      "EQ BOOST",
      "EQBOOST",
      "EQブースト",
      "イーキューブースト",
    ],
    "mercedes-benz",
    "mild-hybrid-system",
    "current",
    20,
  ],

  // ========================================================
  // Audi・Volkswagen
  // ========================================================

  [
    "audi-quattro",
    "quattro",
    "Audi quattro",
    [
      "QUATTRO",
      "クワトロ",
      "クアトロ",
      "AUDI QUATTRO",
      "アウディクワトロ",
    ],
    "audi",
    "awd-system",
    "current",
    10,
  ],

  [
    "vw-group-tsi",
    "TSI",
    "Turbocharged Stratified Injection",
    [
      "TSI",
      "ティーエスアイ",
      "VW TSI",
      "VOLKSWAGEN TSI",
    ],
    "volkswagen",
    "engine-technology",
    "current",
    20,
  ],

  [
    "vw-group-tdi",
    "TDI",
    "Turbocharged Direct Injection",
    [
      "TDI",
      "ティーディーアイ",
      "VW TDI",
      "AUDI TDI",
      "VOLKSWAGEN TDI",
    ],
    "volkswagen",
    "diesel-technology",
    "current",
    20,
  ],

  [
    "audi-tfsi",
    "TFSI",
    "Turbo Fuel Stratified Injection",
    [
      "TFSI",
      "ティーエフエスアイ",
      "AUDI TFSI",
      "アウディTFSI",
    ],
    "audi",
    "engine-technology",
    "current",
    20,
  ],

  [
    "audi-mmi",
    "MMI",
    "Multi Media Interface",
    [
      "MMI",
      "AUDI MMI",
      "アウディMMI",
      "MULTI MEDIA INTERFACE",
    ],
    "audi",
    "infotainment",
    "current",
    25,
  ],

  [
    "audi-etron",
    "e-tron",
    "Audi e-tron",
    [
      "E-TRON",
      "ETRON",
      "E TRON",
      "イートロン",
      "AUDI E-TRON",
      "アウディe-tron",
    ],
    "audi",
    "electrification-technology",
    "current",
    15,
  ],

  [
    "vw-4motion",
    "4MOTION",
    "Volkswagen 4MOTION",
    [
      "4MOTION",
      "4 MOTION",
      "フォーモーション",
      "VW 4MOTION",
      "フォルクスワーゲン4MOTION",
    ],
    "volkswagen",
    "awd-system",
    "current",
    20,
  ],

  [
    "vw-dsg",
    "DSG",
    "Direct-Shift Gearbox",
    [
      "DSG",
      "ディーエスジー",
      "DIRECT-SHIFT GEARBOX",
      "DIRECT SHIFT GEARBOX",
      "VW DSG",
    ],
    "volkswagen",
    "transmission",
    "current",
    15,
  ],

  [
    "vw-gte",
    "GTE",
    "Volkswagen GTE",
    [
      "GTE",
      "VW GTE",
      "VOLKSWAGEN GTE",
      "フォルクスワーゲンGTE",
    ],
    "volkswagen",
    "plug-in-hybrid-system",
    "current",
    25,
  ],

  // ========================================================
  // ポルシェ
  // ========================================================

  [
    "porsche-pdk",
    "PDK",
    "Porsche Doppelkupplung",
    [
      "PDK",
      "PORSCHE DOPPELKUPPLUNG",
      "ポルシェドッペルクップルング",
      "ポルシェPDK",
    ],
    "porsche",
    "transmission",
    "current",
    15,
  ],

  [
    "porsche-e-hybrid",
    "E-Hybrid",
    "Porsche E-Hybrid",
    [
      "E-HYBRID",
      "E HYBRID",
      "EHYBRID",
      "イーハイブリッド",
      "PORSCHE E-HYBRID",
    ],
    "porsche",
    "plug-in-hybrid-system",
    "current",
    20,
  ],

  [
    "porsche-pasm",
    "PASM",
    "Porsche Active Suspension Management",
    [
      "PASM",
      "PORSCHE ACTIVE SUSPENSION MANAGEMENT",
      "ポルシェアクティブサスペンションマネジメント",
    ],
    "porsche",
    "suspension-technology",
    "current",
    25,
  ],

  // ========================================================
  // ボルボ・JLR
  // ========================================================

  [
    "volvo-recharge",
    "Recharge",
    "Volvo Recharge",
    [
      "RECHARGE",
      "VOLVO RECHARGE",
      "ボルボリチャージ",
      "リチャージ",
    ],
    "volvo-cars",
    "electrification-technology",
    "current",
    25,
  ],

  [
    "volvo-city-safety",
    "City Safety",
    "Volvo City Safety",
    [
      "CITY SAFETY",
      "CITYSAFETY",
      "シティセーフティ",
      "VOLVO CITY SAFETY",
    ],
    "volvo-cars",
    "safety-system",
    "current",
    20,
  ],

  [
    "volvo-pilot-assist",
    "Pilot Assist",
    "Volvo Pilot Assist",
    [
      "PILOT ASSIST",
      "PILOTASSIST",
      "パイロットアシスト",
      "VOLVO PILOT ASSIST",
    ],
    "volvo-cars",
    "driver-assistance",
    "current",
    20,
  ],

  [
    "terrain-response",
    "テレインレスポンス",
    "Terrain Response",
    [
      "TERRAIN RESPONSE",
      "テレインレスポンス",
      "LAND ROVER TERRAIN RESPONSE",
      "ランドローバーテレインレスポンス",
    ],
    "jaguar-land-rover",
    "traction-system",
    "current",
    20,
  ],

  [
    "ingenium",
    "インジニウム",
    "Ingenium",
    [
      "INGENIUM",
      "インジニウム",
      "インジェニウム",
      "INGENIUM ENGINE",
    ],
    "jaguar-land-rover",
    "engine-technology",
    "current",
    30,
  ],

  // ========================================================
  // フランス・イタリア・Jeep
  // ========================================================

  [
    "peugeot-puretech",
    "PureTech",
    "PureTech",
    [
      "PURETECH",
      "PURE TECH",
      "ピュアテック",
      "PEUGEOT PURETECH",
    ],
    "stellantis",
    "engine-technology",
    "current",
    25,
  ],

  [
    "bluehdi",
    "BlueHDi",
    "BlueHDi",
    [
      "BLUEHDI",
      "BLUE HDI",
      "ブルーHDi",
      "ブルーエイチディーアイ",
      "PEUGEOT BLUEHDI",
      "CITROEN BLUEHDI",
    ],
    "stellantis",
    "diesel-technology",
    "current",
    20,
  ],

  [
    "eat8",
    "EAT8",
    "Efficient Automatic Transmission 8",
    [
      "EAT8",
      "EAT 8",
      "イートエイト",
      "8速EAT",
    ],
    "stellantis",
    "transmission",
    "current",
    25,
  ],

  [
    "renault-etech",
    "E-TECH",
    "Renault E-TECH",
    [
      "E-TECH",
      "ETECH",
      "E TECH",
      "イーテック",
      "RENAULT E-TECH",
      "ルノーE-TECH",
    ],
    "renault",
    "electrification-technology",
    "current",
    20,
  ],

  [
    "renault-multisense",
    "MULTI-SENSE",
    "Renault MULTI-SENSE",
    [
      "MULTI-SENSE",
      "MULTISENSE",
      "MULTI SENSE",
      "マルチセンス",
      "RENAULT MULTI-SENSE",
    ],
    "renault",
    "drive-mode-system",
    "current",
    30,
  ],

  [
    "jeep-4xe",
    "4xe",
    "Jeep 4xe",
    [
      "4XE",
      "4 XE",
      "フォーバイイー",
      "JEEP 4XE",
      "ジープ4XE",
    ],
    "stellantis",
    "plug-in-hybrid-system",
    "current",
    20,
  ],

  [
    "jeep-selec-terrain",
    "セレクテレイン",
    "Selec-Terrain",
    [
      "SELEC-TERRAIN",
      "SELEC TERRAIN",
      "SELECT TERRAIN",
      "セレクテレイン",
      "JEEP SELEC-TERRAIN",
    ],
    "stellantis",
    "traction-system",
    "current",
    25,
  ],

  [
    "fiat-multiair",
    "マルチエア",
    "MultiAir",
    [
      "MULTIAIR",
      "MULTI AIR",
      "マルチエア",
      "FIAT MULTIAIR",
      "ALFA ROMEO MULTIAIR",
    ],
    "stellantis",
    "engine-technology",
    "current",
    30,
  ],

  [
    "fiat-twinair",
    "ツインエア",
    "TwinAir",
    [
      "TWINAIR",
      "TWIN AIR",
      "ツインエア",
      "FIAT TWINAIR",
    ],
    "stellantis",
    "engine-technology",
    "legacy",
    25,
  ],

  // ========================================================
  // フォード・GM・テスラ
  // ========================================================

  [
    "ford-ecoboost",
    "EcoBoost",
    "Ford EcoBoost",
    [
      "ECOBOOST",
      "ECO BOOST",
      "エコブースト",
      "FORD ECOBOOST",
    ],
    "ford-motor",
    "engine-technology",
    "current",
    20,
  ],

  [
    "ford-sync",
    "SYNC",
    "Ford SYNC",
    [
      "FORD SYNC",
      "フォードSYNC",
      "フォードシンク",
      "SYNC 3",
      "SYNC4",
    ],
    "ford-motor",
    "infotainment",
    "current",
    25,
  ],

  [
    "ford-copilot360",
    "Ford Co-Pilot360",
    "Ford Co-Pilot360",
    [
      "FORD CO-PILOT360",
      "FORD COPILOT360",
      "CO-PILOT360",
      "COPILOT360",
      "フォードコパイロット360",
    ],
    "ford-motor",
    "safety-system",
    "current",
    30,
  ],

  [
    "gm-super-cruise",
    "Super Cruise",
    "GM Super Cruise",
    [
      "SUPER CRUISE",
      "SUPERCRUISE",
      "スーパークルーズ",
      "GM SUPER CRUISE",
    ],
    "general-motors",
    "driver-assistance",
    "current",
    30,
  ],

  [
    "gm-onstar",
    "OnStar",
    "OnStar",
    [
      "ONSTAR",
      "ON STAR",
      "オンスター",
      "GM ONSTAR",
    ],
    "general-motors",
    "connected-service",
    "current",
    30,
  ],

  [
    "tesla-autopilot",
    "オートパイロット",
    "Tesla Autopilot",
    [
      "AUTOPILOT",
      "AUTO PILOT",
      "オートパイロット",
      "TESLA AUTOPILOT",
      "テスラオートパイロット",
    ],
    "tesla",
    "driver-assistance",
    "current",
    15,
  ],

  [
    "tesla-fsd",
    "FSD",
    "Full Self-Driving",
    [
      "FSD",
      "FULL SELF-DRIVING",
      "FULL SELF DRIVING",
      "フルセルフドライビング",
      "完全自動運転対応機能",
      "TESLA FSD",
    ],
    "tesla",
    "driver-assistance",
    "current",
    25,
  ],
];

const mapRowsToEntries = (rows, section) => {
  return rows.map(
    ([
      id,
      name,
      nameEn,
      aliases,
      makerId,
      kind,
      status,
      priority,
    ]) =>
      createDictionaryEntry({
        id,
        name,
        nameEn,
        aliases,
        makerId,
        section,
        kind,
        status,
        priority,
      }),
  );
};

/**
 * 車両ブランド・サブブランド・スポーツブランド。
 */
export const vehicleBrands = Object.freeze(
  mapRowsToEntries(brandRows, BRAND_SECTIONS.BRAND),
);

/**
 * 技術名称・安全装備・駆動方式・エンジン技術。
 */
export const vehicleTechnologies = Object.freeze(
  mapRowsToEntries(technologyRows, BRAND_SECTIONS.TECHNOLOGY),
);

/**
 * brands.js内の全辞書。
 *
 * ブランドを先、技術名称を後に並べる。
 */
export const brands = Object.freeze([
  ...vehicleBrands,
  ...vehicleTechnologies,
]);

/**
 * 入力文字列を比較用に正規化する。
 *
 * 例：
 * e:HEV
 * e-HEV
 * E HEV
 *
 * 上記を近い形式に揃えて比較する。
 */
export function normalizeBrandText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase("ja-JP")
    .replace(/[®™©]/g, "")
    .replace(/[\s\u3000]/g, "")
    .replace(/[・･.,，。'’"`´:：;+＋]/g, "")
    .replace(/[()[\]{}【】「」『』〈〉《》]/g, "")
    .replace(/[\/\\|]/g, "")
    .replace(/[-‐-‒–—―ー]/g, "");
}

const entryById = new Map();
const entriesByNormalizedKeyword = new Map();

for (const entry of brands) {
  entryById.set(entry.id, entry);

  for (const keyword of entry.keywords) {
    const normalizedKeyword = normalizeBrandText(keyword);

    if (!normalizedKeyword) {
      continue;
    }

    const currentEntries =
      entriesByNormalizedKeyword.get(normalizedKeyword) || [];

    entriesByNormalizedKeyword.set(
      normalizedKeyword,
      [...currentEntries, entry].sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }

        if (a.section !== b.section) {
          return a.section === BRAND_SECTIONS.BRAND ? -1 : 1;
        }

        return a.name.localeCompare(b.name, "ja");
      }),
    );
  }
}

/**
 * IDから辞書項目を取得する。
 */
export function getBrandById(id) {
  if (!id) {
    return null;
  }

  return entryById.get(String(id)) || null;
}

/**
 * 入力と完全一致する最優先の項目を返す。
 */
export function findBrandByExactText(text) {
  const normalizedText = normalizeBrandText(text);

  if (!normalizedText) {
    return null;
  }

  const matches =
    entriesByNormalizedKeyword.get(normalizedText) || [];

  return matches[0] || null;
}

/**
 * 入力と完全一致する項目をすべて返す。
 */
export function findAllBrandsByExactText(text) {
  const normalizedText = normalizeBrandText(text);

  if (!normalizedText) {
    return [];
  }

  return entriesByNormalizedKeyword.get(normalizedText) || [];
}

/**
 * メーカーIDに属する項目を返す。
 *
 * 例：
 * getBrandsByMaker("toyota")
 */
export function getBrandsByMaker(makerId) {
  const normalizedMakerId = String(makerId ?? "").trim();

  if (!normalizedMakerId) {
    return [];
  }

  return brands.filter(
    (entry) => entry.makerId === normalizedMakerId,
  );
}

/**
 * brandまたはtechnologyだけを返す。
 *
 * 例：
 * getBrandsBySection("technology")
 */
export function getBrandsBySection(section) {
  if (!Object.values(BRAND_SECTIONS).includes(section)) {
    return [];
  }

  return brands.filter((entry) => entry.section === section);
}

/**
 * 種別で辞書項目を取得する。
 *
 * 例：
 * getBrandsByKind("safety-system")
 */
export function getBrandsByKind(kind) {
  const normalizedKind = String(kind ?? "").trim();

  if (!normalizedKind) {
    return [];
  }

  return brands.filter((entry) => entry.kind === normalizedKind);
}

/**
 * 文章の一部に含まれるブランド・技術名称を検索する。
 *
 * 短すぎる名称による誤判定を防ぐため、
 * 3文字未満のキーワードは完全一致の場合だけ対象とする。
 *
 * 例：
 * 「レクサスRXを探しています」
 * 「e-POWERのノートありますか」
 * 「ハマーH2を売りたい」
 */
export function searchBrandDictionary(
  text,
  {
    section = null,
    makerId = null,
    limit = 10,
  } = {},
) {
  const normalizedText = normalizeBrandText(text);

  if (!normalizedText) {
    return [];
  }

  const safeLimit = Math.max(
    1,
    Math.min(Number(limit) || 10, 50),
  );

  const results = [];

  for (const entry of brands) {
    if (section && entry.section !== section) {
      continue;
    }

    if (makerId && entry.makerId !== makerId) {
      continue;
    }

    let bestScore = 0;
    let matchedKeyword = null;

    for (const keyword of entry.keywords) {
      const normalizedKeyword = normalizeBrandText(keyword);

      if (!normalizedKeyword) {
        continue;
      }

      if (normalizedText === normalizedKeyword) {
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

      // GR、M、DSなど短い語による文章内の誤検出を防ぐ。
      if (normalizedKeyword.length < 3) {
        continue;
      }

      if (normalizedText.startsWith(normalizedKeyword)) {
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

      if (normalizedText.includes(normalizedKeyword)) {
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
        normalizedKeyword.startsWith(normalizedText)
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
    .sort((a, b) => {
      if (a.score !== b.score) {
        return b.score - a.score;
      }

      if (a.entry.priority !== b.entry.priority) {
        return a.entry.priority - b.entry.priority;
      }

      if (a.entry.section !== b.entry.section) {
        return a.entry.section === BRAND_SECTIONS.BRAND
          ? -1
          : 1;
      }

      return a.entry.name.localeCompare(b.entry.name, "ja");
    })
    .slice(0, safeLimit);
}
