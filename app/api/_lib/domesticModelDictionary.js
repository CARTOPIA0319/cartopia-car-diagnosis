import {
  getMakerByKey,
  normalizeMakerText,
  resolveMaker,
} from "./makerDictionary.js";

export const VEHICLE_CLASSES = Object.freeze({
  KEI: "kei",
  STANDARD: "standard",
});

export const DOMESTIC_MODEL_TYPES = Object.freeze({
  SLIDE_DOOR: "slide-door",
  STANDARD: "standard",
  SUV: "suv",
  TRUCK: "truck",
  SPORTY: "sporty",
  COMPACT: "compact",
  MINIVAN: "minivan",
  SEDAN: "sedan",
  STATION_WAGON: "station-wagon",
  VAN_TRUCK: "van-truck",
});

function normalizeLatinDiacritics(value) {
  return Array.from(value)
    .map((character) => {
      if (!/\p{Script=Latin}/u.test(character)) {
        return character;
      }

      return character.normalize("NFD").replace(/\p{M}/gu, "");
    })
    .join("");
}

function toKatakana(value) {
  return Array.from(value)
    .map((character) => {
      const codePoint = character.codePointAt(0);

      if (codePoint >= 0x3041 && codePoint <= 0x3096) {
        return String.fromCodePoint(codePoint + 0x60);
      }

      if (codePoint === 0x309d) return "ヽ";
      if (codePoint === 0x309e) return "ヾ";
      return character;
    })
    .join("");
}

export function normalizeDomesticModelText(value) {
  return toKatakana(
    normalizeLatinDiacritics(String(value ?? "").normalize("NFKC"))
  )
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\+/g, "plus")
    .replace(/ハイブリッド/g, "hybrid")
    .replace(/[\p{Separator}\p{Punctuation}\p{Symbol}]/gu, "")
    .trim();
}

