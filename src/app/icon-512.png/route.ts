import sharp from "sharp";

const createIconSvg = (size: number) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="#ffffff"/>
  <path d="M${size * 0.23} ${size * 0.28}h${size * 0.54}l-${size * 0.1} ${size * 0.22}h-${size * 0.21}l${size * 0.23} ${size * 0.25}h-${size * 0.19}l-${size * 0.29}-${size * 0.32} ${size * 0.08}-${size * 0.15}z" fill="#111827"/>
  <path d="M${size * 0.37} ${size * 0.39}h${size * 0.21}l-${size * 0.07} ${size * 0.15}h-${size * 0.14}l${size * 0.2} ${size * 0.21}h-${size * 0.18}l-${size * 0.3}-${size * 0.31} ${size * 0.04}-${size * 0.05}z" fill="#ffffff"/>
</svg>
`;

export async function GET() {
  const body = await sharp(Buffer.from(createIconSvg(512))).png().toBuffer();

  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
