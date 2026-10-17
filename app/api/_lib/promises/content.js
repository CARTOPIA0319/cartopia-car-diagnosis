
export const PROMISE_CONTENT = Object.freeze({
  "01": {
    sections: [
      {
        type: "intro",
        heading: "販売する車への約束",
        text: "",
      },
    ],
  },

  "02": {
    sections: [],
  },

  "03": {
    sections: [],
  },

  "04": {
    sections: [],
  },

  "05": {
    sections: [],
  },
});

/*
  各約束の sections には、次の形式を
  好きな順番で登録できます。

  【文章】
  {
    type: "text",
    heading: "見出し",
    text: "本文",
  }

  【画像】
  {
    type: "image",
    imageKey: "画像の管理番号",
  }

  画像のURLは images.js で一元管理します。

  例：
  sections: [
    { type: "text", heading: "導入", text: "本文" },
    { type: "image", imageKey: "intro" },
    { type: "text", heading: "第1章", text: "本文" },
    { type: "image", imageKey: "chapter1" },
  ]

  文字のデザインは theme.js で統一します。
*/
