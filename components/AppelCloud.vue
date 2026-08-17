<template>
  <!--
    Nuage « Appel à projet », repris tel quel du Figma : le tracé, la couleur
    (#ff7dff), l'ombre interne blanche et la lueur magenta viennent du fichier
    de design. Tout est dimensionné en pourcentage d'une boîte de 490 × 355,
    donc le nuage entier se met à l'échelle avec --cloud-w.

    Fermable : l'état est partagé entre toutes les instances de la page
    (hero + participer) via useState.
  -->
  <div
    v-if="open && (appel || decorative)"
    class="cloud"
    :class="`cloud--${variant}`"
    :style="{ '--scale': scale }"
    :aria-hidden="decorative ? 'true' : undefined"
  >
    <svg class="cloud__shape" viewBox="0 0 490 355" aria-hidden="true">
      <defs>
        <!-- La zone du filtre est exprimée dans le repère du <g>, donc après
             son translate(31 49) : elle part de 0,0 et non de 31,49. -->
        <filter
          :id="`cloud-inner-${uid}`"
          x="0"
          y="0"
          width="428"
          height="267"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB"
        >
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="10" />
          <feGaussianBlur stdDeviation="5" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.5 0"
          />
          <feBlend mode="normal" in2="SourceGraphic" />
        </filter>
      </defs>
      <g transform="translate(31 49)" :filter="`url(#cloud-inner-${uid})`">
        <path
          d="M390.481 256.962L37.9204 257C17.8298 257 0.0857717 241.547 0.0643417 221.075L5.17068e-05 167.133C-0.0320933 140.511 14.926 117.084 38.183 104.58C51.7535 97.2822 67.0224 94.2634 82.7359 95.1857C70.3333 53.657 95.6528 11.0667 137.136 1.80112C179.021 -7.55556 220.177 20.5038 226.274 63.6732C262.989 55.5927 299.758 76.3222 311.957 112.103C334.983 96.0972 364.835 94.1133 389.876 107.813C412.41 120.14 428.021 144.339 428 171.331L427.952 221.08C427.936 241.273 410.46 256.957 390.476 256.957L390.481 256.962Z"
          fill="var(--c-cloud)"
        />
      </g>
    </svg>

    <template v-if="!decorative">
      <a class="cloud__label" :href="appel.url || '#participer'">
        {{ (appel.label || "Appel à projet").split(" ")[0] }}<br />
        {{ (appel.label || "Appel à projet").split(" ").slice(1).join(" ") }}
      </a>
      <button class="cloud__close" aria-label="Fermer" @click="open = false">
        <svg viewBox="0 0 29.25 29.25" aria-hidden="true">
          <path
            d="M1.875 27.375L27.375 1.875"
            stroke="var(--c-cloud-ink)"
            stroke-width="3.75"
            stroke-linecap="round"
          />
          <path
            d="M27.375 27.375L1.875 1.875"
            stroke="var(--c-cloud-ink)"
            stroke-width="3.75"
            stroke-linecap="round"
          />
        </svg>
      </button>
    </template>
  </div>
</template>

<script setup>
const props = defineProps({
  appel: { type: Object, default: null },
  variant: { type: String, default: "hero" },
  // Facteur d'échelle relatif au nuage du hero (1 = 490 px de large).
  scale: { type: Number, default: 1 },
  // Le petit nuage de la section Participer est purement décoratif :
  // ni texte ni bouton de fermeture.
  decorative: { type: Boolean, default: false },
});

const open = useState("appel-cloud-open", () => true);
const uid = useId();
</script>

<style scoped>
.cloud {
  position: absolute;
  width: calc(var(--cloud-w) * var(--scale, 1));
  /* Ratio de la boîte du design : 490 × 355. */
  aspect-ratio: 490 / 355;
  z-index: 10;
  filter: drop-shadow(var(--glow-cloud));
  pointer-events: none;
}

.cloud__shape {
  display: block;
  width: 100%;
  height: 100%;
}

/* Seuls le lien et la croix sont cliquables : le nuage ne doit pas bloquer
   la sélection du texte qu'il recouvre. */
.cloud__label,
.cloud__close {
  pointer-events: auto;
}

.cloud__label {
  position: absolute;
  /* Dans la maquette : y = 161 px sur 355, centré horizontalement. */
  top: 45.35%;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  text-align: center;
  text-decoration: none;
  color: var(--c-cloud-ink);
  text-transform: uppercase;
  /* 56.4 px pour un nuage de 490 px de large. */
  font-size: calc(var(--cloud-w) * var(--scale, 1) * 0.1151);
  line-height: 1;
  white-space: nowrap;
}

.cloud__close {
  position: absolute;
  /* x = 382.25, y = 182.25 sur 490 × 355. */
  left: 78.01%;
  top: 51.34%;
  width: 5.2%;
  aspect-ratio: 1;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
}

.cloud__close svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

/* Positions issues de la maquette, exprimées en proportion de la colonne. */
.cloud--hero {
  /* Desktop : x = 717 / 1280, y = 137 depuis le haut de page. */
  left: 56%;
  top: 71px;
}

.cloud--participer {
  left: 8%;
  top: 26%;
}

.cloud--puff {
  left: 33%;
  top: 40%;
}

@media (max-width: 720px) {
  .cloud--hero {
    /* Mobile : x = 116 / 375, y = 222. */
    left: 31%;
    top: 156px;
  }
}
</style>
