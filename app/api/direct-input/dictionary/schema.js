/**
 * ==========================================================
 * 車両辞書 共通データ構造
 * ==========================================================
 *
 * すべての辞書はこの形式で管理する。
 *
 * makers.js
 * brands.js
 * models.js
 * categories.js
 * purposes.js
 * synonyms.js
 *
 * ==========================================================
 */

export const DictionaryType = {
  MAKER: "maker",
  BRAND: "brand",
  MODEL: "model",
  CATEGORY: "category",
  PURPOSE: "purpose",
  SYNONYM: "synonym",
};

/**
 * 共通フォーマット
 *
 * id          : 一意ID
 * type        : maker / brand / model ...
 * name        : 正式名称
 * aliases     : 入力ゆれ
 * keywords    : 検索用
 * parent      : 親ID
 * category    : SUV等
 * tags        : 特徴
 * priority    : 優先度
 */

export const SampleDictionary = {
  id: "",
  type: "",
  name: "",
  aliases: [],
  keywords: [],
  parent: null,
  category: null,
  tags: [],
  priority: 100,
};
