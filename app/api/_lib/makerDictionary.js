function normalizeLatinDiacritics(value) {
  return Array.from(value)
    .map((character) => {
      if (!/\p{Script=Latin}/u.test(character)) {
        return character;
      }

      return character
        .normalize("NFD")
        .replace(/\p{M}/gu, "");
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

      if (codePoint === 0x309d) {
        return "ヽ";
      }

      if (codePoint === 0x309e) {
        return "ヾ";
      }

      return character;
    })
    .join("");
}

export function normalizeMakerText(value) {
  return toKatakana(
    normalizeLatinDiacritics(
      String(value ?? "").normalize("NFKC")
    )
  )
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[\p{Separator}\p{Punctuation}\p{Symbol}]/gu, "")
    .trim();
}

function defineMakers(rows) {
  return Object.freeze(
    rows.map(([key, makerName, aliases = []]) =>
      Object.freeze({
        key,
        makerName,
        aliases: Object.freeze(
          Array.from(new Set([makerName, ...aliases]))
        ),
      })
    )
  );
}

const MAKER_ROWS = [
  // 日本
  ["toyota", "トヨタ", ["TOYOTA", "トヨタ自動車", "豊田", "トヨダ", "トヨ夕"]],
  ["lexus", "レクサス", ["LEXUS", "レクセス", "レクサズ", "LEXAS"]],
  ["nissan", "日産", ["NISSAN", "ニッサン", "日産自動車", "ニサン", "ニッサソ"]],
  ["infiniti", "インフィニティ", ["INFINITI", "INFINITY", "インフィニティー"]],
  ["datsun", "ダットサン", ["DATSUN", "ダットソン", "ダッツン"]],
  ["prince", "プリンス", ["PRINCE", "プリンス自動車"]],
  ["honda", "ホンダ", ["HONDA", "本田", "本田技研", "本田技研工業", "ホンタ"]],
  ["acura", "アキュラ", ["ACURA", "AKURA", "アキューラ"]],
  ["mazda", "マツダ", ["MAZDA", "マズダ", "松田", "MATSUDA", "MASDA"]],
  ["eunos", "ユーノス", ["EUNOS", "ユノス", "ユーノース"]],
  ["autozam", "オートザム", ["AUTOZAM", "オートサム"]],
  ["efini", "アンフィニ", ["EFINI", "ẼFINI", "エフィニ", "アンフィニー"]],
  ["subaru", "スバル", ["SUBARU", "富士重工", "富士重工業", "スバル自動車", "スバルー"]],
  ["suzuki", "スズキ", ["SUZUKI", "鈴木", "スヅキ", "ススキ"]],
  ["daihatsu", "ダイハツ", ["DAIHATSU", "ダイハツ工業", "ダイハッツ", "ダイハツー"]],
  ["mitsubishi", "三菱", ["MITSUBISHI", "三菱自動車", "三菱自動車工業", "ミツビシ", "ミツビシ自動車"]],
  ["mitsubishi-fuso", "三菱ふそう", ["MITSUBISHI FUSO", "MITSUBISHIFUSO", "FUSO", "フソウ", "ふそう", "三菱フソウ", "三菱扶桑"]],
  ["isuzu", "いすゞ", ["ISUZU", "いすず", "イスズ", "イスヾ", "いすゞ自動車", "いすず自動車"]],
  ["hino", "日野", ["HINO", "日野自動車", "ヒノ"]],
  ["ud-trucks", "UDトラックス", ["UD TRUCKS", "UDTRUCKS", "UD", "ユーディートラックス", "ＵＤトラックス"]],
  ["nissan-diesel", "日産ディーゼル", ["NISSAN DIESEL", "NISSANDIESEL", "ニッサンディーゼル", "日産ディゼル"]],
  ["mitsuoka", "光岡自動車", ["MITSUOKA", "光岡", "ミツオカ", "ミツオカ自動車"]],
  ["tommykaira", "トミーカイラ", ["TOMMYKAIRA", "TOMMY KAIRA", "トミカイラ"]],
  ["zero-sports", "ゼロスポーツ", ["ZERO SPORTS", "ZEROSPORTS"]],
  ["glm", "GLM", ["ジーエルエム", "GREEN LORD MOTORS", "グリーンロードモータース"]],
  ["asl", "ASL", ["エーエスエル", "AUTOBACS SPORTS CAR LABORATORY"]],
  ["dome", "童夢", ["DOME", "ドーム"]],
  ["ohta", "オオタ", ["OHTA", "太田自動車", "オータ"]],
  ["cony", "コニー", ["CONY", "コニイ", "愛知機械"]],
  ["fomm", "FOMM", ["フォム", "FOMM ONE"]],
  ["hw-electro", "HW ELECTRO", ["HWエレクトロ", "HWELECTRO", "エイチダブリューエレクトロ"]],
  ["folofly", "フォロフライ", ["FOLOFLY", "フォローフライ"]],
  ["asf", "ASF", ["エーエスエフ", "ASF株式会社"]],

  // ドイツ
  ["mercedes-benz", "メルセデス・ベンツ", ["MERCEDES-BENZ", "MERCEDES BENZ", "MERCEDESBENZ", "MERCEDES", "BENZ", "メルセデスベンツ", "メルセデス", "ベンツ", "メルセデスAMG", "MERCEDES AMG", "MERCEDES-AMG", "AMG", "メルセデスマイバッハ", "MERCEDES MAYBACH", "MERCEDES-MAYBACH"]],
  ["maybach", "マイバッハ", ["MAYBACH", "マイバッハー"]],
  ["smart", "スマート", ["SMART", "SMART AUTOMOBILE", "スマート車"]],
  ["bmw", "BMW", ["ビーエムダブリュー", "ビーエムダブル", "ビーエム", "B M W", "BWM", "BMV"]],
  ["bmw-alpina", "BMWアルピナ", ["BMW ALPINA", "BMWALPINA", "ALPINA", "アルピナ", "ビーエムダブリューアルピナ"]],
  ["mini", "MINI", ["ミニ", "BMW MINI", "BMWMINI", "ビーエムダブリューミニ"]],
  ["audi", "アウディ", ["AUDI", "AUDY", "AUID", "アウデイ", "アウデイー", "アウディー"]],
  ["volkswagen", "フォルクスワーゲン", ["VOLKSWAGEN", "VOLKS WAGEN", "VW", "V W", "ワーゲン", "フォルクスワーゲン車", "フォルクスワーケン", "VOLKSWAGON"]],
  ["porsche", "ポルシェ", ["PORSCHE", "PORSHE", "PORCHE", "ポルシエ", "ポルシェー"]],
  ["opel", "オペル", ["OPEL", "オーペル"]],
  ["ruf", "ルーフ", ["RUF", "RUF AUTOMOBILE", "ルフ"]],
  ["brabus", "ブラバス", ["BRABUS", "ブラーブス"]],
  ["carlsson", "カールソン", ["CARLSSON", "カールスン"]],
  ["artega", "アルテガ", ["ARTEGA", "アルティガ"]],
  ["apollo", "アポロ", ["APOLLO AUTOMOBIL", "APOLLO", "GUMPERT", "グンペルト"]],
  ["wiesmann", "ヴィーズマン", ["WIESMANN", "ウィーズマン", "ビーズマン"]],
  ["isdera", "イスデラ", ["ISDERA", "イズデラ"]],
  ["bitter", "ビッター", ["BITTER", "ERICH BITTER"]],
  ["borgward", "ボルクヴァルト", ["BORGWARD", "ボルグワルド", "ボルクワルト"]],
  ["nsu", "NSU", ["エヌエスユー"]],
  ["dkw", "DKW", ["ディーケーダブリュー"]],
  ["trabant", "トラバント", ["TRABANT"]],
  ["wartburg", "ヴァルトブルク", ["WARTBURG", "ワルトブルグ", "ヴァルトブルグ"]],
  ["melkus", "メルクス", ["MELKUS"]],
  ["messerschmitt", "メッサーシュミット", ["MESSERSCHMITT"]],
  ["glas", "グラース", ["GLAS", "GLAS AUTOMOBILE", "グラス"]],
  ["lloyd", "ロイト", ["LLOYD", "LLOYD MOTOR", "ロイド"]],
  ["goggomobil", "ゴッゴモビル", ["GOGGOMOBIL", "ゴゴモビル"]],
  ["man", "MAN", ["マン", "MAN TRUCK", "MAN TRUCK & BUS"]],
  ["setra", "セトラ", ["SETRA", "セトラバス"]],
  ["neoplan", "ネオプラン", ["NEOPLAN", "ネオプランバス"]],
  ["hymer", "ハイマー", ["HYMER", "ハイマーキャンピングカー"]],
  ["burstner", "バーストナー", ["BÜRSTNER", "BURSTNER", "ビュルストナー"]],
  ["knaus", "クナウス", ["KNAUS"]],
  ["dethleffs", "デスレフ", ["DETHLEFFS", "デスレフス"]],
  ["lmc", "LMC", ["エルエムシー", "LMC CARAVAN"]],

  // アメリカ
  ["cadillac", "キャデラック", ["CADILLAC", "CADILAC", "キャデラク"]],
  ["chevrolet", "シボレー", ["CHEVROLET", "CHEVY", "シェビー", "シェビイ", "シボレ", "CHEVROLE"]],
  ["buick", "ビュイック", ["BUICK", "ビュイツク"]],
  ["pontiac", "ポンテアック", ["PONTIAC", "ポンティアック", "ポンテイアック"]],
  ["saturn", "サターン", ["SATURN"]],
  ["hummer", "ハマー", ["HUMMER", "ハンマー"]],
  ["gmc", "GMC", ["ジーエムシー", "G M C"]],
  ["geo", "ジオ", ["GEO"]],
  ["ford", "フォード", ["FORD", "フォードモーター", "フォド"]],
  ["lincoln", "リンカーン", ["LINCOLN", "リンコン", "リンカン"]],
  ["mercury", "マーキュリー", ["MERCURY", "マーキュリ"]],
  ["saleen", "サリーン", ["SALEEN"]],
  ["shelby", "シェルビー", ["SHELBY", "キャロルシェルビー"]],
  ["panoz", "パノス", ["PANOZ", "パノズ"]],
  ["chrysler", "クライスラー", ["CHRYSLER", "CRYSLER", "クライスラ"]],
  ["dodge", "ダッジ", ["DODGE", "ダッヂ", "ドッジ"]],
  ["ram", "ラム", ["RAM", "RAM TRUCKS", "ラムトラック"]],
  ["eagle", "イーグル", ["EAGLE"]],
  ["plymouth", "プリムス", ["PLYMOUTH", "プリマス"]],
  ["amc", "AMC", ["AMERICAN MOTORS", "アメリカンモーターズ", "エーエムシー"]],
  ["jeep", "ジープ", ["JEEP", "AMC JEEP", "AMCジープ", "GEEP"]],
  ["oldsmobile", "オールズモビル", ["OLDSMOBILE", "オルズモビル"]],
  ["tesla", "テスラ", ["TESLA", "TESLA MOTORS", "テスラモーターズ"]],
  ["fisker", "フィスカー", ["FISKER", "FISKER AUTOMOTIVE"]],
  ["karma", "カルマ", ["KARMA", "KARMA AUTOMOTIVE", "カルマオートモーティブ"]],
  ["rivian", "リヴィアン", ["RIVIAN", "リビアン"]],
  ["lucid", "ルーシッド", ["LUCID", "LUCID MOTORS", "ルシッド"]],
  ["delorean", "デロリアン", ["DELOREAN", "DMC", "デロリアンモーター"]],
  ["vector", "ベクター", ["VECTOR", "VECTOR MOTORS"]],
  ["ssc", "SSC", ["SSC NORTH AMERICA", "シェルビースーパーカーズ"]],
  ["hennessey", "ヘネシー", ["HENNESSEY", "HENNESSEY PERFORMANCE"]],
  ["rezvani", "レズヴァニ", ["REZVANI", "レズバニ"]],
  ["czinger", "ツィンガー", ["CZINGER", "ジンガー"]],
  ["bollinger", "ボリンジャー", ["BOLLINGER", "BOLLINGER MOTORS"]],
  ["faraday-future", "ファラデー・フューチャー", ["FARADAY FUTURE", "FARADAYFUTURE", "ファラデーフューチャー", "FF"]],
  ["canoo", "カヌー", ["CANOO", "カノー"]],
  ["scion", "サイオン", ["SCION", "米国サイオン"]],
  ["packard", "パッカード", ["PACKARD"]],
  ["studebaker", "スチュードベーカー", ["STUDEBAKER", "ステュードベーカー"]],
  ["nash", "ナッシュ", ["NASH"]],
  ["hudson", "ハドソン", ["HUDSON"]],
  ["tucker", "タッカー", ["TUCKER"]],
  ["duesenberg", "デューセンバーグ", ["DUESENBERG", "デューゼンバーグ"]],
  ["cord", "コード", ["CORD"]],
  ["auburn", "オーバーン", ["AUBURN", "オーバン"]],
  ["kaiser", "カイザー", ["KAISER", "KAISER-FRAZER", "カイザーフレーザー"]],
  ["willys", "ウィリス", ["WILLYS", "ウイリス"]],
  ["avanti", "アバンティ", ["AVANTI", "AVANTI MOTORS"]],
  ["winnebago", "ウィネベーゴ", ["WINNEBAGO", "ウィネバゴ"]],
  ["starcraft", "スタークラフト", ["STARCRAFT"]],
  ["airstream", "エアストリーム", ["AIRSTREAM", "エアーストリーム"]],
  ["workhorse", "ワークホース", ["WORKHORSE", "WORKHORSE CUSTOM CHASSIS"]],

  // イギリス
  ["rolls-royce", "ロールス・ロイス", ["ROLLS-ROYCE", "ROLLS ROYCE", "ROLLSROYCE", "ロールスロイス"]],
  ["bentley", "ベントレー", ["BENTLEY", "ベントリ"]],
  ["jaguar", "ジャガー", ["JAGUAR", "ジャグアー"]],
  ["daimler", "デイムラー", ["DAIMLER", "ダイムラー"]],
  ["land-rover", "ランドローバー", ["LAND ROVER", "LANDROVER", "ランド・ローバー", "ランドローバ", "RANGE ROVER", "RANGEROVER", "レンジローバー", "レンジローバ"]],
  ["aston-martin", "アストンマーティン", ["ASTON MARTIN", "ASTONMARTIN", "アストン・マーティン", "アストンマーチン"]],
  ["lotus", "ロータス", ["LOTUS", "ロータスカーズ"]],
  ["mclaren", "マクラーレン", ["MCLAREN", "MC LAREN", "マクラレン"]],
  ["tvr", "TVR", ["ティーブイアール", "T V R"]],
  ["mg", "MG", ["エムジー", "M.G."]],
  ["rover", "ローバー", ["ROVER", "ローヴァー"]],
  ["austin", "オースチン", ["AUSTIN", "オースティン"]],
  ["morris", "モーリス", ["MORRIS", "モリス"]],
  ["british-leyland", "ブリティッシュ・レイランド", ["BRITISH LEYLAND", "BL", "ブリティッシュレイランド"]],
  ["moke", "モーク", ["MOKE", "MINI MOKE", "ミニモーク"]],
  ["marcos", "マーコス", ["MARCOS", "マルコス"]],
  ["vanden-plas", "バンデンプラ", ["VANDEN PLAS", "VANDENPLAS", "ヴァンデンプラ"]],
  ["wolseley", "ウーズレー", ["WOLSELEY", "ウーズレイ"]],
  ["riley", "ライレー", ["RILEY", "ライリー"]],
  ["caterham", "ケータハム", ["CATERHAM", "ケータラム"]],
  ["westfield", "ウエストフィールド", ["WESTFIELD", "ウェストフィールド"]],
  ["morgan", "モーガン", ["MORGAN", "モルガン"]],
  ["panther", "パンサー", ["PANTHER"]],
  ["triumph", "トライアンフ", ["TRIUMPH", "トライアンプ"]],
  ["healey", "ヒーレー", ["HEALEY", "AUSTIN-HEALEY", "AUSTIN HEALEY", "オースチンヒーレー"]],
  ["carbodies", "カーボディーズ", ["CARBODIES", "カーボディ"]],
  ["lti", "ロンドンタクシー", ["LONDON TAXI", "LTI", "LONDON TAXIS INTERNATIONAL"]],
  ["reliant", "リライアント", ["RELIANT"]],
  ["ginetta", "ジネッタ", ["GINETTA"]],
  ["ariel", "アリエル", ["ARIEL", "ARIEL MOTOR COMPANY"]],
  ["radical", "ラディカル", ["RADICAL", "RADICAL SPORTSCARS"]],
  ["vauxhall", "ボクスホール", ["VAUXHALL", "ボクソール"]],
  ["noble", "ノーブル", ["NOBLE", "NOBLE AUTOMOTIVE"]],
  ["bac", "BAC", ["BRIGGS AUTOMOTIVE COMPANY", "ビーエーシー"]],
  ["caparo", "カパロ", ["CAPARO", "CAPARO VEHICLE TECHNOLOGIES"]],
  ["ascari", "アスカリ", ["ASCARI", "アスカリカーズ"]],
  ["invicta", "インヴィクタ", ["INVICTA", "インビクタ"]],
  ["jensen", "ジェンセン", ["JENSEN", "ジェンセンモーターズ"]],
  ["bristol", "ブリストル", ["BRISTOL", "BRISTOL CARS"]],
  ["sunbeam", "サンビーム", ["SUNBEAM"]],
  ["hillman", "ヒルマン", ["HILLMAN"]],
  ["ac-cars", "ACカーズ", ["AC CARS", "ACCARS", "エーシーカーズ"]],
  ["allard", "アラード", ["ALLARD"]],
  ["lagonda", "ラゴンダ", ["LAGONDA"]],
  ["gordon-murray", "ゴードン・マレー", ["GORDON MURRAY AUTOMOTIVE", "GMA", "ゴードンマレー"]],
  ["ineos", "イネオス", ["INEOS", "INEOS AUTOMOTIVE", "イネオスオートモーティブ"]],

  // イタリア
  ["fiat", "フィアット", ["FIAT", "フィアト"]],
  ["abarth", "アバルト", ["ABARTH", "アバース"]],
  ["alfa-romeo", "アルファロメオ", ["ALFA ROMEO", "ALFAROMEO", "アルファ ロメオ", "アルファ・ロメオ"]],
  ["ferrari", "フェラーリ", ["FERRARI", "フェラリ"]],
  ["lamborghini", "ランボルギーニ", ["LAMBORGHINI", "LAMBORGINI", "ランボルギニ"]],
  ["maserati", "マセラティ", ["MASERATI", "マゼラティ", "マセラテイ"]],
  ["lancia", "ランチア", ["LANCIA", "ランチャ"]],
  ["bertone", "ベルトーネ", ["BERTONE"]],
  ["autobianchi", "アウトビアンキ", ["AUTOBIANCHI", "オートビアンキ"]],
  ["innocenti", "イノチェンティ", ["INNOCENTI", "イノセンティ"]],
  ["de-tomaso", "デ・トマソ", ["DE TOMASO", "DETOMASO", "デトマソ"]],
  ["pagani", "パガーニ", ["PAGANI", "パガニ"]],
  ["pininfarina", "ピニンファリーナ", ["PININFARINA", "ピニンファリナ"]],
  ["italdesign", "イタルデザイン", ["ITALDESIGN", "ITAL DESIGN", "イタルデザインジウジアーロ"]],
  ["iso", "イソ", ["ISO RIVOLTA", "ISO", "イソリヴォルタ"]],
  ["bizzarrini", "ビッザリーニ", ["BIZZARRINI", "ビザリーニ"]],
  ["cisitalia", "チシタリア", ["CISITALIA", "シシタリア"]],
  ["cizeta", "チゼータ", ["CIZETA", "CIZETA-MORODER", "チゼータモロダー"]],
  ["dallara", "ダラーラ", ["DALLARA", "ダララ"]],
  ["mazzanti", "マッツァンティ", ["MAZZANTI", "マザンティ"]],
  ["fornasari", "フォルナサリ", ["FORNASARI", "フォルナザーリ"]],
  ["dr-automobiles", "DRオートモビルズ", ["DR AUTOMOBILES", "DR MOTOR", "DR"]],
  ["iveco", "イヴェコ", ["IVECO", "イベコ"]],
  ["om", "OM", ["OFFICINE MECCANICHE", "オーエム"]],
  ["piaggio", "ピアッジオ", ["PIAGGIO", "ピアジオ"]],

  // フランス
  ["peugeot", "プジョー", ["PEUGEOT", "プジョ"]],
  ["renault", "ルノー", ["RENAULT", "ルノ"]],
  ["citroen", "シトロエン", ["CITROËN", "CITROEN", "シトローエン"]],
  ["ds-automobiles", "DSオートモビル", ["DS AUTOMOBILES", "DS", "DSオートモビルズ"]],
  ["alpine", "アルピーヌ", ["ALPINE", "ALPINE CARS", "アルパイン"]],
  ["bugatti", "ブガッティ", ["BUGATTI", "ブガティ"]],
  ["venturi", "ヴェンチュリー", ["VENTURI", "ベンチュリー"]],
  ["matra", "マトラ", ["MATRA", "マートラ"]],
  ["simca", "シムカ", ["SIMCA"]],
  ["talbot", "タルボ", ["TALBOT"]],
  ["panhard", "パナール", ["PANHARD"]],
  ["delage", "ドラージュ", ["DELAGE", "デラージュ"]],
  ["delahaye", "ドライエ", ["DELAHAYE", "ドラエ"]],
  ["facel-vega", "ファセル・ヴェガ", ["FACEL VEGA", "FACELVEGA", "ファセルベガ"]],
  ["ligier", "リジェ", ["LIGIER", "リジエ"]],
  ["microcar", "マイクロカー", ["MICROCAR"]],
  ["aixam", "エクザム", ["AIXAM", "アイグザム"]],
  ["pgo", "PGO", ["ピー・ジー・オー", "PGO AUTOMOBILES"]],
  ["mvs", "MVS", ["MVS VENTURI", "エムブイエス"]],
  ["voisin", "ヴォワザン", ["VOISIN", "AVIONS VOISIN", "ボアザン"]],
  ["de-dion-bouton", "ド・ディオン・ブートン", ["DE DION-BOUTON", "DE DION BOUTON"]],

  // 韓国
  ["hyundai", "ヒョンデ", ["HYUNDAI", "ヒュンダイ", "ヒュンデ", "現代", "ヒョンデモーター"]],
  ["genesis", "ジェネシス", ["GENESIS", "GENESIS MOTORS", "ジェネシスモーター"]],
  ["kia", "起亜", ["KIA", "キア", "起亞", "KAI"]],
  ["daewoo", "大宇", ["DAEWOO", "デーウ", "デウ"]],
  ["gm-daewoo", "GMデーウ", ["GM DAEWOO", "GMデウ"]],
  ["ssangyong", "サンヨン", ["SSANGYONG", "雙龍", "双龍", "サンヨン自動車", "サンヤン"]],
  ["kg-mobility", "KGM", ["KG MOBILITY", "KGM", "ケージーモビリティ"]],
  ["renault-korea", "ルノーコリア", ["RENAULT KOREA", "RENAULT SAMSUNG", "ルノーサムスン"]],
  ["ct-and-t", "CT&T", ["CT&T", "CT AND T", "シーティーアンドティー"]],
  ["proto-motors", "プロトモータース", ["PROTO MOTORS", "PROTO"]],

  // 中国
  ["byd", "BYD", ["比亜迪", "ビーワイディー", "B Y D", "BDY"]],
  ["nio", "NIO", ["蔚来", "ニーオ", "ニオ", "NOI"]],
  ["xpeng", "XPENG", ["X PENG", "XIAOPENG", "小鵬", "シャオペン"]],
  ["li-auto", "理想汽車", ["LI AUTO", "LIAUTO", "LIXIANG", "理想", "リ・オート"]],
  ["zeekr", "ZEEKR", ["極氪", "ジーカー", "ジークル"]],
  ["geely", "吉利汽車", ["GEELY", "吉利", "ジーリー"]],
  ["lynk-and-co", "Lynk & Co", ["LYNK & CO", "LYNK AND CO", "LYNKANDCO", "リンクアンドコー"]],
  ["great-wall", "長城汽車", ["GREAT WALL", "GREATWALL", "GWM", "長城", "グレートウォール"]],
  ["haval", "ハヴァル", ["HAVAL", "ハバル"]],
  ["ora", "ORA", ["GWM ORA", "欧拉", "オラEV"]],
  ["tank", "TANK", ["GWM TANK", "長城TANK", "坦克ブランド"]],
  ["wey", "WEY", ["GWM WEY", "魏牌", "ウェイブランド"]],
  ["chery", "奇瑞汽車", ["CHERY", "奇瑞", "チェリー"]],
  ["exeed", "EXEED", ["星途", "エクシード"]],
  ["omoda", "OMODA", ["オモダ", "欧萌达"]],
  ["jaecoo", "JAECOO", ["ジェイクー"]],
  ["jetour", "JETOUR", ["捷途", "ジェトゥール"]],
  ["hongqi", "紅旗", ["HONGQI", "ホンチー", "紅旗汽車"]],
  ["faw", "第一汽車", ["FAW", "FIRST AUTOMOBILE WORKS", "中国一汽"]],
  ["bestune", "BESTUNE", ["奔騰", "ベスターン", "BESTURN"]],
  ["dongfeng", "東風汽車", ["DONGFENG", "東風", "ドンフェン"]],
  ["voyah", "VOYAH", ["嵐図", "ヴォヤー"]],
  ["m-hero", "猛士", ["MHERO", "M-HERO", "M HERO", "モンシー"]],
  ["saic", "上海汽車", ["SAIC", "SAIC MOTOR", "上汽"]],
  ["maxus", "MAXUS", ["大通", "マクサス", "LDV"]],
  ["roewe", "ROEWE", ["栄威", "ロエベ"]],
  ["wuling", "五菱", ["WULING", "ウーリン"]],
  ["baojun", "宝駿", ["BAOJUN", "バオジュン"]],
  ["gac", "広汽", ["GAC", "GAC MOTOR", "広州汽車"]],
  ["aion", "AION", ["埃安", "アイオン"]],
  ["hyptec", "HYPTEC", ["昊鉑", "ハイプテック"]],
  ["changan", "長安汽車", ["CHANGAN", "長安", "チャンアン"]],
  ["deepal", "DEEPAL", ["深藍", "ディーパル"]],
  ["avatr", "AVATR", ["阿維塔", "アバター"]],
  ["baic", "北京汽車", ["BAIC", "BEIJING AUTO", "北汽"]],
  ["arcfox", "ARCFOX", ["極狐", "アークフォックス"]],
  ["beijing", "BEIJING", ["北京汽車ブランド", "ベイジン"]],
  ["jac", "JAC", ["江淮", "JAC MOTORS", "ジェイエーシー"]],
  ["leapmotor", "LEAPMOTOR", ["零跑", "リープモーター"]],
  ["seres", "SERES", ["賽力斯", "セレス"]],
  ["aito", "AITO", ["問界", "アイト"]],
  ["denza", "DENZA", ["騰勢", "デンザ"]],
  ["yangwang", "YANGWANG", ["仰望", "ヤンワン"]],
  ["fangchengbao", "FANGCHENGBAO", ["方程豹", "ファンチェンバオ"]],
  ["neta", "NETA", ["哪吒", "ネタEV"]],
  ["aiways", "AIWAYS", ["愛馳", "アイウェイズ"]],
  ["weltmeister", "WELTMEISTER", ["WM MOTOR", "威馬", "ウェルトマイスター"]],
  ["hiphi", "HiPhi", ["HI PHI", "HUMAN HORIZONS", "高合", "ハイファイ"]],
  ["skyworth", "SKYWORTH", ["創維", "スカイワース"]],
  ["enovate", "ENOVATE", ["天際", "エノベート"]],
  ["zotye", "衆泰", ["ZOTYE", "ゾタイ"]],
  ["lifan", "力帆", ["LIFAN", "リーファン"]],
  ["brilliance", "華晨", ["BRILLIANCE", "ファチェン"]],
  ["haima", "海馬汽車", ["HAIMA", "ハイマ"]],
  ["soueast", "東南汽車", ["SOUEAST", "サウイースト"]],
  ["foton", "福田汽車", ["FOTON", "フォトン"]],
  ["jmc", "JMC", ["JIANGLING", "江鈴", "ジェイエムシー"]],

  // 北欧
  ["volvo", "ボルボ", ["VOLVO", "VOLVO CARS", "ヴォルヴォ"]],
  ["saab", "サーブ", ["SAAB", "サーブオートモービル"]],
  ["koenigsegg", "ケーニグセグ", ["KOENIGSEGG", "ケーニッグゼグ", "ケーニクセグ"]],
  ["scania", "スカニア", ["SCANIA", "スキャニア"]],
  ["zenvo", "ゼンヴォ", ["ZENVO", "ゼンボ"]],
  ["think", "THINK", ["TH!NK", "シンク"]],
  ["rimac", "リマック", ["RIMAC", "リマツ"]],
  ["polestar", "ポールスター", ["POLESTAR", "ポルスター"]],

  // その他ヨーロッパ
  ["ktm", "KTM", ["ケーティーエム", "K T M"]],
  ["steyr-puch", "シュタイア・プフ", ["STEYR-PUCH", "STEYR PUCH", "シュタイアプフ"]],
  ["magna-steyr", "マグナ・シュタイア", ["MAGNA STEYR", "マグナシュタイア"]],
  ["seat", "セアト", ["SEAT", "セアット"]],
  ["cupra", "クプラ", ["CUPRA", "キュプラ"]],
  ["hurtan", "フータン", ["HURTAN", "ウルタン"]],
  ["hispano-suiza", "イスパノ・スイザ", ["HISPANO SUIZA", "HISPANO-SUIZA", "ヒスパノスイザ"]],
  ["apal", "アパル", ["APAL", "アパール"]],
  ["gillet", "ジレ", ["GILLET", "ジレット"]],
  ["donkervoort", "ドンカーブート", ["DONKERVOORT", "ドンカーボート"]],
  ["spyker", "スパイカー", ["SPYKER", "スパイケル"]],
  ["daf", "DAF", ["ダフ", "DAF TRUCKS"]],
  ["skoda", "シュコダ", ["ŠKODA", "SKODA", "スコダ"]],
  ["tatra", "タトラ", ["TATRA"]],
  ["praga", "プラガ", ["PRAGA", "プラーガ"]],
  ["dacia", "ダチア", ["DACIA", "ダシア"]],
  ["adria", "アドリア", ["ADRIA", "ADRIA MOBIL", "アドリアモービル"]],
  ["lada", "ラーダ", ["LADA", "ラダ"]],
  ["uaz", "ワズ", ["UAZ", "ウアズ"]],
  ["gaz", "GAZ", ["ガズ", "GAZELLE"]],
  ["moskvich", "モスクヴィッチ", ["MOSKVICH", "モスクビッチ"]],
  ["aurus", "アウルス", ["AURUS", "オーラス"]],
  ["zaz", "ZAZ", ["ザズ", "ZAPORIZHZHIA"]],
  ["fso", "FSO", ["エフエスオー", "FABRYKA SAMOCHODOW OSOBOWYCH"]],
  ["zastava", "ザスタバ", ["ZASTAVA", "ザスタヴァ"]],
  ["togg", "トッグ", ["TOGG", "TURKIYENIN OTOMOBILI"]],
  ["monteverdi", "モンテヴェルディ", ["MONTEVERDI", "モンテベルディ"]],
  ["rinspeed", "リンスピード", ["RINSPEED"]],
  ["sbarro", "スバッロ", ["SBARRO", "スバロ"]],
  ["piech", "ピエヒ", ["PIËCH AUTOMOTIVE", "PIECH AUTOMOTIVE", "ピエッヒ"]],

  // オセアニア・カナダ
  ["holden", "ホールデン", ["HOLDEN", "ホルデン"]],
  ["hsv", "HSV", ["HOLDEN SPECIAL VEHICLES", "エイチエスブイ"]],
  ["fpv", "FPV", ["FORD PERFORMANCE VEHICLES", "エフピーブイ"]],
  ["elfin", "エルフィン", ["ELFIN", "ELFIN SPORTS CARS"]],
  ["bolwell", "ボルウェル", ["BOLWELL", "ボルウエル"]],
  ["roadtrek", "ロードトレック", ["ROADTREK"]],
  ["campagna", "カンパーニャ", ["CAMPAGNA", "CAMPAGNA MOTORS"]],
  ["bricklin", "ブリックリン", ["BRICKLIN"]],
  ["felino", "フェリーノ", ["FELINO", "FELINO CARS"]],

  // その他アジア
  ["proton", "プロトン", ["PROTON"]],
  ["perodua", "プロドゥア", ["PERODUA", "ペロドゥア"]],
  ["tata", "タタ", ["TATA", "TATA MOTORS", "タタモーターズ"]],
  ["mahindra", "マヒンドラ", ["MAHINDRA"]],
  ["maruti-suzuki", "マルチ・スズキ", ["MARUTI SUZUKI", "MARUTISUZUKI", "MARUTI", "マルチスズキ"]],
  ["force-motors", "フォース・モーターズ", ["FORCE MOTORS", "フォースモーターズ"]],
  ["hindustan", "ヒンドゥスタン", ["HINDUSTAN MOTORS", "HINDUSTAN", "ヒンダスタン"]],
  ["ashok-leyland", "アショック・レイランド", ["ASHOK LEYLAND", "アショクレイランド"]],
  ["vinfast", "ビンファスト", ["VINFAST", "ヴィンファスト"]],
  ["thai-rung", "タイ・ルン", ["THAI RUNG", "THAIRUNG", "タイラング"]],
  ["esemka", "エセムカ", ["ESEMKA"]],
  ["luxgen", "ラクスジェン", ["LUXGEN", "ルクスジェン", "納智捷"]],
  ["yulon", "裕隆", ["YULON", "ユーロン"]],

  // 中東・アフリカ・中南米
  ["birkin", "バーキン", ["BIRKIN", "BIRKIN CARS"]],
  ["perana", "ペラナ", ["PERANA", "PERANA PERFORMANCE GROUP"]],
  ["w-motors", "Wモーターズ", ["W MOTORS", "WMOTORS", "ダブリューモーターズ"]],
  ["devel", "デヴェル", ["DEVEL MOTORS", "DEVEL", "デベル"]],
  ["mobius", "メビウス", ["MOBIUS MOTORS", "MOBIUS", "モビウス"]],
  ["kantanka", "カンタンカ", ["KANTANKA", "KANTANKA AUTOMOBILE"]],
  ["wallyscar", "ウォーリスカー", ["WALLYSCAR", "ウォーリースカー"]],
  ["neo-motors", "ネオ・モーターズ", ["NEO MOTORS", "NEOMOTORS"]],
  ["sabra", "サブラ", ["SABRA", "AUTOCARS", "オートカーズ"]],
  ["vuhl", "VUHL", ["ブール", "V U H L"]],
  ["mastretta", "マストレッタ", ["MASTRETTA", "マストレタ"]],
  ["gurgel", "グルジェル", ["GURGEL", "グルゲル"]],
  ["troller", "トロラー", ["TROLLER", "トローラー"]],
];

