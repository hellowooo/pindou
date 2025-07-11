// colorTable.js
// 读取public/color_table.csv，解析为色号-色值映射

export async function loadColorTable() {
  const response = await fetch(process.env.PUBLIC_URL + '/color_table.csv');
  const text = await response.text();
  const lines = text.trim().split('\n');
  const result = [];
  for (let i = 1; i < lines.length; i++) {
    const [name, hex] = lines[i].split(',');
    if (name && hex) {
      // 只保留A-M开头的色号
      if (/^[A-Ma-m]/.test(name.trim())) {
        result.push({ name: name.trim(), hex: hex.trim().toUpperCase() });
      }
    }
  }
  return result; // [{name: 'A1', hex: '#FAF4C8'}, ...]
}

// 转为色号->色值映射对象
export async function getColorMap() {
  const table = await loadColorTable();
  const map = {};
  table.forEach(({ name, hex }) => {
    map[name] = hex;
  });
  return map;
} 