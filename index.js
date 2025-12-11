// index.js
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const inputFolder = "./images";
const outputFolder = "./output";
const watermarkPath = "./watermark.png"; // path watermark kamu

if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder);

async function prepareWatermarkBuffer(maxWidth) {
  // 1) baca watermark asli
  const wm = sharp(watermarkPath);

  // 2) buat mask: grayscale -> threshold => 1-channel mask (white = area logo)
  const maskBuf = await wm
    .clone()
    .greyscale()
    .threshold(10) // nilai threshold bisa di-tweak (10..30)
    .toBuffer();

  // 3) ambil ukuran asli watermark untuk scaling
  const meta = await wm.metadata();
  const scale =
    maxWidth && meta.width && meta.width > maxWidth ? maxWidth / meta.width : 1;

  // 4) resize watermark sesuai skala dan apply mask sebagai alpha channel
  // buat watermark RGB (tanpa alpha tambahan) lalu composite mask sebagai alpha (dest-in)
  const watermarkResized = await wm
    .clone()
    .resize(Math.round((meta.width || 0) * scale))
    .ensureAlpha() // supaya ada channel alpha untuk composite berikutnya
    .toBuffer();

  // mask harus di-resize sama seperti watermark
  const maskResized = await sharp(maskBuf)
    .resize(Math.round((meta.width || 0) * scale), null, { kernel: "lanczos3" })
    .toBuffer();

  // apply mask: gunakan mask sebagai alpha channel (dest-in)
  const watermarkWithAlpha = await sharp(watermarkResized)
    .composite([{ input: maskResized, blend: "dest-in" }])
    .png()
    .toBuffer();

  return watermarkWithAlpha;
}

(async () => {
  const files = fs
    .readdirSync(inputFolder)
    .filter((f) => f.match(/\.(jpg|jpeg|png|webp)$/i));

  for (const file of files) {
    const inputPath = path.join(inputFolder, file);
    const outputPath = path.join(outputFolder, file);

    try {
      const image = sharp(inputPath);
      const meta = await image.metadata();

      // tentukan ukuran watermark relatif (misal 20% lebar gambar)
      const wmMaxWidth = Math.round((meta.width || 800) * 0.2);

      const wmBuffer = await prepareWatermarkBuffer(wmMaxWidth);

      // letakkan di pojok kanan atas dengan margin (misal 20px)
      const margin = 20;

      // composite watermark: gunakan 'over' agar lebih predictable + opacity
      await image
        .composite([
          {
            input: wmBuffer,
            gravity: "northeast",
            blend: "over",
            top: margin, // when using gravity these are offsets from the edge
            left: margin,
            // opacity here works if libvips supports it; otherwise watermark already has alpha
            opacity: 0.85,
          },
        ])
        .toFile(outputPath);

      console.log("Watermark selesai:", file);
    } catch (err) {
      console.error("Gagal memproses", file, err);
    }
  }
})();
