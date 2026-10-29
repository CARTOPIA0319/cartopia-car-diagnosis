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

  "02": Object.freeze({
    hero: Object.freeze({
      url: "https://cartopia-car-diagnosis.vercel.app/promises/02/A2F87DF6-46B6-4DD4-8CE3-CA16F66DCB7E.png",
    }),
    customer: Object.freeze({
      url: "https://cartopia-car-diagnosis.vercel.app/promises/02/9E315387-2652-4429-A113-787828BAA672.png",
    }),
    details: Object.freeze({
      url: "https://cartopia-car-diagnosis.vercel.app/promises/02/CBD27649-BC78-4455-B508-E40DCA1C066D.png",
    }),
    polishing: Object.freeze({
      url: "https://cartopia-car-diagnosis.vercel.app/promises/02/30238D7B-9913-4917-B10F-4CD79F8C2F19.png",
    }),
    nextOwner: Object.freeze({
      url: "https://cartopia-car-diagnosis.vercel.app/promises/02/25079233-2367-413C-8A23-6F58D2B7FE79.png",
    }),
  }),

  "03": Object.freeze({
    hero: Object.freeze({
      url: "https://cartopia-car-diagnosis.vercel.app/promises/03/B994547B-1F9F-4B3E-900D-143DE8140814.jpeg",
    }),
    chapter01: Object.freeze({
      url: "https://cartopia-car-diagnosis.vercel.app/promises/03/BDBDD4B7-0EDB-4814-AFAA-06560288AD1A.jpeg",
    }),
    chapter02: Object.freeze({
      url: "https://cartopia-car-diagnosis.vercel.app/promises/03/F2AFFDAC-9802-4BF0-8693-11CA1FE5827B.jpeg",
    }),
    chapter03: Object.freeze({
      url: "https://cartopia-car-diagnosis.vercel.app/promises/03/79B4568F-3F69-44BA-BC61-9E27D9EEA998.jpeg",
    }),
    chapter04: Object.freeze({
      url: "https://cartopia-car-diagnosis.vercel.app/promises/03/3B2F0DED-7E50-44A8-AD3F-3F8A68D43BE5.jpeg",
    }),
  }),

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