const MODEL_ROWS = [
  // トヨタ
  ["toyota", "alphard", "アルファード", ["アルファード", "アルファードハイブリッド"], [], "standard", ["minivan"]],
  ["toyota", "vellfire", "ヴェルファイア", ["ヴェルファイア", "ヴェルファイアハイブリッド"], [], "standard", ["minivan"]],
  ["toyota", "noah", "ノア", ["ノア", "ノアハイブリッド"], [], "standard", ["minivan"]],
  ["toyota", "voxy", "ヴォクシー", ["ヴォクシー", "ヴォクシーハイブリッド"], ["VOXY"], "standard", ["minivan"]],
  ["toyota", "esquire", "エスクァイア", ["エスクァイア", "エスクァイアハイブリッド"], [], "standard", ["minivan"]],
  ["toyota", "sienta", "シエンタ", ["シエンタ", "シエンタハイブリッド"], [], "standard", ["compact", "minivan"]],
  ["toyota", "estima", "エスティマ", ["エスティマ", "エスティマハイブリッド"], [], "standard", ["minivan"]],
  ["toyota", "hiace-wagon", "ハイエースワゴン", ["ハイエースワゴン"], ["ハイエース"], "standard", ["minivan", "van-truck"]],
  ["toyota", "hiace-van", "ハイエースバン", ["ハイエースバン"], [], "standard", ["van-truck"]],
  ["toyota", "regiusace", "レジアスエース", ["レジアスエース", "レジアスエースバン"], [], "standard", ["van-truck"]],
  ["toyota", "townace", "タウンエース", ["タウンエース", "タウンエースバン", "タウンエーストラック"], [], "standard", ["van-truck"]],
  ["toyota", "probox", "プロボックス", ["プロボックス", "プロボックスバン"], [], "standard", ["station-wagon", "van-truck"]],
  ["toyota", "succeed", "サクシード", ["サクシード", "サクシードバン"], [], "standard", ["station-wagon", "van-truck"]],
  ["toyota", "roomy", "ルーミー", ["ルーミー"], [], "standard", ["compact", "minivan"]],
  ["toyota", "tank", "タンク", ["タンク"], [], "standard", ["compact", "minivan"]],
  ["toyota", "porte", "ポルテ", ["ポルテ"], [], "standard", ["compact", "minivan"]],
  ["toyota", "spade", "スペイド", ["スペイド"], [], "standard", ["compact", "minivan"]],
  ["toyota", "aqua", "アクア", ["アクア"], [], "standard", ["compact"]],
  ["toyota", "yaris", "ヤリス", ["ヤリス", "ヤリスハイブリッド"], [], "standard", ["compact"]],
  ["toyota", "yaris-cross", "ヤリスクロス", ["ヤリスクロス", "ヤリスクロスハイブリッド"], [], "standard", ["compact", "suv"]],
  ["toyota", "vitz", "ヴィッツ", ["ヴィッツ"], [], "standard", ["compact"]],
  ["toyota", "passo", "パッソ", ["パッソ"], [], "standard", ["compact"]],
  ["toyota", "corolla-sport", "カローラスポーツ", ["カローラスポーツ"], [], "standard", ["compact", "sporty"]],
  ["toyota", "corolla", "カローラ", ["カローラ", "カローラハイブリッド"], [], "standard", ["sedan"]],
  ["toyota", "corolla-touring", "カローラツーリング", ["カローラツーリング", "カローラツーリングハイブリッド"], [], "standard", ["station-wagon"]],
  ["toyota", "corolla-fielder", "カローラフィールダー", ["カローラフィールダー", "カローラフィールダーハイブリッド"], [], "standard", ["station-wagon"]],
  ["toyota", "corolla-cross", "カローラクロス", ["カローラクロス", "カローラクロスハイブリッド"], [], "standard", ["suv"]],
  ["toyota", "prius", "プリウス", ["プリウス", "プリウスPHV"], ["プリウスPHEV"], "standard", ["compact", "sedan"]],
  ["toyota", "prius-alpha", "プリウスα", ["プリウスα"], ["プリウスアルファ"], "standard", ["station-wagon", "minivan"]],
  ["toyota", "crown", "クラウン", ["クラウン", "クラウンハイブリッド"], [], "standard", ["sedan"]],
  ["toyota", "crown-athlete", "クラウンアスリート", ["クラウンアスリート", "クラウンアスリートハイブリッド"], [], "standard", ["sedan", "sporty"]],
  ["toyota", "crown-majesta", "クラウンマジェスタ", ["クラウンマジェスタ"], [], "standard", ["sedan"]],
  ["toyota", "crown-sport", "クラウンスポーツ", ["クラウンスポーツ"], [], "standard", ["suv", "sporty"]],
  ["toyota", "crown-crossover", "クラウンクロスオーバー", ["クラウンクロスオーバー"], [], "standard", ["sedan", "suv"]],
  ["toyota", "camry", "カムリ", ["カムリ", "カムリハイブリッド"], [], "standard", ["sedan"]],
  ["toyota", "mark-x", "マークX", ["マークX"], ["マークエックス"], "standard", ["sedan", "sporty"]],
  ["toyota", "century", "センチュリー", ["センチュリー"], [], "standard", ["sedan"]],
  ["toyota", "rav4", "RAV4", ["RAV4", "RAV4 PHV"], ["RAV4 PHEV", "ラブフォー"], "standard", ["suv"]],
  ["toyota", "harrier", "ハリアー", ["ハリアー", "ハリアーハイブリッド"], [], "standard", ["suv"]],
  ["toyota", "land-cruiser", "ランドクルーザー", ["ランドクルーザー"], ["ランクル"], "standard", ["suv"]],
  ["toyota", "land-cruiser-prado", "ランドクルーザープラド", ["ランドクルーザープラド"], ["プラド", "ランクルプラド"], "standard", ["suv"]],
  ["toyota", "fj-cruiser", "FJクルーザー", ["FJクルーザー"], [], "standard", ["suv"]],
  ["toyota", "hilux", "ハイラックス", ["ハイラックス"], [], "standard", ["suv", "van-truck"]],
  ["toyota", "rush", "ラッシュ", ["ラッシュ"], [], "standard", ["compact", "suv"]],
  ["toyota", "raize", "ライズ", ["ライズ", "ライズハイブリッド"], [], "standard", ["compact", "suv"]],
  ["toyota", "86", "86", ["86"], ["トヨタ86", "ハチロク"], "standard", ["sporty"]],
  ["toyota", "gr86", "GR86", ["GR86"], ["GR 86"], "standard", ["sporty"]],
  ["toyota", "supra", "スープラ", ["スープラ", "GRスープラ"], [], "standard", ["sporty"]],

  // レクサス
  ["lexus", "ls", "LS", ["LS", "LSハイブリッド"], ["レクサスLS"], "standard", ["sedan"]],
  ["lexus", "es", "ES", ["ES", "ESハイブリッド"], ["レクサスES"], "standard", ["sedan"]],
  ["lexus", "is", "IS", ["IS", "ISハイブリッド"], ["レクサスIS"], "standard", ["sedan", "sporty"]],
  ["lexus", "gs", "GS", ["GS", "GSハイブリッド"], ["レクサスGS"], "standard", ["sedan", "sporty"]],
  ["lexus", "hs", "HS", ["HS", "HSハイブリッド"], ["レクサスHS"], "standard", ["sedan"]],
  ["lexus", "ct", "CT", ["CT", "CTハイブリッド"], ["レクサスCT"], "standard", ["compact"]],
  ["lexus", "lc", "LC", ["LC", "LCハイブリッド"], ["レクサスLC"], "standard", ["sporty"]],
  ["lexus", "rc", "RC", ["RC", "RCハイブリッド"], ["レクサスRC"], "standard", ["sporty"]],
  ["lexus", "lbx", "LBX", ["LBX"], ["レクサスLBX"], "standard", ["compact", "suv"]],
  ["lexus", "ux", "UX", ["UX", "UXハイブリッド"], ["レクサスUX"], "standard", ["compact", "suv"]],
  ["lexus", "nx", "NX", ["NX", "NXハイブリッド"], ["レクサスNX"], "standard", ["suv"]],
  ["lexus", "rx", "RX", ["RX", "RXハイブリッド"], ["レクサスRX"], "standard", ["suv"]],
  ["lexus", "rz", "RZ", ["RZ"], ["レクサスRZ"], "standard", ["suv"]],
  ["lexus", "gx", "GX", ["GX"], ["レクサスGX"], "standard", ["suv"]],
  ["lexus", "lx", "LX", ["LX"], ["レクサスLX"], "standard", ["suv"]],

  // 日産
  ["nissan", "note", "ノート", ["ノート", "ノートe-POWER"], ["ノートイーパワー"], "standard", ["compact"]],
  ["nissan", "note-aura", "ノートオーラ", ["ノートオーラ", "オーラ"], ["オーラe-POWER"], "standard", ["compact"]],
  ["nissan", "march", "マーチ", ["マーチ"], [], "standard", ["compact"]],
  ["nissan", "cube", "キューブ", ["キューブ"], [], "standard", ["compact"]],
  ["nissan", "tiida", "ティーダ", ["ティーダ"], [], "standard", ["compact"]],
  ["nissan", "serena", "セレナ", ["セレナ", "セレナe-POWER"], ["セレナイーパワー"], "standard", ["minivan"]],
  ["nissan", "elgrand", "エルグランド", ["エルグランド"], [], "standard", ["minivan"]],
  ["nissan", "lafesta", "ラフェスタ", ["ラフェスタ", "ラフェスタハイウェイスター"], [], "standard", ["minivan"]],
  ["nissan", "x-trail", "エクストレイル", ["エクストレイル"], ["X-TRAIL"], "standard", ["suv"]],
  ["nissan", "kicks", "キックス", ["キックス", "キックスe-POWER"], ["キックスイーパワー"], "standard", ["compact", "suv"]],
  ["nissan", "juke", "ジューク", ["ジューク"], [], "standard", ["compact", "suv"]],
  ["nissan", "dualis", "デュアリス", ["デュアリス"], [], "standard", ["suv"]],
  ["nissan", "murano", "ムラーノ", ["ムラーノ"], [], "standard", ["suv"]],
  ["nissan", "skyline", "スカイライン", ["スカイライン", "スカイラインハイブリッド"], [], "standard", ["sedan", "sporty"]],
  ["nissan", "fuga", "フーガ", ["フーガ", "フーガハイブリッド"], [], "standard", ["sedan"]],
  ["nissan", "sylphy", "シルフィ", ["シルフィ", "ブルーバードシルフィ"], [], "standard", ["sedan"]],
  ["nissan", "fairlady-z", "フェアレディZ", ["フェアレディZ"], ["フェアレディゼット"], "standard", ["sporty"]],
  ["nissan", "gt-r", "GT-R", ["GT-R"], ["GTR"], "standard", ["sporty"]],
  ["nissan", "nv200-vanette", "NV200バネット", ["NV200バネット", "NV200バネットバン"], [], "standard", ["van-truck"]],
  ["nissan", "caravan", "キャラバン", ["キャラバン", "NV350キャラバン"], [], "standard", ["van-truck"]],
  ["nissan", "dayz", "デイズ", ["デイズ", "デイズハイウェイスター"], [], "kei", ["standard"]],
  ["nissan", "dayz-roox", "デイズルークス", ["デイズルークス", "デイズルークスハイウェイスター"], [], "kei", ["slide-door"]],
  ["nissan", "roox", "ルークス", ["ルークス", "ルークスハイウェイスター"], [], "kei", ["slide-door"]],
  ["nissan", "moco", "モコ", ["モコ"], [], "kei", ["standard"]],
  ["nissan", "sakura", "サクラ", ["サクラ"], [], "kei", ["standard"]],
  ["nissan", "clipper-rio", "NV100クリッパーリオ", ["NV100クリッパーリオ", "クリッパーリオ"], [], "kei", ["slide-door"]],
  ["nissan", "clipper-van", "NV100クリッパーバン", ["NV100クリッパーバン", "クリッパーバン"], [], "kei", ["slide-door"]],
  ["nissan", "clipper-truck", "NT100クリッパートラック", ["NT100クリッパートラック", "クリッパートラック"], [], "kei", ["truck"]],

  // ホンダ
  ["honda", "fit", "フィット", ["フィット", "フィットハイブリッド"], [], "standard", ["compact"]],
  ["honda", "shuttle", "シャトル", ["シャトル", "シャトルハイブリッド"], [], "standard", ["station-wagon"]],
  ["honda", "freed", "フリード", ["フリード", "フリードハイブリッド"], [], "standard", ["compact", "minivan"]],
  ["honda", "freed-plus", "フリード＋", ["フリード＋", "フリード＋ハイブリッド"], ["フリードプラス"], "standard", ["compact", "minivan"]],
  ["honda", "stepwgn", "ステップワゴン", ["ステップワゴン", "ステップワゴンスパーダ", "ステップワゴンe:HEV"], ["STEP WGN"], "standard", ["minivan"]],
  ["honda", "odyssey", "オデッセイ", ["オデッセイ", "オデッセイハイブリッド"], [], "standard", ["minivan"]],
  ["honda", "vezel", "ヴェゼル", ["ヴェゼル", "ヴェゼルハイブリッド", "ヴェゼルe:HEV"], [], "standard", ["compact", "suv"]],
  ["honda", "zr-v", "ZR-V", ["ZR-V", "ZR-V e:HEV"], ["ZRV"], "standard", ["suv"]],
  ["honda", "cr-v", "CR-V", ["CR-V", "CR-Vハイブリッド"], ["CRV"], "standard", ["suv"]],
  ["honda", "accord", "アコード", ["アコード", "アコードハイブリッド"], [], "standard", ["sedan"]],
  ["honda", "civic", "シビック", ["シビック", "シビックハイブリッド", "シビックe:HEV"], [], "standard", ["compact", "sedan", "sporty"]],
  ["honda", "grace", "グレイス", ["グレイス", "グレイスハイブリッド"], [], "standard", ["sedan"]],
  ["honda", "insight", "インサイト", ["インサイト"], [], "standard", ["sedan"]],
  ["honda", "s660", "S660", ["S660"], [], "kei", ["sporty"]],
  ["honda", "n-box", "N-BOX", ["N-BOX", "N-BOXカスタム"], ["NBOX"], "kei", ["slide-door"]],
  ["honda", "n-box-slash", "N-BOXスラッシュ", ["N-BOXスラッシュ"], ["NBOXスラッシュ"], "kei", ["standard", "sporty"]],
  ["honda", "n-wgn", "N-WGN", ["N-WGN", "N-WGNカスタム"], ["NWGN"], "kei", ["standard"]],
  ["honda", "n-one", "N-ONE", ["N-ONE"], ["NONE"], "kei", ["standard", "sporty"]],
  ["honda", "n-van", "N-VAN", ["N-VAN", "N-VAN＋スタイル"], ["NVAN", "N-VAN+STYLE"], "kei", ["slide-door"]],
  ["honda", "life", "ライフ", ["ライフ", "ライフディーバ"], [], "kei", ["standard"]],
  ["honda", "zest", "ゼスト", ["ゼスト", "ゼストスパーク"], [], "kei", ["standard", "sporty"]],
  ["honda", "vamos", "バモス", ["バモス", "バモスホビオ"], [], "kei", ["slide-door"]],

  // マツダ
  ["mazda", "mazda2", "MAZDA2", ["MAZDA2"], ["マツダ2"], "standard", ["compact"]],
  ["mazda", "demio", "デミオ", ["デミオ"], [], "standard", ["compact"]],
  ["mazda", "mazda3", "MAZDA3", ["MAZDA3", "MAZDA3ファストバック", "MAZDA3セダン"], ["マツダ3"], "standard", ["compact", "sedan", "sporty"]],
  ["mazda", "axela", "アクセラ", ["アクセラ", "アクセラスポーツ", "アクセラハイブリッド"], [], "standard", ["compact", "sedan", "sporty"]],
  ["mazda", "mazda6", "MAZDA6", ["MAZDA6", "MAZDA6セダン", "MAZDA6ワゴン"], ["マツダ6"], "standard", ["sedan", "station-wagon"]],
  ["mazda", "atenza", "アテンザ", ["アテンザ", "アテンザセダン", "アテンザワゴン"], [], "standard", ["sedan", "station-wagon"]],
  ["mazda", "cx-3", "CX-3", ["CX-3"], ["CX3"], "standard", ["compact", "suv"]],
  ["mazda", "cx-30", "CX-30", ["CX-30"], ["CX30"], "standard", ["compact", "suv"]],
  ["mazda", "cx-5", "CX-5", ["CX-5"], ["CX5"], "standard", ["suv"]],
  ["mazda", "cx-60", "CX-60", ["CX-60"], ["CX60"], "standard", ["suv"]],
  ["mazda", "cx-8", "CX-8", ["CX-8"], ["CX8"], "standard", ["suv", "minivan"]],
  ["mazda", "cx-80", "CX-80", ["CX-80"], ["CX80"], "standard", ["suv", "minivan"]],
  ["mazda", "roadster", "ロードスター", ["ロードスター", "ロードスターRF"], [], "standard", ["sporty"]],
  ["mazda", "flair", "フレア", ["フレア", "フレアカスタムスタイル"], [], "kei", ["standard"]],
  ["mazda", "flair-wagon", "フレアワゴン", ["フレアワゴン", "フレアワゴンカスタムスタイル"], [], "kei", ["slide-door"]],
  ["mazda", "flair-crossover", "フレアクロスオーバー", ["フレアクロスオーバー"], [], "kei", ["suv"]],
  ["mazda", "carol", "キャロル", ["キャロル"], [], "kei", ["standard"]],
  ["mazda", "scrum-wagon", "スクラムワゴン", ["スクラムワゴン"], [], "kei", ["slide-door"]],
  ["mazda", "scrum-truck", "スクラムトラック", ["スクラムトラック"], [], "kei", ["truck"]],

  // スバル
  ["subaru", "impreza", "インプレッサ", ["インプレッサ", "インプレッサスポーツ", "インプレッサG4"], [], "standard", ["compact", "sedan", "sporty"]],
  ["subaru", "wrx", "WRX", ["WRX", "WRX S4", "WRX STI"], [], "standard", ["sedan", "sporty"]],
  ["subaru", "levorg", "レヴォーグ", ["レヴォーグ"], [], "standard", ["station-wagon", "sporty"]],
  ["subaru", "legacy-b4", "レガシィB4", ["レガシィB4"], [], "standard", ["sedan", "sporty"]],
  ["subaru", "legacy-outback", "レガシィアウトバック", ["レガシィアウトバック"], [], "standard", ["suv", "station-wagon"]],
  ["subaru", "forester", "フォレスター", ["フォレスター"], [], "standard", ["suv"]],
  ["subaru", "xv", "XV", ["XV", "インプレッサXV"], ["スバルXV"], "standard", ["compact", "suv"]],
  ["subaru", "crosstrek", "クロストレック", ["クロストレック"], [], "standard", ["compact", "suv"]],
  ["subaru", "exiga", "エクシーガ", ["エクシーガ", "エクシーガクロスオーバー7"], [], "standard", ["minivan", "station-wagon", "suv"]],
  ["subaru", "brz", "BRZ", ["BRZ"], ["スバルBRZ"], "standard", ["sporty"]],
  ["subaru", "justy", "ジャスティ", ["ジャスティ"], [], "standard", ["compact", "minivan"]],
  ["subaru", "stella", "ステラ", ["ステラ", "ステラカスタム"], [], "kei", ["standard"]],
  ["subaru", "chiffon", "シフォン", ["シフォン", "シフォンカスタム"], [], "kei", ["slide-door"]],
  ["subaru", "pleo", "プレオ", ["プレオ", "プレオプラス"], [], "kei", ["standard"]],
  ["subaru", "sambar-van", "サンバーバン", ["サンバーバン", "サンバーディアス"], [], "kei", ["slide-door"]],
  ["subaru", "sambar-truck", "サンバートラック", ["サンバートラック"], [], "kei", ["truck"]],

  // スズキ
  ["suzuki", "swift", "スイフト", ["スイフト", "スイフトハイブリッド"], [], "standard", ["compact", "sporty"]],
  ["suzuki", "swift-sport", "スイフトスポーツ", ["スイフトスポーツ"], [], "standard", ["compact", "sporty"]],
  ["suzuki", "solio", "ソリオ", ["ソリオ", "ソリオハイブリッド", "ソリオバンディット"], [], "standard", ["compact", "minivan"]],
  ["suzuki", "ignis", "イグニス", ["イグニス"], [], "standard", ["compact", "suv"]],
    ["suzuki", "xbee", "クロスビー", ["クロスビー"], ["XBEE"], "standard", ["compact", "suv"]],
  ["suzuki", "escudo", "エスクード", ["エスクード"], [], "standard", ["suv"]],
  ["suzuki", "jimny-sierra", "ジムニーシエラ", ["ジムニーシエラ"], [], "standard", ["suv"]],
  ["suzuki", "jimny-nomade", "ジムニーノマド", ["ジムニーノマド"], [], "standard", ["suv"]],
  ["suzuki", "landy", "ランディ", ["ランディ"], [], "standard", ["minivan"]],
  ["suzuki", "wagon-r", "ワゴンR", ["ワゴンR", "ワゴンRスティングレー"], ["ワゴンアール"], "kei", ["standard"]],
  ["suzuki", "wagon-r-smile", "ワゴンRスマイル", ["ワゴンRスマイル"], [], "kei", ["slide-door"]],
  ["suzuki", "spacia", "スペーシア", ["スペーシア", "スペーシアカスタム", "スペーシアギア"], [], "kei", ["slide-door"]],
  ["suzuki", "hustler", "ハスラー", ["ハスラー"], [], "kei", ["standard", "suv"]],
  ["suzuki", "alto", "アルト", ["アルト", "アルトワークス"], [], "kei", ["standard", "sporty"]],
  ["suzuki", "lapin", "アルトラパン", ["アルトラパン", "ラパン"], [], "kei", ["standard"]],
  ["suzuki", "every-wagon", "エブリイワゴン", ["エブリイワゴン"], [], "kei", ["slide-door"]],
  ["suzuki", "every-van", "エブリイ", ["エブリイ", "エブリイバン"], [], "kei", ["slide-door"]],
  ["suzuki", "carry", "キャリイ", ["キャリイ", "スーパーキャリイ"], [], "kei", ["truck"]],
  ["suzuki", "jimny", "ジムニー", ["ジムニー"], [], "kei", ["suv"]],

  // ダイハツ
  ["daihatsu", "thor", "トール", ["トール", "トールカスタム"], [], "standard", ["compact", "minivan"]],
  ["daihatsu", "rocky", "ロッキー", ["ロッキー", "ロッキーハイブリッド"], [], "standard", ["compact", "suv"]],
  ["daihatsu", "boon", "ブーン", ["ブーン"], [], "standard", ["compact"]],
  ["daihatsu", "cast", "キャスト", ["キャスト", "キャストスタイル", "キャストアクティバ", "キャストスポーツ"], [], "kei", ["standard", "suv", "sporty"]],
  ["daihatsu", "move", "ムーヴ", ["ムーヴ", "ムーヴカスタム"], [], "kei", ["standard", "sporty"]],
  ["daihatsu", "move-canvas", "ムーヴキャンバス", ["ムーヴキャンバス"], [], "kei", ["slide-door"]],
  ["daihatsu", "tanto", "タント", ["タント", "タントカスタム", "タントファンクロス"], [], "kei", ["slide-door"]],
  ["daihatsu", "wake", "ウェイク", ["ウェイク"], [], "kei", ["slide-door"]],
  ["daihatsu", "mira", "ミラ", ["ミラ", "ミラカスタム"], [], "kei", ["standard"]],
  ["daihatsu", "mira-es", "ミライース", ["ミライース"], [], "kei", ["standard"]],
  ["daihatsu", "mira-cocoa", "ミラココア", ["ミラココア"], [], "kei", ["standard"]],
  ["daihatsu", "taft", "タフト", ["タフト"], [], "kei", ["suv"]],
  ["daihatsu", "copen", "コペン", ["コペン"], [], "kei", ["sporty"]],
  ["daihatsu", "atrai", "アトレー", ["アトレー", "アトレーワゴン"], [], "kei", ["slide-door"]],
  ["daihatsu", "hijet-cargo", "ハイゼットカーゴ", ["ハイゼットカーゴ"], [], "kei", ["slide-door"]],
  ["daihatsu", "hijet-truck", "ハイゼットトラック", ["ハイゼットトラック"], [], "kei", ["truck"]],

  // 三菱
  ["mitsubishi", "delica-d5", "デリカD:5", ["デリカD:5"], ["デリカD5"], "standard", ["minivan", "suv"]],
  ["mitsubishi", "delica-d2", "デリカD:2", ["デリカD:2", "デリカD:2ハイブリッド"], ["デリカD2"], "standard", ["compact", "minivan"]],
  ["mitsubishi", "outlander", "アウトランダー", ["アウトランダー", "アウトランダーPHEV"], [], "standard", ["suv"]],
  ["mitsubishi", "eclipse-cross", "エクリプスクロス", ["エクリプスクロス", "エクリプスクロスPHEV"], [], "standard", ["suv"]],
  ["mitsubishi", "rvr", "RVR", ["RVR"], [], "standard", ["compact", "suv"]],
  ["mitsubishi", "pajero", "パジェロ", ["パジェロ"], [], "standard", ["suv"]],
  ["mitsubishi", "pajero-mini", "パジェロミニ", ["パジェロミニ"], ["PAJERO MINI"], "kei", ["suv"]],
  ["mitsubishi", "mirage", "ミラージュ", ["ミラージュ"], [], "standard", ["compact"]],
  ["mitsubishi", "delica-mini", "デリカミニ", ["デリカミニ"], ["DELICA MINI"], "kei", ["slide-door", "suv"]],
  ["mitsubishi", "ek-wagon", "eKワゴン", ["eKワゴン"], ["EKワゴン"], "kei", ["standard"]],
  ["mitsubishi", "ek-space", "eKスペース", ["eKスペース", "eKスペースカスタム"], ["EKスペース"], "kei", ["slide-door"]],
  ["mitsubishi", "ek-cross", "eKクロス", ["eKクロス"], ["EKクロス"], "kei", ["standard", "suv"]],
  ["mitsubishi", "ek-cross-space", "eKクロススペース", ["eKクロススペース"], ["EKクロススペース"], "kei", ["slide-door", "suv"]],
  ["mitsubishi", "minicab-van", "ミニキャブバン", ["ミニキャブバン"], ["MINICAB VAN"], "kei", ["slide-door"]],
  ["mitsubishi", "minicab-truck", "ミニキャブトラック", ["ミニキャブトラック"], ["MINICAB TRUCK"], "kei", ["truck"]],

  // 三菱ふそう
  ["mitsubishi-fuso", "canter", "キャンター", ["キャンター"], [], "standard", ["van-truck"]],

  // いすゞ・日野
  ["isuzu", "elf", "エルフ", ["エルフ"], [], "standard", ["van-truck"]],
  ["isuzu", "forward", "フォワード", ["フォワード"], [], "standard", ["van-truck"]],
  ["isuzu", "giga", "ギガ", ["ギガ"], [], "standard", ["van-truck"]],
  ["hino", "dutro", "デュトロ", ["デュトロ"], [], "standard", ["van-truck"]],
  ["hino", "ranger", "レンジャー", ["レンジャー"], [], "standard", ["van-truck"]],
  ["hino", "profia", "プロフィア", ["プロフィア"], [], "standard", ["van-truck"]],
];

