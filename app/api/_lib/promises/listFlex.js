
import { getPromiseList } from "./index.js";
import { PROMISE_CONTENT } from "./content.js";
import { getPromiseImage } from "./images.js";

const COLORS = Object.freeze({
  navy: "#0B1F3A",
  gold: "#D8BE72",
  beige: "#F8F5EF",
  white: "#FFFFFF",
  text: "#24364B",
  muted: "#7B817F",
  line: "#E6DFD2",
});

const CARD = Object.freeze({
  imageAspectRatio: "16:9",
  imageHeight: "165px",
  titleHeight: "115px",
  chapterRowHeight: "54px",
  chapterNumberWidth: "86px",
  chapterFontSize: "13px",
  contentsPadding: "18px",
  buttonPadding: "18px",
});

// 画像＋文章の組を1章として取得する。
// 冒頭の導入画像・導入文と、最後の締めは除外する。
function getChapters(promiseId) {
  const sections =
    PROMISE_CONTENT[promiseId]?.sections ?? [];

  if (!Array.isArray(sections)) {
    return [];
  }

  const chapters = [];

  let index = 0;

  // 冒頭画像
  if (sections[index]?.type === "image") {
    index++;
  }

  // 導入文
  if (sections[index]?.type === "text") {
    index++;
  }

  while (index < sections.length) {
    const current = sections[index];
    const next = sections[index + 1];

    if (
      current?.type === "image" &&
      next?.type === "text"
    ) {
      const title = String(next.heading ?? "")
        .split("\n\n")[0]
        .replace(/\n/g, "")
        .trim();

      chapters.push({
        number: chapters.length + 1,
        title: title || "この章を読む",
      });

      index += 2;
      continue;
    }

    index++;
  }

  return chapters;
}

// カード間で目次の高さを揃えるため、
// 一覧内で最も章数が多い約束を基準にする。
function getMaximumChapterCount(promises) {
  return Math.max(
    0,
    ...promises.map(
      (promise) => getChapters(promise.id).length
    )
  );
}

function makeChapterRow(chapterItem) {
  return {
    type: "box",
    layout: "horizontal",
    alignItems: "center",
    height: CARD.chapterRowHeight,
    spacing: "sm",
    contents: [
      {
        type: "text",
        text: `CHAPTER ${String(
          chapterItem.number
        ).padStart(2, "0")}`,
        size: "xxs",
        weight: "bold",
        color: COLORS.gold,
        flex: 0,
        gravity: "center",
      },
      {
        type: "text",
        text: chapterItem.title,
        size: CARD.chapterFontSize,
        weight: "bold",
        color: COLORS.text,
        wrap: true,
        maxLines: 2,
        gravity: "center",
        flex: 1,
      },
    ],
  };
}

function makeContentsBox(chapters, maximumChapterCount) {
  const rows = chapters.map(makeChapterRow);

  // 章数が少ないカードは空白行で高さを統一する。
  for (
    let index = chapters.length;
    index < maximumChapterCount;
    index++
  ) {
    rows.push({
      type: "box",
      layout: "vertical",
      height: CARD.chapterRowHeight,
      contents: [
        {
          type: "filler",
        },
      ],
    });
  }

  // LINE Flexのboxには最低1つのcontentsが必要。
  if (rows.length === 0) {
    rows.push({
      type: "text",
      text: " ",
      size: "xs",
      color: COLORS.beige,
    });
  }

  return {
    type: "box",
    layout: "vertical",
    paddingAll: CARD.contentsPadding,
    spacing: "none",
    contents: [
      {
        type: "text",
        text: "CONTENTS",
        size: "xs",
        weight: "bold",
        color: COLORS.muted,
        margin: "none",
      },
      {
        type: "separator",
        margin: "md",
        color: COLORS.line,
      },
      {
        type: "box",
        layout: "vertical",
        spacing: "none",
        margin: "sm",
        contents: rows,
      },
    ],
  };
}

function makeHeroImage(promiseId) {
  const image = getPromiseImage(promiseId, "hero");

  if (!image?.url) {
    // 未登録の約束も同じ画像領域を確保する。
    return {
      type: "box",
      layout: "vertical",
      height: CARD.imageHeight,
      backgroundColor: COLORS.beige,
      contents: [
        {
          type: "filler",
        },
      ],
    };
  }

  return {
    type: "image",
    url: image.url,
    size: "full",
    aspectRatio: CARD.imageAspectRatio,
    aspectMode: "cover",
  };
}

function makePromiseBubble(
  promise,
  maximumChapterCount
) {
  const chapters = getChapters(promise.id);

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
          height: CARD.titleHeight,
          justifyContent: "center",
          spacing: "sm",
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
              maxLines: 2,
            },
          ],
        },

        makeHeroImage(promise.id),

        {
          type: "box",
          layout: "vertical",
          backgroundColor: COLORS.beige,
          paddingAll: "0px",
          contents: [
            makeContentsBox(
              chapters,
              maximumChapterCount
            ),

            {
              type: "box",
              layout: "vertical",
              paddingAll: CARD.buttonPadding,
              paddingTop: "0px",
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
                    displayText:
                      `${promise.id} ${promise.title}`,
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  };
}

export function makePromiseListFlex() {
  const promises = getPromiseList();

  const maximumChapterCount =
    getMaximumChapterCount(promises);

  return {
    type: "flex",
    altText: "カーとぴあ 5つの約束",
    contents: {
      type: "carousel",
      contents: promises.map((promise) =>
        makePromiseBubble(
          promise,
          maximumChapterCount
        )
      ),
    },
  };
}
