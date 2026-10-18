
import { getPromiseById, getNextPromise } from "./index.js";
import { PROMISE_CONTENT } from "./content.js";
import { PROMISE_THEME } from "./theme.js";
import { getPromiseImage } from "./images.js";

const { colors, typography, spacing } = PROMISE_THEME;

const PROMISE_IMAGE_ASPECT_RATIO = "16:9";

// 約束01だけに適用する装飾色
const DESIGN = Object.freeze({
  navy: "#102B43",
  gold: "#B59458",
  goldLight: "#E4C78B",
  beige: "#EAE3D5",
  white: "#FFFFFF",
  text: "#263747",
});

function makeNavigationButton(label, data) {
  return {
    type: "button",
    style: "primary",
    color: colors.navy,
    height: "sm",
    action: {
      type: "postback",
      label,
      data,
      displayText: label,
    },
  };
}

function makeImage(image) {
  if (
    !image ||
    typeof image.url !== "string" ||
    !/^https:\/\//.test(image.url)
  ) {
    return null;
  }

  return {
    type: "image",
    url: image.url,
    size: "full",
    aspectRatio: PROMISE_IMAGE_ASPECT_RATIO,
    aspectMode: "cover",
  };
}

// 既存の文章表示。02〜05では従来どおり使用。
function makeStandardSection(section) {
  const contents = [];

  if (section.heading) {
    contents.push({
      type: "text",
      text: section.heading,
      size: typography.heading.size,
      weight: typography.heading.weight,
      align: typography.heading.align,
      color: colors.navy,
      wrap: true,
    });
  }

  if (section.text) {
    contents.push({
      type: "text",
      text: section.text,
      size: typography.body.size,
      weight: typography.body.weight,
      align: typography.body.align,
      color: colors.text,
      wrap: true,
    });
  }

  if (contents.length === 0) {
    return null;
  }

  return {
    type: "box",
    layout: "vertical",
    spacing: "md",
    contents,
  };
}

function makeText(text, options = {}) {
  return {
    type: "text",
    text,
    wrap: true,
    ...options,
  };
}

// 約束01の章番号・見出し・本文・強調文
function makeChapterSection(section, chapterNumber) {
  const contents = [];

  contents.push(
    makeText(`CHAPTER ${String(chapterNumber).padStart(2, "0")}`, {
      size: "xs",
      weight: "bold",
      color: DESIGN.gold,
    })
  );

  if (section.heading) {
    // 既存の見出し文字列を変えず、改行による区切りだけを利用
    const headingParts = section.heading.split("\n\n");

    headingParts.forEach((part, index) => {
      contents.push(
        makeText(part, {
          size: index === 0 ? "sm" : typography.heading.size,
          weight: "bold",
          color: index === 0 ? DESIGN.gold : DESIGN.navy,
          margin: index === 0 ? "md" : "lg",
        })
      );
    });
  }

  if (section.text) {
    // 最後の段落を強調する。原文の文字は変更しない。
    const paragraphs = section.text.split("\n\n");
    const lastParagraph = paragraphs.pop();

    if (paragraphs.length > 0) {
      contents.push(
        makeText(paragraphs.join("\n\n"), {
          size: typography.body.size,
          weight: typography.body.weight,
          align: typography.body.align,
          color: colors.text,
          margin: "lg",
        })
      );
    }

    if (lastParagraph) {
      contents.push({
        type: "box",
        layout: "vertical",
        backgroundColor: DESIGN.beige,
        paddingAll: "16px",
        margin: "xl",
        contents: [
          makeText(lastParagraph, {
            size: typography.body.size,
            weight: "bold",
            color: DESIGN.navy,
            align: "center",
          }),
        ],
      });
    }
  }

  return {
    type: "box",
    layout: "vertical",
    spacing: "sm",
    contents,
  };
}

// 約束01の締め。原文を保持したまま色を切り替える。
function makeFinalSection(section) {
  const contents = [];

  if (section.heading) {
    contents.push(
      makeText(section.heading, {
        size: typography.heading.size,
        weight: "bold",
        color: DESIGN.goldLight,
        align: "center",
      })
    );
  }

  if (section.text) {
    contents.push(
      makeText(section.text, {
        size: typography.body.size,
        weight: typography.body.weight,
        color: DESIGN.white,
        align: "center",
        margin: "xl",
      })
    );
  }

  return {
    type: "box",
    layout: "vertical",
    backgroundColor: DESIGN.navy,
    paddingAll: "22px",
    spacing: "md",
    contents,
  };
}

function makeSection(section, promiseId, sectionIndex) {
  if (!section || typeof section !== "object") {
    return null;
  }

  if (section.type === "image") {
    return makeImage(
      getPromiseImage(promiseId, section.imageKey)
    );
  }

  if (promiseId !== "01") {
    return makeStandardSection(section);
  }

  // 約束01の既存構成：
  // 0 表紙画像
  // 1 導入
  // 2,4,6,8,10 各章画像
  // 3,5,7,9,11 各章文章
  // 12 締め
  if (sectionIndex === 12) {
    return makeFinalSection(section);
  }

  if (
    sectionIndex >= 3 &&
    sectionIndex <= 11 &&
    sectionIndex % 2 === 1
  ) {
    return makeChapterSection(
      section,
      (sectionIndex - 1) / 2
    );
  }

  return makeStandardSection(section);
}

export function makePromiseDetailFlex(id) {
  const promise = getPromiseById(id);

  if (!promise) {
    return null;
  }

  const nextPromise = getNextPromise(id);
  const sections = PROMISE_CONTENT[id]?.sections || [];

  const sectionComponents = sections
    .map((section, index) => makeSection(section, id, index))
    .filter(Boolean);

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

  // 締めを濃紺にした約束01では、
  // ボタンとの間に余白を確保する。
  const buttonContents = buttons.map((button, index) => ({
    ...button,
    margin: index === 0 ? "xl" : "md",
  }));

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
            backgroundColor: colors.navy,
            paddingAll: spacing.cover,
            spacing: "md",
            contents: [
              {
                type: "text",
                text: promise.id,
                ...typography.number,
                color: colors.gold,
              },
              {
                type: "text",
                text: promise.title,
                ...typography.title,
                color: colors.white,
                wrap: true,
              },
            ],
          },
          {
            type: "box",
            layout: "vertical",
            backgroundColor: colors.beige,
            paddingAll: spacing.content,
            spacing: spacing.section,
            contents: [
              ...sectionComponents,
              ...buttonContents,
            ],
          },
        ],
      },
    },
  };
}
