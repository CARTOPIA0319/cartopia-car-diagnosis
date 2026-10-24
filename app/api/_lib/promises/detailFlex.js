import {
  getPromiseById,
  getNextPromise,
} from "./index.js";

import { PROMISE_CONTENT } from "./content.js";
import { PROMISE_THEME } from "./theme.js";
import { getPromiseImage } from "./images.js";

const {
  colors,
  typography,
  spacing,
  layout,
  chapter,
  final,
  navigation,
} = PROMISE_THEME;

function makeText(text, options = {}) {
  return {
    type: "text",
    text,
    wrap: true,
    ...options,
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
    size: layout.imageSize,
    aspectRatio: layout.imageAspectRatio,
    aspectMode: layout.imageAspectMode,
  };
}

function makeNavigationButton(label, data) {
  return {
    type: "button",
    style: navigation.style,
    color: navigation.color,
    height: navigation.height,
    action: {
      type: "postback",
      label,
      data,
      displayText: label,
    },
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
        ...typography.heading,
        color: colors.navy,
      })
    );
  }

  if (section.text) {
    contents.push(
      makeText(section.text, {
        ...typography.body,
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
    spacing: layout.sectionSpacing,
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

  if (section.type === "text") {
    return makeStandardSection(section);
  }

  return null;
}

function splitHeading(heading) {
  const parts = String(heading || "").split("\n\n");

  return {
    title: parts[0] || "",
    phrase: parts.slice(1).join("\n\n"),
  };
}

function makeChapterHeader(section, chapterNumber) {
  const { title } = splitHeading(section.heading);

  return {
    type: "box",
    layout: "vertical",
    backgroundColor: chapter.backgroundColor,
    paddingAll: chapter.padding,
    spacing: chapter.spacing,
    contents: [
      makeText(
        `${chapter.prefix} ${String(chapterNumber).padStart(
          chapter.numberDigits,
          "0"
        )}`,
        chapter.number
      ),
      makeText(title, chapter.title),
    ],
  };
}

function makeChapterPhrase(section) {
  const { phrase } = splitHeading(section.heading);

  if (!phrase) {
    return null;
  }

  return makeText(phrase, chapter.phrase);
}

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
        ...typography.body,
        color: colors.text,
      })
    );
  }

  if (lastParagraph) {
    contents.push(
      makeText(lastParagraph, {
        ...chapter.emphasis,
        margin:
          paragraphs.length > 0
            ? chapter.emphasis.margin
            : "none",
      })
    );
  }

  if (contents.length === 0) {
    return null;
  }

  return {
    type: "box",
    layout: "vertical",
    spacing: layout.sectionSpacing,
    contents,
  };
}

function makeChapter(
  imageSection,
  textSection,
  promiseId,
  chapterNumber
) {
  const contents = [
    makeChapterHeader(textSection, chapterNumber),
  ];

  const image = makeImage(
    getPromiseImage(
      promiseId,
      imageSection.imageKey
    )
  );

  if (image) {
    contents.push(image);
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
    spacing: layout.chapterSpacing,
    contents,
  };
}

function makeFinalSection(section) {
  const contents = [];

  if (section.heading) {
    contents.push(
      makeText(section.heading, final.heading)
    );
  }

  if (section.text) {
    contents.push(
      makeText(section.text, final.body)
    );
  }

  if (contents.length === 0) {
    return null;
  }

  return {
    type: "box",
    layout: "vertical",
    backgroundColor: final.backgroundColor,
    paddingAll: final.padding,
    spacing: final.spacing,
    contents,
  };
}

// 全約束共通の文章構成
//
// 先頭：画像＋導入文
// 中間：画像＋章本文を繰り返す
// 最後：締めの文章
//
// 章数は固定しない。
// 約束番号による特別処理も行わない。

function makePromiseSections(sections, promiseId) {
  if (!Array.isArray(sections)) {
    return [];
  }

  const result = [];

  if (sections.length === 0) {
    return result;
  }

  let index = 0;
  let chapterNumber = 0;

  // 冒頭画像
  if (sections[index]?.type === "image") {
    const image = makeSection(
      sections[index],
      promiseId
    );

    if (image) {
      result.push(image);
    }

    index++;
  }

  // 導入文
  if (sections[index]?.type === "text") {
    const introduction = makeSection(
      sections[index],
      promiseId
    );

    if (introduction) {
      result.push(introduction);
    }

    index++;
  }

  // 中間の章と最後の締め
  while (index < sections.length) {
    const current = sections[index];
    const next = sections[index + 1];

    // 画像＋本文を1章として扱う
    if (
      current?.type === "image" &&
      next?.type === "text"
    ) {
      chapterNumber++;

      result.push(
        makeChapter(
          current,
          next,
          promiseId,
          chapterNumber
        )
      );

      index += 2;
      continue;
    }

    // 最後に単独で置かれた文章は締め
    if (
      current?.type === "text" &&
      index === sections.length - 1
    ) {
      const closing = makeFinalSection(current);

      if (closing) {
        result.push(closing);
      }

      index++;
      continue;
    }

    // 想定外の構成でも内容を消さない
    const component = makeSection(
      current,
      promiseId
    );

    if (component) {
      result.push(component);
    }

    index++;
  }

  return result;
}

export function makePromiseDetailFlex(id) {
  const promise = getPromiseById(id);

  if (!promise) {
    return null;
  }

  const nextPromise = getNextPromise(id);

  const sections =
    PROMISE_CONTENT[id]?.sections || [];

  const sectionComponents = makePromiseSections(
    sections,
    id
  );

  const buttons = [];

  if (nextPromise) {
    buttons.push(
      makeNavigationButton(
        navigation.nextLabel,
        `promise|${nextPromise.id}`
      )
    );
  }

  buttons.push(
    makeNavigationButton(
      navigation.listLabel,
      "promise|list"
    )
  );

  return {
    type: "flex",
    altText: `${promise.id} ${promise.title}`,
    contents: {
      type: "bubble",
      size: layout.bubbleSize,
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
            spacing: layout.sectionSpacing,
            contents: [
              makeText(promise.id, {
                ...typography.number,
                color: colors.gold,
              }),
              makeText(promise.title, {
                ...typography.title,
                color: colors.white,
              }),
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