export const MAKER_DICTIONARY = defineMakers(MAKER_ROWS);

function createGeneratedLatinTypos(normalizedAlias) {
  if (!/^[a-z]{5,24}$/.test(normalizedAlias)) {
    return [];
  }

  const variants = new Set();
  const characters = Array.from(normalizedAlias);

  for (let index = 0; index < characters.length; index += 1) {
    variants.add(
      characters
        .filter((_, characterIndex) => characterIndex !== index)
        .join("")
    );

    const duplicated = [...characters];
    duplicated.splice(index, 0, characters[index]);
    variants.add(duplicated.join(""));
  }

  for (let index = 0; index < characters.length - 1; index += 1) {
    if (characters[index] === characters[index + 1]) {
      continue;
    }

    const swapped = [...characters];
    [swapped[index], swapped[index + 1]] = [
      swapped[index + 1],
      swapped[index],
    ];
    variants.add(swapped.join(""));
  }

  variants.delete(normalizedAlias);
  return Array.from(variants);
}

function buildMakerIndexes(dictionary) {
  const keyIndex = new Map();
  const exactAliasIndex = new Map();
  const generatedTypoIndex = new Map();
  const ambiguousGeneratedTypos = new Set();
  const normalizedAliasesByMaker = new Map();

  for (const maker of dictionary) {
    if (!maker.key || !maker.makerName) {
      throw new Error("メーカー辞書にkeyまたはmakerNameがありません");
    }

    if (keyIndex.has(maker.key)) {
      throw new Error(`メーカー辞書のkeyが重複しています: ${maker.key}`);
    }

    keyIndex.set(maker.key, maker);

    const normalizedAliases = new Set();

    for (const alias of maker.aliases) {
      const normalizedAlias = normalizeMakerText(alias);

      if (!normalizedAlias || normalizedAliases.has(normalizedAlias)) {
        continue;
      }

      normalizedAliases.add(normalizedAlias);

      const existingMaker = exactAliasIndex.get(normalizedAlias);

      if (existingMaker && existingMaker.key !== maker.key) {
        throw new Error(
          `メーカー別名が衝突しています: ${alias} / ${existingMaker.makerName} / ${maker.makerName}`
        );
      }

      exactAliasIndex.set(normalizedAlias, maker);
    }

    normalizedAliasesByMaker.set(maker.key, normalizedAliases);
  }

  for (const maker of dictionary) {
    const normalizedAliases = normalizedAliasesByMaker.get(maker.key);

    for (const normalizedAlias of normalizedAliases) {
      for (const typo of createGeneratedLatinTypos(normalizedAlias)) {
        if (
          exactAliasIndex.has(typo) ||
          ambiguousGeneratedTypos.has(typo)
        ) {
          continue;
        }

        const existingMaker = generatedTypoIndex.get(typo);

        if (!existingMaker) {
          generatedTypoIndex.set(typo, maker);
          continue;
        }

        if (existingMaker.key !== maker.key) {
          generatedTypoIndex.delete(typo);
          ambiguousGeneratedTypos.add(typo);
        }
      }
    }
  }

  return Object.freeze({
    keyIndex,
    exactAliasIndex,
    generatedTypoIndex,
    ambiguousGeneratedTypos,
  });
}

