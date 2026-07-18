import { FAQ_DATA } from "./faqData";

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

export function findFaq(rawText) {
  const text = normalizeText(rawText);

  if (!text) {
    return null;
  }

  for (const faq of FAQ_DATA) {
    const matchedKeyword = faq.keywords.find((keyword) =>
      text.includes(normalizeText(keyword))
    );

    if (matchedKeyword) {
      return {
        type: "faq",
        title: faq.title,
        answer: faq.answer,
        matchedKeyword,
        useAi: false,
      };
    }
  }

  return null;
}
