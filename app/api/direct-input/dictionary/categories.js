/**
 * ==========================================================
 * 車両カテゴリ辞書
 * ==========================================================
 *
 * 対象：
 * - 軽自動車・普通車
 * - 国産車・輸入車
 * - ボディタイプ
 * - 動力方式
 * - 駆動方式
 * - 車体サイズ
 * - 乗車人数
 *
 * models.jsのbodyTypesと対応させる。
 */

export const CATEGORY_GROUPS =
  Object.freeze({
    VEHICLE_CLASS: "vehicle-class",
    ORIGIN: "origin",
    BODY_TYPE: "body-type",
    POWERTRAIN: "powertrain",
    DRIVE_TYPE: "drive-type",
    SIZE: "size",
    SEATING: "seating",
  });

const DICTIONARY_TYPE = "category";

const unique = (values) => {
  return [
    ...new Set(
      values
        .filter(
          (value) =>
            typeof value === "string",
        )
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ];
};

const defineCategory = (
  id,
  name,
  nameEn,
  aliases,
  group,
  key,
  {
    inventoryTypes = [],
    modelBodyTypes = [],
    seatCount = null,
    minimumSeats = null,
    maximumSeats = null,
    status = "current",
    priority = 100,
  } = {},
) => ({
  id,
  name,
  nameEn,
  aliases,
  group,
  key,
  inventoryTypes,
  modelBodyTypes,
  seatCount,
  minimumSeats,
  maximumSeats,
  status,
  priority,
});

const createCategoryEntry = ({
  id,
  name,
  nameEn,
  aliases = [],
  group,
  key,
  inventoryTypes = [],
  modelBodyTypes = [],
  seatCount = null,
  minimumSeats = null,
  maximumSeats = null,
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

    // schema.jsとの共通項目
    parent: group,
    category: key,

    tags: unique([
      group,
      key,
      status,
      ...modelBodyTypes,
      ...inventoryTypes.map(
        (value) =>
          `inventory:${value}`,
      ),
    ]),

    priority,

    // categories.js固有項目
    group,
    key,
    inventoryTypes:
      unique(inventoryTypes),
    modelBodyTypes:
      unique(modelBodyTypes),
    seatCount,
    minimumSeats,
    maximumSeats,
    status,
  });
};

