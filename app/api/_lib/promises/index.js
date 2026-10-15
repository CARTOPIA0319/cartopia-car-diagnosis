import { PROMISES } from "./config.js";

export function getPromiseList() {
  return PROMISES;
}

export function getPromiseById(id) {
  return PROMISES.find((promise) => promise.id === id) ?? null;
}

export function getNextPromise(id) {
  const index = PROMISES.findIndex((promise) => promise.id === id);

  if (index === -1) {
    return null;
  }

  return PROMISES[index + 1] ?? null;
}
