<template>
  <!--
    Nuage « Appel à projet » flottant, fermable. L'état de fermeture est
    partagé entre toutes les instances (hero + participer) via useState.
  -->
  <div v-if="open && appel" class="appel-cloud" :class="`appel-cloud--${variant}`">
    <a class="appel-cloud__link" :href="appel.url || '#participer'">
      <svg class="appel-cloud__shape" viewBox="0 0 340 168" aria-hidden="true">
        <circle cx="78" cy="102" r="54" />
        <circle cx="152" cy="66" r="60" />
        <circle cx="235" cy="76" r="56" />
        <circle cx="286" cy="112" r="46" />
        <rect x="32" y="86" width="286" height="72" rx="36" />
      </svg>
      <span class="appel-cloud__label">{{ appel.label || "Appel à projet" }}</span>
    </a>
    <button class="appel-cloud__close" aria-label="Fermer" @click="open = false">
      ×
    </button>
    <svg
      v-if="variant === 'participer'"
      class="appel-cloud__puff"
      viewBox="0 0 120 60"
      aria-hidden="true"
    >
      <circle cx="38" cy="34" r="22" />
      <circle cx="68" cy="24" r="24" />
      <circle cx="92" cy="38" r="18" />
      <rect x="16" y="30" width="90" height="26" rx="13" />
    </svg>
  </div>
</template>

<script setup>
defineProps({
  appel: { type: Object, default: null },
  variant: { type: String, default: "hero" },
});

const open = useState("appel-cloud-open", () => true);
</script>

<style scoped>
.appel-cloud {
  position: absolute;
  width: clamp(190px, 34vw, 340px);
  z-index: 10;
  filter: drop-shadow(0 0 18px rgba(251, 93, 253, 0.45));
}

.appel-cloud--hero {
  right: var(--pad-x);
  bottom: -3.5rem;
}

.appel-cloud--participer {
  left: calc(var(--pad-x) + 2vw);
  top: 38%;
}

.appel-cloud__link {
  display: block;
  position: relative;
  text-decoration: none;
}

.appel-cloud__shape {
  display: block;
  width: 100%;
  fill: var(--c-cloud);
}

.appel-cloud__label {
  position: absolute;
  inset: 28% 20% 10%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--c-cloud-ink);
  font-weight: 700;
  font-size: clamp(0.9rem, 0.5rem + 1.6vw, 1.6rem);
  line-height: 1.25;
}

.appel-cloud__close {
  position: absolute;
  top: 26%;
  right: 14%;
  border: 0;
  background: none;
  color: var(--c-cloud-ink);
  font: inherit;
  font-size: clamp(1.1rem, 0.7rem + 1.4vw, 1.7rem);
  font-weight: 700;
  cursor: pointer;
  line-height: 1;
  padding: 0.1em;
}

.appel-cloud__puff {
  position: absolute;
  left: 58%;
  bottom: -34%;
  width: 38%;
  fill: var(--c-cloud);
}
</style>