const MAKER_INDEXES = buildMakerIndexes(MAKER_DICTIONARY);

export function resolveMaker(input) {
  const normalizedInput = normalizeMakerText(input);

  if (!normalizedInput) {
    return null;
  }

  const exactMaker = MAKER_INDEXES.exactAliasIndex.get(normalizedInput);

  if (exactMaker) {
    return Object.freeze({
      key: exactMaker.key,
      makerName: exactMaker.makerName,
      matchType: "exact",
    });
  }

  const generatedTypoMaker =
    MAKER_INDEXES.generatedTypoIndex.get(normalizedInput);

  if (!generatedTypoMaker) {
    return null;
  }

  return Object.freeze({
    key: generatedTypoMaker.key,
    makerName: generatedTypoMaker.makerName,
    matchType: "generated-typo",
  });
}

export function resolveMakerName(input) {
  return resolveMaker(input)?.makerName ?? null;
}

export function getMakerByKey(key) {
  return MAKER_INDEXES.keyIndex.get(String(key ?? "")) ?? null;
}

export function filterInventoryByMaker(inventory, makerInput) {
  if (!Array.isArray(inventory)) {
    return [];
  }

  const targetMaker =
    typeof makerInput === "string"
      ? resolveMaker(makerInput)
      : makerInput;

  if (!targetMaker?.key) {
    return [];
  }

  return inventory.filter((vehicle) => {
    const inventoryMaker = resolveMaker(vehicle?.makerName);
    return inventoryMaker?.key === targetMaker.key;
  });
}

export function findUnknownInventoryMakerNames(inventory) {
  if (!Array.isArray(inventory)) {
    return [];
  }

  const unknownMakerNames = new Set();

  for (const vehicle of inventory) {
    const makerName = String(vehicle?.makerName ?? "").trim();

    if (makerName && !resolveMaker(makerName)) {
      unknownMakerNames.add(makerName);
    }
  }

  return Array.from(unknownMakerNames).sort((left, right) =>
    left.localeCompare(right, "ja")
  );
}

export function validateMakerDictionary() {
  return Object.freeze({
    makerCount: MAKER_DICTIONARY.length,
    exactAliasCount: MAKER_INDEXES.exactAliasIndex.size,
    generatedTypoCount: MAKER_INDEXES.generatedTypoIndex.size,
    ambiguousGeneratedTypoCount:
      MAKER_INDEXES.ambiguousGeneratedTypos.size,
  });
}
