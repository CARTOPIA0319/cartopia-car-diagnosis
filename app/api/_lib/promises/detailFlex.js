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

// 全約束共通の自動改行設定。
// 日本語の全角文字を基準とした目安。
// 端末ごとの表示幅には差がある。
const LINE_BREAK = Object.freeze({
  chapterTitle: 11,
  heading: 15,
  phrase: 15,
  body: 22,
  finalHeading: 15,
  finalBody: 22,
  minLastLine: 4,
});

// 自然な位置で改行するための優先度
function getBreakPriority(text, position) {
  const previous = text.slice(0, position);
  const last = previous.slice(-1);

  if (/[、。！？!?]/.test(last)) {
    return 100;
  }

  if (/[）)」』]/.test(last)) {
    return 90;
  }

  if (
    /(?:には|では|から|まで|より|こそ|ても|でも|なら|とは|へと)$/.test(
      previous
    )
  ) {
    return 75;
  }

  if (/[はがをにへでともやの]/.test(last)) {
    return 55;
  }

  return 0;
}

// 半角・全角を考慮した文字幅
function getTextWidth(text) {
  let width = 0;

  for (const character of Array.from(text)) {
    if (/[\u0020-\u007E]/.test(character)) {
      width += 0.55;
    } else {
      width += 1;
    }
  }

  return width;
}

function chooseBreakPosition(text, limit, minLastLine) {
  const characters = Array.from(text);

  if (getTextWidth(text) <= limit) {
    return characters.length;
  }

  const candidates = [];

  for (
    let position = 1;
    position < characters.length;
    position++
  ) {
    const left = characters
      .slice(0, position)
      .join("");

    const right = characters
      .slice(position)
      .join("");

    const leftWidth = getTextWidth(left);
    const rightWidth = getTextWidth(right);

    if (leftWidth > limit) {
      break;
    }

    // 句読点を行頭に置かない
    if (/^[、。！？!?）)」』]/.test(right)) {
      continue;
    }

    // 最終行が短くなりすぎる候補を避ける
    if (rightWidth < minLastLine) {
      continue;
    }

    const priority = getBreakPriority(
      left,
      position
    );

    const fillRatio = leftWidth / limit;

    let score = priority + fillRatio * 25;

    // 2行に収まる場合は長さの偏りを抑える
    if (rightWidth <= limit) {
      score -= Math.abs(
        leftWidth - rightWidth
      ) * 3;
    }

    // 極端に短い行を避ける
    if (fillRatio < 0.45) {
      score -= 80;
    }

    candidates.push({
      position,
      score,
    });
  }

  if (candidates.length === 0) {
    let position = 1;

    while (
      position < characters.length &&
      getTextWidth(
        characters
          .slice(0, position + 1)
          .join("")
      ) <= limit
    ) {
      position++;
    }

    return position;
  }

  candidates.sort(
    (a, b) => b.score - a.score
  );

  return candidates[0].position;
}

function wrapLine(line, limit) {
  if (
    !line ||
    getTextWidth(line) <= limit
  ) {
    return line;
  }

  const result = [];
  let remaining = line;

  while (
    getTextWidth(remaining) > limit
  ) {
    const position = chooseBreakPosition(
      remaining,
      limit,
      LINE_BREAK.minLastLine
    );

    const characters = Array.from(
      remaining
    );

    if (
      position <= 0 ||
      position >= characters.length
    ) {
      break;
    }

    result.push(
      characters
        .slice(0, position)
        .join("")
    );

    remaining = characters
      .slice(position)
      .join("");
  }

  if (remaining) {
    result.push(remaining);
  }

  return result.join("\n");
}

function autoWrap(text, limit) {
  if (
    typeof text !== "string" ||
    !text
  ) {
    return text;
  }

  // 原稿の改行と空行は維持
  return text
    .split("\n")
    .map((line) =>
      wrapLine(line, limit)
    )
    .join("\n");
}

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
  if (
    !section ||
    section.type !== "text"
  ) {
    return null;
  }

  const contents = [];

  if (section.heading) {
    contents.push(
      makeText(
        autoWrap(
          section.heading,
          LINE_BREAK.heading
        ),
        {
          ...typography.heading,
          color: colors.navy,
        }
      )
    );
  }

  if (section.text) {
    contents.push(
      makeText(
        autoWrap(
          section.text,
          LINE_BREAK.body
        ),
        {
          ...typography.body,
          color: colors.text,
        }
      )
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
  if (
    !section ||
    typeof section !== "object"
  ) {
    return null;
  }

  if (section.type === "image") {
    return makeImage(
      getPromiseImage(
        promiseId,
        section.imageKey
      )
    );
  }

  if (section.type === "text") {
    return makeStandardSection(section);
  }

  return null;
}

function splitHeading(heading) {
  const parts = String(
    heading || ""
  ).split("\n\n");

  return {
    title: parts[0] || "",
    phrase: parts
      .slice(1)
      .join("\n\n"),
  };
}

function makeChapterHeader(
  section,
  chapterNumber
) {
  const { title } = splitHeading(
    section.heading
  );

  return {
    type: "box",
    layout: "vertical",
    backgroundColor: chapter.backgroundColor,
    paddingAll: chapter.padding,
    spacing: chapter.spacing,
    contents: [
      makeText(
        `${chapter.prefix} ${String(
          chapterNumber
        ).padStart(
          chapter.numberDigits,
          "0"
        )}`,
        chapter.number
      ),
      makeText(
        autoWrap(
          title,
          LINE_BREAK.chapterTitle
        ),
        chapter.title
      ),
    ],
  };
}

function makeChapterPhrase(section) {
  const { phrase } = splitHeading(
    section.heading
  );

  if (!phrase) {
    return null;
  }

  return makeText(
    autoWrap(
      phrase,
      LINE_BREAK.phrase
    ),
    chapter.phrase
  );
}

function makeChapterBody(section) {
  if (!section.text) {
    return null;
  }

  const paragraphs = section.text.split(
    "\n\n"
  );

  const lastParagraph = paragraphs.pop();

  const contents = [];

  if (paragraphs.length > 0) {
    contents.push(
      makeText(
        autoWrap(
          paragraphs.join("\n\n"),
          LINE_BREAK.body
        ),
        {
          ...typography.body,
          color: colors.text,
        }
      )
    );
  }

  if (lastParagraph) {
    contents.push(
      makeText(
        autoWrap(
          lastParagraph,
          LINE_BREAK.body
        ),
        {
          ...chapter.emphasis,
          margin:
            paragraphs.length > 0
              ? chapter.emphasis.margin
              : "none",
        }
      )
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
    makeChapterHeader(
      textSection,
      chapterNumber
    ),
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

  const phrase = makeChapterPhrase(
    textSection
  );

  if (phrase) {
    contents.push(phrase);
  }

  const body = makeChapterBody(
    textSection
  );

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
      makeText(
        autoWrap(
          section.heading,
          LINE_BREAK.finalHeading
        ),
        final.heading
      )
    );
  }

  if (section.text) {
    contents.push(
      makeText(
        autoWrap(
          section.text,
          LINE_BREAK.finalBody
        ),
        final.body
      )
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

function makePromiseSections(
  sections,
  promiseId
) {
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
  if (
    sections[index]?.type === "image"
  ) {
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
  if (
    sections[index]?.type === "text"
  ) {
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

    // 最後の単独文章は締め
    if (
      current?.type === "text" &&
      index === sections.length - 1
    ) {
      const closing = makeFinalSection(
        current
      );

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

  const sectionComponents =
    makePromiseSections(
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
