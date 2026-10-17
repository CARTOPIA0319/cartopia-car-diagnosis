
import { getPromiseById, getNextPromise } from "./index.js";
import { PROMISE_CONTENT } from "./content.js";
import { PROMISE_THEME } from "./theme.js";
import { getPromiseImage } from "./images.js";

const { colors, typography, spacing } = PROMISE_THEME;

// すべての約束で共通の画像表示比率
const PROMISE_IMAGE_ASPECT_RATIO = "16:9";

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

function makeSection(section, promiseId) {
  if (!section || typeof section !== "object") {
    return null;
  }

  if (section.type === "image") {
    const image = getPromiseImage(
      promiseId,
      section.imageKey
    );

    return makeImage(image);
  }

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

export function makePromiseDetailFlex(id) {
  const promise = getPromiseById(id);

  if (!promise) {
    return null;
  }

  const nextPromise = getNextPromise(id);
  const sections = PROMISE_CONTENT[id]?.sections || [];

  const sectionComponents = sections
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