function defineDomesticModels(rows) {
  return Object.freeze(
    rows.map(
      ([
        makerKey,
        modelKey,
        modelName,
        modelNames,
        aliases,
        vehicleClass,
        types,
      ]) =>
        Object.freeze({
          key: `${makerKey}:${modelKey}`,
          makerKey,
          modelKey,
          modelName,
          modelNames: Object.freeze(
            Array.from(new Set([modelName, ...modelNames]))
          ),
          aliases: Object.freeze(
            Array.from(new Set([modelName, ...modelNames, ...aliases]))
          ),
          vehicleClass,
          types: Object.freeze(Array.from(new Set(types))),
        })
    )
  );
}

export const DOMESTIC_MODEL_DICTIONARY =
  defineDomesticModels(MODEL_ROWS);

function buildDomesticModelIndexes(dictionary) {
  const keyIndex = new Map();
  const makerIndex = new Map();
  const searchableAliases = new Map();
  const aliasOwnersByMaker = new Map();

  for (const model of dictionary) {
    if (!getMakerByKey(model.makerKey)) {
      throw new Error(
        `車種辞書のメーカーがメーカー辞書にありません: ${model.key}`
      );
    }

    if (keyIndex.has(model.key)) {
      throw new Error(`車種辞書のkeyが重複しています: ${model.key}`);
    }

    keyIndex.set(model.key, model);

    if (!makerIndex.has(model.makerKey)) {
      makerIndex.set(model.makerKey, []);
    }

    makerIndex.get(model.makerKey).push(model);

    const normalizedAliases = Array.from(
      new Set(model.aliases.map(normalizeDomesticModelText).filter(Boolean))
    );

    if (!aliasOwnersByMaker.has(model.makerKey)) {
      aliasOwnersByMaker.set(model.makerKey, new Map());
    }

    const aliasOwners = aliasOwnersByMaker.get(model.makerKey);

    for (const normalizedAlias of normalizedAliases) {
      const existingModel = aliasOwners.get(normalizedAlias);

      if (existingModel && existingModel.key !== model.key) {
        throw new Error(
          `同一メーカー内で車種の別名が衝突しています: ${normalizedAlias} / ${existingModel.key} / ${model.key}`
        );
      }

      aliasOwners.set(normalizedAlias, model);
    }

    searchableAliases.set(model.key, normalizedAliases);
  }

  for (const [makerKey, models] of makerIndex) {
    makerIndex.set(makerKey, Object.freeze([...models]));
  }

  return Object.freeze({
    keyIndex,
    makerIndex,
    searchableAliases,
  });
}

