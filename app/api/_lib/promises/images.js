
export const PROMISE_IMAGES = Object.freeze({
  "01": Object.freeze({}),
  "02": Object.freeze({}),
  "03": Object.freeze({}),
  "04": Object.freeze({}),
  "05": Object.freeze({}),
});

export function getPromiseImage(id, imageKey) {
  if (typeof imageKey !== "string" || !imageKey) {
    return null;
  }

  return PROMISE_IMAGES[id]?.[imageKey] ?? null;
}

export function getPromiseImages(id) {
  return Object.values(PROMISE_IMAGES[id] ?? {});
}
