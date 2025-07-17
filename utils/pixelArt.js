// pixelArt.js
// 图片转像素画核心逻辑
import { rgb_to_lab, diff } from 'color-diff';

// 获取原图像素数据
export function getImageData(img) {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, img.width, img.height);
  return ctx.getImageData(0, 0, img.width, img.height);
}

// 获取缩放后像素数据（原方案）
export function getResizedImageData(img, pixelWidth, pixelHeight) {
  const canvas = document.createElement('canvas');
  canvas.width = pixelWidth;
  canvas.height = pixelHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, pixelWidth, pixelHeight);
  return ctx.getImageData(0, 0, pixelWidth, pixelHeight);
}

// 取主色
function getDominantColor(data, x0, y0, blockW, blockH, imgW, excludeEdge = false) {
  let sx = x0, sy = y0, ex = x0 + blockW, ey = y0 + blockH;
  if (excludeEdge) {
    const marginX = Math.max(1, Math.floor(blockW * 0.15));
    const marginY = Math.max(1, Math.floor(blockH * 0.15));
    sx += marginX; ex -= marginX; sy += marginY; ey -= marginY;
  }
  const colorCount = {};
  let maxCount = 0;
  let dominant = { r: 0, g: 0, b: 0 };
  for (let y = sy; y < ey; y++) {
    for (let x = sx; x < ex; x++) {
      const px = y * imgW + x;
      const i = px * 4;
      const key = `${data[i]},${data[i+1]},${data[i+2]}`;
      colorCount[key] = (colorCount[key] || 0) + 1;
      if (colorCount[key] > maxCount) {
        maxCount = colorCount[key];
        dominant = { r: data[i], g: data[i+1], b: data[i+2] };
      }
    }
  }
  return dominant;
}

// 取平均色
function getAverageColor(data, x0, y0, blockW, blockH, imgW, excludeEdge = false) {
  let sx = x0, sy = y0, ex = x0 + blockW, ey = y0 + blockH;
  if (excludeEdge) {
    const marginX = Math.max(1, Math.floor(blockW * 0.15));
    const marginY = Math.max(1, Math.floor(blockH * 0.15));
    sx += marginX; ex -= marginX; sy += marginY; ey -= marginY;
  }
  let r = 0, g = 0, b = 0, count = 0;
  for (let y = sy; y < ey; y++) {
    for (let x = sx; x < ex; x++) {
      const px = y * imgW + x;
      const i = px * 4;
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      count++;
    }
  }
  return count > 0 ? {
    r: Math.round(r / count),
    g: Math.round(g / count),
    b: Math.round(b / count)
  } : { r: 0, g: 0, b: 0 };
}

// 取中心像素色
function getCenterColor(data, x0, y0, blockW, blockH, imgW, excludeEdge = false) {
  let cx = Math.floor(blockW / 2), cy = Math.floor(blockH / 2);
  if (excludeEdge) {
    // 取中心区域的中心像素
    const marginX = Math.max(1, Math.floor(blockW * 0.15));
    const marginY = Math.max(1, Math.floor(blockH * 0.15));
    cx = Math.floor((blockW - 2 * marginX) / 2) + marginX;
    cy = Math.floor((blockH - 2 * marginY) / 2) + marginY;
  }
  const px = (y0 + cy) * imgW + (x0 + cx);
  const i = px * 4;
  return {
    r: data[i],
    g: data[i + 1],
    b: data[i + 2]
  };
}

// 取对角线4/5处像素色
function getDiagonal45Color(data, x0, y0, blockW, blockH, imgW, excludeEdge = false) {
  // 计算4/5位置
  let px = Math.floor(blockW * 4 / 5);
  let py = Math.floor(blockH * 4 / 5);
  if (excludeEdge) {
    const marginX = Math.max(1, Math.floor(blockW * 0.15));
    const marginY = Math.max(1, Math.floor(blockH * 0.15));
    px = Math.floor((blockW - 2 * marginX) * 4 / 5) + marginX;
    py = Math.floor((blockH - 2 * marginY) * 4 / 5) + marginY;
  }
  const xx = x0 + px;
  const yy = y0 + py;
  const i = (yy * imgW + xx) * 4;
  return {
    r: data[i],
    g: data[i + 1],
    b: data[i + 2]
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
  font = 'bold 12px sans-serif',
  colorMode = 'dominant',
  excludeEdge = false
}) {
  let data, imgW, imgH, blockW, blockH;
  if (colorMode === 'original') {
    // 原方案：先缩放再取色
    const imageData = getResizedImageData(img, pixelWidth, pixelHeight);
    data = imageData.data;
    imgW = pixelWidth;
    imgH = pixelHeight;
    blockW = 1;
    blockH = 1;
  } else {
    // 新方案：原图分块
    const imageData = getImageData(img);
    data = imageData.data;
    imgW = imageData.width;
    imgH = imageData.height;
    blockW = Math.floor(imgW / pixelWidth);
    blockH = Math.floor(imgH / pixelHeight);
  }

  // 标准色准备
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

  // 生成像素画数据
  const result = [];
  for (let y = 0; y < pixelHeight; y++) {
    const row = [];
    for (let x = 0; x < pixelWidth; x++) {
      let rgb;
      if (colorMode === 'diagonal45') {
        const x0 = x * blockW, y0 = y * blockH;
        rgb = getDiagonal45Color(data, x0, y0, blockW, blockH, imgW, excludeEdge);
      } else if (colorMode === 'dominant') {
        const x0 = x * blockW, y0 = y * blockH;
        rgb = getDominantColor(data, x0, y0, blockW, blockH, imgW, excludeEdge);
      } else if (colorMode === 'average') {
        const x0 = x * blockW, y0 = y * blockH;
        rgb = getAverageColor(data, x0, y0, blockW, blockH, imgW, excludeEdge);
      } else if (colorMode === 'center') {
        const x0 = x * blockW, y0 = y * blockH;
        rgb = getCenterColor(data, x0, y0, blockW, blockH, imgW, excludeEdge);
      } else if (colorMode === 'original') {
        // 直接取缩放后像素
        const i = (y * imgW + x) * 4;
        rgb = { r: data[i], g: data[i + 1], b: data[i + 2] };
      } else {
        const x0 = x * blockW, y0 = y * blockH;
        rgb = getDominantColor(data, x0, y0, blockW, blockH, imgW, excludeEdge);
      }
      // 映射到标准色
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

  // 绘制canvas
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
      ctx.fillStyle = c.hex;
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      ctx.fillStyle = '#222';
      ctx.fillText(c.name, x * cellSize + cellSize / 2, y * cellSize + cellSize / 2);
    }
  }
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