const DOMESTIC_MODEL_INDEXES =
  buildDomesticModelIndexes(DOMESTIC_MODEL_DICTIONARY);

function resolveMakerKey(makerInput) {
  if (!makerInput) return null;

  if (
    typeof makerInput === "object" &&
    typeof makerInput.key === "string"
  ) {
    return getMakerByKey(makerInput.key)?.key ?? null;
  }

  const rawValue = String(makerInput);
  const normalizedMakerInput = normalizeMakerText(rawValue);

  if (getMakerByKey(rawValue)) {
    return rawValue;
  }

  if (getMakerByKey(normalizedMakerInput)) {
    return normalizedMakerInput;
  }

  return resolveMaker(rawValue)?.key ?? null;
}

function matchPriority(matchType) {
  if (matchType === "exact") return 0;
  if (matchType === "prefix") return 1;
  return 2;
}

function keepHighestPriorityCandidates(candidates) {
  if (!candidates.length) {
    return [];
  }

  const highestPriority = Math.min(
    ...candidates.map((candidate) => matchPriority(candidate.matchType))
  );

  return candidates.filter(
    (candidate) => matchPriority(candidate.matchType) === highestPriority
  );
}

export function findDomesticModelCandidates(input, options = {}) {
  const normalizedInput = normalizeDomesticModelText(input);

  if (normalizedInput.length < 2) {
    return [];
  }

  const hasMakerFilter =
    options.makerKey !== undefined || options.maker !== undefined;
  const makerKey = resolveMakerKey(options.makerKey ?? options.maker);

  if (hasMakerFilter && !makerKey) {
    return [];
  }

  const sourceModels = makerKey
    ? DOMESTIC_MODEL_INDEXES.makerIndex.get(makerKey) || []
    : DOMESTIC_MODEL_DICTIONARY;

  return sourceModels
    .map((model) => {
      const aliases =
        DOMESTIC_MODEL_INDEXES.searchableAliases.get(model.key) || [];

      let matchType = null;
            for (const alias of aliases) {
        if (alias === normalizedInput) {
          matchType = "exact";
          break;
        }

        if (
          matchType !== "prefix" &&
          alias.startsWith(normalizedInput)
        ) {
          matchType = "prefix";
          continue;
        }

        if (!matchType && alias.includes(normalizedInput)) {
          matchType = "contains";
        }
      }

      return matchType
        ? Object.freeze({
            ...model,
            matchType,
          })
        : null;
    })
    .filter(Boolean)
    .sort((first, second) => {
      const priorityDifference =
        matchPriority(first.matchType) - matchPriority(second.matchType);

      if (priorityDifference !== 0) {
        return priorityDifference;
      }

      const firstNameLength =
        normalizeDomesticModelText(first.modelName).length;
      const secondNameLength =
        normalizeDomesticModelText(second.modelName).length;

      if (firstNameLength !== secondNameLength) {
        return firstNameLength - secondNameLength;
      }

      return first.key.localeCompare(second.key, "ja");
    });
}

