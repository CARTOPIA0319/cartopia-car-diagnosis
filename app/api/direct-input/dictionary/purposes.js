/** 利用目的辞書 */

export const PURPOSE_GROUPS = Object.freeze({
  DAILY_USE: "daily-use",
  FAMILY: "family",
  ROAD_CONDITION: "road-condition",
  LEISURE: "leisure",
  BUSINESS: "business",
  DRIVER: "driver",
  PRIORITY: "priority",
});

const G = PURPOSE_GROUPS;
const TYPE = "purpose";

const unique = (values) => [
  ...new Set(
    values
      .filter((value) => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean),
  ),
];

// key, name, nameEn, aliases, group,
// categoryKeys, bodyTypes, featureKeys,
// minSeats, maxSeats, priority
const rows = [
  // 日常利用
  [
    "commute",
    "通勤",
    "Commuting",
    [
      "通勤用",
      "会社への通勤",
      "職場への通勤",
      "毎日の通勤",
      "COMMUTE",
      "COMMUTING",
    ],
    G.DAILY_USE,
    [
      "kei",
      "compact",
      "hybrid",
      "ev",
      "diesel",
    ],
    [
      "kei",
      "compact",
      "hatchback",
      "hybrid",
      "ev",
    ],
    [
      "fuel-economy",
      "easy-parking",
      "reliability",
    ],
    null,
    null,
    10,
  ],

  [
    "school-commute",
    "通学",
    "School Commuting",
    [
      "通学用",
      "学校への通学",
      "大学への通学",
      "専門学校への通学",
      "SCHOOL COMMUTE",
    ],
    G.DAILY_USE,
    [
      "kei",
      "compact",
      "hybrid",
    ],
    [
      "kei",
      "compact",
      "hatchback",
    ],
    [
      "fuel-economy",
      "easy-parking",
    ],
    null,
    null,
    15,
  ],

  [
    "shopping",
    "買い物",
    "Shopping",
    [
      "買物",
      "日常の買い物",
      "スーパーへの買い物",
      "買い出し",
      "SHOPPING",
    ],
    G.DAILY_USE,
    [
      "kei",
      "compact",
      "tall-wagon",
      "small",
    ],
    [
      "kei",
      "compact",
      "hatchback",
      "tall-wagon",
    ],
    [
      "easy-parking",
      "easy-loading",
      "fuel-economy",
    ],
    null,
    null,
    10,
  ],

  [
    "nearby-use",
    "近距離利用",
    "Short-Distance Use",
    [
      "近場だけ",
      "近所用",
      "近距離メイン",
      "街乗りだけ",
      "チョイ乗り",
      "SHORT TRIP",
    ],
    G.DAILY_USE,
    [
      "kei",
      "compact",
      "ev",
      "small",
    ],
    [
      "kei",
      "compact",
      "hatchback",
      "ev",
    ],
    [
      "easy-parking",
      "low-running-cost",
    ],
    null,
    null,
    15,
  ],

  [
    "city-driving",
    "街乗り",
    "City Driving",
    [
      "市街地走行",
      "市内中心",
      "街中で使う",
      "CITY DRIVING",
      "URBAN DRIVING",
    ],
    G.DAILY_USE,
    [
      "kei",
      "compact",
      "small",
      "hybrid",
      "ev",
    ],
    [
      "kei",
      "compact",
      "hatchback",
      "hybrid",
      "ev",
    ],
    [
      "easy-parking",
      "maneuverability",
    ],
    null,
    null,
    10,
  ],

  [
    "long-distance",
    "長距離移動",
    "Long-Distance Driving",
    [
      "長距離",
      "遠出",
      "長距離ドライブ",
      "県外移動",
      "LONG DISTANCE",
      "LONG DRIVE",
    ],
    G.DAILY_USE,
    [
      "sedan",
      "wagon",
      "suv",
      "minivan",
      "diesel",
      "hybrid",
    ],
    [
      "sedan",
      "wagon",
      "suv",
      "minivan",
      "hybrid",
    ],
    [
      "comfort",
      "quietness",
      "fuel-economy",
      "cruise-control",
    ],
    null,
    null,
    10,
  ],

  [
    "highway",
    "高速道路",
    "Highway Driving",
    [
      "高速走行",
      "高速をよく使う",
      "高速道路メイン",
      "HIGHWAY",
      "EXPRESSWAY",
    ],
    G.DAILY_USE,
    [
      "sedan",
      "wagon",
      "suv",
      "minivan",
      "diesel",
      "turbo",
    ],
    [
      "sedan",
      "wagon",
      "suv",
      "minivan",
      "sports",
    ],
    [
      "stability",
      "acceleration",
      "cruise-control",
      "quietness",
    ],
    null,
    null,
    10,
  ],

  [
    "multi-purpose",
    "一台で何でも",
    "All-Purpose Use",
    [
      "万能な車",
      "普段使いも遠出も",
      "一台で全部",
      "オールラウンド",
      "ALL PURPOSE",
      "VERSATILE",
    ],
    G.DAILY_USE,
    [
      "suv",
      "compact-suv",
      "minivan",
      "wagon",
    ],
    [
      "suv",
      "minivan",
      "wagon",
      "compact",
    ],
    [
      "versatility",
      "cargo-space",
      "comfort",
    ],
    null,
    null,
    20,
  ],

  // 家族
  [
    "child-pickup",
    "子どもの送迎",
    "Child Pickup and Drop-off",
    [
      "子供の送迎",
      "こどもの送迎",
      "子ども送迎",
      "送り迎え",
      "習い事の送迎",
      "CHILD PICKUP",
    ],
    G.FAMILY,
    [
      "super-height-wagon",
      "tall-wagon",
      "minivan",
      "compact",
    ],
    [
      "tall-wagon",
      "minivan",
      "compact",
    ],
    [
      "sliding-door",
      "low-floor",
      "easy-entry",
      "advanced-safety",
    ],
    4,
    null,
    10,
  ],

  [
    "nursery-pickup",
    "保育園送迎",
    "Nursery Pickup and Drop-off",
    [
      "保育所送迎",
      "保育園の送り迎え",
      "保育所の送り迎え",
      "NURSERY PICKUP",
      "DAYCARE PICKUP",
    ],
    G.FAMILY,
    [
      "super-height-wagon",
      "tall-wagon",
      "minivan",
      "compact",
    ],
    [
      "tall-wagon",
      "minivan",
      "compact",
    ],
    [
      "sliding-door",
      "low-floor",
      "easy-entry",
      "easy-parking",
    ],
    4,
    null,
    10,
  ],

  [
    "kindergarten-pickup",
    "幼稚園送迎",
    "Kindergarten Pickup and Drop-off",
    [
      "幼稚園の送り迎え",
      "園児の送迎",
      "KINDERGARTEN PICKUP",
    ],
    G.FAMILY,
    [
      "super-height-wagon",
      "tall-wagon",
      "minivan",
      "compact",
    ],
    [
      "tall-wagon",
      "minivan",
      "compact",
    ],
    [
      "sliding-door",
      "low-floor",
      "easy-entry",
    ],
    4,
    null,
    10,
  ],

  [
    "school-pickup",
    "学校送迎",
    "School Pickup and Drop-off",
    [
      "小学校送迎",
      "中学校送迎",
      "高校送迎",
      "学校の送り迎え",
      "SCHOOL PICKUP",
    ],
    G.FAMILY,
    [
      "tall-wagon",
      "minivan",
      "suv",
      "compact",
    ],
    [
      "tall-wagon",
      "minivan",
      "suv",
      "compact",
    ],
    [
      "cargo-space",
      "easy-entry",
      "advanced-safety",
    ],
    4,
    null,
    15,
  ],

  [
    "family-use",
    "家族用",
    "Family Use",
    [
      "ファミリーカー",
      "家族で使う",
      "家族の車",
      "家族向け",
      "FAMILY CAR",
      "FAMILY USE",
    ],
    G.FAMILY,
    [
      "minivan",
      "suv",
      "tall-wagon",
      "wagon",
    ],
    [
      "minivan",
      "suv",
      "tall-wagon",
      "wagon",
    ],
    [
      "cabin-space",
      "cargo-space",
      "advanced-safety",
    ],
    4,
    null,
    10,
  ],

  [
    "family-trip",
    "家族旅行",
    "Family Travel",
    [
      "家族で旅行",
      "家族で遠出",
      "帰省",
      "FAMILY TRIP",
      "FAMILY TRAVEL",
    ],
    G.FAMILY,
    [
      "minivan",
      "suv",
      "wagon",
      "large",
    ],
    [
      "minivan",
      "suv",
      "wagon",
    ],
    [
      "comfort",
      "cargo-space",
      "third-row",
      "quietness",
    ],
    4,
    null,
    10,
  ],

  [
    "newborn-baby",
    "赤ちゃんがいる家庭",
    "Family with a Baby",
    [
      "乳児がいる",
      "新生児がいる",
      "ベビーがいる",
      "チャイルドシートを使う",
      "BABY ON BOARD",
    ],
    G.FAMILY,
    [
      "super-height-wagon",
      "tall-wagon",
      "minivan",
    ],
    [
      "tall-wagon",
      "minivan",
    ],
    [
      "sliding-door",
      "low-floor",
      "wide-door-opening",
      "rear-seat-space",
    ],
    4,
    null,
    10,
  ],

  [
    "small-children",
    "小さい子どもがいる家庭",
    "Family with Small Children",
    [
      "幼児がいる",
      "小さい子供がいる",
      "未就学児がいる",
      "SMALL CHILDREN",
    ],
    G.FAMILY,
    [
      "super-height-wagon",
      "tall-wagon",
      "minivan",
    ],
    [
      "tall-wagon",
      "minivan",
    ],
    [
      "sliding-door",
      "low-floor",
      "easy-entry",
      "washable-interior",
    ],
    4,
    null,
    10,
  ],

  [
    "many-children",
    "子どもが多い家庭",
    "Family with Several Children",
    [
      "子供が多い",
      "三人きょうだい",
      "兄弟が多い",
      "姉妹が多い",
      "四人家族以上",
      "LARGE FAMILY",
    ],
    G.FAMILY,
    [
      "minivan",
      "large",
      "three-row-seats",
      "seven-seater",
      "eight-seater",
    ],
    [
      "minivan",
      "suv",
    ],
    [
      "third-row",
      "sliding-door",
      "cabin-space",
      "cargo-space",
    ],
    6,
    null,
    10,
  ],

  [
    "grandparents",
    "祖父母も乗る",
    "Traveling with Grandparents",
    [
      "おじいちゃんも乗る",
      "おばあちゃんも乗る",
      "高齢の家族も乗る",
      "三世代で乗る",
      "THREE GENERATIONS",
    ],
    G.FAMILY,
    [
      "minivan",
      "suv",
      "tall-wagon",
      "three-row-seats",
    ],
    [
      "minivan",
      "suv",
      "tall-wagon",
    ],
    [
      "easy-entry",
      "low-floor",
      "comfortable-seats",
      "grab-handles",
    ],
    5,
    null,
    15,
  ],

  [
    "many-passengers",
    "大人数で乗る",
    "Carrying Many Passengers",
    [
      "人数が多い",
      "みんなで乗る",
      "6人以上で乗る",
      "多人数乗車",
      "MANY PASSENGERS",
    ],
    G.FAMILY,
    [
      "multi-passenger",
      "three-row-seats",
      "seven-seater",
      "eight-seater",
      "nine-seater",
      "ten-seater",
      "minivan",
      "microbus",
    ],
    [
      "minivan",
      "suv",
      "commercial-van",
    ],
    [
      "third-row",
      "cabin-space",
    ],
    6,
    null,
    10,
  ],

  [
    "pet",
    "ペットと出かける",
    "Traveling with Pets",
    [
      "犬と出かける",
      "猫と出かける",
      "ペットを乗せる",
      "愛犬とドライブ",
      "PET TRAVEL",
    ],
    G.FAMILY,
    [
      "suv",
      "wagon",
      "minivan",
      "tall-wagon",
    ],
    [
      "suv",
      "wagon",
      "minivan",
      "tall-wagon",
    ],
    [
      "cargo-space",
      "flat-floor",
      "washable-interior",
      "low-loading-height",
    ],
    null,
    null,
    20,
  ],

  // 道路・環境
  [
    "snow-road",
    "雪道",
    "Snowy Roads",
    [
      "雪道を走る",
      "雪国で使う",
      "積雪路",
      "冬道",
      "SNOW ROAD",
      "SNOWY ROAD",
    ],
    G.ROAD_CONDITION,
    [
      "4wd",
      "suv",
      "off-road",
      "high-roof",
    ],
    [
      "suv",
      "off-road",
    ],
    [
      "4wd",
      "traction-control",
      "high-ground-clearance",
      "heated-features",
    ],
    null,
    null,
    10,
  ],

  [
    "icy-road",
    "凍結路",
    "Icy Roads",
    [
      "凍った道",
      "アイスバーン",
      "凍結した道路",
      "ICY ROAD",
      "ICE ROAD",
    ],
    G.ROAD_CONDITION,
    [
      "4wd",
      "suv",
      "off-road",
    ],
    [
      "suv",
      "off-road",
    ],
    [
      "4wd",
      "traction-control",
      "advanced-safety",
    ],
    null,
    null,
    15,
  ],

  [
    "mountain-road",
    "山道",
    "Mountain Roads",
    [
      "峠道",
      "坂道が多い",
      "山間部",
      "急坂",
      "MOUNTAIN ROAD",
      "HILLY ROAD",
    ],
    G.ROAD_CONDITION,
    [
      "4wd",
      "suv",
      "off-road",
      "turbo",
      "diesel",
    ],
    [
      "suv",
      "off-road",
      "sports",
    ],
    [
      "traction",
      "engine-torque",
      "hill-descent-control",
    ],
    null,
    null,
    15,
  ],

  [
    "narrow-road",
    "狭い道",
    "Narrow Roads",
    [
      "道が狭い",
      "細い道",
      "住宅街",
      "狭い道路",
      "NARROW ROAD",
      "TIGHT ROAD",
    ],
    G.ROAD_CONDITION,
    [
      "kei",
      "compact",
      "small",
    ],
    [
      "kei",
      "compact",
      "hatchback",
    ],
    [
      "maneuverability",
      "easy-parking",
      "good-visibility",
    ],
    null,
    null,
    10,
  ],

  [
    "rough-road",
    "悪路",
    "Rough Roads",
    [
      "未舗装路",
      "砂利道",
      "林道",
      "荒れた道",
      "ROUGH ROAD",
      "UNPAVED ROAD",
    ],
    G.ROAD_CONDITION,
    [
      "4wd",
      "suv",
      "off-road",
      "pickup-truck",
    ],
    [
      "suv",
      "off-road",
      "truck",
    ],
    [
      "4wd",
      "high-ground-clearance",
      "durability",
      "all-terrain",
    ],
    null,
    null,
    15,
  ],

  [
    "flood-prone-road",
    "水たまりや冠水路",
    "Flood-Prone Roads",
    [
      "冠水しやすい道",
      "深い水たまり",
      "水害に強い車",
      "FLOODED ROAD",
    ],
    G.ROAD_CONDITION,
    [
      "suv",
      "off-road",
      "high-roof",
    ],
    [
      "suv",
      "off-road",
    ],
    [
      "high-ground-clearance",
      "water-wading",
    ],
    null,
    null,
    30,
  ],

  // レジャー
  [
    "camping",
    "キャンプ",
    "Camping",
    [
      "キャンプに行く",
      "キャンプ用",
      "オートキャンプ",
      "CAMPING",
    ],
    G.LEISURE,
    [
      "suv",
      "minivan",
      "wagon",
      "camper",
      "4wd",
    ],
    [
      "suv",
      "minivan",
      "wagon",
      "commercial-van",
    ],
    [
      "cargo-space",
      "roof-rack",
      "flat-floor",
      "outdoor-use",
    ],
    null,
    null,
    10,
  ],

  [
    "fishing",
    "釣り",
    "Fishing",
    [
      "釣りに行く",
      "海釣り",
      "川釣り",
      "バス釣り",
      "FISHING",
    ],
    G.LEISURE,
    [
      "suv",
      "wagon",
      "commercial-van",
      "kei-van",
      "4wd",
    ],
    [
      "suv",
      "wagon",
      "commercial-van",
    ],
    [
      "long-cargo",
      "washable-interior",
      "roof-rack",
      "4wd",
    ],
    null,
    null,
    15,
  ],

  [
    "outdoor",
    "アウトドア",
    "Outdoor Activities",
    [
      "外遊び",
      "レジャー",
      "アウトドア用",
      "OUTDOOR",
      "OUTDOOR ACTIVITY",
    ],
    G.LEISURE,
    [
      "suv",
      "minivan",
      "wagon",
      "4wd",
    ],
    [
      "suv",
      "minivan",
      "wagon",
    ],
    [
      "cargo-space",
      "roof-rack",
      "washable-interior",
    ],
    null,
    null,
    10,
  ],

  [
    "car-camping",
    "車中泊",
    "Sleeping in the Car",
    [
      "車中泊したい",
      "車で寝る",
      "オートキャンプ",
      "VAN LIFE",
      "CAR CAMPING",
    ],
    G.LEISURE,
    [
      "camper",
      "minivan",
      "commercial-van",
      "kei-van",
      "high-roof",
    ],
    [
      "minivan",
      "commercial-van",
      "tall-wagon",
    ],
    [
      "flat-floor",
      "full-flat-seat",
      "interior-length",
      "power-outlet",
    ],
    null,
    null,
    10,
  ],

  [
    "cycling",
    "自転車を積む",
    "Carrying Bicycles",
    [
      "自転車を載せる",
      "ロードバイクを積む",
      "子どもの自転車を積む",
      "サイクリング",
      "CYCLING",
    ],
    G.LEISURE,
    [
      "minivan",
      "commercial-van",
      "wagon",
      "suv",
    ],
    [
      "minivan",
      "commercial-van",
      "wagon",
      "suv",
    ],
    [
      "large-cargo-opening",
      "flat-floor",
      "interior-height",
    ],
    null,
    null,
    10,
  ],

  [
    "ski-snowboard",
    "スキー・スノーボード",
    "Skiing and Snowboarding",
    [
      "スキー",
      "スノーボード",
      "スノボ",
      "ウィンタースポーツ",
      "SKI",
      "SNOWBOARD",
    ],
    G.LEISURE,
    [
      "4wd",
      "suv",
      "wagon",
      "minivan",
    ],
    [
      "suv",
      "wagon",
      "minivan",
    ],
    [
      "4wd",
      "roof-rack",
      "long-cargo",
      "heated-features",
    ],
    null,
    null,
    15,
  ],

  [
    "golf",
    "ゴルフ",
    "Golf",
    [
      "ゴルフバッグを積む",
      "ゴルフ場に行く",
      "GOLF",
    ],
    G.LEISURE,
    [
      "sedan",
      "wagon",
      "suv",
      "minivan",
    ],
    [
      "sedan",
      "wagon",
      "suv",
      "minivan",
    ],
    [
      "cargo-width",
      "comfort",
      "quietness",
    ],
    null,
    null,
    20,
  ],

  [
    "marine-sports",
    "マリンスポーツ",
    "Marine Sports",
    [
      "サーフィン",
      "海に行く",
      "カヤック",
      "SUP",
      "MARINE SPORTS",
      "SURFING",
    ],
    G.LEISURE,
    [
      "suv",
      "wagon",
      "commercial-van",
      "4wd",
    ],
    [
      "suv",
      "wagon",
      "commercial-van",
    ],
    [
      "roof-rack",
      "washable-interior",
      "long-cargo",
      "4wd",
    ],
    null,
    null,
    20,
  ],

  [
    "drive",
    "ドライブ",
    "Leisure Driving",
    [
      "運転を楽しむ",
      "休日ドライブ",
      "景色を見に行く",
      "DRIVE",
      "LEISURE DRIVE",
    ],
    G.LEISURE,
    [
      "sports",
      "coupe",
      "convertible",
      "sedan",
      "suv",
    ],
    [
      "sports",
      "coupe",
      "convertible",
      "sedan",
      "suv",
    ],
    [
      "driving-enjoyment",
      "comfort",
      "handling",
    ],
    null,
    null,
    15,
  ],

  [
    "date",
    "デート",
    "Dating",
    [
      "デート用",
      "二人で出かける",
      "恋人とドライブ",
      "DATE CAR",
    ],
    G.LEISURE,
    [
      "coupe",
      "convertible",
      "sports",
      "luxury",
      "compact",
    ],
    [
      "coupe",
      "convertible",
      "sports",
      "luxury",
      "compact",
    ],
    [
      "design",
      "quietness",
      "comfort",
    ],
    null,
    5,
    25,
  ],

  [
    "hobby",
    "趣味",
    "Hobby Use",
    [
      "趣味用",
      "セカンドカー",
      "遊びの車",
      "HOBBY CAR",
    ],
    G.LEISURE,
    [
      "sports",
      "convertible",
      "suv",
      "kei",
    ],
    [
      "sports",
      "convertible",
      "suv",
      "kei",
    ],
    [
      "special-purpose",
      "driving-enjoyment",
    ],
    null,
    null,
    25,
  ],

  [
    "diy",
    "DIY・日曜大工",
    "DIY and Home Improvement",
    [
      "DIY",
      "日曜大工",
      "資材を積む",
      "ホームセンターに行く",
      "HOME IMPROVEMENT",
    ],
    G.LEISURE,
    [
      "commercial-van",
      "kei-van",
      "truck",
      "pickup-truck",
    ],
    [
      "commercial-van",
      "truck",
    ],
    [
      "long-cargo",
      "easy-loading",
      "durability",
    ],
    null,
    null,
    20,
  ],

  // 仕事
  [
    "work",
    "仕事",
    "Work Use",
    [
      "仕事用",
      "業務用",
      "商売用",
      "BUSINESS USE",
      "WORK CAR",
    ],
    G.BUSINESS,
    [
      "commercial",
      "commercial-van",
      "kei-van",
      "truck",
      "kei-truck",
    ],
    [
      "commercial-van",
      "truck",
      "kei",
    ],
    [
      "durability",
      "low-running-cost",
    ],
    null,
    null,
    10,
  ],

  [
    "sales",
    "営業",
    "Sales Use",
    [
      "営業車",
      "外回り",
      "取引先訪問",
      "SALES CAR",
      "BUSINESS SALES",
    ],
    G.BUSINESS,
    [
      "kei",
      "compact",
      "hybrid",
      "sedan",
    ],
    [
      "kei",
      "compact",
      "hatchback",
      "hybrid",
      "sedan",
    ],
    [
      "fuel-economy",
      "reliability",
      "professional-appearance",
    ],
    null,
    null,
    10,
  ],

  [
    "delivery",
    "配送",
    "Delivery",
    [
      "配達",
      "宅配",
      "荷物の配達",
      "デリバリー",
      "DELIVERY",
    ],
    G.BUSINESS,
    [
      "commercial-van",
      "kei-van",
      "truck",
      "kei-truck",
    ],
    [
      "commercial-van",
      "truck",
      "kei",
    ],
    [
      "cargo-space",
      "sliding-door",
      "low-floor",
      "durability",
    ],
    null,
    null,
    10,
  ],

  [
    "cargo",
    "荷物を積む",
    "Carrying Cargo",
    [
      "荷物が多い",
      "大量の荷物",
      "荷物運搬",
      "積載重視",
      "CARGO",
    ],
    G.BUSINESS,
    [
      "commercial-van",
      "kei-van",
      "truck",
      "wagon",
      "minivan",
    ],
    [
      "commercial-van",
      "truck",
      "wagon",
      "minivan",
    ],
    [
      "cargo-space",
      "payload",
      "easy-loading",
    ],
    null,
    null,
    10,
  ],

  [
    "equipment",
    "道具・機材を運ぶ",
    "Carrying Tools and Equipment",
    [
      "仕事道具を積む",
      "工具を積む",
      "機材運搬",
      "長い物を積む",
      "TOOLS AND EQUIPMENT",
    ],
    G.BUSINESS,
    [
      "commercial-van",
      "kei-van",
      "truck",
      "pickup-truck",
    ],
    [
      "commercial-van",
      "truck",
    ],
    [
      "long-cargo",
      "payload",
      "durability",
    ],
    null,
    null,
    15,
  ],

  [
    "moving",
    "引っ越し",
    "Moving",
    [
      "引越し",
      "家具を運ぶ",
      "大きな荷物を運ぶ",
      "MOVING",
    ],
    G.BUSINESS,
    [
      "commercial-van",
      "truck",
      "minivan",
    ],
    [
      "commercial-van",
      "truck",
      "minivan",
    ],
    [
      "large-cargo-opening",
      "flat-floor",
      "payload",
    ],
    null,
    null,
    20,
  ],

  [
    "agriculture",
    "農作業",
    "Agricultural Work",
    [
      "農業",
      "畑仕事",
      "田んぼ",
      "農作業用",
      "FARM WORK",
      "AGRICULTURE",
    ],
    G.BUSINESS,
    [
      "kei-truck",
      "truck",
      "4wd",
      "commercial-van",
    ],
    [
      "truck",
      "commercial-van",
      "kei",
      "off-road",
    ],
    [
      "4wd",
      "durability",
      "payload",
      "easy-cleaning",
    ],
    null,
    null,
    15,
  ],

  [
    "construction",
    "建設・現場仕事",
    "Construction Work",
    [
      "建築現場",
      "工事現場",
      "現場用",
      "職人の車",
      "CONSTRUCTION",
    ],
    G.BUSINESS,
    [
      "truck",
      "pickup-truck",
      "commercial-van",
      "4wd",
    ],
    [
      "truck",
      "commercial-van",
      "off-road",
    ],
    [
      "payload",
      "durability",
      "4wd",
      "tool-storage",
    ],
    null,
    null,
    15,
  ],

  [
    "passenger-transport",
    "送迎業務",
    "Passenger Transport",
    [
      "施設送迎",
      "ホテル送迎",
      "スクール送迎",
      "乗客を乗せる",
      "PASSENGER TRANSPORT",
    ],
    G.BUSINESS,
    [
      "minivan",
      "microbus",
      "multi-passenger",
      "ten-seater",
    ],
    [
      "minivan",
      "commercial-van",
    ],
    [
      "easy-entry",
      "cabin-space",
      "reliability",
    ],
    6,
    null,
    20,
  ],

  // 運転者
  [
    "first-car",
    "初めての車",
    "First Car",
    [
      "初購入",
      "初めて車を買う",
      "ファーストカー",
      "FIRST CAR",
    ],
    G.DRIVER,
    [
      "kei",
      "compact",
      "small",
    ],
    [
      "kei",
      "compact",
      "hatchback",
    ],
    [
      "easy-driving",
      "easy-parking",
      "low-running-cost",
      "advanced-safety",
    ],
    null,
    null,
    10,
  ],

  [
    "beginner-driver",
    "初心者向け",
    "Beginner-Friendly",
    [
      "運転初心者",
      "免許取りたて",
      "初心者でも乗りやすい",
      "BEGINNER DRIVER",
    ],
    G.DRIVER,
    [
      "kei",
      "compact",
      "small",
    ],
    [
      "kei",
      "compact",
      "hatchback",
    ],
    [
      "easy-driving",
      "good-visibility",
      "advanced-safety",
      "easy-parking",
    ],
    null,
    null,
    10,
  ],

  [
    "driving-anxiety",
    "運転が苦手",
    "For Nervous Drivers",
    [
      "運転に自信がない",
      "車庫入れが苦手",
      "駐車が苦手",
      "大きい車が怖い",
      "NERVOUS DRIVER",
    ],
    G.DRIVER,
    [
      "kei",
      "compact",
      "small",
    ],
    [
      "kei",
      "compact",
      "hatchback",
    ],
    [
      "easy-parking",
      "parking-camera",
      "advanced-safety",
      "good-visibility",
    ],
    null,
    null,
    10,
  ],

  [
    "elderly-driver",
    "高齢者向け",
    "Senior-Friendly",
    [
      "年配者向け",
      "シニア向け",
      "高齢の親が乗る",
      "SENIOR DRIVER",
    ],
    G.DRIVER,
    [
      "kei",
      "compact",
      "tall-wagon",
    ],
    [
      "kei",
      "compact",
      "tall-wagon",
    ],
    [
      "easy-entry",
      "good-visibility",
      "advanced-safety",
      "simple-controls",
    ],
    null,
    null,
    15,
  ],

  [
    "short-driver",
    "小柄な人向け",
    "For Short Drivers",
    [
      "身長が低い",
      "小柄でも運転しやすい",
      "座高が低い",
      "SHORT DRIVER",
    ],
    G.DRIVER,
    [
      "kei",
      "compact",
      "tall-wagon",
    ],
    [
      "kei",
      "compact",
      "tall-wagon",
    ],
    [
      "seat-adjustability",
      "good-visibility",
      "easy-controls",
    ],
    null,
    null,
    25,
  ],

  [
    "tall-driver",
    "長身の人向け",
    "For Tall Drivers",
    [
      "身長が高い",
      "背が高い人",
      "足元が広い車",
      "TALL DRIVER",
    ],
    G.DRIVER,
    [
      "suv",
      "minivan",
      "high-roof",
      "large",
    ],
    [
      "suv",
      "minivan",
      "tall-wagon",
    ],
    [
      "headroom",
      "legroom",
      "seat-adjustability",
    ],
    null,
    null,
    25,
  ],

  [
    "easy-parking",
    "駐車しやすさ",
    "Easy Parking",
    [
      "駐車しやすい車",
      "車庫入れしやすい",
      "取り回し重視",
      "PARKING EASY",
    ],
    G.DRIVER,
    [
      "kei",
      "compact",
      "small",
    ],
    [
      "kei",
      "compact",
      "hatchback",
    ],
    [
      "easy-parking",
      "parking-camera",
      "maneuverability",
    ],
    null,
    null,
    10,
  ],

  [
    "easy-entry",
    "乗り降りしやすさ",
    "Easy Entry and Exit",
    [
      "乗降しやすい",
      "乗り込みやすい",
      "降りやすい",
      "足腰に優しい",
      "EASY ENTRY",
    ],
    G.DRIVER,
    [
      "tall-wagon",
      "minivan",
      "suv",
      "high-roof",
    ],
    [
      "tall-wagon",
      "minivan",
      "suv",
    ],
    [
      "low-floor",
      "wide-door-opening",
      "grab-handles",
    ],
    null,
    null,
    10,
  ],

  [
    "long-ownership",
    "長く乗りたい",
    "Long-Term Ownership",
    [
      "長期保有",
      "10年乗りたい",
      "壊れにくい車",
      "長く大切に乗る",
      "LONG TERM OWNERSHIP",
    ],
    G.DRIVER,
    [
      "regular-car",
      "hybrid",
      "suv",
      "compact",
    ],
    [
      "compact",
      "sedan",
      "suv",
      "minivan",
    ],
    [
      "reliability",
      "durability",
      "parts-availability",
    ],
    null,
    null,
    20,
  ],

  // 重視条件
  [
    "low-budget",
    "予算重視",
    "Budget Priority",
    [
      "安い車",
      "価格重視",
      "低予算",
      "できるだけ安く",
      "BUDGET",
      "LOW PRICE",
    ],
    G.PRIORITY,
    [
      "kei",
      "compact",
      "small",
    ],
    [
      "kei",
      "compact",
      "hatchback",
    ],
    [
      "low-purchase-price",
      "low-running-cost",
    ],
    null,
    null,
    10,
  ],

  [
    "fuel-efficiency",
    "燃費重視",
    "Fuel Economy Priority",
    [
      "燃費が良い車",
      "低燃費",
      "ガソリン代を抑えたい",
      "FUEL ECONOMY",
      "GOOD MILEAGE",
    ],
    G.PRIORITY,
    [
      "hybrid",
      "mild-hybrid",
      "ev",
      "diesel",
      "kei",
      "compact",
    ],
    [
      "hybrid",
      "ev",
      "kei",
      "compact",
      "hatchback",
    ],
    [
      "fuel-economy",
    ],
    null,
    null,
    10,
  ],

  [
    "maintenance-cost",
    "維持費重視",
    "Low Running Cost",
    [
      "維持費が安い",
      "税金が安い",
      "車検代を抑えたい",
      "ランニングコスト重視",
      "LOW RUNNING COST",
    ],
    G.PRIORITY,
    [
      "kei",
      "compact",
      "hybrid",
      "ev",
    ],
    [
      "kei",
      "compact",
      "hatchback",
      "hybrid",
      "ev",
    ],
    [
      "low-tax",
      "fuel-economy",
      "low-maintenance",
    ],
    null,
    null,
    10,
  ],

  [
    "safety",
    "安全性重視",
    "Safety Priority",
    [
      "安全な車",
      "安全装備重視",
      "事故を防ぎたい",
      "衝突被害軽減ブレーキ",
      "SAFETY",
    ],
    G.PRIORITY,
    [
      "regular-car",
      "suv",
      "minivan",
      "compact",
    ],
    [
      "suv",
      "minivan",
      "sedan",
      "compact",
    ],
    [
      "advanced-safety",
      "collision-avoidance",
      "good-visibility",
    ],
    null,
    null,
    10,
  ],

  [
    "cargo-space",
    "荷室重視",
    "Cargo Space Priority",
    [
      "荷室が広い",
      "トランクが広い",
      "荷物がたくさん積める",
      "積載性重視",
      "CARGO SPACE",
    ],
    G.PRIORITY,
    [
      "commercial-van",
      "minivan",
      "wagon",
      "suv",
      "tall-wagon",
    ],
    [
      "commercial-van",
      "minivan",
      "wagon",
      "suv",
      "tall-wagon",
    ],
    [
      "cargo-space",
      "large-cargo-opening",
      "flat-floor",
    ],
    null,
    null,
    10,
  ],

  [
    "cabin-space",
    "室内広さ重視",
    "Cabin Space Priority",
    [
      "車内が広い",
      "室内空間が広い",
      "広い車",
      "後席が広い",
      "CABIN SPACE",
    ],
    G.PRIORITY,
    [
      "minivan",
      "tall-wagon",
      "super-height-wagon",
      "suv",
      "large",
    ],
    [
      "minivan",
      "tall-wagon",
      "suv",
      "luxury",
    ],
    [
      "cabin-space",
      "headroom",
      "legroom",
    ],
    null,
    null,
    10,
  ],

  [
    "sliding-door",
    "スライドドア重視",
    "Sliding Door Priority",
    [
      "スライドドアが欲しい",
      "両側スライドドア",
      "電動スライドドア",
      "SLIDING DOOR",
    ],
    G.PRIORITY,
    [
      "tall-wagon",
      "super-height-wagon",
      "minivan",
      "kei-van",
    ],
    [
      "tall-wagon",
      "minivan",
      "commercial-van",
    ],
    [
      "sliding-door",
    ],
    null,
    null,
    10,
  ],

  [
    "easy-loading",
    "積み降ろしやすさ",
    "Easy Loading",
    [
      "荷物を載せやすい",
      "荷物を降ろしやすい",
      "開口部が広い",
      "荷室床が低い",
      "EASY LOADING",
    ],
    G.PRIORITY,
    [
      "commercial-van",
      "tall-wagon",
      "minivan",
      "wagon",
    ],
    [
      "commercial-van",
      "tall-wagon",
      "minivan",
      "wagon",
    ],
    [
      "low-loading-height",
      "large-cargo-opening",
      "flat-floor",
    ],
    null,
    null,
    15,
  ],

  [
    "comfort",
    "乗り心地重視",
    "Ride Comfort Priority",
    [
      "快適な車",
      "疲れにくい車",
      "長時間でも楽",
      "乗り心地が良い",
      "COMFORT",
    ],
    G.PRIORITY,
    [
      "sedan",
      "suv",
      "minivan",
      "luxury",
      "large",
    ],
    [
      "sedan",
      "suv",
      "minivan",
      "luxury",
    ],
    [
      "comfort",
      "seat-comfort",
      "suspension-comfort",
    ],
    null,
    null,
    10,
  ],

  [
    "quietness",
    "静粛性重視",
    "Quietness Priority",
    [
      "静かな車",
      "車内が静か",
      "エンジン音が小さい",
      "ロードノイズが少ない",
      "QUIETNESS",
    ],
    G.PRIORITY,
    [
      "hybrid",
      "ev",
      "luxury",
      "sedan",
    ],
    [
      "hybrid",
      "ev",
      "luxury",
      "sedan",
    ],
    [
      "quietness",
      "sound-insulation",
    ],
    null,
    null,
    15,
  ],

  [
    "performance",
    "走行性能重視",
    "Performance Priority",
    [
      "走り重視",
      "加速重視",
      "速い車",
      "運転が楽しい車",
      "PERFORMANCE",
    ],
    G.PRIORITY,
    [
      "sports",
      "coupe",
      "turbo",
      "4wd",
    ],
    [
      "sports",
      "coupe",
      "sedan",
      "suv",
    ],
    [
      "acceleration",
      "handling",
      "braking",
      "engine-power",
    ],
    null,
    null,
    10,
  ],

  [
    "design",
    "見た目重視",
    "Design Priority",
    [
      "デザイン重視",
      "かっこいい車",
      "かわいい車",
      "おしゃれな車",
      "STYLE",
      "DESIGN",
    ],
    G.PRIORITY,
    [
      "coupe",
      "convertible",
      "suv",
      "luxury",
      "compact",
    ],
    [
      "coupe",
      "convertible",
      "suv",
      "luxury",
      "compact",
    ],
    [
      "design",
      "style",
    ],
    null,
    null,
    10,
  ],

  [
    "resale",
    "リセール重視",
    "Resale Value Priority",
    [
      "売る時に高い車",
      "値落ちしにくい車",
      "下取りが高い車",
      "資産価値",
      "RESALE VALUE",
    ],
    G.PRIORITY,
    [
      "suv",
      "off-road",
      "minivan",
      "luxury",
    ],
    [
      "suv",
      "off-road",
      "minivan",
      "luxury",
    ],
    [
      "resale-value",
      "market-demand",
    ],
    null,
    null,
    10,
  ],

  [
    "status",
    "高級感重視",
    "Premium Feel Priority",
    [
      "高級感がある車",
      "ステータス重視",
      "ブランド重視",
      "上質な車",
      "PREMIUM FEEL",
    ],
    G.PRIORITY,
    [
      "luxury",
      "sedan",
      "suv",
      "large",
    ],
    [
      "luxury",
      "sedan",
      "suv",
    ],
    [
      "premium-interior",
      "brand-prestige",
      "comfort",
    ],
    null,
    null,
    15,
  ],

  [
    "eco",
    "環境性能重視",
    "Environmental Priority",
    [
      "環境に優しい車",
      "エコカー",
      "排気ガスが少ない",
      "脱炭素",
      "ECO FRIENDLY",
    ],
    G.PRIORITY,
    [
      "ev",
      "hybrid",
      "plug-in-hybrid",
      "fuel-cell",
    ],
    [
      "ev",
      "hybrid",
      "plug-in-hybrid",
    ],
    [
      "low-emissions",
      "fuel-economy",
    ],
    null,
    null,
    15,
  ],

  [
    "reliability",
    "故障しにくさ重視",
    "Reliability Priority",
    [
      "壊れにくい車",
      "信頼性重視",
      "丈夫な車",
      "故障が少ない車",
      "RELIABILITY",
    ],
    G.PRIORITY,
    [
      "regular-car",
      "compact",
      "suv",
      "commercial",
    ],
    [
      "compact",
      "sedan",
      "suv",
      "commercial-van",
    ],
    [
      "reliability",
      "durability",
      "parts-availability",
    ],
    null,
    null,
    15,
  ],
];

