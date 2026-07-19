/**
 * ==========================================================
 * 自動車メーカー辞書
 * ==========================================================
 *
 * このファイルに入れるもの：
 * - 自動車メーカー
 * - 自動車グループ
 * - 商用車メーカー
 * - 少量生産メーカー
 * - 受託生産会社
 * - 合弁メーカー
 *
 * このファイルに入れないもの：
 * - 車種
 * - グレード
 * - ボディタイプ
 * - 用途
 * - サブブランド
 * - チューニングブランド
 *
 * 例：
 * レクサス、MINI、Jeep、AMG、GR、NISMO、STIなどは
 * brands.js 側で管理する。
 */

const MAKER_TYPE = "maker";

const unique = (values) => {
  return [...new Set(values.filter(Boolean))];
};

const createMaker = ({
  id,
  name,
  nameEn,
  aliases = [],
  countries = [],
  kind = "automaker",
  vehicleTypes = ["passenger"],
  priority = 100,
}) => {
  const keywords = unique([
    name,
    nameEn,
    ...aliases,
  ]);

  return Object.freeze({
    id,
    type: MAKER_TYPE,
    name,
    nameEn,
    aliases: unique(aliases),
    keywords,

    // schema.jsとの共通項目
    parent: null,
    category: null,
    tags: unique([
      kind,
      ...vehicleTypes,
      ...countries.map((country) => `country:${country}`),
    ]),
    priority,

    // メーカー辞書固有項目
    countries: unique(countries),
    kind,
    vehicleTypes: unique(vehicleTypes),
  });
};

/**
 * 配列の順番
 *
 * 0: id
 * 1: 日本語名称
 * 2: 英語名称
 * 3: 別名・入力ゆれ
 * 4: 国コード
 * 5: 種別
 * 6: 車両区分
 * 7: 検索優先度
 */
