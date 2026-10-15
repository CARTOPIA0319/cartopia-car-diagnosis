import { getPromiseList } from "./index.js";

const COLORS = Object.freeze({
  navy: "#0B1F3A",
  gold: "#D8BE72",
  beige: "#F8F5EF",
  white: "#FFFFFF",
});

function makePromiseBubble(promise) {
  return {
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
          spacing: "lg",
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
          paddingAll: "18px",
          contents: [
            {
              type: "button",
              style: "primary",
              color: COLORS.navy,
              height: "sm",
              action: {
                type: "postback",
                label: "この約束を読む",
                data: `promise|${promise.id}`,
                displayText: `${promise.id} ${promise.title}`,
              },
            },
          ],
        },
      ],
    },
  };
}

export function makePromiseListFlex() {
  return {
    type: "flex",
    altText: "カーとぴあ 5つの約束",
    contents: {
      type: "carousel",
      contents: getPromiseList().map(makePromiseBubble),
    },
  };
}
