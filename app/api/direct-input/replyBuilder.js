// app/api/direct-input/replyBuilder.js

import resolveSearchTarget from "./searchResolver";

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

export function buildAiConfirmationReply(ai) {
  const search =
    resolveSearchTarget(ai);

  return {
    type: "ai-confirmation",

    replyType: "buttons",

    title: "検索しますか？",

    text: `「${search.query}」で検索します。よろしいですか？`,

    search,

    actions: [
      {
        type: "message",
        label: "検索する",
        text: `検索:${search.query}`,
      },
      {
        type: "message",
        label: "キャンセル",
        text: "キャンセル",
      },
    ],
  };
}
