// app/api/direct-input/searchMessageBuilder.js

export function buildSearchMessage(search = {}) {
  if (!search || search.action === "unknown") {
    return {
      type: "text",
      text: "検索条件を特定できませんでした。",
    };
  }

  const labels = {
    "maker-search": "メーカー",
    "brand-search": "ブランド",
    "model-search": "車種",
    "category-search": "カテゴリ",
    "purpose-search": "用途",
  };

  const label =
    labels[search.action] ?? "検索";

  return {
    type: "flex",
    altText: `${search.keyword}の検索結果`,
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: "検索内容",
            weight: "bold",
            size: "lg",
          },
          {
            type: "text",
            text: `${label}：${search.keyword}`,
            wrap: true,
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            style: "primary",
            action: {
              type: "uri",
              label: "在庫を見る",
              uri: search.url,
            },
          },
        ],
      },
    },
  };
}

export default buildSearchMessage;
