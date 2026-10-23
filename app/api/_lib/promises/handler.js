
import { makePromiseListFlex } from "./listFlex.js";
import { makePromiseDetailFlex } from "./detailFlex.js";

export function handlePromiseEvent(text, postbackData) {
  const isListRequest =
    text === "約束" ||
    text === "5つの約束" ||
    postbackData === "promise|list" ||
    postbackData === "switch-to-promise-menu";

  if (isListRequest) {
    return makePromiseListFlex();
  }

  if (!postbackData.startsWith("promise|")) {
    return null;
  }

  const id = postbackData.slice("promise|".length);

  return makePromiseDetailFlex(id);
}