export function resolveDomesticModel(input, options = {}) {
  const candidates = keepHighestPriorityCandidates(
    findDomesticModelCandidates(input, options)
  );

  return candidates.length === 1 ? candidates[0] : null;
}

export function resolveDomesticModelName(input, options = {}) {
  return resolveDomesticModel(input, options)?.modelName ?? null;
}

export function getDomesticModelByKey(key, modelKey) {
  const dictionaryKey =
    modelKey === undefined ? String(key ?? "") : `${key}:${modelKey}`;

  return DOMESTIC_MODEL_INDEXES.keyIndex.get(dictionaryKey) ?? null;
}

export function getDomesticModelsByMaker(makerInput) {
  const makerKey = resolveMakerKey(makerInput);

  if (!makerKey) {
    return [];
  }

  return DOMESTIC_MODEL_INDEXES.makerIndex.get(makerKey) || [];
}

export function findDomesticInventoryModelCandidates(vehicle) {
  const makerKey = resolveMaker(vehicle?.makerName)?.key;

  if (!makerKey) {
    return [];
  }

  const normalizedCarName = normalizeDomesticModelText(vehicle?.carName);

  if (!normalizedCarName) {
    return [];
  }

  const makerModels =
    DOMESTIC_MODEL_INDEXES.makerIndex.get(makerKey) || [];

  const exactModels = makerModels.filter((model) =>
    model.modelNames.some(
      (modelName) =>
        normalizeDomesticModelText(modelName) === normalizedCarName
    )
  );

  if (exactModels.length) {
    return exactModels;
  }

  const prefixMatches = makerModels
    .map((model) => {
      const matchedLength = Math.max(
        0,
        ...model.modelNames
          .map(normalizeDomesticModelText)
          .filter((modelName) => normalizedCarName.startsWith(modelName))
          .map((modelName) => modelName.length)
      );

      return matchedLength > 0 ? { model, matchedLength } : null;
    })
    .filter(Boolean);

  if (!prefixMatches.length) {
    return [];
  }

  const longestLength = Math.max(
    ...prefixMatches.map(({ matchedLength }) => matchedLength)
  );

  return prefixMatches
    .filter(({ matchedLength }) => matchedLength === longestLength)
    .map(({ model }) => model);
}