const makerRows = [
  // ========================================================
  // 日本
  // ========================================================

  [
    "toyota",
    "トヨタ自動車",
    "Toyota Motor Corporation",
    [
      "トヨタ",
      "トヨタ自動車",
      "TOYOTA",
      "TOYOTA MOTOR",
      "TOYOTA MOTOR CORPORATION",
      "TMC",
    ],
    ["JP"],
    "automaker",
    ["passenger", "commercial"],
    10,
  ],

  [
    "honda",
    "本田技研工業",
    "Honda Motor Co., Ltd.",
    [
      "ホンダ",
      "本田技研",
      "本田技研工業",
      "HONDA",
      "HONDA MOTOR",
      "HONDA MOTOR CO LTD",
      "HMC",
    ],
    ["JP"],
    "automaker",
    ["passenger", "commercial"],
    10,
  ],

  [
    "nissan",
    "日産自動車",
    "Nissan Motor Co., Ltd.",
    [
      "日産",
      "ニッサン",
      "日産自動車",
      "NISSAN",
      "NISSAN MOTOR",
      "NISSAN MOTOR CO LTD",
    ],
    ["JP"],
    "automaker",
    ["passenger", "commercial"],
    10,
  ],

  [
    "mazda",
    "マツダ",
    "Mazda Motor Corporation",
    [
      "マツダ",
      "MAZDA",
      "MAZDA MOTOR",
      "MAZDA MOTOR CORPORATION",
    ],
    ["JP"],
    "automaker",
    ["passenger", "commercial"],
    10,
  ],

  [
    "subaru",
    "SUBARU",
    "Subaru Corporation",
    [
      "スバル",
      "SUBARU",
      "SUBARU CORPORATION",
      "富士重工",
      "富士重工業",
      "FUJI HEAVY INDUSTRIES",
      "FHI",
    ],
    ["JP"],
    "automaker",
    ["passenger"],
    10,
  ],

  [
    "suzuki",
    "スズキ",
    "Suzuki Motor Corporation",
    [
      "スズキ",
      "SUZUKI",
      "SUZUKI MOTOR",
      "SUZUKI MOTOR CORPORATION",
    ],
    ["JP"],
    "automaker",
    ["passenger", "commercial"],
    10,
  ],

  [
    "daihatsu",
    "ダイハツ工業",
    "Daihatsu Motor Co., Ltd.",
    [
      "ダイハツ",
      "ダイハツ工業",
      "DAIHATSU",
      "DAIHATSU MOTOR",
      "DAIHATSU MOTOR CO LTD",
    ],
    ["JP"],
    "automaker",
    ["passenger", "commercial"],
    10,
  ],

  [
    "mitsubishi-motors",
    "三菱自動車工業",
    "Mitsubishi Motors Corporation",
    [
      "三菱自動車",
      "三菱自動車工業",
      "ミツビシ自動車",
      "MITSUBISHI MOTORS",
      "MITSUBISHI MOTORS CORPORATION",
      "MMC",
    ],
    ["JP"],
    "automaker",
    ["passenger", "commercial"],
    10,
  ],

  [
    "isuzu",
    "いすゞ自動車",
    "Isuzu Motors Limited",
    [
      "いすゞ",
      "イスズ",
      "いすず",
      "いすゞ自動車",
      "ISUZU",
      "ISUZU MOTORS",
    ],
    ["JP"],
    "commercial-vehicle-maker",
    ["commercial"],
    15,
  ],

  [
    "hino",
    "日野自動車",
    "Hino Motors, Ltd.",
    [
      "日野",
      "日野自動車",
      "HINO",
      "HINO MOTORS",
    ],
    ["JP"],
    "commercial-vehicle-maker",
    ["commercial"],
    15,
  ],

  [
    "mitsuoka",
    "光岡自動車",
    "Mitsuoka Motor Co., Ltd.",
    [
      "光岡",
      "ミツオカ",
      "光岡自動車",
      "MITSUOKA",
      "MITSUOKA MOTOR",
    ],
    ["JP"],
    "specialty-maker",
    ["passenger"],
    20,
  ],

  [
    "mitsubishi-fuso",
    "三菱ふそうトラック・バス",
    "Mitsubishi Fuso Truck and Bus Corporation",
    [
      "三菱ふそう",
      "ふそう",
      "フソウ",
      "FUSO",
      "MITSUBISHI FUSO",
      "MFTBC",
    ],
    ["JP"],
    "commercial-vehicle-maker",
    ["commercial"],
    15,
  ],

  [
    "ud-trucks",
    "UDトラックス",
    "UD Trucks Corporation",
    [
      "UD",
      "UDトラックス",
      "ユーディー",
      "UD TRUCKS",
      "日産ディーゼル",
      "NISSAN DIESEL",
    ],
    ["JP"],
    "commercial-vehicle-maker",
    ["commercial"],
    15,
  ],

  // ========================================================
  // ドイツ・オーストリア
  // ========================================================

  [
    "volkswagen",
    "フォルクスワーゲン",
    "Volkswagen AG",
    [
      "フォルクスワーゲン",
      "ワーゲン",
      "VW",
      "VOLKSWAGEN",
      "VOLKSWAGEN AG",
    ],
    ["DE"],
    "automotive-group",
    ["passenger", "commercial"],
    20,
  ],

  [
    "audi",
    "アウディ",
    "AUDI AG",
    [
      "アウディ",
      "AUDI",
      "AUDI AG",
    ],
    ["DE"],
    "automaker",
    ["passenger"],
    20,
  ],

  [
    "porsche",
    "ポルシェ",
    "Dr. Ing. h.c. F. Porsche AG",
    [
      "ポルシェ",
      "PORSCHE",
      "PORSCHE AG",
    ],
    ["DE"],
    "automaker",
    ["passenger"],
    20,
  ],

  [
    "bmw",
    "BMW",
    "Bayerische Motoren Werke AG",
    [
      "BMW",
      "ビーエムダブリュー",
      "ビーエム",
      "BMW AG",
      "BMW GROUP",
      "BAYERISCHE MOTOREN WERKE",
    ],
    ["DE"],
    "automotive-group",
    ["passenger"],
    20,
  ],

  [
    "mercedes-benz",
    "メルセデス・ベンツ",
    "Mercedes-Benz AG",
    [
      "メルセデス",
      "メルセデスベンツ",
      "ベンツ",
      "MERCEDES",
      "MERCEDES-BENZ",
      "MERCEDES BENZ",
      "MERCEDES-BENZ AG",
    ],
    ["DE"],
    "automaker",
    ["passenger", "commercial"],
    20,
  ],

  [
    "mercedes-benz-group",
    "メルセデス・ベンツ・グループ",
    "Mercedes-Benz Group AG",
    [
      "メルセデスベンツグループ",
      "MERCEDES-BENZ GROUP",
      "MERCEDES BENZ GROUP",
      "DAIMLER AG",
      "ダイムラーAG",
    ],
    ["DE"],
    "automotive-group",
    ["passenger"],
    30,
  ],

  [
    "daimler-truck",
    "ダイムラー・トラック",
    "Daimler Truck AG",
    [
      "ダイムラートラック",
      "DAIMLER TRUCK",
      "DAIMLER TRUCK AG",
    ],
    ["DE"],
    "commercial-vehicle-maker",
    ["commercial"],
    30,
  ],

  [
    "opel",
    "オペル",
    "Opel Automobile GmbH",
    [
      "オペル",
      "OPEL",
      "OPEL AUTOMOBILE",
    ],
    ["DE"],
    "automaker",
    ["passenger", "commercial"],
    25,
  ],

  [
    "man-truck-bus",
    "MANトラック＆バス",
    "MAN Truck & Bus SE",
    [
      "MAN",
      "MANトラック",
      "マン",
      "MAN TRUCK",
      "MAN TRUCK & BUS",
    ],
    ["DE"],
    "commercial-vehicle-maker",
    ["commercial"],
    30,
  ],

  [
    "ruf",
    "RUFオートモービル",
    "RUF Automobile GmbH",
    [
      "RUF",
      "ルーフ",
      "RUF AUTOMOBILE",
    ],
    ["DE"],
    "specialty-maker",
    ["passenger"],
    40,
  ],

  [
    "smart-automobile",
    "スマート・オートモービル",
    "smart Automobile Co., Ltd.",
    [
      "スマートオートモービル",
      "SMART AUTOMOBILE",
      "智馬達汽車",
    ],
    ["DE", "CN"],
    "joint-venture",
    ["passenger"],
    35,
  ],

  [
    "magna-steyr",
    "マグナ・シュタイヤー",
    "Magna Steyr AG & Co KG",
    [
      "マグナシュタイヤー",
      "MAGNA STEYR",
      "STEYR",
    ],
    ["AT"],
    "contract-manufacturer",
    ["passenger", "commercial"],
    40,
  ],

  [
    "ktm",
    "KTM",
    "KTM AG",
    [
      "KTM",
      "ケーティーエム",
    ],
    ["AT"],
    "specialty-maker",
    ["passenger"],
    45,
  ],

  // ========================================================
  // フランス・イタリア
  // ========================================================

  [
    "renault",
    "ルノー",
    "Renault S.A.S.",
    [
      "ルノー",
      "RENAULT",
      "RENAULT SAS",
      "RENAULT GROUP",
    ],
    ["FR"],
    "automotive-group",
    ["passenger", "commercial"],
    20,
  ],

  [
    "stellantis",
    "ステランティス",
    "Stellantis N.V.",
    [
      "ステランティス",
      "STELLANTIS",
      "STELLANTIS NV",
    ],
    ["NL", "FR", "IT"],
    "automotive-group",
    ["passenger", "commercial"],
    25,
  ],

  [
    "aixam-mega",
    "エグザム・メガ",
    "Aixam Mega S.A.S.",
    [
      "エグザム",
      "エクザム",
      "AIXAM",
      "AIXAM MEGA",
    ],
    ["FR"],
    "specialty-maker",
    ["passenger"],
    50,
  ],

  [
    "ligier-group",
    "リジェ・グループ",
    "Ligier Group",
    [
      "リジェ",
      "LIGIER",
      "LIGIER GROUP",
    ],
    ["FR"],
    "specialty-maker",
    ["passenger"],
    50,
  ],

  [
    "ferrari",
    "フェラーリ",
    "Ferrari S.p.A.",
    [
      "フェラーリ",
      "FERRARI",
      "FERRARI SPA",
    ],
    ["IT"],
    "automaker",
    ["passenger"],
    25,
  ],

  [
    "lamborghini",
    "アウトモビリ・ランボルギーニ",
    "Automobili Lamborghini S.p.A.",
    [
      "ランボルギーニ",
      "ランボ",
      "LAMBORGHINI",
      "AUTOMOBILI LAMBORGHINI",
    ],
    ["IT"],
    "automaker",
    ["passenger"],
    25,
  ],

  [
    "maserati",
    "マセラティ",
    "Maserati S.p.A.",
    [
      "マセラティ",
      "MASERATI",
      "MASERATI SPA",
    ],
    ["IT"],
    "automaker",
    ["passenger"],
    25,
  ],

  [
    "pagani",
    "パガーニ・アウトモビリ",
    "Pagani Automobili S.p.A.",
    [
      "パガーニ",
      "PAGANI",
      "PAGANI AUTOMOBILI",
    ],
    ["IT"],
    "specialty-maker",
    ["passenger"],
    40,
  ],

  [
    "iveco-group",
    "イベコ・グループ",
    "Iveco Group N.V.",
    [
      "イベコ",
      "IVECO",
      "IVECO GROUP",
    ],
    ["IT", "NL"],
    "commercial-vehicle-maker",
    ["commercial"],
    35,
  ],

  [
    "dallara",
    "ダラーラ・アウトモビリ",
    "Dallara Automobili S.p.A.",
    [
      "ダラーラ",
      "DALLARA",
      "DALLARA AUTOMOBILI",
    ],
    ["IT"],
    "specialty-maker",
    ["passenger"],
    45,
  ],

  [
    "dr-automobiles",
    "DRオートモビルズ",
    "DR Automobiles Groupe S.r.l.",
    [
      "DRオートモビルズ",
      "DR AUTOMOBILES",
      "DR MOTOR",
    ],
    ["IT"],
    "automaker",
    ["passenger"],
    50,
  ],

  [
    "automobili-pininfarina",
    "アウトモビリ・ピニンファリーナ",
    "Automobili Pininfarina GmbH",
    [
      "ピニンファリーナ",
      "AUTOMOBILI PININFARINA",
      "PININFARINA",
    ],
    ["DE", "IT"],
    "specialty-maker",
    ["passenger"],
    45,
  ],

  // ========================================================
  // イギリス
  // ========================================================

  [
    "jaguar-land-rover",
    "ジャガー・ランドローバー",
    "Jaguar Land Rover Automotive plc",
    [
      "ジャガーランドローバー",
      "JAGUAR LAND ROVER",
      "JLR",
    ],
    ["GB"],
    "automaker",
    ["passenger"],
    25,
  ],

  [
    "aston-martin",
    "アストンマーティン・ラゴンダ",
    "Aston Martin Lagonda Limited",
    [
      "アストンマーティン",
      "ASTON MARTIN",
      "ASTON MARTIN LAGONDA",
    ],
    ["GB"],
    "automaker",
    ["passenger"],
    30,
  ],

  [
    "mclaren-automotive",
    "マクラーレン・オートモーティブ",
    "McLaren Automotive Limited",
    [
      "マクラーレン",
      "MCLAREN",
      "MCLAREN AUTOMOTIVE",
    ],
    ["GB"],
    "specialty-maker",
    ["passenger"],
    30,
  ],

  [
    "bentley-motors",
    "ベントレー・モーターズ",
    "Bentley Motors Limited",
    [
      "ベントレー",
      "BENTLEY",
      "BENTLEY MOTORS",
    ],
    ["GB"],
    "automaker",
    ["passenger"],
    30,
  ],

  [
    "rolls-royce-motor-cars",
    "ロールス・ロイス・モーター・カーズ",
    "Rolls-Royce Motor Cars Limited",
    [
      "ロールスロイス",
      "ROLLS-ROYCE",
      "ROLLS ROYCE",
      "ROLLS-ROYCE MOTOR CARS",
    ],
    ["GB"],
    "automaker",
    ["passenger"],
    30,
  ],

  [
    "lotus-cars",
    "ロータス・カーズ",
    "Lotus Cars Limited",
    [
      "ロータス",
      "LOTUS",
      "LOTUS CARS",
    ],
    ["GB"],
    "automaker",
    ["passenger"],
    35,
  ],

  [
    "caterham-cars",
    "ケータハム・カーズ",
    "Caterham Cars Ltd",
    [
      "ケータハム",
      "CATERHAM",
      "CATERHAM CARS",
    ],
    ["GB"],
    "specialty-maker",
    ["passenger"],
    45,
  ],

  [
    "morgan-motor",
    "モーガン・モーター・カンパニー",
    "Morgan Motor Company Limited",
    [
      "モーガン",
      "MORGAN",
      "MORGAN MOTOR COMPANY",
    ],
    ["GB"],
    "specialty-maker",
    ["passenger"],
    45,
  ],

  [
    "ineos-automotive",
    "イネオス・オートモーティブ",
    "INEOS Automotive Limited",
    [
      "イネオス",
      "INEOS",
      "INEOS AUTOMOTIVE",
    ],
    ["GB"],
    "automaker",
    ["passenger", "commercial"],
    40,
  ],

  [
    "levc",
    "ロンドンEVカンパニー",
    "London EV Company Limited",
    [
      "LEVC",
      "ロンドンタクシー",
      "LONDON EV COMPANY",
      "LONDON ELECTRIC VEHICLE COMPANY",
    ],
    ["GB"],
    "commercial-vehicle-maker",
    ["commercial"],
    45,
  ],

  [
    "ariel-motor",
    "アリエル・モーター・カンパニー",
    "Ariel Motor Company Ltd",
    [
      "アリエル",
      "ARIEL",
      "ARIEL MOTOR",
    ],
    ["GB"],
    "specialty-maker",
    ["passenger"],
    50,
  ],

  [
    "ginetta",
    "ジネッタ・カーズ",
    "Ginetta Cars Limited",
    [
      "ジネッタ",
      "GINETTA",
      "GINETTA CARS",
    ],
    ["GB"],
    "specialty-maker",
    ["passenger"],
    50,
  ],

  [
    "noble-automotive",
    "ノーブル・オートモーティブ",
    "Noble Automotive Ltd",
    [
      "ノーブル",
      "NOBLE",
      "NOBLE AUTOMOTIVE",
    ],
    ["GB"],
    "specialty-maker",
    ["passenger"],
    50,
  ],

  [
    "radical-motorsport",
    "ラディカル・モータースポーツ",
    "Radical Motorsport Ltd",
    [
      "ラディカル",
      "RADICAL",
      "RADICAL MOTORSPORT",
    ],
    ["GB"],
    "specialty-maker",
    ["passenger"],
    50,
  ],

  [
    "gordon-murray-automotive",
    "ゴードン・マレー・オートモーティブ",
    "Gordon Murray Automotive Limited",
    [
      "ゴードンマレー",
      "GMA",
      "GORDON MURRAY",
      "GORDON MURRAY AUTOMOTIVE",
    ],
    ["GB"],
    "specialty-maker",
    ["passenger"],
    45,
  ],

  // ========================================================
  // 北欧・中欧・東欧
  // ========================================================

  [
    "volvo-cars",
    "ボルボ・カー",
    "Volvo Car AB",
    [
      "ボルボカー",
      "VOLVO CARS",
      "VOLVO CAR AB",
    ],
    ["SE"],
    "automaker",
    ["passenger"],
    25,
  ],

  [
    "polestar",
    "ポールスター",
    "Polestar Automotive Sweden AB",
    [
      "ポールスター",
      "POLESTAR",
      "POLESTAR AUTOMOTIVE",
    ],
    ["SE"],
    "automaker",
    ["passenger"],
    35,
  ],

  [
    "koenigsegg",
    "ケーニグセグ・オートモーティブ",
    "Koenigsegg Automotive AB",
    [
      "ケーニグセグ",
      "KOENIGSEGG",
      "KOENIGSEGG AUTOMOTIVE",
    ],
    ["SE"],
    "specialty-maker",
    ["passenger"],
    40,
  ],

  [
    "volvo-group",
    "ボルボ・グループ",
    "AB Volvo",
    [
      "ボルボグループ",
      "VOLVO GROUP",
      "AB VOLVO",
    ],
    ["SE"],
    "commercial-vehicle-maker",
    ["commercial"],
    35,
  ],

  [
    "scania",
    "スカニア",
    "Scania AB",
    [
      "スカニア",
      "SCANIA",
      "SCANIA AB",
    ],
    ["SE"],
    "commercial-vehicle-maker",
    ["commercial"],
    35,
  ],

  [
    "daf-trucks",
    "DAFトラックス",
    "DAF Trucks N.V.",
    [
      "DAF",
      "ダフ",
      "DAF TRUCKS",
    ],
    ["NL"],
    "commercial-vehicle-maker",
    ["commercial"],
    40,
  ],

  [
    "donkervoort",
    "ドンカーブート",
    "Donkervoort Automobielen B.V.",
    [
      "ドンカーブート",
      "DONKERVOORT",
      "DONKERVOORT AUTOMOBIELEN",
    ],
    ["NL"],
    "specialty-maker",
    ["passenger"],
    50,
  ],

  [
    "vdl-nedcar",
    "VDLネッドカー",
    "VDL Nedcar B.V.",
    [
      "VDLネッドカー",
      "VDL NEDCAR",
      "NEDCAR",
    ],
    ["NL"],
    "contract-manufacturer",
    ["passenger"],
    50,
  ],

  [
    "skoda-auto",
    "シュコダ・オート",
    "Škoda Auto a.s.",
    [
      "シュコダ",
      "SKODA",
      "ŠKODA",
      "SKODA AUTO",
    ],
    ["CZ"],
    "automaker",
    ["passenger"],
    35,
  ],

  [
    "tatra-trucks",
    "タトラ・トラックス",
    "Tatra Trucks a.s.",
    [
      "タトラ",
      "TATRA",
      "TATRA TRUCKS",
    ],
    ["CZ"],
    "commercial-vehicle-maker",
    ["commercial"],
    45,
  ],

  [
    "seat",
    "セアト",
    "SEAT, S.A.",
    [
      "セアト",
      "SEAT",
      "SEAT SA",
    ],
    ["ES"],
    "automaker",
    ["passenger"],
    35,
  ],

  [
    "irizar",
    "イリサール",
    "Irizar Group",
    [
      "イリサール",
      "IRIZAR",
      "IRIZAR GROUP",
    ],
    ["ES"],
    "commercial-vehicle-maker",
    ["commercial"],
    45,
  ],

  [
    "hispano-suiza-cars",
    "イスパノ・スイザ・カーズ",
    "Hispano Suiza Cars S.L.",
    [
      "イスパノスイザ",
      "HISPANO SUIZA",
      "HISPANO SUIZA CARS",
    ],
    ["ES"],
    "specialty-maker",
    ["passenger"],
    50,
  ],

  [
    "automobile-dacia",
    "オートモービル・ダチア",
    "Automobile Dacia S.A.",
    [
      "ダチア",
      "DACIA",
      "AUTOMOBILE DACIA",
    ],
    ["RO"],
    "automaker",
    ["passenger", "commercial"],
    40,
  ],

  [
    "rimac-group",
    "リマック・グループ",
    "Rimac Group d.o.o.",
    [
      "リマック",
      "RIMAC",
      "RIMAC GROUP",
    ],
    ["HR"],
    "automotive-group",
    ["passenger"],
    40,
  ],

  [
    "bugatti-rimac",
    "ブガッティ・リマック",
    "Bugatti Rimac d.o.o.",
    [
      "ブガッティリマック",
      "BUGATTI RIMAC",
    ],
    ["HR"],
    "joint-venture",
    ["passenger"],
    45,
  ],

  // ========================================================
  // アメリカ
  // ========================================================

  [
    "general-motors",
    "ゼネラルモーターズ",
    "General Motors Company",
    [
      "ゼネラルモーターズ",
      "GM",
      "GENERAL MOTORS",
      "GENERAL MOTORS COMPANY",
    ],
    ["US"],
    "automotive-group",
    ["passenger", "commercial"],
    25,
  ],

  [
    "ford-motor",
    "フォード・モーター",
    "Ford Motor Company",
    [
      "フォード",
      "FORD",
      "FORD MOTOR",
      "FORD MOTOR COMPANY",
    ],
    ["US"],
    "automotive-group",
    ["passenger", "commercial"],
    25,
  ],

  [
    "tesla",
    "テスラ",
    "Tesla, Inc.",
    [
      "テスラ",
      "TESLA",
      "TESLA MOTORS",
      "TESLA INC",
    ],
    ["US"],
    "automaker",
    ["passenger", "commercial"],
    25,
  ],

  [
    "rivian",
    "リヴィアン・オートモーティブ",
    "Rivian Automotive, Inc.",
    [
      "リヴィアン",
      "リビアン",
      "RIVIAN",
      "RIVIAN AUTOMOTIVE",
    ],
    ["US"],
    "automaker",
    ["passenger", "commercial"],
    35,
  ],

  [
    "lucid-motors",
    "ルーシッド・モーターズ",
    "Lucid Motors",
    [
      "ルーシッド",
      "LUCID",
      "LUCID MOTORS",
      "LUCID GROUP",
    ],
    ["US"],
    "automaker",
    ["passenger"],
    35,
  ],

  [
    "paccar",
    "パッカー",
    "PACCAR Inc",
    [
      "パッカー",
      "PACCAR",
      "PACCAR INC",
    ],
    ["US"],
    "commercial-vehicle-maker",
    ["commercial"],
    45,
  ],

  [
    "international-motors",
    "インターナショナル・モーターズ",
    "International Motors, LLC",
    [
      "インターナショナルモーターズ",
      "INTERNATIONAL MOTORS",
      "NAVISTAR",
      "ナビスター",
      "INTERNATIONAL TRUCK",
    ],
    ["US"],
    "commercial-vehicle-maker",
    ["commercial"],
    45,
  ],

  [
    "am-general",
    "AMゼネラル",
    "AM General LLC",
    [
      "AMゼネラル",
      "AM GENERAL",
      "AMGENERAL",
    ],
    ["US"],
    "commercial-vehicle-maker",
    ["passenger", "commercial"],
    40,
  ],

  [
    "karma-automotive",
    "カルマ・オートモーティブ",
    "Karma Automotive LLC",
    [
      "カルマ",
      "KARMA",
      "KARMA AUTOMOTIVE",
    ],
    ["US"],
    "automaker",
    ["passenger"],
    45,
  ],

  [
    "hennessey-special-vehicles",
    "ヘネシー・スペシャル・ビークルズ",
    "Hennessey Special Vehicles",
    [
      "ヘネシー",
      "HENNESSEY",
      "HENNESSEY SPECIAL VEHICLES",
    ],
    ["US"],
    "specialty-maker",
    ["passenger"],
    45,
  ],

  [
    "faraday-future",
    "ファラデー・フューチャー",
    "Faraday Future Intelligent Electric Inc.",
    [
      "ファラデーフューチャー",
      "FARADAY FUTURE",
      "FFIE",
    ],
    ["US"],
    "automaker",
    ["passenger"],
    50,
  ],

  // ========================================================
  // 韓国・インド・東南アジア・トルコ
  // ========================================================

  [
    "hyundai-motor",
    "現代自動車",
    "Hyundai Motor Company",
    [
      "ヒョンデ",
      "ヒュンダイ",
      "現代自動車",
      "HYUNDAI",
      "HYUNDAI MOTOR",
    ],
    ["KR"],
    "automaker",
    ["passenger", "commercial"],
    25,
  ],

  [
    "kia",
    "起亜",
    "Kia Corporation",
    [
      "キア",
      "起亜",
      "KIA",
      "KIA MOTORS",
      "KIA CORPORATION",
    ],
    ["KR"],
    "automaker",
    ["passenger", "commercial"],
    30,
  ],

  [
    "kg-mobility",
    "KGモビリティ",
    "KG Mobility Corporation",
    [
      "KGモビリティ",
      "KGM",
      "KG MOBILITY",
      "サンヨン",
      "双龍",
      "SSANGYONG",
    ],
    ["KR"],
    "automaker",
    ["passenger", "commercial"],
    40,
  ],

  [
    "renault-korea",
    "ルノーコリア",
    "Renault Korea Motors Co., Ltd.",
    [
      "ルノーコリア",
      "RENAULT KOREA",
      "RENAULT SAMSUNG",
      "ルノーサムスン",
    ],
    ["KR"],
    "automaker",
    ["passenger"],
    40,
  ],

  [
    "gm-korea",
    "GMコリア",
    "GM Korea Company",
    [
      "GMコリア",
      "GM KOREA",
      "GM DAEWOO",
      "GM大宇",
    ],
    ["KR"],
    "automaker",
    ["passenger", "commercial"],
    40,
  ],

  [
    "tata-motors",
    "タタ・モーターズ",
    "Tata Motors Limited",
    [
      "タタ",
      "TATA",
      "TATA MOTORS",
    ],
    ["IN"],
    "automotive-group",
    ["passenger", "commercial"],
    35,
  ],

  [
    "mahindra",
    "マヒンドラ＆マヒンドラ",
    "Mahindra & Mahindra Limited",
    [
      "マヒンドラ",
      "MAHINDRA",
      "MAHINDRA & MAHINDRA",
    ],
    ["IN"],
    "automotive-group",
    ["passenger", "commercial"],
    35,
  ],

  [
    "maruti-suzuki",
    "マルチ・スズキ",
    "Maruti Suzuki India Limited",
    [
      "マルチスズキ",
      "MARUTI",
      "MARUTI SUZUKI",
    ],
    ["IN"],
    "automaker",
    ["passenger", "commercial"],
    40,
  ],

  [
    "ashok-leyland",
    "アショック・レイランド",
    "Ashok Leyland Limited",
    [
      "アショックレイランド",
      "ASHOK LEYLAND",
    ],
    ["IN"],
    "commercial-vehicle-maker",
    ["commercial"],
    45,
  ],

  [
    "force-motors",
    "フォース・モーターズ",
    "Force Motors Limited",
    [
      "フォースモーターズ",
      "FORCE MOTORS",
    ],
    ["IN"],
    "automaker",
    ["passenger", "commercial"],
    45,
  ],

  [
    "ve-commercial-vehicles",
    "VEコマーシャル・ビークルズ",
    "VE Commercial Vehicles Limited",
    [
      "VECV",
      "VE COMMERCIAL VEHICLES",
      "ボルボアイシャー",
    ],
    ["IN"],
    "joint-venture",
    ["commercial"],
    50,
  ],

  [
    "vinfast",
    "ビンファスト",
    "VinFast Auto Ltd.",
    [
      "ビンファスト",
      "VINFAST",
      "VINFAST AUTO",
    ],
    ["VN"],
    "automaker",
    ["passenger", "commercial"],
    35,
  ],

  [
    "proton",
    "プロトン",
    "Proton Holdings Berhad",
    [
      "プロトン",
      "PROTON",
      "PROTON HOLDINGS",
    ],
    ["MY"],
    "automaker",
    ["passenger"],
    40,
  ],

  [
    "perodua",
    "プロドゥア",
    "Perusahaan Otomobil Kedua Sdn Bhd",
    [
      "プロドゥア",
      "PERODUA",
      "PERUSAHAAN OTOMOBIL KEDUA",
    ],
    ["MY"],
    "automaker",
    ["passenger", "commercial"],
    40,
  ],

  [
    "togg",
    "トッグ",
    "Türkiye'nin Otomobili Girişim Grubu",
    [
      "トッグ",
      "TOGG",
      "TURKIYENIN OTOMOBILI GIRISIM GRUBU",
    ],
    ["TR"],
    "automaker",
    ["passenger"],
    45,
  ],

  // ========================================================
  // 中国・台湾
  // ========================================================

  [
    "saic-motor",
    "上海汽車集団",
    "SAIC Motor Corporation Limited",
    [
      "上海汽車",
      "上海汽車集団",
      "SAIC",
      "SAIC MOTOR",
    ],
    ["CN"],
    "automotive-group",
    ["passenger", "commercial"],
    35,
  ],

  [
    "faw-group",
    "中国第一汽車集団",
    "China FAW Group Co., Ltd.",
    [
      "第一汽車",
      "中国一汽",
      "FAW",
      "FAW GROUP",
      "CHINA FAW",
    ],
    ["CN"],
    "automotive-group",
    ["passenger", "commercial"],
    35,
  ],

  [
    "dongfeng-motor",
    "東風汽車集団",
    "Dongfeng Motor Group Co., Ltd.",
    [
      "東風汽車",
      "東風",
      "DONGFENG",
      "DONGFENG MOTOR",
    ],
    ["CN"],
    "automotive-group",
    ["passenger", "commercial"],
    35,
  ],

  [
    "changan-automobile",
    "長安汽車",
    "Chongqing Changan Automobile Co., Ltd.",
    [
      "長安汽車",
      "長安",
      "CHANGAN",
      "CHANGAN AUTOMOBILE",
    ],
    ["CN"],
    "automotive-group",
    ["passenger", "commercial"],
    35,
  ],

  [
    "geely-auto-group",
    "吉利汽車集団",
    "Geely Auto Group",
    [
      "吉利汽車",
      "ジーリー",
      "GEELY",
      "GEELY AUTO",
      "GEELY AUTO GROUP",
    ],
    ["CN"],
    "automotive-group",
    ["passenger", "commercial"],
    30,
  ],

  [
    "byd",
    "比亜迪",
    "BYD Company Limited",
    [
      "BYD",
      "ビーワイディー",
      "比亜迪",
      "BYD AUTO",
      "BYD COMPANY",
    ],
    ["CN"],
    "automotive-group",
    ["passenger", "commercial"],
    30,
  ],

  [
    "great-wall-motor",
    "長城汽車",
    "Great Wall Motor Company Limited",
    [
      "長城汽車",
      "GWM",
      "GREAT WALL",
      "GREAT WALL MOTOR",
    ],
    ["CN"],
    "automotive-group",
    ["passenger", "commercial"],
    35,
  ],

  [
    "chery-automobile",
    "奇瑞汽車",
    "Chery Automobile Co., Ltd.",
    [
      "奇瑞汽車",
      "チェリー",
      "CHERY",
      "CHERY AUTOMOBILE",
    ],
    ["CN"],
    "automotive-group",
    ["passenger", "commercial"],
    35,
  ],

  [
    "gac-group",
    "広州汽車集団",
    "Guangzhou Automobile Group Co., Ltd.",
    [
      "広州汽車",
      "広汽",
      "GAC",
      "GAC GROUP",
      "GUANGZHOU AUTOMOBILE",
    ],
    ["CN"],
    "automotive-group",
    ["passenger", "commercial"],
    40,
  ],

  [
    "baic-group",
    "北京汽車集団",
    "Beijing Automotive Group Co., Ltd.",
    [
      "北京汽車",
      "北汽",
      "BAIC",
      "BAIC GROUP",
      "BEIJING AUTOMOTIVE",
    ],
    ["CN"],
    "automotive-group",
    ["passenger", "commercial"],
    40,
  ],

  [
    "jac-motors",
    "江淮汽車",
    "Anhui Jianghuai Automobile Group Corp., Ltd.",
    [
      "江淮汽車",
      "JAC",
      "JAC MOTORS",
      "JIANGHUAI",
    ],
    ["CN"],
    "automotive-group",
    ["passenger", "commercial"],
    40,
  ],

  [
    "nio",
    "蔚来汽車",
    "NIO Inc.",
    [
      "蔚来",
      "NIO",
      "ニオ",
      "NIO INC",
    ],
    ["CN"],
    "automaker",
    ["passenger"],
    35,
  ],

  [
    "xpeng",
    "小鵬汽車",
    "XPeng Inc.",
    [
      "小鵬",
      "XPENG",
      "シャオペン",
      "XIAOPENG",
    ],
    ["CN"],
    "automaker",
    ["passenger"],
    35,
  ],

  [
    "li-auto",
    "理想汽車",
    "Li Auto Inc.",
    [
      "理想汽車",
      "理想",
      "LI AUTO",
      "LIXIANG",
    ],
    ["CN"],
    "automaker",
    ["passenger"],
    40,
  ],

  [
    "leapmotor",
    "零跑汽車",
    "Zhejiang Leapmotor Technology Co., Ltd.",
    [
      "零跑汽車",
      "リープモーター",
      "LEAPMOTOR",
      "LEAP MOTOR",
    ],
    ["CN"],
    "automaker",
    ["passenger"],
    40,
  ],

  [
    "seres-group",
    "賽力斯集団",
    "Seres Group Co., Ltd.",
    [
      "賽力斯",
      "セレス",
      "SERES",
      "SERES GROUP",
    ],
    ["CN"],
    "automotive-group",
    ["passenger", "commercial"],
    40,
  ],

  [
    "xiaomi-ev",
    "小米汽車",
    "Xiaomi EV Technology Co., Ltd.",
    [
      "小米汽車",
      "シャオミEV",
      "XIAOMI EV",
      "XIAOMI AUTO",
    ],
    ["CN"],
    "automaker",
    ["passenger"],
    40,
  ],

  [
    "saic-gm-wuling",
    "上汽通用五菱",
    "SAIC-GM-Wuling Automobile Co., Ltd.",
    [
      "上汽通用五菱",
      "五菱",
      "SGMW",
      "SAIC-GM-WULING",
      "WULING AUTOMOBILE",
    ],
    ["CN"],
    "joint-venture",
    ["passenger", "commercial"],
    40,
  ],

  [
    "yulon-motor",
    "裕隆汽車",
    "Yulon Motor Co., Ltd.",
    [
      "裕隆汽車",
      "ユーロン",
      "YULON",
      "YULON MOTOR",
    ],
    ["TW"],
    "automotive-group",
    ["passenger", "commercial"],
    45,
  ],

  [
    "foxtron",
    "鴻華先進科技",
    "Foxtron Vehicle Technologies Co., Ltd.",
    [
      "鴻華先進",
      "フォックストロン",
      "FOXTRON",
      "FOXTRON VEHICLE TECHNOLOGIES",
    ],
    ["TW"],
    "automaker",
    ["passenger", "commercial"],
    45,
  ],

  // ========================================================
  // その他
  // ========================================================

  [
    "avtovaz",
    "アフトワズ",
    "AvtoVAZ JSC",
    [
      "アフトワズ",
      "AVTOVAZ",
      "AUTO VAZ",
    ],
    ["RU"],
    "automaker",
    ["passenger", "commercial"],
    45,
  ],

  [
    "gaz-group",
    "GAZグループ",
    "GAZ Group",
    [
      "GAZ",
      "ガズ",
      "GAZ GROUP",
    ],
    ["RU"],
    "automotive-group",
    ["passenger", "commercial"],
    45,
  ],

  [
    "kamaz",
    "カマズ",
    "KAMAZ PTC",
    [
      "カマズ",
      "KAMAZ",
      "KAMAZ PTC",
    ],
    ["RU"],
    "commercial-vehicle-maker",
    ["commercial"],
    45,
  ],

  [
    "sollers",
    "ソラーズ",
    "Sollers PJSC",
    [
      "ソラーズ",
      "SOLLERS",
      "SOLLERS PJSC",
    ],
    ["RU"],
    "automotive-group",
    ["passenger", "commercial"],
    50,
  ],

  [
    "iran-khodro",
    "イラン・ホドロ",
    "Iran Khodro Industrial Group",
    [
      "イランホドロ",
      "IRAN KHODRO",
      "IKCO",
    ],
    ["IR"],
    "automotive-group",
    ["passenger", "commercial"],
    50,
  ],

  [
    "saipa",
    "サイパ",
    "SAIPA Corporation",
    [
      "サイパ",
      "SAIPA",
      "SAIPA CORPORATION",
    ],
    ["IR"],
    "automaker",
    ["passenger", "commercial"],
    50,
  ],

  [
    "w-motors",
    "Wモーターズ",
    "W Motors",
    [
      "Wモーターズ",
      "W MOTORS",
      "WMOTORS",
    ],
    ["AE"],
    "specialty-maker",
    ["passenger"],
    50,
  ],

  [
    "ceer-motors",
    "シーア・モーターズ",
    "Ceer Motors",
    [
      "シーア",
      "CEER",
      "CEER MOTORS",
    ],
    ["SA"],
    "automaker",
    ["passenger"],
    50,
  ],

  [
    "thai-rung",
    "タイ・ルン・ユニオン・カー",
    "Thai Rung Union Car Public Company Limited",
    [
      "タイ・ルン",
      "THAI RUNG",
      "THAI RUNG UNION CAR",
    ],
    ["TH"],
    "automaker",
    ["passenger", "commercial"],
    50,
  ],

  [
    "rodin-cars",
    "ロディン・カーズ",
    "Rodin Cars Limited",
    [
      "ロディン",
      "RODIN",
      "RODIN CARS",
    ],
    ["NZ"],
    "specialty-maker",
    ["passenger"],
    50,
  ],
];

