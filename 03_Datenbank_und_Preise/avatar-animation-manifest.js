/**
 * Pauli Münz-Avatar — 5 Animations-Slots (OpenAI-Loops + CSS-Fallback).
 * Prompts exakt laut Produkt-Spezifikation.
 */
(function (global) {
  "use strict";

  var BASE = "/assets/avatar/";

  global.OSG_AVATAR_ANIMATION_MANIFEST = Object.freeze({
    FRONT_IMAGE: "/Frontseite02.png",
    BACK_IMAGE: "/hinterseite.png",
    PREMIUM_PURCHASE_MIN_THB: 500,
    LOCKED_FULL_ROTATION_MS: 12000,
    slots: Object.freeze({
      wai_greeting: Object.freeze({
        id: 1,
        key: "wai_greeting",
        label: "Thai Wai greeting (app start)",
        prompt:
          "Animate the face on this gold coin performing a welcoming gesture. The coin stays fixed in place in the top-right position, but the avatar’s facial expression shifts to a warm, authentic smile, combined with a subtle nod and a stylized representation of a traditional Thai Wai greeting. High-quality smooth render, looping fluidly, transparent background.",
        webm: BASE + "01-wai-greeting.webm",
        mp4: BASE + "01-wai-greeting.mp4",
        poster: BASE + "01-wai-greeting-poster.png",
      }),
      speak: Object.freeze({
        id: 2,
        key: "speak",
        label: "Normal speech (all i18n TTS)",
        prompt:
          "Animate the existing face on this gold coin. The coin remains completely static in the upper right corner of the frame. Only the facial features of the avatar come to life: natural eye blinking, subtle facial muscle movements, and realistic, highly synchronized mouth movements that perfectly match text-to-speech audio. Keep the background transparent. Professional mobile app UI animation.",
        webm: BASE + "02-speak-loop.webm",
        mp4: BASE + "02-speak-loop.mp4",
        poster: BASE + "02-speak-loop-poster.png",
      }),
      purchase_standard: Object.freeze({
        id: 3,
        key: "purchase_standard",
        label: "Standard purchase comment (< 500 THB)",
        prompt:
          "Animate the face on this gold coin to show a proud, approving expression. The avatar smiles warmly, nods its head in agreement, and speaks a short, encouraging confirmation message. The coin remains fixed in the top-right position. High-quality smooth render, transparent background.",
        webm: BASE + "03-purchase-standard.webm",
        mp4: BASE + "03-purchase-standard.mp4",
        poster: BASE + "03-purchase-standard-poster.png",
      }),
      purchase_premium: Object.freeze({
        id: 4,
        key: "purchase_premium",
        label: "Premium fireworks (≥ 500 THB)",
        prompt:
          "Animate this coin image to celebrate a major milestone purchase over 500 Baht. The avatar face on the coin cheers enthusiastically with a huge smile and a celebratory wink, while spectacular, colorful 3D fireworks explode all around the golden coin. Premium reward effect, high energy, smooth loop, transparent background.",
        webm: BASE + "04-purchase-premium.webm",
        mp4: BASE + "04-purchase-premium.mp4",
        poster: BASE + "04-purchase-premium-poster.png",
      }),
      locked_carousel: Object.freeze({
        id: 5,
        key: "locked_carousel",
        label: "Silent coin carousel (90-day lock)",
        prompt:
          "Animate this gold coin to perform a seamless, endless 360-degree rotation on its vertical axis against a perfectly transparent background. The speed must be very slow and precise: a 180-degree turn must take exactly 6 seconds (meaning a full 360-degree rotation takes 12 seconds). The coin shows the avatar face on the front and the Garuda symbol on the back as provided in the images. The movement must be completely smooth and loopable for a top-right mobile app UI position.",
        webm: BASE + "05-locked-carousel.webm",
        mp4: BASE + "05-locked-carousel.mp4",
        poster: BASE + "05-locked-carousel-poster.png",
      }),
    }),
  });
})(typeof window !== "undefined" ? window : globalThis);
