
export const PROMISE_IMAGES = Object.freeze({
  "01": Object.freeze({
    images: [],
  }),
  "02": Object.freeze({
    images: [],
  }),
  "03": Object.freeze({
    images: [],
  }),
  "04": Object.freeze({
    images: [],
  }),
  "05": Object.freeze({
    images: [],
  }),
});

export function getPromiseImages(id) {
  return PROMISE_IMAGES[id]?.images ?? [];
}
