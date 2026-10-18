
import { getPromiseById, getNextPromise } from "./index.js";
import { PROMISE_CONTENT } from "./content.js";
import { PROMISE_THEME } from "./theme.js";
import { getPromiseImage } from "./images.js";

const { colors, typography, spacing } = PROMISE_THEME;

const PROMISE_IMAGE_ASPECT_RATIO = "16:9";

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
    aspectRatio: PROMISE_IMAGE_ASPECT_RATIO,
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

// 章末の強調文。
// 第4章は背景を付けず、文字サイズだけで強調する。
function makeChapterBody(section, chapterNumber) {
  const contents = [];

  if (section.text) {
    const paragraphs = section.text.split("\n\n");
    const lastParagraph = paragraphs.pop();

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
      if (chapterNumber === 4) {
        contents.push(
          makeText(lastParagraph, {
            size: typography.heading.size,
            weight: typography.body.weight,
            color: colors.navy,
            margin: "xl",
          })
        );
      } else {
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
  }

  return {
    type: "box",
    layout: "vertical",
    spacing: "md",
    contents,
  };
}

// CHAPTER番号と章タイトルを同じ背景にまとめる。
function makeChapterHeader(section, chapterNumber) {
  const headingParts = (section.heading || "").split("\n\n");
  const chapterTitle = headingParts[0] || "";

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

// 章タイトルと本文の間にある大きなフレーズ。
function makeChapterPhrase(section) {
  const headingParts = (section.heading || "").split("\n\n");
  const phrase = headingParts.slice(1).join("\n\n");

  if (!phrase) {
    return null;
  }

  return makeText(phrase, {
    size: typography.heading.size,
    weight: "bold",
    color: DESIGN.navy,
  });
}

// 章の表示順：
// CHAPTER番号 → 章タイトル → 写真 → フレーズ → 本文
function makeChapter(imageSection, textSection, id, chapterNumber) {
  const contents = [];

  contents.push(
    makeChapterHeader(textSection, chapterNumber)
  );

  const image = makeImage(
    getPromiseImage(id, imageSection.imageKey)
  );

  if (image) {
    contents.push(image);
  }

  const phrase = makeChapterPhrase(textSection);

  if (phrase) {
    contents.push(phrase);
  }

  if (textSection.text) {
    contents.push(
      makeChapterBody(textSection, chapterNumber)
    );
  }

  return {
    type: "box",
    layout: "vertical",
    spacing: "lg",
    contents,
  };
}

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

function makePromise01Sections(sections) {
  const result = [];

  // 冒頭の写真と導入文
  if (sections[0]) {
    const hero = makeSection(sections[0], "01");
    if (hero) result.push(hero);
  }

  if (sections[1]) {
    const intro = makeSection(sections[1], "01");
    if (intro) result.push(intro);
  }

  // 第1章〜第5章
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
      // 想定外の構成でも内容を消さない。
      for (const section of [imageSection, textSection]) {
        if (section) {
          const component = makeSection(section, "01");
          if (component) result.push(component);
        }
      }
    }
  }

  // 締め
  if (sections[12]) {
    result.push(makeFinalSection(sections[12]));
  }

  // 将来追加されたセクションも保持する。
  for (const section of sections.slice(13)) {
    const component = makeSection(section, "01");
    if (component) result.push(component);
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
