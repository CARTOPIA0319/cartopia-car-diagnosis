// app/api/direct-input/replyBuilder.js

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
    title: "ご予約ですね",
    text: "ご希望の内容を選択してください。",
    actions: [
      {
        type: "message",
        label: "車検",
        text: "車検",
      },
      {
        type: "message",
        label: "オイル交換",
        text: "オイル交換",
      },
      {
        type: "message",
        label: "点検・整備",
        text: "点検・整備",
      },
      {
        type: "message",
        label: "その他",
        text: "その他",
      },
    ],
  };
}

export function buildAiConfirmationReply(aiResult = {}) {
  const titleMap = {
    maker: "メーカー候補",
    brand: "ブランド候補",
    model: "車種候補",
    category: "車種カテゴリ",
    purpose: "利用目的",
    unknown: "検索",
  };

  const title =
    titleMap[aiResult.type] ?? "検索";

  const keyword =
    aiResult.normalized ||
    aiResult.keyword ||
    "";

  return {
    type: "ai-confirmation",
    replyType: "buttons",
    title,
    text: keyword
      ? `「${keyword}」で検索しますか？`
      : "検索しますか？",
    keyword,
    normalized: aiResult.normalized ?? "",
    confidence: aiResult.confidence ?? "low",
    actions: [
      {
        type: "message",
        label: "検索する",
        text: keyword || "検索",
      },
      {
        type: "message",
        label: "キャンセル",
        text: "キャンセル",
      },
    ],
  };
}
