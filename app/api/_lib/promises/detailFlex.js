import { getPromiseById, getNextPromise } from "./index.js";

const COLORS = Object.freeze({
  navy: "#0B1F3A",
  gold: "#D8BE72",
  beige: "#F8F5EF",
  white: "#FFFFFF",
  text: "#253247",
});

function makeNavigationButton(label, data) {
  return {
    type: "button",
    style: "primary",
    color: COLORS.navy,
    height: "sm",
    action: {
      type: "postback",
      label,
      data,
      displayText: label,
    },
  };
}

export function makePromiseDetailFlex(id) {
  const promise = getPromiseById(id);

  if (!promise) {
    return null;
  }

  const nextPromise = getNextPromise(id);

  const buttons = [];

  if (nextPromise) {
    buttons.push(
      makeNavigationButton(
        "次の約束を読む",
        `promise|${nextPromise.id}`
      )
    );
  }

  buttons.push(
    makeNavigationButton(
      "約束の一覧へ戻る",
      "promise|list"
    )
  );

  return {
    type: "flex",
    altText: `${promise.id} ${promise.title}`,
    contents: {
      type: "bubble",
      size: "mega",
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "0px",
        contents: [
          {
            type: "box",
            layout: "vertical",
            backgroundColor: COLORS.navy,
            paddingAll: "24px",
            spacing: "md",
            contents: [
              {
                type: "text",
                text: promise.id,
                size: "3xl",
                weight: "bold",
                color: COLORS.gold,
                align: "center",
              },
              {
                type: "text",
                text: promise.title,
                size: "xl",
                weight: "bold",
                color: COLORS.white,
                align: "center",
                wrap: true,
              },
            ],
          },
          {
            type: "box",
            layout: "vertical",
            backgroundColor: COLORS.beige,
            paddingAll: "20px",
            spacing: "md",
            contents: [
              {
                type: "text",
                text: "本文は確定済みの内容を組み込みます。",
                size: "md",
                color: COLORS.text,
                wrap: true,
              },
              ...buttons,
            ],
          },
        ],
      },
    },
  };
}
