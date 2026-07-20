// app/api/direct-input/buildConfirmation.js

export function buildConfirmation(
  rawText,
  classification,
) {
  const text = String(
    rawText ?? "",
  ).trim();

  if (!text) {
    return {
      type: "error",
      replyType: "text",
      text: "内容を入力してください。",
    };
  }

  switch (classification.type) {
    case "reservation":
      return {
        type: "reservation",
        replyType: "buttons",
        title: "ご予約ですね",
        text: "ご希望の内容を選択してください。",
        actions: [
          "車検",
          "オイル交換",
          "点検・整備",
          "その他",
        ],
      };

    case "sell":
      return {
        type: "sell",
        replyType: "buttons",
        title: "お車の売却ですね",
        text: "ご希望の内容を選択してください。",
        actions: [
          "査定を依頼する",
          "まず相談する",
        ],
      };

    case "purchase":
      return {
        type: "purchase",
        replyType: "buttons",
        title: "お車探しですね",
        text: "ご希望の内容を選択してください。",
        actions: [
          "在庫車を見る",
          "注文車を相談する",
          "ぴったり車種診断",
        ],
      };

    case "diagnosis":
      return {
        type: "diagnosis",
        replyType: "buttons",
        title: "ぴったり車種診断",
        text: "診断を開始しますか？",
        actions: [
          "診断を開始する",
          "キャンセル",
        ],
      };

    case "vehicle-search":
      return {
        type: "vehicle-search",
        replyType: "buttons",
        title: "車を探します",
        text: `「${text}」に近い車を検索しますか？`,
        actions: [
          "検索する",
          "キャンセル",
        ],
      };

    default:
      return {
        type: "unknown",
        replyType: "text",
        text: "内容を理解できませんでした。もう少し詳しく入力してください。",
      };
  }
}

export default buildConfirmation;
