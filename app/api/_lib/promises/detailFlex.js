
import { getPromiseById, getNextPromise } from "./index.js";
import { PROMISE_CONTENT } from "./content.js";
import { PROMISE_THEME } from "./theme.js";
import { getPromiseImages } from "./images.js";

const { colors, typography, spacing } = PROMISE_THEME;

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
  if (!image || typeof image.url !== "string") {
    return null;
  }

  if (!/^https:\/\//.test(image.url)) {
    return null;
  }

  return {
    type: "image",
    url: image.url,
    size: "full",
    aspectRatio: image.aspectRatio || "4:3",
    aspectMode: "fit",
  };
}

function makeSection(section) {
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
  const images = getPromiseImages(id);

  const sectionBoxes = sections
    .map(makeSection)
    .filter(Boolean);

  const imageComponents = images
    .map(makeImage)
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
              ...sectionBoxes,
              ...imageComponents,
              ...buttons,
            ],
          },
        ],
      },
    },
  };
}
