// exportExcel.js
// 导出色号清单为Excel/CSV
import * as XLSX from 'xlsx';

// colorList: [{name, hex}, ...]
export function exportColorList(colorList, filename = '色号清单.xlsx') {
  // 去重并按色号排序
  const unique = {};
  colorList.forEach(c => { unique[c.name] = c.hex; });
  const sorted = Object.keys(unique).sort().map(name => ({ name, hex: unique[name] }));

  // 生成sheet数据
  const sheetData = [['色号', '色值']];
  sorted.forEach(c => {
    sheetData.push([c.name, c.hex]);
  });

  // 导出Excel
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '色号清单');
  XLSX.writeFile(wb, filename);
} 