const categoryDefinitions = [
  // ========================================================
  // 車両区分
  // ========================================================

  defineCategory(
    "category-kei",
    "軽自動車",
    "Kei Car",
    [
      "軽",
      "軽四",
      "軽カー",
      "Kカー",
      "K CAR",
      "KEI",
      "KEI CAR",
      "軽乗用車",
      "軽四輪",
      "660CC",
      "660シーシー",
      "黄色ナンバー",
    ],
    CATEGORY_GROUPS.VEHICLE_CLASS,
    "kei",
    {
      inventoryTypes: [
        "軽自動車",
      ],
      modelBodyTypes: [
        "kei",
      ],
      priority: 10,
    },
  ),

  defineCategory(
    "category-regular-car",
    "普通車",
    "Regular Car",
    [
      "普通乗用車",
      "登録車",
      "白ナンバー",
      "乗用車",
      "普通自動車",
      "REGULAR CAR",
      "PASSENGER CAR",
    ],
    CATEGORY_GROUPS.VEHICLE_CLASS,
    "regular-car",
    {
      inventoryTypes: [
        "普通車",
      ],
      priority: 10,
    },
  ),

  defineCategory(
    "category-small-passenger-car",
    "小型乗用車",
    "Small Passenger Car",
    [
      "小型車",
      "小型自動車",
      "小型乗用",
      "5ナンバー",
      "5ナンバー車",
      "5ナンバーサイズ",
      "五ナンバー",
    ],
    CATEGORY_GROUPS.VEHICLE_CLASS,
    "small-passenger-car",
    {
      inventoryTypes: [
        "普通車",
        "コンパクトカー",
      ],
      modelBodyTypes: [
        "compact",
      ],
      priority: 20,
    },
  ),

  defineCategory(
    "category-three-number-car",
    "3ナンバー車",
    "Three Number Car",
    [
      "3ナンバー",
      "三ナンバー",
      "普通乗用車",
      "ワイドボディ",
      "ワイドサイズ",
    ],
    CATEGORY_GROUPS.VEHICLE_CLASS,
    "three-number-car",
    {
      inventoryTypes: [
        "普通車",
      ],
      priority: 30,
    },
  ),

  defineCategory(
    "category-commercial-vehicle",
    "商用車",
    "Commercial Vehicle",
    [
      "営業車",
      "仕事用車",
      "業務用車",
      "働く車",
      "働くクルマ",
      "COMMERCIAL VEHICLE",
      "BUSINESS VEHICLE",
    ],
    CATEGORY_GROUPS.VEHICLE_CLASS,
    "commercial",
    {
      inventoryTypes: [
        "商用車",
      ],
      modelBodyTypes: [
        "commercial-van",
        "truck",
      ],
      priority: 15,
    },
  ),

  // ========================================================
  // 国産・輸入
  // ========================================================

  defineCategory(
    "category-domestic-car",
    "国産車",
    "Japanese Car",
    [
      "日本車",
      "国内メーカー",
      "日本メーカー",
      "国産メーカー",
      "DOMESTIC CAR",
      "JAPANESE CAR",
      "JDM",
    ],
    CATEGORY_GROUPS.ORIGIN,
    "domestic",
    {
      inventoryTypes: [
        "国産車",
      ],
      priority: 10,
    },
  ),

  defineCategory(
    "category-imported-car",
    "輸入車",
    "Imported Car",
    [
      "外車",
      "外国車",
      "海外メーカー",
      "輸入メーカー",
      "IMPORT CAR",
      "IMPORTED CAR",
      "FOREIGN CAR",
    ],
    CATEGORY_GROUPS.ORIGIN,
    "imported",
    {
      inventoryTypes: [
        "輸入車",
      ],
      priority: 10,
    },
  ),

  defineCategory(
    "category-european-car",
    "欧州車",
    "European Car",
    [
      "ヨーロッパ車",
      "ヨーロッパメーカー",
      "欧州メーカー",
      "EUROPEAN CAR",
      "EURO CAR",
    ],
    CATEGORY_GROUPS.ORIGIN,
    "european",
    {
      inventoryTypes: [
        "輸入車",
      ],
      priority: 20,
    },
  ),

  defineCategory(
    "category-american-car",
    "アメリカ車",
    "American Car",
    [
      "アメ車",
      "米国車",
      "アメリカンカー",
      "米国メーカー",
      "AMERICAN CAR",
      "US CAR",
    ],
    CATEGORY_GROUPS.ORIGIN,
    "american",
    {
      inventoryTypes: [
        "輸入車",
      ],
      priority: 15,
    },
  ),

  defineCategory(
    "category-german-car",
    "ドイツ車",
    "German Car",
    [
      "ドイツメーカー",
      "独車",
      "GERMAN CAR",
      "GERMAN VEHICLE",
    ],
    CATEGORY_GROUPS.ORIGIN,
    "german",
    {
      inventoryTypes: [
        "輸入車",
      ],
      priority: 15,
    },
  ),

  defineCategory(
    "category-british-car",
    "イギリス車",
    "British Car",
    [
      "英国車",
      "イギリスメーカー",
      "英国メーカー",
      "BRITISH CAR",
      "UK CAR",
    ],
    CATEGORY_GROUPS.ORIGIN,
    "british",
    {
      inventoryTypes: [
        "輸入車",
      ],
      priority: 20,
    },
  ),

  defineCategory(
    "category-french-car",
    "フランス車",
    "French Car",
    [
      "仏車",
      "フランスメーカー",
      "FRENCH CAR",
    ],
    CATEGORY_GROUPS.ORIGIN,
    "french",
    {
      inventoryTypes: [
        "輸入車",
      ],
      priority: 20,
    },
  ),

  defineCategory(
    "category-italian-car",
    "イタリア車",
    "Italian Car",
    [
      "イタ車",
      "イタリアメーカー",
      "ITALIAN CAR",
    ],
    CATEGORY_GROUPS.ORIGIN,
    "italian",
    {
      inventoryTypes: [
        "輸入車",
      ],
      priority: 20,
    },
  ),

  defineCategory(
    "category-swedish-car",
    "スウェーデン車",
    "Swedish Car",
    [
      "北欧車",
      "スウェーデンメーカー",
      "SWEDISH CAR",
      "SCANDINAVIAN CAR",
    ],
    CATEGORY_GROUPS.ORIGIN,
    "swedish",
    {
      inventoryTypes: [
        "輸入車",
      ],
      priority: 25,
    },
  ),

  // ========================================================
  // ボディタイプ
  // ========================================================

  defineCategory(
    "category-compact",
    "コンパクトカー",
    "Compact Car",
    [
      "コンパクト",
      "小さい車",
      "小さな車",
      "小型カー",
      "小型乗用車",
      "COMPACT",
      "COMPACT CAR",
      "CITY CAR",
    ],
    CATEGORY_GROUPS.BODY_TYPE,
    "compact",
    {
      inventoryTypes: [
        "コンパクトカー",
      ],
      modelBodyTypes: [
        "compact",
        "hatchback",
      ],
      priority: 10,
    },
  ),

  defineCategory(
    "category-hatchback",
    "ハッチバック",
    "Hatchback",
    [
      "ハッチバック車",
      "5ドアハッチバック",
      "5ドア",
      "3ドアハッチバック",
      "HATCHBACK",
      "HATCH BACK",
    ],
    CATEGORY_GROUPS.BODY_TYPE,
    "hatchback",
    {
      inventoryTypes: [
        "コンパクトカー",
      ],
      modelBodyTypes: [
        "hatchback",
      ],
      priority: 15,
    },
  ),

  defineCategory(
    "category-tall-wagon",
    "トールワゴン",
    "Tall Wagon",
    [
      "ハイトワゴン",
      "背の高い車",
      "背が高い車",
      "背の高い軽",
      "背が高い軽",
      "軽トールワゴン",
      "軽ハイトワゴン",
      "TALL WAGON",
      "HIGH WAGON",
    ],
    CATEGORY_GROUPS.BODY_TYPE,
    "tall-wagon",
    {
      inventoryTypes: [
        "軽自動車",
      ],
      modelBodyTypes: [
        "tall-wagon",
      ],
      priority: 15,
    },
  ),

  defineCategory(
    "category-super-height-wagon",
    "スーパーハイトワゴン",
    "Super Height Wagon",
    [
      "スーパーハイト",
      "軽スーパーハイト",
      "軽スーパーハイトワゴン",
      "超ハイトワゴン",
      "SUPER HEIGHT WAGON",
      "SUPER TALL WAGON",
    ],
    CATEGORY_GROUPS.BODY_TYPE,
    "super-height-wagon",
    {
      inventoryTypes: [
        "軽自動車",
      ],
      modelBodyTypes: [
        "tall-wagon",
        "kei",
      ],
      priority: 10,
    },
  ),

  defineCategory(
    "category-minivan",
    "ミニバン",
    "Minivan",
    [
      "ミニバンタイプ",
      "ワンボックス",
      "ワンボックスカー",
      "1BOX",
      "1BOXカー",
      "三列シート",
      "3列シート",
      "ファミリーミニバン",
      "MINIVAN",
      "MINI VAN",
      "MPV",
    ],
    CATEGORY_GROUPS.BODY_TYPE,
    "minivan",
    {
      inventoryTypes: [
        "ミニバン",
      ],
      modelBodyTypes: [
        "minivan",
      ],
      priority: 10,
    },
  ),

  defineCategory(
    "category-suv",
    "SUV",
    "Sport Utility Vehicle",
    [
      "エスユーブイ",
      "SUV車",
      "SUVタイプ",
      "スポーツユーティリティ",
      "SPORT UTILITY VEHICLE",
      "SPORTS UTILITY VEHICLE",
    ],
    CATEGORY_GROUPS.BODY_TYPE,
    "suv",
    {
      inventoryTypes: [
        "SUV",
      ],
      modelBodyTypes: [
        "suv",
      ],
      priority: 10,
    },
  ),

  defineCategory(
    "category-compact-suv",
    "コンパクトSUV",
    "Compact SUV",
    [
      "小型SUV",
      "小さいSUV",
      "ミドルコンパクトSUV",
      "COMPACT SUV",
      "SMALL SUV",
    ],
    CATEGORY_GROUPS.BODY_TYPE,
    "compact-suv",
    {
      inventoryTypes: [
        "SUV",
        "コンパクトカー",
      ],
      modelBodyTypes: [
        "suv",
        "compact",
      ],
      priority: 10,
    },
  ),

  defineCategory(
    "category-crossover-suv",
    "クロスオーバーSUV",
    "Crossover SUV",
    [
      "クロスオーバー",
      "クロスオーバー車",
      "CUV",
      "CROSSOVER SUV",
      "CROSSOVER",
    ],
    CATEGORY_GROUPS.BODY_TYPE,
    "crossover-suv",
    {
      inventoryTypes: [
        "SUV",
      ],
      modelBodyTypes: [
        "suv",
      ],
      priority: 15,
    },
  ),

  defineCategory(
    "category-off-road",
    "クロスカントリー",
    "Off-Road Vehicle",
    [
      "クロカン",
      "本格四駆",
      "本格4WD",
      "オフロード車",
      "四駆車",
      "4駆車",
      "OFF ROAD",
      "OFF-ROAD",
      "CROSS COUNTRY",
    ],
    CATEGORY_GROUPS.BODY_TYPE,
    "off-road",
    {
      inventoryTypes: [
        "SUV",
      ],
      modelBodyTypes: [
        "suv",
        "off-road",
      ],
      priority: 15,
    },
  ),

  defineCategory(
    "category-sedan",
    "セダン",
    "Sedan",
    [
      "セダン車",
      "4ドアセダン",
      "ノッチバック",
      "SALOON",
      "SEDAN",
    ],
    CATEGORY_GROUPS.BODY_TYPE,
    "sedan",
    {
      inventoryTypes: [
        "セダン",
      ],
      modelBodyTypes: [
        "sedan",
      ],
      priority: 10,
    },
  ),

  defineCategory(
    "category-wagon",
    "ステーションワゴン",
    "Station Wagon",
    [
      "ワゴン",
      "ツーリングワゴン",
      "エステート",
      "アバント",
      "ヴァリアント",
      "シューティングブレーク",
      "STATION WAGON",
      "ESTATE",
      "TOURING WAGON",
    ],
    CATEGORY_GROUPS.BODY_TYPE,
    "wagon",
    {
      inventoryTypes: [
        "ステーションワゴン",
      ],
      modelBodyTypes: [
        "wagon",
      ],
      priority: 10,
    },
  ),

  defineCategory(
    "category-coupe",
    "クーペ",
    "Coupe",
    [
      "2ドアクーペ",
      "ツードアクーペ",
      "ファストバッククーペ",
      "COUPE",
      "COUPÉ",
    ],
    CATEGORY_GROUPS.BODY_TYPE,
    "coupe",
    {
      inventoryTypes: [
        "クーペ",
      ],
      modelBodyTypes: [
        "coupe",
      ],
      priority: 10,
    },
  ),

  defineCategory(
    "category-convertible",
    "オープンカー",
    "Convertible",
    [
      "オープン",
      "幌車",
      "カブリオレ",
      "コンバーチブル",
      "ロードスター",
      "スパイダー",
      "タルガトップ",
      "電動オープン",
      "CONVERTIBLE",
      "CABRIOLET",
      "ROADSTER",
      "SPIDER",
    ],
    CATEGORY_GROUPS.BODY_TYPE,
    "convertible",
    {
      inventoryTypes: [
        "オープンカー",
      ],
      modelBodyTypes: [
        "convertible",
      ],
      priority: 10,
    },
  ),

  defineCategory(
    "category-sports-car",
    "スポーツカー",
    "Sports Car",
    [
      "スポーツモデル",
      "ハイパフォーマンスカー",
      "走りの車",
      "速い車",
      "SPORTS CAR",
      "PERFORMANCE CAR",
    ],
    CATEGORY_GROUPS.BODY_TYPE,
    "sports",
    {
      inventoryTypes: [
        "スポーツカー",
        "クーペ",
      ],
      modelBodyTypes: [
        "sports",
        "coupe",
      ],
      priority: 10,
    },
  ),

  defineCategory(
    "category-luxury-car",
    "高級車",
    "Luxury Car",
    [
      "ラグジュアリーカー",
      "プレミアムカー",
      "高級セダン",
      "高級SUV",
      "高級ミニバン",
      "上級車",
      "LUXURY CAR",
      "PREMIUM CAR",
    ],
    CATEGORY_GROUPS.BODY_TYPE,
    "luxury",
    {
      inventoryTypes: [
        "高級車",
      ],
      modelBodyTypes: [
        "luxury",
      ],
      priority: 15,
    },
  ),

  defineCategory(
    "category-commercial-van",
    "商用バン",
    "Commercial Van",
    [
      "バン",
      "貨物バン",
      "仕事用バン",
      "営業バン",
      "箱バン",
      "箱型バン",
      "貨物車",
      "COMMERCIAL VAN",
      "CARGO VAN",
    ],
    CATEGORY_GROUPS.BODY_TYPE,
    "commercial-van",
    {
      inventoryTypes: [
        "商用車",
        "バン",
      ],
      modelBodyTypes: [
        "commercial-van",
      ],
      priority: 10,
    },
  ),

  defineCategory(
    "category-kei-van",
    "軽バン",
    "Kei Van",
    [
      "軽貨物",
      "軽箱バン",
      "軽箱",
      "軽商用バン",
      "軽ワンボックス",
      "KEI VAN",
      "LIGHT VAN",
    ],
    CATEGORY_GROUPS.BODY_TYPE,
    "kei-van",
    {
      inventoryTypes: [
        "軽自動車",
        "商用車",
        "バン",
      ],
      modelBodyTypes: [
        "kei",
        "commercial-van",
      ],
      priority: 10,
    },
  ),

  defineCategory(
    "category-truck",
    "トラック",
    "Truck",
    [
      "貨物トラック",
      "平ボディ",
      "平ボデー",
      "ダンプ",
      "ダンプカー",
      "TRUCK",
      "LORRY",
    ],
    CATEGORY_GROUPS.BODY_TYPE,
    "truck",
    {
      inventoryTypes: [
        "トラック",
        "商用車",
      ],
      modelBodyTypes: [
        "truck",
      ],
      priority: 10,
    },
  ),

  defineCategory(
    "category-kei-truck",
    "軽トラック",
    "Kei Truck",
    [
      "軽トラ",
      "軽貨物トラック",
      "軽ダンプ",
      "KEI TRUCK",
      "MINI TRUCK",
    ],
    CATEGORY_GROUPS.BODY_TYPE,
    "kei-truck",
    {
      inventoryTypes: [
        "軽自動車",
        "トラック",
        "商用車",
      ],
      modelBodyTypes: [
        "kei",
        "truck",
      ],
      priority: 10,
    },
  ),

  defineCategory(
    "category-pickup-truck",
    "ピックアップトラック",
    "Pickup Truck",
    [
      "ピックアップ",
      "ダブルキャブ",
      "PICKUP",
      "PICK UP",
      "PICKUP TRUCK",
    ],
    CATEGORY_GROUPS.BODY_TYPE,
    "pickup-truck",
    {
      inventoryTypes: [
        "トラック",
        "SUV",
      ],
      modelBodyTypes: [
        "truck",
        "off-road",
      ],
      priority: 15,
    },
  ),

  defineCategory(
    "category-camper",
    "キャンピングカー",
    "Camper",
    [
      "キャンパー",
      "車中泊カー",
      "車中泊仕様",
      "キャンピング仕様",
      "バンコン",
      "キャブコン",
      "軽キャンパー",
      "軽キャン",
      "CAMPER",
      "CAMPER VAN",
      "MOTORHOME",
    ],
    CATEGORY_GROUPS.BODY_TYPE,
    "camper",
    {
      inventoryTypes: [
        "キャンピングカー",
        "商用車",
      ],
      modelBodyTypes: [
        "commercial-van",
        "minivan",
      ],
      priority: 15,
    },
  ),

  defineCategory(
    "category-microbus",
    "マイクロバス",
    "Microbus",
    [
      "小型バス",
      "送迎バス",
      "コミューター",
      "MICROBUS",
      "MINIBUS",
    ],
    CATEGORY_GROUPS.BODY_TYPE,
    "microbus",
    {
      inventoryTypes: [
        "バス",
        "商用車",
      ],
      modelBodyTypes: [
        "commercial-van",
        "minivan",
      ],
      minimumSeats: 10,
      priority: 25,
    },
  ),

  // ========================================================
  // 動力方式
  // ========================================================

  defineCategory(
    "category-electrified",
    "電動車",
    "Electrified Vehicle",
    [
      "電動化車両",
      "電動自動車",
      "電動モデル",
      "EV・HV",
      "EV HV",
      "EV/HV",
      "ELECTRIFIED VEHICLE",
      "ELECTRIFIED CAR",
    ],
    CATEGORY_GROUPS.POWERTRAIN,
    "electrified",
    {
      inventoryTypes: [
        "EV・HV",
      ],
      modelBodyTypes: [
        "hybrid",
        "plug-in-hybrid",
        "ev",
      ],
      priority: 20,
    },
  ),

  defineCategory(
    "category-gasoline",
    "ガソリン車",
    "Gasoline Car",
    [
      "ガソリン",
      "ガソリンエンジン",
      "ガソリンモデル",
      "レギュラーガソリン",
      "ハイオク車",
      "PETROL",
      "GASOLINE",
      "GASOLINE CAR",
    ],
    CATEGORY_GROUPS.POWERTRAIN,
    "gasoline",
    {
      inventoryTypes: [
        "ガソリン車",
      ],
      priority: 10,
    },
  ),

  defineCategory(
    "category-diesel",
    "ディーゼル車",
    "Diesel Car",
    [
      "ディーゼル",
      "ディーゼルエンジン",
      "クリーンディーゼル",
      "軽油車",
      "軽油",
      "DIESEL",
      "DIESEL CAR",
      "CLEAN DIESEL",
    ],
    CATEGORY_GROUPS.POWERTRAIN,
    "diesel",
    {
      inventoryTypes: [
        "ディーゼル車",
      ],
      priority: 10,
    },
  ),

  defineCategory(
    "category-hybrid",
    "ハイブリッド車",
    "Hybrid Vehicle",
    [
      "ハイブリッド",
      "HV",
      "HEV",
      "HYBRID",
      "HYBRID CAR",
      "HYBRID VEHICLE",
      "ストロングハイブリッド",
      "フルハイブリッド",
    ],
    CATEGORY_GROUPS.POWERTRAIN,
    "hybrid",
    {
      inventoryTypes: [
        "EV・HV",
      ],
      modelBodyTypes: [
        "hybrid",
      ],
      priority: 10,
    },
  ),

  defineCategory(
    "category-mild-hybrid",
    "マイルドハイブリッド",
    "Mild Hybrid",
    [
      "MILD HYBRID",
      "MHEV",
      "マイルドHV",
      "簡易ハイブリッド",
    ],
    CATEGORY_GROUPS.POWERTRAIN,
    "mild-hybrid",
    {
      inventoryTypes: [
        "EV・HV",
      ],
      modelBodyTypes: [
        "hybrid",
      ],
      priority: 15,
    },
  ),

  defineCategory(
    "category-plug-in-hybrid",
    "プラグインハイブリッド",
    "Plug-in Hybrid",
    [
      "プラグインHV",
      "PHEV",
      "PHV",
      "PLUGIN HYBRID",
      "PLUG-IN HYBRID",
      "プラグインハイブリッド車",
    ],
    CATEGORY_GROUPS.POWERTRAIN,
    "plug-in-hybrid",
    {
      inventoryTypes: [
        "EV・HV",
      ],
      modelBodyTypes: [
        "plug-in-hybrid",
      ],
      priority: 10,
    },
  ),

  defineCategory(
    "category-ev",
    "電気自動車",
    "Electric Vehicle",
    [
      "電気車",
      "EV",
      "BEV",
      "バッテリーEV",
      "バッテリー式電気自動車",
      "ELECTRIC VEHICLE",
      "ELECTRIC CAR",
      "BATTERY EV",
    ],
    CATEGORY_GROUPS.POWERTRAIN,
    "ev",
    {
      inventoryTypes: [
        "EV・HV",
      ],
      modelBodyTypes: [
        "ev",
      ],
      priority: 10,
    },
  ),

  defineCategory(
    "category-fuel-cell",
    "燃料電池車",
    "Fuel Cell Vehicle",
    [
      "FCV",
      "FCEV",
      "水素自動車",
      "水素車",
      "燃料電池自動車",
      "FUEL CELL VEHICLE",
      "HYDROGEN CAR",
    ],
    CATEGORY_GROUPS.POWERTRAIN,
    "fuel-cell",
    {
      inventoryTypes: [
        "EV・HV",
      ],
      priority: 20,
    },
  ),

  defineCategory(
    "category-range-extender",
    "レンジエクステンダー",
    "Range Extender",
    [
      "レンジエクステンダーEV",
      "発電用エンジン",
      "シリーズハイブリッド",
      "RANGE EXTENDER",
      "RANGE-EXTENDER EV",
      "REEV",
    ],
    CATEGORY_GROUPS.POWERTRAIN,
    "range-extender",
    {
      inventoryTypes: [
        "EV・HV",
      ],
      modelBodyTypes: [
        "hybrid",
        "ev",
      ],
      priority: 25,
    },
  ),

  defineCategory(
    "category-turbo",
    "ターボ車",
    "Turbocharged Car",
    [
      "ターボ",
      "過給機付き",
      "ターボエンジン",
      "TURBO",
      "TURBOCHARGED",
      "TURBO CAR",
    ],
    CATEGORY_GROUPS.POWERTRAIN,
    "turbo",
    {
      inventoryTypes: [
        "ターボ車",
      ],
      priority: 15,
    },
  ),

  defineCategory(
    "category-supercharger",
    "スーパーチャージャー車",
    "Supercharged Car",
    [
      "スーパーチャージャー",
      "SC車",
      "機械式過給機",
      "SUPERCHARGER",
      "SUPERCHARGED",
    ],
    CATEGORY_GROUPS.POWERTRAIN,
    "supercharger",
    {
      priority: 25,
    },
  ),

  // ========================================================
  // 駆動方式
  // ========================================================

  defineCategory(
    "category-four-wheel-drive",
    "4WD",
    "Four-Wheel Drive",
    [
      "四駆",
      "4駆",
      "ヨンク",
      "四輪駆動",
      "4輪駆動",
      "AWD",
      "FULL TIME 4WD",
      "FULL-TIME 4WD",
      "FOUR WHEEL DRIVE",
      "ALL WHEEL DRIVE",
    ],
    CATEGORY_GROUPS.DRIVE_TYPE,
    "4wd",
    {
      inventoryTypes: [
        "4WD",
      ],
      priority: 10,
    },
  ),

  defineCategory(
    "category-two-wheel-drive",
    "2WD",
    "Two-Wheel Drive",
    [
      "二駆",
      "2駆",
      "二輪駆動",
      "前輪駆動か後輪駆動",
      "TWO WHEEL DRIVE",
    ],
    CATEGORY_GROUPS.DRIVE_TYPE,
    "2wd",
    {
      inventoryTypes: [
        "2WD",
      ],
      priority: 20,
    },
  ),

  defineCategory(
    "category-front-wheel-drive",
    "FF",
    "Front-Wheel Drive",
    [
      "前輪駆動",
      "フロント駆動",
      "FRONT WHEEL DRIVE",
      "FWD",
    ],
    CATEGORY_GROUPS.DRIVE_TYPE,
    "ff",
    {
      priority: 20,
    },
  ),

  defineCategory(
    "category-rear-wheel-drive",
    "FR",
    "Front-Engine Rear-Wheel Drive",
    [
      "後輪駆動",
      "リア駆動",
      "FR車",
      "REAR WHEEL DRIVE",
      "RWD",
    ],
    CATEGORY_GROUPS.DRIVE_TYPE,
    "fr",
    {
      priority: 20,
    },
  ),

  defineCategory(
    "category-midship",
    "MR",
    "Mid-Engine Rear-Wheel Drive",
    [
      "ミッドシップ",
      "ミッドエンジン",
      "MR車",
      "MIDSHIP",
      "MID ENGINE",
    ],
    CATEGORY_GROUPS.DRIVE_TYPE,
    "mr",
    {
      priority: 30,
    },
  ),

  defineCategory(
    "category-rear-engine",
    "RR",
    "Rear-Engine Rear-Wheel Drive",
    [
      "リアエンジン",
      "RR車",
      "REAR ENGINE",
    ],
    CATEGORY_GROUPS.DRIVE_TYPE,
    "rr",
    {
      priority: 30,
    },
  ),

  // ========================================================
  // 車体サイズ
  // ========================================================

  defineCategory(
    "category-small-size",
    "小さい車",
    "Small Car",
    [
      "小さめの車",
      "小型車",
      "小回りが利く車",
      "取り回しが良い車",
      "狭い道に強い車",
      "SMALL CAR",
      "SMALL SIZE",
    ],
    CATEGORY_GROUPS.SIZE,
    "small",
    {
      inventoryTypes: [
        "軽自動車",
        "コンパクトカー",
      ],
      modelBodyTypes: [
        "kei",
        "compact",
        "hatchback",
      ],
      priority: 15,
    },
  ),

  defineCategory(
    "category-medium-size",
    "中型車",
    "Medium Size Car",
    [
      "ミドルサイズ",
      "中くらいの車",
      "中間サイズ",
      "MEDIUM CAR",
      "MEDIUM SIZE",
      "MIDSIZE",
      "MID SIZE",
    ],
    CATEGORY_GROUPS.SIZE,
    "medium",
    {
      inventoryTypes: [
        "普通車",
      ],
      priority: 20,
    },
  ),

  defineCategory(
    "category-large-size",
    "大型車",
    "Large Car",
    [
      "大きい車",
      "大きな車",
      "ラージサイズ",
      "フルサイズ",
      "大型乗用車",
      "LARGE CAR",
      "LARGE SIZE",
      "FULL SIZE",
    ],
    CATEGORY_GROUPS.SIZE,
    "large",
    {
      inventoryTypes: [
        "普通車",
        "ミニバン",
        "SUV",
      ],
      modelBodyTypes: [
        "minivan",
        "suv",
        "luxury",
      ],
      priority: 15,
    },
  ),

  defineCategory(
    "category-low-roof",
    "低い車",
    "Low Roof Car",
    [
      "車高が低い車",
      "背が低い車",
      "ロールーフ",
      "LOW ROOF",
      "LOW HEIGHT",
    ],
    CATEGORY_GROUPS.SIZE,
    "low-roof",
    {
      modelBodyTypes: [
        "sedan",
        "coupe",
        "sports",
      ],
      priority: 25,
    },
  ),

  defineCategory(
    "category-high-roof",
    "背の高い車",
    "High Roof Car",
    [
      "車高が高い車",
      "ハイルーフ",
      "高い車",
      "室内高が高い車",
      "HIGH ROOF",
      "HIGH ROOF CAR",
    ],
    CATEGORY_GROUPS.SIZE,
    "high-roof",
    {
      modelBodyTypes: [
        "tall-wagon",
        "minivan",
        "suv",
        "commercial-van",
      ],
      priority: 20,
    },
  ),

  // ========================================================
  // 乗車人数
  // ========================================================

  defineCategory(
    "category-two-seater",
    "2人乗り",
    "Two-Seater",
    [
      "二人乗り",
      "2名乗車",
      "二名乗車",
      "2シーター",
      "ツーシーター",
      "TWO SEATER",
      "2 SEATER",
    ],
    CATEGORY_GROUPS.SEATING,
    "two-seater",
    {
      seatCount: 2,
      minimumSeats: 2,
      maximumSeats: 2,
      modelBodyTypes: [
        "coupe",
        "convertible",
        "sports",
      ],
      priority: 15,
    },
  ),

  defineCategory(
    "category-four-seater",
    "4人乗り",
    "Four-Seater",
    [
      "四人乗り",
      "4名乗車",
      "四名乗車",
      "4シーター",
      "FOUR SEATER",
      "4 SEATER",
    ],
    CATEGORY_GROUPS.SEATING,
    "four-seater",
    {
      seatCount: 4,
      minimumSeats: 4,
      maximumSeats: 4,
      priority: 15,
    },
  ),

  defineCategory(
    "category-five-seater",
    "5人乗り",
    "Five-Seater",
    [
      "五人乗り",
      "5名乗車",
      "五名乗車",
      "5シーター",
      "FIVE SEATER",
      "5 SEATER",
    ],
    CATEGORY_GROUPS.SEATING,
    "five-seater",
    {
      seatCount: 5,
      minimumSeats: 5,
      maximumSeats: 5,
      priority: 10,
    },
  ),

  defineCategory(
    "category-six-seater",
    "6人乗り",
    "Six-Seater",
    [
      "六人乗り",
      "6名乗車",
      "六名乗車",
      "6シーター",
      "SIX SEATER",
      "6 SEATER",
    ],
    CATEGORY_GROUPS.SEATING,
    "six-seater",
    {
      seatCount: 6,
      minimumSeats: 6,
      maximumSeats: 6,
      modelBodyTypes: [
        "minivan",
      ],
      priority: 10,
    },
  ),

  defineCategory(
    "category-seven-seater",
    "7人乗り",
    "Seven-Seater",
    [
      "七人乗り",
      "7名乗車",
      "七名乗車",
      "7シーター",
      "三列7人",
      "3列7人",
      "SEVEN SEATER",
      "7 SEATER",
    ],
    CATEGORY_GROUPS.SEATING,
    "seven-seater",
    {
      seatCount: 7,
      minimumSeats: 7,
      maximumSeats: 7,
      modelBodyTypes: [
        "minivan",
        "suv",
      ],
      priority: 10,
    },
  ),

  defineCategory(
    "category-eight-seater",
    "8人乗り",
    "Eight-Seater",
    [
      "八人乗り",
      "8名乗車",
      "八名乗車",
      "8シーター",
      "三列8人",
      "3列8人",
      "EIGHT SEATER",
      "8 SEATER",
    ],
    CATEGORY_GROUPS.SEATING,
    "eight-seater",
    {
      seatCount: 8,
      minimumSeats: 8,
      maximumSeats: 8,
      modelBodyTypes: [
        "minivan",
      ],
      priority: 10,
    },
  ),

  defineCategory(
    "category-nine-seater",
    "9人乗り",
    "Nine-Seater",
    [
      "九人乗り",
      "9名乗車",
      "九名乗車",
      "9シーター",
      "NINE SEATER",
      "9 SEATER",
    ],
    CATEGORY_GROUPS.SEATING,
    "nine-seater",
    {
      seatCount: 9,
      minimumSeats: 9,
      maximumSeats: 9,
      modelBodyTypes: [
        "commercial-van",
        "minivan",
      ],
      priority: 20,
    },
  ),

  defineCategory(
    "category-ten-seater",
    "10人乗り",
    "Ten-Seater",
    [
      "十人乗り",
      "10名乗車",
      "十名乗車",
      "10シーター",
      "TEN SEATER",
      "10 SEATER",
    ],
    CATEGORY_GROUPS.SEATING,
    "ten-seater",
    {
      seatCount: 10,
      minimumSeats: 10,
      maximumSeats: 10,
      modelBodyTypes: [
        "commercial-van",
        "minivan",
      ],
      priority: 20,
    },
  ),

  defineCategory(
    "category-three-row-seats",
    "3列シート",
    "Three-Row Seats",
    [
      "三列シート",
      "3列",
      "三列",
      "3列席",
      "三列席",
      "THREE ROW SEATS",
      "3 ROW SEATS",
    ],
    CATEGORY_GROUPS.SEATING,
    "three-row-seats",
    {
      minimumSeats: 6,
      modelBodyTypes: [
        "minivan",
        "suv",
      ],
      priority: 10,
    },
  ),

  defineCategory(
    "category-multi-passenger",
    "大人数向け",
    "Multi-Passenger Vehicle",
    [
      "大人数で乗れる車",
      "人数が多く乗れる車",
      "家族全員で乗れる車",
      "6人以上乗れる車",
      "多人数乗車",
      "MULTI PASSENGER",
      "MULTI-PASSENGER VEHICLE",
    ],
    CATEGORY_GROUPS.SEATING,
    "multi-passenger",
    {
      minimumSeats: 6,
      modelBodyTypes: [
        "minivan",
        "suv",
        "commercial-van",
      ],
      priority: 20,
    },
  ),
];

