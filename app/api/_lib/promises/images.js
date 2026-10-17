
export const PROMISE_IMAGES = Object.freeze({
  "01": Object.freeze({
    hero: Object.freeze({
      url: "https://cartopia-car-diagnosis.vercel.app/promises/01/F54CECFE-871C-441E-A692-A1A6F6C43D56.png",
    }),
    auction: Object.freeze({
      url: "https://cartopia-car-diagnosis.vercel.app/promises/01/IMG_5632.jpeg",
    }),
    documents: Object.freeze({
      url: "https://cartopia-car-diagnosis.vercel.app/promises/01/IMG_5633.jpeg",
    }),
    engine: Object.freeze({
      url: "https://cartopia-car-diagnosis.vercel.app/promises/01/IMG_5634.jpeg",
    }),
    underbody: Object.freeze({
      url: "https://cartopia-car-diagnosis.vercel.app/promises/01/IMG_5635.jpeg",
    }),
    customer: Object.freeze({
      url: "https://cartopia-car-diagnosis.vercel.app/promises/01/IMG_5636.jpeg",
    }),
  }),
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