export function resolveDomesticInventoryModel(vehicle) {
  const candidates = findDomesticInventoryModelCandidates(vehicle);
  return candidates.length === 1 ? candidates[0] : null;
}

/**
 * 在庫検索は makerName と carName だけを対象にする。
 * 型式・車台番号・装備・説明文など、ほかの項目は検索しない。
 */
export function filterInventoryByMakerOrModelText(inventory, input) {
  if (!Array.isArray(inventory)) {
    return [];
  }

  const normalizedInput = normalizeDomesticModelText(input);
  const maker = resolveMaker(input);
  const modelCandidates = keepHighestPriorityCandidates(
    normalizedInput.length >= 2
      ? findDomesticModelCandidates(input)
      : []
  );
  const modelCandidateKeys = new Set(
    modelCandidates.map((model) => model.key)
  );
  const useRawCarNameFallback =
    !maker &&
    modelCandidateKeys.size === 0 &&
    normalizedInput.length >= 2;

  if (!maker && !modelCandidateKeys.size && !useRawCarNameFallback) {
    return [];
  }

  return inventory.filter((vehicle) => {
    const inventoryMaker = resolveMaker(vehicle?.makerName);
    const normalizedCarName = normalizeDomesticModelText(vehicle?.carName);

    if (maker && inventoryMaker?.key === maker.key) {
      return true;
    }

    if (modelCandidateKeys.size > 0) {
      return findDomesticInventoryModelCandidates(vehicle).some((model) =>
        modelCandidateKeys.has(model.key)
      );
    }

    return (
      useRawCarNameFallback &&
      normalizedCarName.includes(normalizedInput)
    );
  });
}

