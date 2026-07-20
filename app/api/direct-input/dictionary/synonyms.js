/** 表記ゆれ・略称・俗称・誤入力の正規化辞書 */

const unique = (values) => [
  ...new Set(
    values
      .filter((value) => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean),
  ),
];

export function normalizeSynonymText(value) {
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

const rows = [
  // メーカー
  {
    canonical: "トヨタ",
    type: "maker",
    aliases: [
      "TOYOTA",
      "toyota",
      "トヨダ",
      "豊田",
    ],
  },
  {
    canonical: "レクサス",
    type: "maker",
    aliases: [
      "LEXUS",
      "lexus",
      "レクサス車",
    ],
  },
  {
    canonical: "日産",
    type: "maker",
    aliases: [
      "ニッサン",
      "NISSAN",
      "nissan",
      "日産自動車",
    ],
  },
  {
    canonical: "ホンダ",
    type: "maker",
    aliases: [
      "HONDA",
      "honda",
      "本田",
      "本田技研",
    ],
  },
  {
    canonical: "マツダ",
    type: "maker",
    aliases: [
      "MAZDA",
      "mazda",
      "松田",
    ],
  },
  {
    canonical: "スバル",
    type: "maker",
    aliases: [
      "SUBARU",
      "subaru",
      "富士重工",
    ],
  },
  {
    canonical: "三菱",
    type: "maker",
    aliases: [
      "ミツビシ",
      "MITSUBISHI",
      "mitsubishi",
      "三菱自動車",
    ],
  },
  {
    canonical: "スズキ",
    type: "maker",
    aliases: [
      "SUZUKI",
      "suzuki",
      "鈴木",
    ],
  },
  {
    canonical: "ダイハツ",
    type: "maker",
    aliases: [
      "DAIHATSU",
      "daihatsu",
      "ダイハツ工業",
    ],
  },
  {
    canonical: "いすゞ",
    type: "maker",
    aliases: [
      "イスズ",
      "ISUZU",
      "isuzu",
    ],
  },
  {
    canonical: "日野",
    type: "maker",
    aliases: [
      "ヒノ",
      "HINO",
      "hino",
      "日野自動車",
    ],
  },
  {
    canonical: "メルセデス・ベンツ",
    type: "maker",
    aliases: [
      "メルセデス",
      "ベンツ",
      "メルセデスベンツ",
      "Mercedes-Benz",
      "Mercedes Benz",
      "Mercedes",
      "BENZ",
      "benz",
    ],
  },
  {
    canonical: "BMW",
    type: "maker",
    aliases: [
      "ビーエム",
      "ビーエムダブリュー",
      "ビーエムダブリュ",
      "BMW車",
      "bmw",
    ],
  },
  {
    canonical: "MINI",
    type: "maker",
    aliases: [
      "ミニ",
      "BMWミニ",
      "mini",
    ],
  },
  {
    canonical: "アウディ",
    type: "maker",
    aliases: [
      "AUDI",
      "audi",
      "アウディー",
    ],
  },
  {
    canonical: "フォルクスワーゲン",
    type: "maker",
    aliases: [
      "VW",
      "vw",
      "ワーゲン",
      "フォルクスワーゲン車",
      "Volkswagen",
      "volkswagen",
    ],
  },
  {
    canonical: "ポルシェ",
    type: "maker",
    aliases: [
      "PORSCHE",
      "porsche",
      "ポルシェ車",
    ],
  },
  {
    canonical: "ボルボ",
    type: "maker",
    aliases: [
      "VOLVO",
      "volvo",
    ],
  },
  {
    canonical: "プジョー",
    type: "maker",
    aliases: [
      "PEUGEOT",
      "peugeot",
      "プジョ",
    ],
  },
  {
    canonical: "シトロエン",
    type: "maker",
    aliases: [
      "CITROEN",
      "Citroën",
      "citroen",
      "シトロエン車",
    ],
  },
  {
    canonical: "ルノー",
    type: "maker",
    aliases: [
      "RENAULT",
      "renault",
    ],
  },
  {
    canonical: "フィアット",
    type: "maker",
    aliases: [
      "FIAT",
      "fiat",
    ],
  },
  {
    canonical: "アルファロメオ",
    type: "maker",
    aliases: [
      "アルファロメオ車",
      "アルファ",
      "ALFA ROMEO",
      "Alfa Romeo",
      "alfaromeo",
    ],
  },
  {
    canonical: "フェラーリ",
    type: "maker",
    aliases: [
      "FERRARI",
      "ferrari",
    ],
  },
  {
    canonical: "ランボルギーニ",
    type: "maker",
    aliases: [
      "LAMBORGHINI",
      "lamborghini",
      "ランボ",
    ],
  },
  {
    canonical: "マセラティ",
    type: "maker",
    aliases: [
      "MASERATI",
      "maserati",
    ],
  },
  {
    canonical: "ジャガー",
    type: "maker",
    aliases: [
      "JAGUAR",
      "jaguar",
    ],
  },
  {
    canonical: "ランドローバー",
    type: "maker",
    aliases: [
      "LAND ROVER",
      "Land Rover",
      "landrover",
      "レンジローバー",
    ],
  },
  {
    canonical: "ジープ",
    type: "maker",
    aliases: [
      "JEEP",
      "Jeep",
      "jeep",
    ],
  },
  {
    canonical: "フォード",
    type: "maker",
    aliases: [
      "FORD",
      "Ford",
      "ford",
    ],
  },
  {
    canonical: "シボレー",
    type: "maker",
    aliases: [
      "CHEVROLET",
      "Chevrolet",
      "chevrolet",
      "シェビー",
    ],
  },
  {
    canonical: "キャデラック",
    type: "maker",
    aliases: [
      "CADILLAC",
      "Cadillac",
      "cadillac",
    ],
  },
  {
    canonical: "テスラ",
    type: "maker",
    aliases: [
      "TESLA",
      "Tesla",
      "tesla",
    ],
  },

  // トヨタ
  {
    canonical: "アルファード",
    type: "model",
    aliases: [
      "アル",
      "アルファ",
      "アルファド",
      "アルフアード",
      "ALPHARD",
      "alphard",
    ],
  },
  {
    canonical: "ヴェルファイア",
    type: "model",
    aliases: [
      "ベルファイア",
      "ヴェル",
      "ベル",
      "ヴェルファイヤ",
      "ベルファイヤ",
      "VELLFIRE",
      "vellfire",
    ],
  },
  {
    canonical: "ノア",
    type: "model",
    aliases: [
      "NOAH",
      "noah",
      "トヨタノア",
    ],
  },
  {
    canonical: "ヴォクシー",
    type: "model",
    aliases: [
      "ボクシー",
      "ヴォクシィ",
      "ボクシィ",
      "ヴォクシ",
      "VOXY",
      "voxy",
    ],
  },
  {
    canonical: "エスクァイア",
    type: "model",
    aliases: [
      "エスクワイア",
      "エスクアイア",
      "ESQUIRE",
      "esquire",
    ],
  },
  {
    canonical: "シエンタ",
    type: "model",
    aliases: [
      "シェンタ",
      "SIENTA",
      "sienta",
    ],
  },
  {
    canonical: "ハイエース",
    type: "model",
    aliases: [
      "ハイエースバン",
      "ハイエースワゴン",
      "ハイエス",
      "HIACE",
      "hiace",
    ],
  },
  {
    canonical: "プリウス",
    type: "model",
    aliases: [
      "PRIUS",
      "prius",
      "プリウス50",
      "プリウス30",
      "プリウス60",
    ],
  },
  {
    canonical: "プリウスPHV",
    type: "model",
    aliases: [
      "プリウスPHEV",
      "プリウスphv",
      "プリウスphev",
      "PHV",
      "PHEV",
      "phv",
      "phev",
    ],
  },
  {
    canonical: "アクア",
    type: "model",
    aliases: [
      "AQUA",
      "aqua",
      "トヨタアクア",
    ],
  },
  {
    canonical: "ヤリス",
    type: "model",
    aliases: [
      "YARIS",
      "yaris",
      "ヴィッツ後継",
    ],
  },
  {
    canonical: "ヤリスクロス",
    type: "model",
    aliases: [
      "ヤリクロ",
      "ヤリス クロス",
      "YARIS CROSS",
      "yaris cross",
    ],
  },
  {
    canonical: "カローラ",
    type: "model",
    aliases: [
      "COROLLA",
      "corolla",
    ],
  },
  {
    canonical: "カローラクロス",
    type: "model",
    aliases: [
      "カロクロ",
      "カローラ クロス",
      "COROLLA CROSS",
      "corolla cross",
    ],
  },
  {
    canonical: "カローラスポーツ",
    type: "model",
    aliases: [
      "カロスポ",
      "カローラ スポーツ",
      "COROLLA SPORT",
      "corolla sport",
    ],
  },
  {
    canonical: "カローラツーリング",
    type: "model",
    aliases: [
      "カロツー",
      "カローラ ツーリング",
      "COROLLA TOURING",
      "corolla touring",
    ],
  },
  {
    canonical: "クラウン",
    type: "model",
    aliases: [
      "CROWN",
      "crown",
      "トヨタクラウン",
    ],
  },
  {
    canonical: "クラウンクロスオーバー",
    type: "model",
    aliases: [
      "クラウンクロス",
      "クラウン クロスオーバー",
      "CROWN CROSSOVER",
      "crown crossover",
    ],
  },
  {
    canonical: "クラウンスポーツ",
    type: "model",
    aliases: [
      "クラスポ",
      "クラウン スポーツ",
      "CROWN SPORT",
      "crown sport",
    ],
  },
  {
    canonical: "クラウンセダン",
    type: "model",
    aliases: [
      "クラウン セダン",
      "CROWN SEDAN",
      "crown sedan",
    ],
  },
  {
    canonical: "ハリアー",
    type: "model",
    aliases: [
      "ハリア",
      "HARRIER",
      "harrier",
    ],
  },
  {
    canonical: "RAV4",
    type: "model",
    aliases: [
      "ラブフォー",
      "ラヴフォー",
      "ラブ4",
      "RAV-4",
      "rav4",
    ],
  },
  {
    canonical: "ランドクルーザー",
    type: "model",
    aliases: [
      "ランクル",
      "ランドクルーザ",
      "LAND CRUISER",
      "land cruiser",
    ],
  },
  {
    canonical: "ランドクルーザー70",
    type: "model",
    aliases: [
      "ランクル70",
      "ランクルナナマル",
      "ナナマル",
      "LAND CRUISER 70",
    ],
  },
  {
    canonical: "ランドクルーザー250",
    type: "model",
    aliases: [
      "ランクル250",
      "ランクルニーハン",
      "LC250",
      "LAND CRUISER 250",
    ],
  },
  {
    canonical: "ランドクルーザー300",
    type: "model",
    aliases: [
      "ランクル300",
      "ランクルサンマルマル",
      "LC300",
      "LAND CRUISER 300",
    ],
  },
  {
    canonical: "ランドクルーザープラド",
    type: "model",
    aliases: [
      "プラド",
      "ランクルプラド",
      "ランドクルーザー プラド",
      "LAND CRUISER PRADO",
    ],
  },
  {
    canonical: "ハイラックス",
    type: "model",
    aliases: [
      "HILUX",
      "hilux",
      "トヨタハイラックス",
    ],
  },
  {
    canonical: "ルーミー",
    type: "model",
    aliases: [
      "ROOMY",
      "roomy",
      "トヨタルーミー",
    ],
  },
  {
    canonical: "タンク",
    type: "model",
    aliases: [
      "TANK",
      "tank",
      "トヨタタンク",
    ],
  },
  {
    canonical: "パッソ",
    type: "model",
    aliases: [
      "PASSO",
      "passo",
    ],
  },
  {
    canonical: "ライズ",
    type: "model",
    aliases: [
      "RAIZE",
      "raize",
      "トヨタライズ",
    ],
  },

  // レクサス
  {
    canonical: "レクサスRX",
    type: "model",
    aliases: [
      "RX",
      "rx",
      "レクサス RX",
      "LEXUS RX",
    ],
  },
  {
    canonical: "レクサスNX",
    type: "model",
    aliases: [
      "NX",
      "nx",
      "レクサス NX",
      "LEXUS NX",
    ],
  },
  {
    canonical: "レクサスUX",
    type: "model",
    aliases: [
      "UX",
      "ux",
      "レクサス UX",
      "LEXUS UX",
    ],
  },
  {
    canonical: "レクサスLX",
    type: "model",
    aliases: [
      "LX",
      "lx",
      "レクサス LX",
      "LEXUS LX",
    ],
  },
  {
    canonical: "レクサスGX",
    type: "model",
    aliases: [
      "GX",
      "gx",
      "レクサス GX",
      "LEXUS GX",
    ],
  },
  {
    canonical: "レクサスLBX",
    type: "model",
    aliases: [
      "LBX",
      "lbx",
      "レクサス LBX",
      "LEXUS LBX",
    ],
  },
  {
    canonical: "レクサスIS",
    type: "model",
    aliases: [
      "IS",
      "is",
      "レクサス IS",
      "LEXUS IS",
    ],
  },
  {
    canonical: "レクサスES",
    type: "model",
    aliases: [
      "ES",
      "es",
      "レクサス ES",
      "LEXUS ES",
    ],
  },
  {
    canonical: "レクサスLS",
    type: "model",
    aliases: [
      "LS",
      "ls",
      "レクサス LS",
      "LEXUS LS",
    ],
  },
  {
    canonical: "レクサスRC",
    type: "model",
    aliases: [
      "RC",
      "rc",
      "レクサス RC",
      "LEXUS RC",
    ],
  },

  // 日産
  {
    canonical: "セレナ",
    type: "model",
    aliases: [
      "SERENA",
      "serena",
      "日産セレナ",
    ],
  },
  {
    canonical: "セレナe-POWER",
    type: "model",
    aliases: [
      "セレナePOWER",
      "セレナイーパワー",
      "セレナ e-POWER",
      "セレナ eパワー",
      "セレナeパワー",
      "SERENA e-POWER",
    ],
  },
  {
    canonical: "ノート",
    type: "model",
    aliases: [
      "NOTE",
      "note",
      "日産ノート",
    ],
  },
  {
    canonical: "ノートe-POWER",
    type: "model",
    aliases: [
      "ノートePOWER",
      "ノートイーパワー",
      "ノート e-POWER",
      "ノートeパワー",
      "NOTE e-POWER",
    ],
  },
  {
    canonical: "ノートオーラ",
    type: "model",
    aliases: [
      "オーラ",
      "ノート オーラ",
      "NOTE AURA",
      "note aura",
    ],
  },
  {
    canonical: "エクストレイル",
    type: "model",
    aliases: [
      "X-TRAIL",
      "XTRAIL",
      "xtrail",
      "エクストレール",
    ],
  },
  {
    canonical: "キックス",
    type: "model",
    aliases: [
      "KICKS",
      "kicks",
      "日産キックス",
    ],
  },
  {
    canonical: "デイズ",
    type: "model",
    aliases: [
      "DAYZ",
      "dayz",
      "日産デイズ",
    ],
  },
  {
    canonical: "デイズルークス",
    type: "model",
    aliases: [
      "デイズ ルークス",
      "DAYZ ROOX",
      "dayz roox",
    ],
  },
  {
    canonical: "ルークス",
    type: "model",
    aliases: [
      "ROOX",
      "roox",
      "日産ルークス",
    ],
  },
  {
    canonical: "モコ",
    type: "model",
    aliases: [
      "MOCO",
      "moco",
      "日産モコ",
    ],
  },
  {
    canonical: "リーフ",
    type: "model",
    aliases: [
      "LEAF",
      "leaf",
      "日産リーフ",
    ],
  },
  {
    canonical: "サクラ",
    type: "model",
    aliases: [
      "SAKURA",
      "sakura",
      "日産サクラ",
    ],
  },
  {
    canonical: "フェアレディZ",
    type: "model",
    aliases: [
      "フェアレディ",
      "Z",
      "ゼット",
      "FAIRLADY Z",
      "fairlady z",
    ],
  },
  {
    canonical: "スカイライン",
    type: "model",
    aliases: [
      "SKYLINE",
      "skyline",
      "日産スカイライン",
    ],
  },
  {
    canonical: "キャラバン",
    type: "model",
    aliases: [
      "NV350",
      "NV350キャラバン",
      "日産キャラバン",
      "CARAVAN",
      "caravan",
    ],
  },

  // ホンダ
  {
    canonical: "N-BOX",
    type: "model",
    aliases: [
      "NBOX",
      "N BOX",
      "nbox",
      "n box",
      "エヌボックス",
      "エヌBOX",
      "Nボックス",
    ],
  },
  {
    canonical: "N-BOXカスタム",
    type: "model",
    aliases: [
      "NBOXカスタム",
      "N BOXカスタム",
      "エヌボックスカスタム",
      "Nボックスカスタム",
      "N-BOX CUSTOM",
    ],
  },
  {
    canonical: "N-WGN",
    type: "model",
    aliases: [
      "NWGN",
      "N WGN",
      "nwgn",
      "エヌワゴン",
      "Nワゴン",
    ],
  },
  {
    canonical: "N-ONE",
    type: "model",
    aliases: [
      "NONE",
      "N ONE",
      "none",
      "エヌワン",
      "Nワン",
    ],
  },
  {
    canonical: "N-VAN",
    type: "model",
    aliases: [
      "NVAN",
      "N VAN",
      "nvan",
      "エヌバン",
      "Nバン",
    ],
  },
  {
    canonical: "フリード",
    type: "model",
    aliases: [
      "FREED",
      "freed",
      "ホンダフリード",
    ],
  },
  {
    canonical: "フリード+",
    type: "model",
    aliases: [
      "フリードプラス",
      "FREED+",
      "FREED PLUS",
    ],
  },
  {
    canonical: "ステップワゴン",
    type: "model",
    aliases: [
      "ステップ",
      "ステップW",
      "STEP WGN",
      "STEPWGN",
      "stepwgn",
    ],
  },
  {
    canonical: "ヴェゼル",
    type: "model",
    aliases: [
      "ベゼル",
      "VEZEL",
      "vezel",
    ],
  },
  {
    canonical: "フィット",
    type: "model",
    aliases: [
      "FIT",
      "fit",
      "ホンダフィット",
    ],
  },
  {
    canonical: "シャトル",
    type: "model",
    aliases: [
      "SHUTTLE",
      "shuttle",
      "ホンダシャトル",
    ],
  },
  {
    canonical: "オデッセイ",
    type: "model",
    aliases: [
      "ODYSSEY",
      "odyssey",
      "オデ",
    ],
  },
  {
    canonical: "シビック",
    type: "model",
    aliases: [
      "CIVIC",
      "civic",
      "ホンダシビック",
    ],
  },
  {
    canonical: "CR-V",
    type: "model",
    aliases: [
      "CRV",
      "crv",
      "シーアールブイ",
    ],
  },
  {
    canonical: "ZR-V",
    type: "model",
    aliases: [
      "ZRV",
      "zrv",
      "ゼットアールブイ",
    ],
  },

  // スズキ
  {
    canonical: "スペーシア",
    type: "model",
    aliases: [
      "スペーシャ",
      "SPACIA",
      "spacia",
      "スズキスペーシア",
    ],
  },
  {
    canonical: "スペーシアカスタム",
    type: "model",
    aliases: [
      "スペカス",
      "スペーシア カスタム",
      "スペーシャカスタム",
      "SPACIA CUSTOM",
    ],
  },
  {
    canonical: "スペーシアギア",
    type: "model",
    aliases: [
      "スペーシア ギア",
      "スペギア",
      "SPACIA GEAR",
    ],
  },
  {
    canonical: "スペーシアベース",
    type: "model",
    aliases: [
      "スペーシア ベース",
      "スペベース",
      "SPACIA BASE",
    ],
  },
  {
    canonical: "ワゴンR",
    type: "model",
    aliases: [
      "ワゴンアール",
      "WAGON R",
      "WAGONR",
      "wagon r",
    ],
  },
  {
    canonical: "ワゴンRスマイル",
    type: "model",
    aliases: [
      "ワゴンアールスマイル",
      "ワゴンR スマイル",
      "WAGON R SMILE",
    ],
  },
  {
    canonical: "ハスラー",
    type: "model",
    aliases: [
      "HUSTLER",
      "hustler",
      "スズキハスラー",
    ],
  },
  {
    canonical: "ジムニー",
    type: "model",
    aliases: [
      "JIMNY",
      "jimny",
      "スズキジムニー",
    ],
  },
  {
    canonical: "ジムニーシエラ",
    type: "model",
    aliases: [
      "シエラ",
      "ジムニー シエラ",
      "JIMNY SIERRA",
      "jimny sierra",
    ],
  },
  {
    canonical: "ジムニーノマド",
    type: "model",
    aliases: [
      "ノマド",
      "ジムニー ノマド",
      "JIMNY NOMADE",
    ],
  },
  {
    canonical: "スイフト",
    type: "model",
    aliases: [
      "SWIFT",
      "swift",
      "スズキスイフト",
    ],
  },
  {
    canonical: "スイフトスポーツ",
    type: "model",
    aliases: [
      "スイスポ",
      "スイフト スポーツ",
      "SWIFT SPORT",
    ],
  },
  {
    canonical: "ソリオ",
    type: "model",
    aliases: [
      "SOLIO",
      "solio",
      "スズキソリオ",
    ],
  },
  {
    canonical: "ソリオバンディット",
    type: "model",
    aliases: [
      "バンディット",
      "ソリオ バンディット",
      "SOLIO BANDIT",
    ],
  },
  {
    canonical: "アルト",
    type: "model",
    aliases: [
      "ALTO",
      "alto",
      "スズキアルト",
    ],
  },
  {
    canonical: "ラパン",
    type: "model",
    aliases: [
      "アルトラパン",
      "ALTO LAPIN",
      "LAPIN",
      "lapin",
    ],
  },
  {
    canonical: "エブリイ",
    type: "model",
    aliases: [
      "エブリィ",
      "エブリー",
      "EVERY",
      "every",
    ],
  },
  {
    canonical: "エブリイワゴン",
    type: "model",
    aliases: [
      "エブリィワゴン",
      "エブリーワゴン",
      "EVERY WAGON",
    ],
  },
  {
    canonical: "クロスビー",
    type: "model",
    aliases: [
      "XBEE",
      "xbee",
      "スズキクロスビー",
    ],
  },

  // ダイハツ
  {
    canonical: "タント",
    type: "model",
    aliases: [
      "TANTO",
      "tanto",
      "ダイハツタント",
    ],
  },
  {
    canonical: "タントカスタム",
    type: "model",
    aliases: [
      "タンカス",
      "タント カスタム",
      "TANTO CUSTOM",
    ],
  },
  {
    canonical: "ムーヴ",
    type: "model",
    aliases: [
      "ムーブ",
      "MOVE",
      "move",
      "ダイハツムーヴ",
    ],
  },
  {
    canonical: "ムーヴカスタム",
    type: "model",
    aliases: [
      "ムーブカスタム",
      "ムーヴ カスタム",
      "MOVE CUSTOM",
    ],
  },
  {
    canonical: "ムーヴキャンバス",
    type: "model",
    aliases: [
      "ムーブキャンバス",
      "キャンバス",
      "ムーヴ キャンバス",
      "MOVE CANBUS",
    ],
  },
  {
    canonical: "ミライース",
    type: "model",
    aliases: [
      "ミラ イース",
      "MIRA E:S",
      "MIRA ES",
      "mira es",
    ],
  },
  {
    canonical: "ミラココア",
    type: "model",
    aliases: [
      "ミラ ココア",
      "ココア",
      "MIRA COCOA",
    ],
  },
  {
    canonical: "ミラトコット",
    type: "model",
    aliases: [
      "ミラ トコット",
      "トコット",
      "MIRA TOCOT",
    ],
  },
  {
    canonical: "ウェイク",
    type: "model",
    aliases: [
      "WAKE",
      "wake",
      "ダイハツウェイク",
    ],
  },
  {
    canonical: "アトレー",
    type: "model",
    aliases: [
      "ATRAI",
      "atrai",
      "ダイハツアトレー",
    ],
  },
  {
    canonical: "ハイゼットカーゴ",
    type: "model",
    aliases: [
      "ハイゼット カーゴ",
      "ハイゼットバン",
      "HIJET CARGO",
    ],
  },
  {
    canonical: "ハイゼットトラック",
    type: "model",
    aliases: [
      "ハイゼット トラック",
      "ハイゼット",
      "HIJET TRUCK",
    ],
  },
  {
    canonical: "ロッキー",
    type: "model",
    aliases: [
      "ROCKY",
      "rocky",
      "ダイハツロッキー",
    ],
  },
  {
    canonical: "トール",
    type: "model",
    aliases: [
      "THOR",
      "thor",
      "ダイハツトール",
    ],
  },
  {
    canonical: "コペン",
    type: "model",
    aliases: [
      "COPEN",
      "copen",
      "ダイハツコペン",
    ],
  },

  // スバル
  {
    canonical: "フォレスター",
    type: "model",
    aliases: [
      "FORESTER",
      "forester",
      "スバルフォレスター",
    ],
  },
  {
    canonical: "レヴォーグ",
    type: "model",
    aliases: [
      "レボーグ",
      "LEVORG",
      "levorg",
    ],
  },
  {
    canonical: "インプレッサ",
    type: "model",
    aliases: [
      "IMPREZA",
      "impreza",
      "インプ",
    ],
  },
  {
    canonical: "クロストレック",
    type: "model",
    aliases: [
      "CROSSTREK",
      "crosstrek",
      "スバルクロストレック",
    ],
  },
  {
    canonical: "XV",
    type: "model",
    aliases: [
      "SUBARU XV",
      "スバルXV",
      "エックスブイ",
    ],
  },
  {
    canonical: "レガシィアウトバック",
    type: "model",
    aliases: [
      "アウトバック",
      "レガシーアウトバック",
      "LEGACY OUTBACK",
    ],
  },
  {
    canonical: "WRX",
    type: "model",
    aliases: [
      "ダブリューアールエックス",
      "SUBARU WRX",
      "wrx",
    ],
  },
  {
    canonical: "BRZ",
    type: "model",
    aliases: [
      "ビーアールゼット",
      "SUBARU BRZ",
      "brz",
    ],
  },
  {
    canonical: "ステラ",
    type: "model",
    aliases: [
      "STELLA",
      "stella",
      "スバルステラ",
    ],
  },
  {
    canonical: "シフォン",
    type: "model",
    aliases: [
      "CHIFFON",
      "chiffon",
      "スバルシフォン",
    ],
  },

  // マツダ
  {
    canonical: "CX-3",
    type: "model",
    aliases: [
      "CX3",
      "cx3",
      "シーエックススリー",
    ],
  },
  {
    canonical: "CX-30",
    type: "model",
    aliases: [
      "CX30",
      "cx30",
      "シーエックスサーティ",
    ],
  },
  {
    canonical: "CX-5",
    type: "model",
    aliases: [
      "CX5",
      "cx5",
      "シーエックスファイブ",
    ],
  },
  {
    canonical: "CX-60",
    type: "model",
    aliases: [
      "CX60",
      "cx60",
      "シーエックスシックスティ",
    ],
  },
  {
    canonical: "CX-8",
    type: "model",
    aliases: [
      "CX8",
      "cx8",
      "シーエックスエイト",
    ],
  },
  {
    canonical: "CX-80",
    type: "model",
    aliases: [
      "CX80",
      "cx80",
      "シーエックスエイティ",
    ],
  },
  {
    canonical: "MAZDA2",
    type: "model",
    aliases: [
      "マツダ2",
      "マツダツー",
      "デミオ",
      "mazda2",
    ],
  },
  {
    canonical: "MAZDA3",
    type: "model",
    aliases: [
      "マツダ3",
      "マツダスリー",
      "アクセラ",
      "mazda3",
    ],
  },
  {
    canonical: "MAZDA6",
    type: "model",
    aliases: [
      "マツダ6",
      "マツダシックス",
      "アテンザ",
      "mazda6",
    ],
  },
  {
    canonical: "ロードスター",
    type: "model",
    aliases: [
      "ROADSTER",
      "roadster",
      "MX-5",
      "MX5",
    ],
  },
  {
    canonical: "フレア",
    type: "model",
    aliases: [
      "FLAIR",
      "flair",
      "マツダフレア",
    ],
  },
  {
    canonical: "フレアワゴン",
    type: "model",
    aliases: [
      "フレア ワゴン",
      "FLAIR WAGON",
      "flair wagon",
    ],
  },

  // 三菱
  {
    canonical: "デリカD:5",
    type: "model",
    aliases: [
      "デリカD5",
      "デリカ D5",
      "デリカ",
      "DELICA D:5",
      "DELICA D5",
    ],
  },
  {
    canonical: "デリカミニ",
    type: "model",
    aliases: [
      "デリカ ミニ",
      "DELICA MINI",
      "delica mini",
    ],
  },
  {
    canonical: "アウトランダーPHEV",
    type: "model",
    aliases: [
      "アウトランダー",
      "アウトランダー PHEV",
      "OUTLANDER PHEV",
    ],
  },
  {
    canonical: "エクリプスクロス",
    type: "model",
    aliases: [
      "エクリプス クロス",
      "ECLIPSE CROSS",
      "eclipse cross",
    ],
  },
  {
    canonical: "eKワゴン",
    type: "model",
    aliases: [
      "EKワゴン",
      "ekワゴン",
      "イーケーワゴン",
      "eK WAGON",
    ],
  },
  {
    canonical: "eKスペース",
    type: "model",
    aliases: [
      "EKスペース",
      "ekスペース",
      "イーケースペース",
      "eK SPACE",
    ],
  },
  {
    canonical: "eKクロス",
    type: "model",
    aliases: [
      "EKクロス",
      "ekクロス",
      "イーケークロス",
      "eK X",
    ],
  },

  // 輸入車モデル
  {
    canonical: "メルセデス・ベンツAクラス",
    type: "model",
    aliases: [
      "Aクラス",
      "ベンツAクラス",
      "Mercedes A-Class",
      "A-Class",
    ],
  },
  {
    canonical: "メルセデス・ベンツCクラス",
    type: "model",
    aliases: [
      "Cクラス",
      "ベンツCクラス",
      "Mercedes C-Class",
      "C-Class",
    ],
  },
  {
    canonical: "メルセデス・ベンツEクラス",
    type: "model",
    aliases: [
      "Eクラス",
      "ベンツEクラス",
      "Mercedes E-Class",
      "E-Class",
    ],
  },
  {
    canonical: "メルセデス・ベンツSクラス",
    type: "model",
    aliases: [
      "Sクラス",
      "ベンツSクラス",
      "Mercedes S-Class",
      "S-Class",
    ],
  },
  {
    canonical: "メルセデス・ベンツGクラス",
    type: "model",
    aliases: [
      "Gクラス",
      "ゲレンデ",
      "ベンツGクラス",
      "Mercedes G-Class",
      "G-Class",
    ],
  },
  {
    canonical: "BMW 1シリーズ",
    type: "model",
    aliases: [
      "1シリーズ",
      "BMW1シリーズ",
      "BMW 1 Series",
    ],
  },
  {
    canonical: "BMW 3シリーズ",
    type: "model",
    aliases: [
      "3シリーズ",
      "BMW3シリーズ",
      "BMW 3 Series",
    ],
  },
  {
    canonical: "BMW 5シリーズ",
    type: "model",
    aliases: [
      "5シリーズ",
      "BMW5シリーズ",
      "BMW 5 Series",
    ],
  },
  {
    canonical: "BMW X1",
    type: "model",
    aliases: [
      "X1",
      "BMWX1",
      "BMW X1",
    ],
  },
  {
    canonical: "BMW X3",
    type: "model",
    aliases: [
      "X3",
      "BMWX3",
      "BMW X3",
    ],
  },
  {
    canonical: "BMW X5",
    type: "model",
    aliases: [
      "X5",
      "BMWX5",
      "BMW X5",
    ],
  },
  {
    canonical: "MINIクロスオーバー",
    type: "model",
    aliases: [
      "ミニクロスオーバー",
      "MINI CROSSOVER",
      "MINI COUNTRYMAN",
      "カントリーマン",
    ],
  },
  {
    canonical: "フォルクスワーゲンゴルフ",
    type: "model",
    aliases: [
      "ゴルフ",
      "VWゴルフ",
      "Volkswagen Golf",
      "VW Golf",
    ],
  },
  {
    canonical: "フォルクスワーゲンポロ",
    type: "model",
    aliases: [
      "ポロ",
      "VWポロ",
      "Volkswagen Polo",
      "VW Polo",
    ],
  },
  {
    canonical: "アウディA3",
    type: "model",
    aliases: [
      "A3",
      "Audi A3",
      "アウディ A3",
    ],
  },
  {
    canonical: "アウディA4",
    type: "model",
    aliases: [
      "A4",
      "Audi A4",
      "アウディ A4",
    ],
  },
  {
    canonical: "アウディQ3",
    type: "model",
    aliases: [
      "Q3",
      "Audi Q3",
      "アウディ Q3",
    ],
  },
  {
    canonical: "アウディQ5",
    type: "model",
    aliases: [
      "Q5",
      "Audi Q5",
      "アウディ Q5",
    ],
  },

  // 車種カテゴリ
  {
    canonical: "軽自動車",
    type: "category",
    aliases: [
      "軽",
      "軽四",
      "軽四輪",
      "軽カー",
      "KEI",
      "KEI CAR",
    ],
  },
  {
    canonical: "軽乗用車",
    type: "category",
    aliases: [
      "軽乗用",
      "軽の乗用車",
    ],
  },
  {
    canonical: "軽バン",
    type: "category",
    aliases: [
      "軽貨物",
      "軽箱バン",
      "軽箱",
      "軽商用バン",
    ],
  },
  {
    canonical: "軽トラック",
    type: "category",
    aliases: [
      "軽トラ",
      "軽トラック車",
    ],
  },
  {
    canonical: "コンパクトカー",
    type: "category",
    aliases: [
      "コンパクト",
      "小型車",
      "小さい普通車",
    ],
  },
  {
    canonical: "ミニバン",
    type: "category",
    aliases: [
      "ワンボックス",
      "1BOX",
      "ファミリーミニバン",
    ],
  },
  {
    canonical: "SUV",
    type: "category",
    aliases: [
      "エスユーブイ",
      "クロカン",
      "スポーツユーティリティ",
    ],
  },
  {
    canonical: "セダン",
    type: "category",
    aliases: [
      "4ドアセダン",
      "サルーン",
    ],
  },
  {
    canonical: "ステーションワゴン",
    type: "category",
    aliases: [
      "ワゴン",
      "ツーリングワゴン",
    ],
  },
  {
    canonical: "クーペ",
    type: "category",
    aliases: [
      "2ドアクーペ",
      "スポーツクーペ",
    ],
  },
  {
    canonical: "オープンカー",
    type: "category",
    aliases: [
      "オープン",
      "カブリオレ",
      "コンバーチブル",
      "ロードスタータイプ",
    ],
  },
  {
    canonical: "商用バン",
    type: "category",
    aliases: [
      "バン",
      "貨物バン",
      "仕事用バン",
      "箱バン",
    ],
  },
  {
    canonical: "トラック",
    type: "category",
    aliases: [
      "貨物トラック",
      "仕事用トラック",
    ],
  },
  {
    canonical: "ハイブリッド車",
    type: "category",
    aliases: [
      "ハイブリッド",
      "HV",
      "HEV",
      "hybrid",
    ],
  },
  {
    canonical: "プラグインハイブリッド車",
    type: "category",
    aliases: [
      "PHEV",
      "PHV",
      "プラグインハイブリッド",
      "プラグインHV",
    ],
  },
  {
    canonical: "電気自動車",
    type: "category",
    aliases: [
      "EV",
      "BEV",
      "電気車",
      "電動車",
    ],
  },
  {
    canonical: "ディーゼル車",
    type: "category",
    aliases: [
      "ディーゼル",
      "クリーンディーゼル",
      "軽油車",
    ],
  },
  {
    canonical: "4WD",
    type: "category",
    aliases: [
      "四駆",
      "四輪駆動",
      "AWD",
      "4駆",
    ],
  },
  {
    canonical: "2WD",
    type: "category",
    aliases: [
      "二駆",
      "二輪駆動",
      "FF",
      "FR",
    ],
  },

  // 利用目的・条件
  {
    canonical: "通勤",
    type: "purpose",
    aliases: [
      "通勤用",
      "会社用",
      "会社への往復",
      "職場への往復",
    ],
  },
  {
    canonical: "通学",
    type: "purpose",
    aliases: [
      "通学用",
      "学校への往復",
    ],
  },
  {
    canonical: "買い物",
    type: "purpose",
    aliases: [
      "買物",
      "買い出し",
      "スーパー用",
    ],
  },
  {
    canonical: "子どもの送迎",
    type: "purpose",
    aliases: [
      "子供の送迎",
      "こどもの送迎",
      "送り迎え",
      "習い事送迎",
    ],
  },
  {
    canonical: "保育園送迎",
    type: "purpose",
    aliases: [
      "保育所送迎",
      "保育園の送り迎え",
    ],
  },
  {
    canonical: "幼稚園送迎",
    type: "purpose",
    aliases: [
      "幼稚園の送り迎え",
      "園児送迎",
    ],
  },
  {
    canonical: "家族旅行",
    type: "purpose",
    aliases: [
      "家族で旅行",
      "ファミリー旅行",
      "帰省",
    ],
  },
  {
    canonical: "長距離移動",
    type: "purpose",
    aliases: [
      "長距離",
      "遠出",
      "ロングドライブ",
    ],
  },
  {
    canonical: "高速道路",
    type: "purpose",
    aliases: [
      "高速",
      "高速走行",
      "高速道路をよく使う",
    ],
  },
  {
    canonical: "雪道",
    type: "purpose",
    aliases: [
      "冬道",
      "積雪路",
      "雪国",
      "雪の道",
    ],
  },
  {
    canonical: "山道",
    type: "purpose",
    aliases: [
      "峠道",
      "坂道",
      "山間部",
    ],
  },
  {
    canonical: "キャンプ",
    type: "purpose",
    aliases: [
      "オートキャンプ",
      "キャンプ用",
    ],
  },
  {
    canonical: "釣り",
    type: "purpose",
    aliases: [
      "フィッシング",
      "海釣り",
      "川釣り",
    ],
  },
  {
    canonical: "アウトドア",
    type: "purpose",
    aliases: [
      "外遊び",
      "レジャー",
      "屋外レジャー",
    ],
  },
  {
    canonical: "車中泊",
    type: "purpose",
    aliases: [
      "車で寝る",
      "車泊",
      "バンライフ",
    ],
  },
  {
    canonical: "仕事",
    type: "purpose",
    aliases: [
      "仕事用",
      "業務用",
      "商売用",
    ],
  },
  {
    canonical: "営業",
    type: "purpose",
    aliases: [
      "営業車",
      "外回り",
    ],
  },
  {
    canonical: "配送",
    type: "purpose",
    aliases: [
      "配達",
      "宅配",
      "デリバリー",
    ],
  },
  {
    canonical: "荷物を積む",
    type: "purpose",
    aliases: [
      "荷物運搬",
      "積載",
      "荷物が多い",
      "荷物を載せる",
    ],
  },
  {
    canonical: "引っ越し",
    type: "purpose",
    aliases: [
      "引越し",
      "家具運搬",
    ],
  },
  {
    canonical: "ドライブ",
    type: "purpose",
    aliases: [
      "運転を楽しむ",
      "休日ドライブ",
    ],
  },
  {
    canonical: "デート",
    type: "purpose",
    aliases: [
      "デート用",
      "恋人とドライブ",
    ],
  },
  {
    canonical: "初めての車",
    type: "purpose",
    aliases: [
      "初購入",
      "ファーストカー",
      "免許取りたて",
    ],
  },
  {
    canonical: "運転が苦手",
    type: "purpose",
    aliases: [
      "運転に自信がない",
      "駐車が苦手",
      "車庫入れが苦手",
    ],
  },
  {
    canonical: "維持費重視",
    type: "purpose",
    aliases: [
      "維持費が安い",
      "ランニングコスト重視",
      "税金が安い",
    ],
  },
  {
    canonical: "燃費重視",
    type: "purpose",
    aliases: [
      "燃費が良い",
      "低燃費",
      "ガソリン代を抑えたい",
    ],
  },
  {
    canonical: "安全性重視",
    type: "purpose",
    aliases: [
      "安全な車",
      "安全装備重視",
      "衝突軽減ブレーキ",
    ],
  },
  {
    canonical: "荷室重視",
    type: "purpose",
    aliases: [
      "荷室が広い",
      "トランクが広い",
      "積載性重視",
    ],
  },
  {
    canonical: "室内広さ重視",
    type: "purpose",
    aliases: [
      "車内が広い",
      "室内が広い",
      "後席が広い",
    ],
  },
  {
    canonical: "見た目重視",
    type: "purpose",
    aliases: [
      "デザイン重視",
      "かっこいい車",
      "かわいい車",
      "おしゃれな車",
    ],
  },
  {
    canonical: "リセール重視",
    type: "purpose",
    aliases: [
      "リセール",
      "売る時に高い",
      "値落ちしにくい",
      "下取りが高い",
    ],
  },

  // 装備・機能
  {
    canonical: "スライドドア",
    type: "feature",
    aliases: [
      "スライドドア付き",
      "電動スライド",
      "パワースライドドア",
      "パワスラ",
    ],
  },
  {
    canonical: "両側電動スライドドア",
    type: "feature",
    aliases: [
      "両側パワースライド",
      "両側パワスラ",
      "両側電動スライド",
    ],
  },
  {
    canonical: "衝突被害軽減ブレーキ",
    type: "feature",
    aliases: [
      "自動ブレーキ",
      "衝突軽減ブレーキ",
      "緊急ブレーキ",
    ],
  },
  {
    canonical: "全周囲カメラ",
    type: "feature",
    aliases: [
      "アラウンドビューモニター",
      "アラウンドビュー",
      "360度カメラ",
      "パノラミックビューモニター",
      "全方位カメラ",
    ],
  },
  {
    canonical: "バックカメラ",
    type: "feature",
    aliases: [
      "リアカメラ",
      "後方カメラ",
      "バックモニター",
    ],
  },
  {
    canonical: "クルーズコントロール",
    type: "feature",
    aliases: [
      "クルコン",
      "追従クルコン",
      "アダプティブクルーズ",
      "ACC",
    ],
  },
  {
    canonical: "シートヒーター",
    type: "feature",
    aliases: [
      "ヒートシーター",
      "座席ヒーター",
      "暖かいシート",
    ],
  },
  {
    canonical: "サンルーフ",
    type: "feature",
    aliases: [
      "ムーンルーフ",
      "パノラマルーフ",
      "ガラスルーフ",
    ],
  },
  {
    canonical: "本革シート",
    type: "feature",
    aliases: [
      "革シート",
      "レザーシート",
      "本皮シート",
    ],
  },
  {
    canonical: "ETC",
    type: "feature",
    aliases: [
      "ETC付き",
      "イーティーシー",
    ],
  },
  {
    canonical: "ドライブレコーダー",
    type: "feature",
    aliases: [
      "ドラレコ",
      "ドライブレコーダ",
    ],
  },

  // 燃料・駆動・ミッション
  {
    canonical: "ガソリン車",
    type: "spec",
    aliases: [
      "ガソリン",
      "ガソリンエンジン",
    ],
  },
  {
    canonical: "ハイブリッド車",
    type: "spec",
    aliases: [
      "ハイブリッド",
      "HV",
      "HEV",
    ],
  },
  {
    canonical: "ディーゼル車",
    type: "spec",
    aliases: [
      "ディーゼル",
      "軽油",
      "クリーンディーゼル",
    ],
  },
  {
    canonical: "電気自動車",
    type: "spec",
    aliases: [
      "EV",
      "BEV",
      "電気車",
    ],
  },
  {
    canonical: "4WD",
    type: "spec",
    aliases: [
      "四駆",
      "4駆",
      "AWD",
      "四輪駆動",
    ],
  },
  {
    canonical: "2WD",
    type: "spec",
    aliases: [
      "二駆",
      "FF",
      "FR",
      "二輪駆動",
    ],
  },
  {
    canonical: "オートマチック",
    type: "spec",
    aliases: [
      "AT",
      "オートマ",
      "オートマ車",
    ],
  },
  {
    canonical: "マニュアル",
    type: "spec",
    aliases: [
      "MT",
      "ミッション",
      "マニュアル車",
      "5速",
      "6速",
    ],
  },

  // 人数
  {
    canonical: "2人乗り",
    type: "seat",
    aliases: [
      "二人乗り",
      "2名乗車",
      "2シーター",
    ],
  },
  {
    canonical: "4人乗り",
    type: "seat",
    aliases: [
      "四人乗り",
      "4名乗車",
    ],
  },
  {
    canonical: "5人乗り",
    type: "seat",
    aliases: [
      "五人乗り",
      "5名乗車",
    ],
  },
  {
    canonical: "6人乗り",
    type: "seat",
    aliases: [
      "六人乗り",
      "6名乗車",
    ],
  },
  {
    canonical: "7人乗り",
    type: "seat",
    aliases: [
      "七人乗り",
      "7名乗車",
      "7人乗車",
    ],
  },
  {
    canonical: "8人乗り",
    type: "seat",
    aliases: [
      "八人乗り",
      "8名乗車",
      "8人乗車",
    ],
  },
  {
    canonical: "10人乗り",
    type: "seat",
    aliases: [
      "十人乗り",
      "10名乗車",
      "10人乗車",
    ],
  },
];

const createEntry = (
  {
    canonical,
    type,
    aliases,
  },
  index,
) => {
  const cleanAliases = unique(
    aliases,
  );

  return Object.freeze({
    id: `synonym-${String(
      index + 1,
    ).padStart(4, "0")}`,
    canonical,
    type,
    aliases: cleanAliases,
    keywords: unique([
      canonical,
      ...cleanAliases,
    ]),
  });
};

export const vehicleSynonyms =
  Object.freeze(
    rows.map(createEntry),
  );

export const synonyms =
  vehicleSynonyms;

const byCanonical = new Map();
const byAlias = new Map();
const byType = new Map();

for (
  const entry of vehicleSynonyms
) {
  const canonicalKey =
    normalizeSynonymText(
      entry.canonical,
    );

  if (!byCanonical.has(canonicalKey)) {
    byCanonical.set(
      canonicalKey,
      [],
    );
  }

  byCanonical
    .get(canonicalKey)
    .push(entry);

  if (!byType.has(entry.type)) {
    byType.set(
      entry.type,
      [],
    );
  }

  byType
    .get(entry.type)
    .push(entry);

  for (
    const keyword of entry.keywords
  ) {
    const normalized =
      normalizeSynonymText(
        keyword,
      );

    if (!normalized) {
      continue;
    }

    if (!byAlias.has(normalized)) {
      byAlias.set(
        normalized,
        [],
      );
    }

    const current =
      byAlias.get(normalized);

    if (
      !current.some(
        (value) =>
          value.id === entry.id,
      )
    ) {
      current.push(entry);
    }
  }
}

export function getSynonymsByType(
  type,
) {
  const key = String(
    type ?? "",
  ).trim();

  if (!key) {
    return [];
  }

  return [
    ...(byType.get(key) || []),
  ];
}

export function getSynonymsByCanonical(
  canonical,
) {
  const key =
    normalizeSynonymText(
      canonical,
    );

  if (!key) {
    return [];
  }

  return [
    ...(byCanonical.get(key) || []),
  ];
}

export function findSynonymEntries(
  value,
  {
    type = null,
  } = {},
) {
  const key =
    normalizeSynonymText(
      value,
    );

  if (!key) {
    return [];
  }

  const matches = [
    ...(byAlias.get(key) || []),
  ];

  if (!type) {
    return matches;
  }

  return matches.filter(
    (entry) =>
      entry.type === type,
  );
}

export function findSynonymEntry(
  value,
  options = {},
) {
  return (
    findSynonymEntries(
      value,
      options,
    )[0] || null
  );
}

export function resolveSynonym(
  value,
  {
    type = null,
    fallback = null,
  } = {},
) {
  const entry =
    findSynonymEntry(
      value,
      { type },
    );

  if (entry) {
    return entry.canonical;
  }

  if (fallback !== null) {
    return fallback;
  }

  return String(value ?? "").trim();
}

export function resolveAllSynonyms(
  value,
  {
    type = null,
  } = {},
) {
  return unique(
    findSynonymEntries(
      value,
      { type },
    ).map(
      (entry) =>
        entry.canonical,
    ),
  );
}

function replaceAllLiteral(
  source,
  search,
  replacement,
) {
  if (!search) {
    return source;
  }

  return source
    .split(search)
    .join(replacement);
}

export function normalizeInputWithSynonyms(
  value,
  {
    types = null,
  } = {},
) {
  let result = String(
    value ?? "",
  ).normalize("NFKC");

  const typeSet =
    Array.isArray(types) &&
    types.length > 0
      ? new Set(types)
      : null;

  const candidates =
    vehicleSynonyms
      .filter(
        (entry) =>
          !typeSet ||
          typeSet.has(entry.type),
      )
      .flatMap(
        (entry) =>
          entry.aliases.map(
            (alias) => ({
              alias,
              canonical:
                entry.canonical,
            }),
          ),
      )
      .sort(
        (first, second) =>
          second.alias.length -
          first.alias.length,
      );

  for (
    const {
      alias,
      canonical,
    } of candidates
  ) {
    if (!alias) {
      continue;
    }

    result =
      replaceAllLiteral(
        result,
        alias,
        canonical,
      );

    const lowerAlias =
      alias.toLocaleLowerCase(
        "ja-JP",
      );

    const lowerResult =
      result.toLocaleLowerCase(
        "ja-JP",
      );

    const index =
      lowerResult.indexOf(
        lowerAlias,
      );

    if (index !== -1) {
      result =
        result.slice(0, index) +
        canonical +
        result.slice(
          index + alias.length,
        );
    }
  }

  return result;
}

export function searchSynonyms(
  value,
  {
    type = null,
    limit = 20,
  } = {},
) {
  const normalizedInput =
    normalizeSynonymText(
      value,
    );

  if (!normalizedInput) {
    return [];
  }

  const safeLimit = Math.max(
    1,
    Math.min(
      Number(limit) || 20,
      100,
    ),
  );

  const results = [];

  for (
    const entry of vehicleSynonyms
  ) {
    if (
      type &&
      entry.type !== type
    ) {
      continue;
    }

    let bestScore = 0;
    let matchedKeyword = null;

    for (
      const keyword of entry.keywords
    ) {
      const normalizedKeyword =
        normalizeSynonymText(
          keyword,
        );

      if (!normalizedKeyword) {
        continue;
      }

      let score = 0;

      if (
        normalizedInput ===
        normalizedKeyword
      ) {
        score =
          keyword ===
          entry.canonical
            ? 10000
            : 9500;
      } else if (
        normalizedInput.includes(
          normalizedKeyword,
        )
      ) {
        score =
          7000 +
          normalizedKeyword.length;
      } else if (
        normalizedKeyword.includes(
          normalizedInput,
        )
      ) {
        score =
          5000 +
          normalizedInput.length;
      }

      if (score > bestScore) {
        bestScore = score;
        matchedKeyword = keyword;
      }
    }

    if (bestScore > 0) {
      results.push({
        entry,
        canonical:
          entry.canonical,
        type:
          entry.type,
        matchedKeyword,
        score: bestScore,
      });
    }
  }

  return results
    .sort(
      (first, second) => {
        if (
          first.score !==
          second.score
        ) {
          return (
            second.score -
            first.score
          );
        }

        return first.canonical.localeCompare(
          second.canonical,
          "ja",
        );
      },
    )
    .slice(0, safeLimit);
}

export function hasSynonym(
  value,
  {
    type = null,
  } = {},
) {
  return Boolean(
    findSynonymEntry(
      value,
      { type },
    ),
  );
}
