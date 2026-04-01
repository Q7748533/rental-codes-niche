/**
 * 转换 SVG OG 图片为 JPG 格式
 * 运行: node scripts/convert-og-image.js
 */

const sharp = require('sharp');
const path = require('path');

async function convertSvgToJpg() {
  try {
    const inputPath = path.join(__dirname, '..', 'public', 'og-image.svg');
    const outputPath = path.join(__dirname, '..', 'public', 'og-image.jpg');

    console.log('Converting SVG to JPG...');
    console.log('Input:', inputPath);
    console.log('Output:', outputPath);

    await sharp(inputPath)
      .resize(1200, 630, { fit: 'contain', background: { r: 37, g: 99, b: 235 } })
      .jpeg({ quality: 90 })
      .toFile(outputPath);

    console.log('✅ Conversion successful!');
    console.log('OG Image saved to:', outputPath);
  } catch (error) {
    console.error('❌ Conversion failed:', error.message);
    process.exit(1);
  }
}

convertSvgToJpg();