/**
 * 車両カテゴリ辞書の全項目。
 */
export const vehicleCategories =
  Object.freeze(
    categoryDefinitions.map(
      (definition) =>
        createCategoryEntry(
          definition,
        ),
    ),
  );

/**
 * categoriesという名前でも利用できるようにする。
 */
export const categories =
  vehicleCategories;

/**
 * 入力文字列をカテゴリ比較用に正規化する。
 *
 * 例：
 * 4WD
 * 4-WD
 * 4 WD
 *
 * 上記を同じ形式へ近づける。
 */
export function normalizeCategoryText(
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

const entryByKey = new Map();

const entriesByNormalizedKeyword =
  new Map();

for (const entry of vehicleCategories) {
  entryById.set(entry.id, entry);

  if (!entryByKey.has(entry.key)) {
    entryByKey.set(
      entry.key,
      entry,
    );
  }

  for (const keyword of entry.keywords) {
    const normalizedKeyword =
      normalizeCategoryText(keyword);

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
 * 正規表現で使用する文字をエスケープする。
 */
function escapeRegExp(value) {
  return String(value).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );
}

/**
 * SUV、EV、HV、4WD、FFなど、
 * 短い英数字のカテゴリを文章内から検出する。
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
    !/^[a-z0-9]{1,5}$/i.test(
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
    String(sourceText ?? "")
      .normalize("NFKC"),
  );
}

/**
 * 「軽ありますか」など、
 * 1文字の日本語カテゴリを検出する。
 */
function containsShortJapaneseKeyword(
  normalizedText,
  normalizedKeyword,
) {
  if (
    normalizedKeyword === "軽"
  ) {
    return (
      normalizedText === "軽" ||
      normalizedText.startsWith("軽") ||
      normalizedText.includes("軽自動車") ||
      normalizedText.includes("軽四") ||
      normalizedText.includes("軽カー")
    );
  }

  return false;
}

/**
 * IDからカテゴリを取得する。
 */
export function getCategoryById(id) {
  if (!id) {
    return null;
  }

  return (
    entryById.get(String(id)) || null
  );
}

/**
 * keyからカテゴリを取得する。
 *
 * 例：
 * getCategoryByKey("suv")
 */
export function getCategoryByKey(key) {
  const normalizedKey =
    String(key ?? "").trim();

  if (!normalizedKey) {
    return null;
  }

  return (
    entryByKey.get(normalizedKey) ||
    null
  );
}

/**
 * 入力と完全一致する最優先のカテゴリを返す。
 */
export function findCategoryByExactText(
  text,
) {
  const normalizedText =
    normalizeCategoryText(text);

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
 * 入力と完全一致するカテゴリをすべて返す。
 */
export function findAllCategoriesByExactText(
  text,
) {
  const normalizedText =
    normalizeCategoryText(text);

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
 * グループに属するカテゴリを返す。
 *
 * 例：
 * getCategoriesByGroup("body-type")
 */
export function getCategoriesByGroup(
  group,
) {
  if (
    !Object.values(
      CATEGORY_GROUPS,
    ).includes(group)
  ) {
    return [];
  }

  return vehicleCategories.filter(
    (entry) =>
      entry.group === group,
  );
}

/**
 * models.jsのbodyTypeに対応する
 * カテゴリを返す。
 *
 * 例：
 * getCategoriesByModelBodyType("suv")
 */
export function getCategoriesByModelBodyType(
  bodyType,
) {
  const normalizedBodyType =
    String(bodyType ?? "").trim();

  if (!normalizedBodyType) {
    return [];
  }

  return vehicleCategories.filter(
    (entry) =>
      entry.modelBodyTypes.includes(
        normalizedBodyType,
      ),
  );
}

/**
 * 在庫検索用カテゴリ名に対応する
 * カテゴリを返す。
 */
export function getCategoriesByInventoryType(
  inventoryType,
) {
  const normalizedInventoryType =
    String(inventoryType ?? "").trim();

  if (!normalizedInventoryType) {
    return [];
  }

  return vehicleCategories.filter(
    (entry) =>
      entry.inventoryTypes.includes(
        normalizedInventoryType,
      ),
  );
}

/**
 * 指定人数に対応するカテゴリを返す。
 */
export function getCategoriesBySeatCount(
  seatCount,
) {
  const normalizedSeatCount =
    Number(seatCount);

  if (
    !Number.isFinite(
      normalizedSeatCount,
    ) ||
    normalizedSeatCount <= 0
  ) {
    return [];
  }

  return vehicleCategories.filter(
    (entry) => {
      if (
        entry.seatCount ===
        normalizedSeatCount
      ) {
        return true;
      }

      if (
        entry.minimumSeats !== null &&
        normalizedSeatCount <
          entry.minimumSeats
      ) {
        return false;
      }

      if (
        entry.maximumSeats !== null &&
        normalizedSeatCount >
          entry.maximumSeats
      ) {
        return false;
      }

      return (
        entry.minimumSeats !== null ||
        entry.maximumSeats !== null
      );
    },
  );
}

/**
 * カテゴリから在庫検索用のtypeを取得する。
 */
export function getInventoryTypesForCategory(
  categoryOrKey,
) {
  const entry =
    typeof categoryOrKey === "string"
      ? (
          getCategoryByKey(
            categoryOrKey,
          ) ||
          findCategoryByExactText(
            categoryOrKey,
          )
        )
      : categoryOrKey;

  if (
    !entry ||
    !Array.isArray(
      entry.inventoryTypes,
    )
  ) {
    return [];
  }

  return [...entry.inventoryTypes];
}

/**
 * 文章から車両カテゴリを検索する。
 *
 * 検索順：
 * 1. 完全一致
 * 2. 短い英数字カテゴリ
 * 3. 入力の先頭にカテゴリ名
 * 4. 入力文中にカテゴリ名
 * 5. カテゴリ名の途中まで入力
 */
export function searchCategoryDictionary(
  text,
  {
    group = null,
    inventoryType = null,
    modelBodyType = null,
    limit = 10,
  } = {},
) {
  const sourceText = String(
    text ?? "",
  );

  const normalizedText =
    normalizeCategoryText(sourceText);

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

  for (
    const entry of vehicleCategories
  ) {
    if (
      group &&
      entry.group !== group
    ) {
      continue;
    }

    if (
      inventoryType &&
      !entry.inventoryTypes.includes(
        inventoryType,
      )
    ) {
      continue;
    }

    if (
      modelBodyType &&
      !entry.modelBodyTypes.includes(
        modelBodyType,
      )
    ) {
      continue;
    }

    let bestScore = 0;
    let matchedKeyword = null;

    for (
      const keyword of entry.keywords
    ) {
      const normalizedKeyword =
        normalizeCategoryText(keyword);

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
        /^[a-z0-9]{1,5}$/i.test(
          String(keyword)
            .normalize("NFKC")
            .trim(),
        )
      ) {
        if (
          containsShortAsciiKeyword(
            sourceText,
            keyword,
          )
        ) {
          const score =
            7500 -
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
        normalizedKeyword.length === 1
      ) {
        if (
          containsShortJapaneseKeyword(
            normalizedText,
            normalizedKeyword,
          )
        ) {
          const score =
            7000 -
            entry.priority;

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
        normalizedText.length >= 2 &&
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
