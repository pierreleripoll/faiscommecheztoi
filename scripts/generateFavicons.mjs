// Fabrique le favicon à partir du tracé du nuage-menu (components/SiteNav.vue) :
// un carré au rose de la page, le nuage en magenta plein dedans. Le nuage est
// dessiné, pas tramé — on aplatit ses courbes de Bézier et on remplit le
// polygone, ce qui donne un bord net à 16 px sans dépendre d'un moteur SVG.
//
// Écrit public/favicon.svg (vectoriel, servi aux navigateurs modernes),
// public/favicon.ico (16/32/48, pour le reste et pour /favicon.ico que les
// navigateurs demandent d'office) et public/apple-touch-icon.png (180).
// À relancer si le tracé change : `node scripts/generateFavicons.mjs`.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");

const C_FOND = "#ffbfff"; // --c-bg
const C_NUAGE = "#ff00ff"; // --c-ink
const COTE = 32; // côté de la boîte de dessin du SVG
const MARGE = 1.5; // air autour du nuage, en unités de cette boîte

// Le tracé vit dans le composant : une seule source, pas de copie à resynchroniser.
const nav = readFileSync(join(racine, "components/SiteNav.vue"), "utf8");
const d = nav.match(/const NUAGE_MENU =\s*\n\s*"([^"]+)"/)[1];

// Boîte réelle du DESSIN, pas celle du fichier : le tracé ne remplit pas sa
// boîte de 45 × 27 (le contour de l'export tombe à mi-course, d'où une unité de
// marge de chaque côté). On aplatit les courbes plutôt que de prendre les
// points de contrôle, qui débordent de la courbe et décentreraient le nuage.
function points(d) {
  const jetons = d.match(/[MCLZ]|-?\d*\.?\d+(?:e-?\d+)?/g);
  const sortie = [];
  let i = 0;
  let cmd = "M";
  let cur = [0, 0];
  const n = () => Number(jetons[i++]);
  while (i < jetons.length) {
    if (/[MCLZ]/.test(jetons[i])) {
      cmd = jetons[i++];
      continue;
    }
    if (cmd === "M" || cmd === "L") {
      cur = [n(), n()];
      sortie.push(cur);
      if (cmd === "M") cmd = "L";
    } else if (cmd === "C") {
      const p0 = cur;
      const p1 = [n(), n()];
      const p2 = [n(), n()];
      const p3 = [n(), n()];
      for (let k = 1; k <= 8; k++) {
        const t = k / 8;
        const m = 1 - t;
        sortie.push([
          m ** 3 * p0[0] + 3 * m * m * t * p1[0] + 3 * m * t * t * p2[0] + t ** 3 * p3[0],
          m ** 3 * p0[1] + 3 * m * m * t * p1[1] + 3 * m * t * t * p2[1] + t ** 3 * p3[1],
        ]);
      }
      cur = p3;
    } else i++;
  }
  return sortie;
}

const pts = points(d);
const x0 = Math.min(...pts.map((p) => p[0]));
const x1 = Math.max(...pts.map((p) => p[0]));
const y0 = Math.min(...pts.map((p) => p[1]));
const y1 = Math.max(...pts.map((p) => p[1]));

const echelle = (COTE - 2 * MARGE) / (x1 - x0);
const tx = MARGE - x0 * echelle;
const ty = (COTE - (y1 - y0) * echelle) / 2 - y0 * echelle;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${COTE} ${COTE}">
  <rect width="${COTE}" height="${COTE}" fill="${C_FOND}"/>
  <g transform="translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${echelle.toFixed(5)})">
    <path d="${d}" fill="${C_NUAGE}"/>
  </g>
</svg>
`;
writeFileSync(join(racine, "public/favicon.svg"), svg);

const png = (taille) =>
  sharp(Buffer.from(svg)).resize(taille, taille).png().toBuffer();

writeFileSync(join(racine, "public/apple-touch-icon.png"), await png(180));

// ICO : un en-tête de 6 octets, un répertoire de 16 octets par image, puis les
// PNG bruts (l'ICO les accepte depuis Vista, et c'est plus léger qu'un BMP).
const tailles = [16, 32, 48];
const images = [];
for (const t of tailles) images.push(await png(t));

const entete = Buffer.alloc(6);
entete.writeUInt16LE(0, 0);
entete.writeUInt16LE(1, 2); // type : icône
entete.writeUInt16LE(tailles.length, 4);

let offset = 6 + 16 * tailles.length;
const repertoire = tailles.map((t, i) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(t === 256 ? 0 : t, 0);
  e.writeUInt8(t === 256 ? 0 : t, 1);
  e.writeUInt8(0, 2); // palette
  e.writeUInt8(0, 3);
  e.writeUInt16LE(1, 4); // plans
  e.writeUInt16LE(32, 6); // bits par pixel
  e.writeUInt32LE(images[i].length, 8);
  e.writeUInt32LE(offset, 12);
  offset += images[i].length;
  return e;
});

writeFileSync(
  join(racine, "public/favicon.ico"),
  Buffer.concat([entete, ...repertoire, ...images])
);

console.log(
  `Favicons : public/favicon.svg, favicon.ico (${tailles.join("/")}), apple-touch-icon.png (180).`
);
