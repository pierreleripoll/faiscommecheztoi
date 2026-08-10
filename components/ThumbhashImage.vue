<template>
  <!--
    Stable layout: the wrapper is a fixed box; both the placeholder and the real
    image are absolutely-positioned layers using object-fit: contain, so every
    photo letterboxes into the *same* fixed box and stays centered (no per-image
    reflow or scroll shift). The placeholder is sized by a transparent SVG spacer
    at the exact real ratio, so the two layers letterbox to the identical
    rectangle. While the photo paints in progressively the blur shows through the
    transparent <img>; the opaque photo then covers it once loaded.
  -->
  <div class="thumbhash-image" :style="{ aspectRatio: boxAspectRatio }">
    <!--
      The placeholder sits behind the photo permanently. Because its ratio
      matches the photo exactly, the opaque image fully covers it once loaded —
      so there's no need to remove it on load.
    -->
    <img
      v-if="thumbPng"
      class="thumbhash-image__placeholder"
      :src="spacerSvg"
      :style="{ backgroundImage: `url(${thumbPng})` }"
      alt=""
      aria-hidden="true"
    />
    <!--
      Native <picture> for every image — the browser loads it through the normal
      image pipeline, so it paints in progressively over the placeholder. The
      priority (first/LCP) image loads eagerly with the real srcset already in
      the SSR HTML; the rest defer with loading="lazy". We render our own
      placeholder above, so no lazy-load library is needed.
    -->
    <NuxtPicture
      :src="image.src"
      :alt="alt"
      :width="image.width"
      :height="image.height"
      :sizes="sizes"
      :quality="quality"
      format="webp"
      :loading="priority ? 'eager' : 'lazy'"
      :img-attrs="imgAttrs"
    />
  </div>
</template>

<script setup>
import { computed } from "vue";
import { thumbHashToDataURL } from "thumbhash";

const props = defineProps({
  lazy: {
    type: Boolean,
    default: true,
  },
  thumbhash: {
    type: String,
    default: null,
  },
  image: {
    type: Object,
    required: true,
  },
  format: {
    type: String,
    default: "webp",
    required: false,
  },
  aspectRatio: {
    type: Number,
    default: undefined,
    required: false,
  },
  quality: {
    type: [Number, String],
    default: 80,
    required: false,
  },
  priority: {
    type: Boolean,
    default: false,
    required: false,
  },
  sizes: {
    type: String,
    default: "300px  xl:600px",
    required: false,
  },
  debug: {
    type: Boolean,
    default: false,
  },
});

const alt = computed(() => {
  return props.image.caption || props.image.alt || "Image";
});

// Both image layers are absolutely positioned, so the box has no intrinsic
// content height. We give it an aspect-ratio from the real image dimensions:
// when the parent has a definite height (desktop, 60vh), the explicit
// height: 100% wins and this is ignored; when the parent height is auto
// (mobile, stacked images), height: 100% resolves to auto and this provides
// the height — without it the box would collapse to 0 and the image vanishes.
const boxAspectRatio = computed(() => {
  if (props.aspectRatio) return String(props.aspectRatio);
  return props.image.width && props.image.height
    ? `${props.image.width} / ${props.image.height}`
    : undefined;
});

const thumbhash = computed(() => {
  return props.thumbhash || props.image.thumbhash;
});

function base64ToBytes(b64) {
  const bin =
    typeof atob === "function"
      ? atob(b64)
      : Buffer.from(b64, "base64").toString("binary");
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// Small PNG decoded from the thumbhash (its own approximate ratio); painted as
// the placeholder's background and stretched to fill, so its ratio doesn't
// matter. Pure JS, so it runs at SSR too.
const thumbPng = computed(() =>
  thumbhash.value
    ? thumbHashToDataURL(base64ToBytes(thumbhash.value))
    : undefined
);

// Transparent SVG spacer sized to the *exact* real dimensions. Used as the
// placeholder <img>'s src so native replaced-element sizing letterboxes it to
// precisely the same rectangle as the photo (no pixel-rounding error), while the
// thumbhash background fills that box. A plain empty SVG renders reliably as an
// <img> (unlike one embedding a raster data-URI).
const spacerSvg = computed(() => {
  const w = props.image.width || 100;
  const h = props.image.height || 100;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
});

// Attributes forwarded onto NuxtPicture's <img>. The priority image gets a high
// fetch priority; the rest inherit the default.
const imgAttrs = computed(() => ({
  class: "thumbhash-image__img",
  ...(props.priority ? { fetchpriority: "high" } : {}),
}));
</script>

<style scoped>
.thumbhash-image {
  position: relative;
  width: 100%;
  height: 100%;
}

/* Real image: fills the fixed box and letterboxes via object-fit: contain. It's
   rendered by a child component, so :deep() is needed to reach its <img> /
   <picture> from this scoped stylesheet. */
.thumbhash-image :deep(picture),
.thumbhash-image :deep(.thumbhash-image__img) {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}
.thumbhash-image :deep(.thumbhash-image__img) {
  display: block;
  object-fit: contain;
}

/* Placeholder: the transparent SVG spacer is sized by native replaced-element
   contain (max-width/height + auto), so its box is exactly the photo's letterbox
   rectangle — no pixel-rounding error. margin:auto centers it. The thumbhash
   background is stretched to fill that box. Sits behind the photo. */
.thumbhash-image__placeholder {
  position: absolute;
  inset: 0;
  margin: auto;
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  background-size: 100% 100%;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 0;
}
</style>