const createEntry = ([
  key,
  name,
  nameEn,
  aliases,
  group,
  recommendedCategoryKeys,
  recommendedModelBodyTypes,
  recommendedFeatureKeys,
  minimumSeats,
  maximumSeats,
  priority,
]) => {
  const cleanAliases = unique(
    aliases,
  );

  const keywords = unique([
    name,
    nameEn,
    ...cleanAliases,
  ]);

  return Object.freeze({
    id: `purpose-${key}`,
    type: TYPE,
    name,
    nameEn,
    aliases: cleanAliases,
    keywords,

    parent: group,
    category: key,

    tags: unique([
      group,
      key,
      "current",
      ...recommendedCategoryKeys.map(
        (value) =>
          `category:${value}`,
      ),
      ...recommendedModelBodyTypes.map(
        (value) =>
          `body:${value}`,
      ),
      ...recommendedFeatureKeys.map(
        (value) =>
          `feature:${value}`,
      ),
    ]),

    priority,
    group,
    key,

    recommendedCategoryKeys:
      unique(
        recommendedCategoryKeys,
      ),

    recommendedModelBodyTypes:
      unique(
        recommendedModelBodyTypes,
      ),

    recommendedFeatureKeys:
      unique(
        recommendedFeatureKeys,
      ),

    minimumSeats,
    maximumSeats,
    status: "current",
  });
};

