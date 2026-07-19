export function buildFaqReply(faq) {
  return {
    type: "faq",
    replyType: "text",
    text: faq.answer,
  };
}

export function buildReservationReply() {
  return {
    type: "reservation",
    replyType: "buttons",
    title: "ご予約ですね。",
    text: "ご希望の内容を選択してください。",
    actions: [
      "車検",
      "オイル交換",
      "点検・整備",
      "その他",
    ],
  };
}

export function buildAiConfirmationReply() {
  return {
    type: "ai-confirmation",
    replyType: "buttons",
    title: "在庫検索",
    text: "入力内容をもとに在庫車や近い車種を検索しますか？",
    actions: [
      "検索する",
      "キャンセル",
    ],
  };
}
