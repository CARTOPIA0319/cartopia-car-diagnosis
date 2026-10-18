
import { getPromiseById, getNextPromise } from "./index.js";
import { PROMISE_CONTENT } from "./content.js";
import { PROMISE_THEME } from "./theme.js";
import { getPromiseImage } from "./images.js";

const { colors, typography, spacing } = PROMISE_THEME;

const DESIGN = Object.freeze({
  navy: "#102B43",
  gold: "#B59458",
  goldLight: "#E4C78B",
  beige: "#EAE3D5",
  white: "#FFFFFF",
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
    aspectRatio: "16:9",
    aspectMode: "cover",
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

function makeStandardSection(section) {
  if (!section || section.type !== "text") {
    return null;
  }

  const contents = [];

  if (section.heading) {
    contents.push(
      makeText(section.heading, {
        size: typography.heading.size,
        weight: typography.heading.weight,
        align: typography.heading.align,
        color: colors.navy,
      })
    );
  }

  if (section.text) {
    contents.push(
      makeText(section.text, {
        size: typography.body.size,
        weight: typography.body.weight,
        align: typography.body.align,
        color: colors.text,
      })
    );
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

function makeSection(section, promiseId) {
  if (!section || typeof section !== "object") {
    return null;
  }

  if (section.type === "image") {
    return makeImage(
      getPromiseImage(promiseId, section.imageKey)
    );
  }

  return makeStandardSection(section);
}

// 章番号と章タイトルだけを濃いベージュで囲む。
// 本文や章末の強調文には背景を付けない。
function makeChapterHeader(section, chapterNumber) {
  const parts = (section.heading || "").split("\n\n");
  const chapterTitle = parts[0] || "";

  return {
    type: "box",
    layout: "vertical",
    backgroundColor: DESIGN.beige,
    paddingAll: "18px",
    spacing: "md",
    contents: [
      makeText(
        `CHAPTER ${String(chapterNumber).padStart(2, "0")}`,
        {
          size: "sm",
          weight: "bold",
          color: DESIGN.gold,
        }
      ),
      makeText(chapterTitle, {
        size: typography.heading.size,
        weight: "bold",
        color: DESIGN.navy,
      }),
    ],
  };
}

// 画像の直後に置く章のフレーズ。
function makeChapterPhrase(section) {
  const parts = (section.heading || "").split("\n\n");
  const phrase = parts.slice(1).join("\n\n");

  if (!phrase) {
    return null;
  }

  return makeText(phrase, {
    size: typography.heading.size,
    weight: "bold",
    color: DESIGN.navy,
  });
}

// 全章の最後の強調文を統一する。
// 背景なし、左寄せ、章のフレーズと同じ文字サイズ・太さ。
function makeChapterBody(section) {
  if (!section.text) {
    return null;
  }

  const paragraphs = section.text.split("\n\n");
  const lastParagraph = paragraphs.pop();

  const contents = [];

  if (paragraphs.length > 0) {
    contents.push(
      makeText(paragraphs.join("\n\n"), {
        size: typography.body.size,
        weight: typography.body.weight,
        align: typography.body.align,
        color: colors.text,
      })
    );
  }

  if (lastParagraph) {
    contents.push(
      makeText(lastParagraph, {
        size: typography.heading.size,
        weight: "bold",
        color: DESIGN.navy,
        align: "start",
        margin: paragraphs.length > 0 ? "xl" : "none",
      })
    );
  }

  return {
    type: "box",
    layout: "vertical",
    spacing: "md",
    contents,
  };
}

// 表示順：章番号・章タイトル → 写真 → フレーズ → 本文
function makeChapter(imageSection, textSection, id, number) {
  const contents = [
    makeChapterHeader(textSection, number),
  ];

  const chapterImage = makeImage(
    getPromiseImage(id, imageSection.imageKey)
  );

  if (chapterImage) {
    contents.push(chapterImage);
  }

  const phrase = makeChapterPhrase(textSection);

  if (phrase) {
    contents.push(phrase);
  }

  const body = makeChapterBody(textSection);

  if (body) {
    contents.push(body);
  }

  return {
    type: "box",
    layout: "vertical",
    spacing: "lg",
    contents,
  };
}

// 締め：ネイビー背景、全文左寄せ。
// 幅に対して文字が大きくなりすぎないよう調整。
function makeFinalSection(section) {
  const contents = [];

  if (section.heading) {
    contents.push(
      makeText(section.heading, {
        size: "md",
        weight: "bold",
        color: DESIGN.goldLight,
        align: "start",
      })
    );
  }

  if (section.text) {
    contents.push(
      makeText(section.text, {
        size: "sm",
        weight: "regular",
        color: DESIGN.white,
        align: "start",
        margin: "xl",
      })
    );
  }

  return {
    type: "box",
    layout: "vertical",
    backgroundColor: DESIGN.navy,
    paddingAll: "16px",
    spacing: "md",
    contents,
  };
}

function makePromise01Sections(sections) {
  const result = [];

  // 冒頭画像と導入文
  for (const section of sections.slice(0, 2)) {
    const component = makeSection(section, "01");

    if (component) {
      result.push(component);
    }
  }

  // 第1章から第5章
  for (let chapter = 1; chapter <= 5; chapter++) {
    const imageIndex = chapter * 2;
    const textIndex = imageIndex + 1;

    const imageSection = sections[imageIndex];
    const textSection = sections[textIndex];

    if (
      imageSection?.type === "image" &&
      textSection?.type === "text"
    ) {
      result.push(
        makeChapter(
          imageSection,
          textSection,
          "01",
          chapter
        )
      );
    } else {
      // 予期しない構成でも既存内容は残す
      for (const section of [imageSection, textSection]) {
        const component = makeSection(section, "01");

        if (component) {
          result.push(component);
        }
      }
    }
  }

  // 締め
  if (sections[12]) {
    result.push(makeFinalSection(sections[12]));
  }

  // 将来追加されるセクションも維持
  for (const section of sections.slice(13)) {
    const component = makeSection(section, "01");

    if (component) {
      result.push(component);
    }
  }

  return result;
}

export function makePromiseDetailFlex(id) {
  const promise = getPromiseById(id);

  if (!promise) {
    return null;
  }

  const nextPromise = getNextPromise(id);
  const sections = PROMISE_CONTENT[id]?.sections || [];

  const sectionComponents =
    id === "01"
      ? makePromise01Sections(sections)
      : sections
          .map((section) => makeSection(section, id))
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
              ...buttons,
            ],
          },
        ],
      },
    },
  };
}