export const vehiclePurposes =
  Object.freeze(
    rows.map(createEntry),
  );

export const purposes =
  vehiclePurposes;

export function normalizePurposeText(
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

const byId = new Map();
const byKey = new Map();
const byKeyword = new Map();

for (
  const entry of vehiclePurposes
) {
  byId.set(
    entry.id,
    entry,
  );

  if (!byKey.has(entry.key)) {
    byKey.set(
      entry.key,
      entry,
    );
  }

  for (
    const keyword of entry.keywords
  ) {
    const normalized =
      normalizePurposeText(
        keyword,
      );

    if (!normalized) {
      continue;
    }

    const values =
      byKeyword.get(normalized) ||
      [];

    byKeyword.set(
      normalized,
      [...values, entry].sort(
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

const escapeRegExp = (value) =>
  String(value).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );

function containsShortAsciiKeyword(
  sourceText,
  keyword,
) {
  const value = String(
    keyword ?? "",
  )
    .normalize("NFKC")
    .trim();

  if (
    !/^[a-z0-9]{2,6}$/i.test(
      value,
    )
  ) {
    return false;
  }

  const pattern = new RegExp(
    `(^|[^a-z0-9])${escapeRegExp(
      value,
    )}([^a-z0-9]|$)`,
    "i",
  );

  return pattern.test(
    String(sourceText ?? "")
      .normalize("NFKC"),
  );
}

export function getPurposeById(id) {
  if (!id) {
    return null;
  }

  return (
    byId.get(String(id)) ||
    null
  );
}

export function getPurposeByKey(
  key,
) {
  const value = String(
    key ?? "",
  ).trim();

  if (!value) {
    return null;
  }

  return (
    byKey.get(value) ||
    null
  );
}

export function findPurposeByExactText(
  text,
) {
  const value =
    normalizePurposeText(text);

  if (!value) {
    return null;
  }

  const matches =
    byKeyword.get(value) ||
    [];

  return matches[0] || null;
}

export function findAllPurposesByExactText(
  text,
) {
  const value =
    normalizePurposeText(text);

  if (!value) {
    return [];
  }

  return (
    byKeyword.get(value) ||
    []
  );
}

export function getPurposesByGroup(
  group,
) {
  if (
    !Object.values(G).includes(
      group,
    )
  ) {
    return [];
  }

  return vehiclePurposes.filter(
    (entry) =>
      entry.group === group,
  );
}

export function getPurposesByCategoryKey(
  key,
) {
  const value = String(
    key ?? "",
  ).trim();

  if (!value) {
    return [];
  }

  return vehiclePurposes.filter(
    (entry) =>
      entry
        .recommendedCategoryKeys
        .includes(value),
  );
}

export function getPurposesByModelBodyType(
  bodyType,
) {
  const value = String(
    bodyType ?? "",
  ).trim();

  if (!value) {
    return [];
  }

  return vehiclePurposes.filter(
    (entry) =>
      entry
        .recommendedModelBodyTypes
        .includes(value),
  );
}

export function getPurposesByFeatureKey(
  featureKey,
) {
  const value = String(
    featureKey ?? "",
  ).trim();

  if (!value) {
    return [];
  }

  return vehiclePurposes.filter(
    (entry) =>
      entry
        .recommendedFeatureKeys
        .includes(value),
  );
}

export function getPurposesBySeatCount(
  seatCount,
) {
  const seats =
    Number(seatCount);

  if (
    !Number.isFinite(seats) ||
    seats <= 0
  ) {
    return [];
  }

  return vehiclePurposes.filter(
    (entry) => {
      if (
        entry.minimumSeats !==
          null &&
        seats <
          entry.minimumSeats
      ) {
        return false;
      }

      if (
        entry.maximumSeats !==
          null &&
        seats >
          entry.maximumSeats
      ) {
        return false;
      }

      return (
        entry.minimumSeats !==
          null ||
        entry.maximumSeats !==
          null
      );
    },
  );
}

export function searchPurposeDictionary(
  text,
  {
    group = null,
    categoryKey = null,
    modelBodyType = null,
    featureKey = null,
    limit = 10,
  } = {},
) {
  const sourceText = String(
    text ?? "",
  );

  const normalizedText =
    normalizePurposeText(
      sourceText,
    );

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
    const entry of vehiclePurposes
  ) {
    if (
      group &&
      entry.group !== group
    ) {
      continue;
    }

    if (
      categoryKey &&
      !entry
        .recommendedCategoryKeys
        .includes(categoryKey)
    ) {
      continue;
    }

    if (
      modelBodyType &&
      !entry
        .recommendedModelBodyTypes
        .includes(modelBodyType)
    ) {
      continue;
    }

    if (
      featureKey &&
      !entry
        .recommendedFeatureKeys
        .includes(featureKey)
    ) {
      continue;
    }

    let bestScore = 0;
    let matchedKeyword = null;

    for (
      const keyword of entry.keywords
    ) {
      const normalizedKeyword =
        normalizePurposeText(
          keyword,
        );

      if (!normalizedKeyword) {
        continue;
      }

      let score = 0;

      if (
        normalizedText ===
        normalizedKeyword
      ) {
        score =
          10000 -
          entry.priority +
          normalizedKeyword.length;
      } else if (
        /^[a-z0-9]{2,6}$/i.test(
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
          score =
            7500 -
            entry.priority +
            normalizedKeyword.length;
        }
      } else if (
        normalizedKeyword.length >=
          2 &&
        normalizedText.startsWith(
          normalizedKeyword,
        )
      ) {
        score =
          7000 -
          entry.priority +
          normalizedKeyword.length;
      } else if (
        normalizedKeyword.length >=
          2 &&
        normalizedText.includes(
          normalizedKeyword,
        )
      ) {
        score =
          5000 -
          entry.priority +
          normalizedKeyword.length;
      } else if (
        normalizedText.length >= 2 &&
        normalizedKeyword.startsWith(
          normalizedText,
        )
      ) {
        score =
          3000 -
          entry.priority +
          normalizedText.length;
      }

      if (score > bestScore) {
        bestScore = score;
        matchedKeyword = keyword;
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
        first.score !==
        second.score
      ) {
        return (
          second.score -
          first.score
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
