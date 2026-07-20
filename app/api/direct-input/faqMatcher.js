// app/api/direct-input/faqMatcher.js

import { FAQ_DATA } from "./faqData";

function normalize(text) {
  return String(text ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/g, "")
    .trim();
}

export function findFaq(input) {
  const text = normalize(input);

  if (!text) {
    return null;
  }

  for (const faq of FAQ_DATA) {
    const keywords = Array.isArray(faq.keywords)
      ? faq.keywords
      : [];

    for (const keyword of keywords) {
      if (
        text.includes(
          normalize(keyword),
        )
      ) {
        return {
          id: faq.id ?? null,
          type: "faq",
          title: faq.title,
          answer: faq.answer,
          matchedKeyword: keyword,
          confidence: "high",
        };
      }
    }
  }

  return null;
}

export default findFaq;
