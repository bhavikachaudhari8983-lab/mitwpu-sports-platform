// Generates fictional placeholder "photos" (a silhouette portrait) as PNG with no native deps.
// Used by the mock ERP/DigiLocker/passport services and by the seed script. Never a real face.
import { createHash } from "node:crypto";
import { deflateSync } from "node:zlib";

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

type RGB = [number, number, number];
const SKIN: RGB[] = [[241, 194, 125], [224, 172, 105], [198, 134, 66], [141, 85, 36], [255, 219, 172], [176, 116, 72]];
const HAIR: RGB[] = [[35, 25, 20], [60, 40, 30], [20, 20, 20], [90, 60, 40]];
const SHIRT: RGB[] = [[11, 31, 58], [21, 128, 61], [180, 83, 9], [71, 85, 105], [124, 58, 237], [14, 116, 144]];
const BG_ID: RGB = [232, 238, 245];
const BG_SELFIE: RGB[] = [[203, 213, 225], [214, 211, 209], [190, 205, 190], [222, 206, 186]];

export type PortraitVariant = "official" | "selfie";

/** Deterministic per-person portrait. "official" = plain ID background; "selfie" = slightly different framing/background. */
export function placeholderPortrait(seed: string, variant: PortraitVariant = "official", width = 300, height = 380): Buffer {
  const h = createHash("sha256").update(seed).digest();
  const skin = SKIN[h[0] % SKIN.length];
  const hair = HAIR[h[1] % HAIR.length];
  const shirt = SHIRT[h[2] % SHIRT.length];
  const bg = variant === "official" ? BG_ID : BG_SELFIE[h[3] % BG_SELFIE.length];
  const shift = variant === "selfie" ? width * 0.04 : 0;
  const scale = variant === "selfie" ? 1.08 : 1;

  const cx = width / 2 + shift;
  const headY = height * 0.4;
  const headR = width * 0.19 * scale;
  const hairLong = h[4] % 2 === 0;

  const raw = Buffer.alloc((width * 3 + 1) * height);
  let o = 0;
  for (let y = 0; y < height; y++) {
    raw[o++] = 0;
    for (let x = 0; x < width; x++) {
      let c: RGB = bg;
      if (variant === "selfie") {
        const shade = 1 - (y / height) * 0.15;
        c = [bg[0] * shade, bg[1] * shade, bg[2] * shade];
      }
      const dxs = (x - cx) / (width * 0.44 * scale);
      const dys = (y - height * 1.05) / (height * 0.4);
      if (dxs * dxs + dys * dys <= 1) c = shirt;
      const neck = Math.abs(x - cx) < headR * 0.45 && y > headY && y < headY + headR * 1.5;
      if (neck) c = [skin[0] * 0.92, skin[1] * 0.92, skin[2] * 0.92];
      const dx = x - cx;
      const dy = y - headY;
      const inHair = (dx * dx) / ((headR * 1.08) ** 2) + ((dy + headR * 0.12) ** 2) / ((headR * 1.12) ** 2) <= 1;
      const longHair = hairLong && Math.abs(dx) < headR * 1.1 && dy > -headR * 0.2 && dy < headR * 1.3;
      if ((inHair && dy < headR * 0.05) || longHair) c = hair;
      if ((dx * dx) / (headR * headR) + (dy * dy) / ((headR * 1.18) ** 2) <= 1 && dy > -headR * 0.55) c = skin;
      raw[o++] = Math.round(c[0]);
      raw[o++] = Math.round(c[1]);
      raw[o++] = Math.round(c[2]);
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // truecolour RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
