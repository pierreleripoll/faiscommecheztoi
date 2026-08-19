// Walks every Markdown file under content/ and fills in machine-generated
// image metadata (width/height/ratio + thumbhash) for any frontmatter image
// entry that lacks it. Only absent fields are written, so re-running is safe.
// Adapted from mariaclaracastioni's script: instead of fixed collections it
// scans recursively and handles any array of {src} objects (images, posters,
// logos, ...) plus single object fields (photo, image).
import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import * as thumbhash from "thumbhash";
import sharp from "sharp";

const contentDir = path.resolve("content");

// Frontmatter keys that may hold images.
const ARRAY_KEYS = ["images", "posters", "logos", "photos"];
const OBJECT_KEYS = ["photo", "image"];

function getImagePath(src) {
  if (src.startsWith("/")) {
    return path.join(process.cwd(), "public", src);
  }
  return path.join(process.cwd(), "public", "uploads", src);
}

async function generateThumbhash(imagePath) {
  try {
    const imageBuffer = await sharp(imagePath).resize(40).toBuffer();
    const { data: imageData, info } = await sharp(imageBuffer)
      .raw()
      .ensureAlpha()
      .toBuffer({ resolveWithObject: true });
    const hash = thumbhash.rgbaToThumbHash(info.width, info.height, imageData);
    const ratio = thumbhash.thumbHashToApproximateAspectRatio(hash);
    return { hash: Buffer.from(hash).toString("base64"), ratio };
  } catch (err) {
    console.error(`Error generating thumbhash: ${err.message}`);
    return null;
  }
}

async function fillImageEntry(image, file) {
  if (!image || typeof image !== "object" || !image.src) return false;
  const imgPath = getImagePath(image.src);
  let changed = false;

  if (!image.width || !image.height) {
    try {
      const metadata = await sharp(imgPath).metadata();
      image.width = metadata.width;
      image.height = metadata.height;
      image.ratio = metadata.width / metadata.height;
      changed = true;
    } catch (err) {
      console.error(
        `Error reading image dimensions ${image.src} in ${file}: ${err.message}`
      );
    }
  }

  if (!image.thumbhash) {
    const result = await generateThumbhash(imgPath);
    if (result) {
      image.thumbhash = result.hash;
      image.thumbhashRatio = result.ratio;
      changed = true;
    }
  }

  return changed;
}

async function updateFile(filePath, file) {
  const content = await fs.readFile(filePath, "utf8");
  const parsed = matter(content);
  let changed = false;

  for (const key of ARRAY_KEYS) {
    if (Array.isArray(parsed.data[key])) {
      for (const image of parsed.data[key]) {
        if (await fillImageEntry(image, file)) changed = true;
      }
    }
  }
  for (const key of OBJECT_KEYS) {
    if (await fillImageEntry(parsed.data[key], file)) changed = true;
  }

  if (changed) {
    const updated = matter.stringify(parsed.content, parsed.data);
    await fs.writeFile(filePath, updated, "utf8");
    console.log(`Updated ${file}`);
  }
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full);
    } else if (entry.name.endsWith(".md")) {
      await updateFile(full, path.relative(contentDir, full));
    }
  }
}

await walk(contentDir);
console.log("Image metadata up to date.");
