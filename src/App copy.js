import logo from './logo.svg';
import React, { useRef, useState } from 'react';
import './App.css';
import { loadColorTable } from './utils/colorTable';
import { generatePixelArt } from './utils/pixelArt';
import { exportColorList } from './utils/exportExcel';
import { Button, InputNumber, Upload, message, Spin, Checkbox } from 'antd';

function App() {
  const [img, setImg] = useState(null);
  const [imgObj, setImgObj] = useState(null);
  const [pixelWidth, setPixelWidth] = useState(16);
  const [pixelHeight, setPixelHeight] = useState(16);
  const [cellSize, setCellSize] = useState(24);
  const [canvasUrl, setCanvasUrl] = useState('');
  const [usedColors, setUsedColors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lockRatio, setLockRatio] = useState(false);
  const [ratio, setRatio] = useState(1);
  const canvasRef = useRef();

  // 处理图片上传
  const handleUpload = info => {
    let file = null;
    if (info.file && info.file.originFileObj) {
      file = info.file.originFileObj;
    } else if (info.file) {
      file = info.file;
    }
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImg(url);
    const image = new window.Image();
    image.onload = () => {
      setImgObj(image);
      setRatio(image.width / image.height);
      // 若锁定长宽比，自动同步宽高
      if (lockRatio) {
        setPixelHeight(Math.round(pixelWidth / (image.width / image.height)));
      }
    };
    image.onerror = () => {
      message.error('图片加载失败，请换一张图片试试');
      setImgObj(null);
    };
    image.src = url;
  };

  // 宽度变化
  const handleWidthChange = (w) => {
    setPixelWidth(w);
    if (lockRatio && imgObj) {
      setPixelHeight(Math.round(w / ratio));
    }
  };
  // 高度变化
  const handleHeightChange = (h) => {
    setPixelHeight(h);
    if (lockRatio && imgObj) {
      setPixelWidth(Math.round(h * ratio));
    }
  };
  // 切换锁定
  const handleLockRatio = (checked) => {
    setLockRatio(checked);
    if (checked && imgObj) {
      setPixelHeight(Math.round(pixelWidth / ratio));
    }
  };

  // 生成像素画
  const handleGenerate = async () => {
    if (!imgObj) {
      message.error('请先上传图片');
      return;
    }
    setLoading(true);
    const colorTable = await loadColorTable();
    setTimeout(() => {
      const { canvas, result } = generatePixelArt({
        img: imgObj,
        pixelWidth,
        pixelHeight,
        cellSize,
        colorTable,
        showGrid: true
      });
      setCanvasUrl(canvas.toDataURL('image/png'));
      canvasRef.current = canvas;
      // 统计用到的色号
      const used = [];
      const usedSet = new Set();
      result.flat().forEach(c => {
        if (!usedSet.has(c.name)) {
          used.push({ name: c.name, hex: c.hex });
          usedSet.add(c.name);
        }
      });
      setUsedColors(used);
      setLoading(false);
    }, 100);
  };

  // 下载像素画图片
  const handleDownloadImg = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.href = canvasRef.current.toDataURL('image/png');
    link.download = '像素画.png';
    link.click();
  };

  // 下载色号清单
  const handleDownloadExcel = () => {
    exportColorList(usedColors);
  };

  return (
    <div className="App" style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
      <h2>像素画生成工具</h2>
      <div style={{ marginBottom: 16 }}>
        <Upload
          accept="image/*"
          showUploadList={false}
          beforeUpload={() => false}
          onChange={handleUpload}
        >
          <Button>上传图片</Button>
        </Upload>
      </div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
        <div>
          宽(格): <InputNumber min={2} max={128} value={pixelWidth} onChange={handleWidthChange} />
        </div>
        <div>
          高(格): <InputNumber min={2} max={128} value={pixelHeight} onChange={handleHeightChange} />
        </div>
        <div>
          <Checkbox checked={lockRatio} onChange={e => handleLockRatio(e.target.checked)}>
            锁定长宽比
          </Checkbox>
        </div>
        <div>
          单格像素(px): <InputNumber min={8} max={64} value={cellSize} onChange={setCellSize} />
        </div>
      </div>
      <Button type="primary" onClick={handleGenerate} disabled={!imgObj} loading={loading}>
        生成像素画
      </Button>
      <div style={{ margin: '24px 0' }}>
        {loading && <Spin />}
        {canvasUrl && (
          <div>
            <img src={canvasUrl} alt="像素画预览" style={{ border: '1px solid #eee', maxWidth: '100%' }} />
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <Button onClick={handleDownloadImg}>下载像素画图片</Button>
              <Button onClick={handleDownloadExcel} disabled={usedColors.length === 0}>下载色号清单</Button>
            </div>
          </div>
        )}
      </div>
      <div style={{ fontSize: 12, color: '#888' }}>
        支持自定义像素画宽高，输出带色号和网格线的像素图及色号清单。
      </div>
    </div>
  );
}

export default App;
