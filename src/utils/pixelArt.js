// pixelArt.js
// 图片转像素画核心逻辑
import { rgb_to_lab, diff } from 'color-diff';

// 计算图片缩放后的像素数据
export function getResizedImageData(img, pixelWidth, pixelHeight) {
  const canvas = document.createElement('canvas');
  canvas.width = pixelWidth;
  canvas.height = pixelHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, pixelWidth, pixelHeight);
  return ctx.getImageData(0, 0, pixelWidth, pixelHeight);
}

// 取主色（平均色）
function getBlockColor(data, x, y, blockW, blockH, imgW) {
  let r = 0, g = 0, b = 0, count = 0;
  for (let dy = 0; dy < blockH; dy++) {
    for (let dx = 0; dx < blockW; dx++) {
      const px = (y * blockH + dy) * imgW + (x * blockW + dx);
      const i = px * 4;
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      count++;
    }
  }
  return {
    r: Math.round(r / count),
    g: Math.round(g / count),
    b: Math.round(b / count)
  };
}

// hex转rgb
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16)
  };
}

// 生成像素画canvas
export function generatePixelArt({
  img,
  pixelWidth,
  pixelHeight,
  cellSize = 24,
  colorTable,
  showGrid = true,
  font = 'bold 12px sans-serif'
}) {
  // 1. 缩放图片，获取像素数据
  const imageData = getResizedImageData(img, pixelWidth, pixelHeight);
  const { data } = imageData;

  // 2. 标准色准备
  const palette = colorTable.map(c => ({
    ...hexToRgb(c.hex),
    name: c.name,
    hex: c.hex
  }));
  const paletteLab = palette.map(c => ({
    ...rgb_to_lab(c),
    name: c.name,
    hex: c.hex
  }));

  // 3. 生成像素画数据
  const result = [];
  for (let y = 0; y < pixelHeight; y++) {
    const row = [];
    for (let x = 0; x < pixelWidth; x++) {
      const i = (y * pixelWidth + x) * 4;
      const rgb = { r: data[i], g: data[i + 1], b: data[i + 2] };
      // 找最近标准色
      const lab = rgb_to_lab(rgb);
      let minDist = Infinity, minIdx = 0;
      for (let j = 0; j < paletteLab.length; j++) {
        const d = diff(lab, paletteLab[j]);
        if (d < minDist) {
          minDist = d;
          minIdx = j;
        }
      }
      row.push(palette[minIdx]);
    }
    result.push(row);
  }

  // 4. 绘制canvas
  const canvas = document.createElement('canvas');
  canvas.width = pixelWidth * cellSize;
  canvas.height = pixelHeight * cellSize;
  const ctx = canvas.getContext('2d');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = font;

  for (let y = 0; y < pixelHeight; y++) {
    for (let x = 0; x < pixelWidth; x++) {
      const c = result[y][x];
      // 填充色块
      ctx.fillStyle = c.hex;
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      // 写色号
      ctx.fillStyle = '#222';
      ctx.fillText(c.name, x * cellSize + cellSize / 2, y * cellSize + cellSize / 2);
    }
  }
  // 绘制网格线
  if (showGrid) {
    ctx.strokeStyle = '#888';
    for (let x = 0; x <= pixelWidth; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellSize, 0);
      ctx.lineTo(x * cellSize, pixelHeight * cellSize);
      ctx.stroke();
    }
    for (let y = 0; y <= pixelHeight; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cellSize);
      ctx.lineTo(pixelWidth * cellSize, y * cellSize);
      ctx.stroke();
    }
  }

  return { canvas, result };
} 