export function validateDomesticModelDictionary() {
  const vehicleClassCounts = {
    [VEHICLE_CLASSES.KEI]: 0,
    [VEHICLE_CLASSES.STANDARD]: 0,
  };

  const typeCounts = Object.fromEntries(
    Object.values(DOMESTIC_MODEL_TYPES).map((type) => [type, 0])
  );

  for (const model of DOMESTIC_MODEL_DICTIONARY) {
    if (!(model.vehicleClass in vehicleClassCounts)) {
      throw new Error(
        `車種辞書のvehicleClassが不正です: ${model.key}`
      );
    }

    if (!model.types.length) {
      throw new Error(`車種辞書のtypesが空です: ${model.key}`);
    }

    vehicleClassCounts[model.vehicleClass] += 1;

    for (const type of model.types) {
      if (!(type in typeCounts)) {
        throw new Error(`車種辞書のtypeが不正です: ${model.key} / ${type}`);
      }

      typeCounts[type] += 1;
    }
  }

  return Object.freeze({
    modelCount: DOMESTIC_MODEL_DICTIONARY.length,
    makerCount: DOMESTIC_MODEL_INDEXES.makerIndex.size,
    vehicleClassCounts: Object.freeze(vehicleClassCounts),
    typeCounts: Object.freeze(typeCounts),
  });
}