export const makers = Object.freeze(
  makerRows
    .map(
      ([
        id,
        name,
        nameEn,
        aliases,
        countries,
        kind,
        vehicleTypes,
        priority,
      ]) =>
        createMaker({
          id,
          name,
          nameEn,
          aliases,
          countries,
          kind,
          vehicleTypes,
          priority,
        }),
    )
    .sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }

      return a.name.localeCompare(b.name, "ja");
    }),
);

/**
 * 入力文字列を比較用に整える。
 *
 * 例：
 * Mercedes-Benz
 * Mercedes Benz
 * メルセデス・ベンツ
 *
 * 記号や空白の違いを吸収して比較する。
 */
export function normalizeMakerText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase("ja-JP")
    .replace(/[\s\u3000]/g, "")
    .replace(/[・･.,，。'’"`´]/g, "")
    .replace(/[()[\]{}【】「」『』]/g, "")
    .replace(/[\/\\|]/g, "")
    .replace(/[-‐-‒–—―ー]/g, "");
}

const makerById = new Map();
const makersByNormalizedKeyword = new Map();

for (const maker of makers) {
  makerById.set(maker.id, maker);

  for (const keyword of maker.keywords) {
    const normalizedKeyword = normalizeMakerText(keyword);

    if (!normalizedKeyword) {
      continue;
    }

    const current = makersByNormalizedKeyword.get(normalizedKeyword) || [];

    makersByNormalizedKeyword.set(
      normalizedKeyword,
      [...current, maker].sort((a, b) => a.priority - b.priority),
    );
  }
}

/**
 * IDからメーカーを取得する。
 */
export function getMakerById(id) {
  if (!id) {
    return null;
  }

  return makerById.get(String(id)) || null;
}

/**
 * 入力内容がメーカー名と完全一致した場合に取得する。
 *
 * 完全一致なので、
 * 「GM」が無関係な文章の途中に含まれていた場合などの
 * 誤判定を避けられる。
 */
export function findMakerByExactText(text) {
  const normalizedText = normalizeMakerText(text);

  if (!normalizedText) {
    return null;
  }

  const matches = makersByNormalizedKeyword.get(normalizedText) || [];

  return matches[0] || null;
}

/**
 * 同じ表記が複数メーカーに登録されている場合も含め、
 * 完全一致したメーカーをすべて返す。
 */
export function findAllMakersByExactText(text) {
  const normalizedText = normalizeMakerText(text);

  if (!normalizedText) {
    return [];
  }

  return makersByNormalizedKeyword.get(normalizedText) || [];
}

/**
 * 指定した種類のメーカーだけを返す。
 *
 * 例：
 * getMakersByKind("commercial-vehicle-maker")
 */
export function getMakersByKind(kind) {
  if (!kind) {
    return [];
  }

  return makers.filter((maker) => maker.kind === kind);
}

/**
 * 指定した国に関係するメーカーだけを返す。
 *
 * 例：
 * getMakersByCountry("JP")
 */
export function getMakersByCountry(country) {
  const normalizedCountry = String(country ?? "")
    .trim()
    .toUpperCase();

  if (!normalizedCountry) {
    return [];
  }

  return makers.filter((maker) =>
    maker.countries.includes(normalizedCountry),
  );
}

/**
 * 乗用車・商用車などの区分で取得する。
 *
 * 例：
 * getMakersByVehicleType("passenger")
 */
export function getMakersByVehicleType(vehicleType) {
  if (!vehicleType) {
    return [];
  }

  return makers.filter((maker) =>
    maker.vehicleTypes.includes(vehicleType),
  );
}
