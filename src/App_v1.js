import React, { useRef, useState } from 'react';
import './App.css';
import { loadColorTable } from './utils/colorTable';
import { generatePixelArt } from './utils/pixelArt';
import { exportColorList } from './utils/exportExcel';
import { Button, InputNumber, Upload, message, Spin, Checkbox, Divider } from 'antd';

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
    <div className="App pretty-pink-bg">
      <h2 className="pretty-title">拼豆图纸生成工具</h2>
      <div className="pretty-subtitle">上传图片，定制参数，一键生成像素图与专属拼豆色号表</div>
      <Divider style={{ borderColor: '#ffd1dc', margin: '18px 0 24px 0' }} />
      <div className="pretty-section">
        <div className="pretty-label">1. 上传图片</div>
        <Upload
          accept="image/*"
          showUploadList={false}
          beforeUpload={() => false}
          onChange={handleUpload}
        >
          <Button style={{ marginTop: 8, marginBottom: 8 }}>选择图片</Button>
        </Upload>
        {img && (
          <div style={{ margin: '8px 0 0 0', textAlign: 'center' }}>
            <img src={img} alt="预览" style={{ maxWidth: 180, maxHeight: 120, borderRadius: 8, boxShadow: '0 1px 8px #ffd1dc55', border: '1.5px solid #ffd1dc' }} />
          </div>
        )}
      </div>
      <div className="pretty-section">
        <div className="pretty-label">2. 设置像素画参数</div>
        <div className="pretty-param-row">
          <span>宽(格):</span>
          <InputNumber min={2} max={128} value={pixelWidth} onChange={handleWidthChange} />
          <span style={{ marginLeft: 12 }}>高(格):</span>
          <InputNumber min={2} max={128} value={pixelHeight} onChange={handleHeightChange} />
          <Checkbox checked={lockRatio} onChange={e => handleLockRatio(e.target.checked)} style={{ marginLeft: 16 }}>
            锁定长宽比
          </Checkbox>
        </div>
        <div className="pretty-param-row">
          <span>单格像素(px):</span>
          <InputNumber min={8} max={64} value={cellSize} onChange={setCellSize} />
        </div>
      </div>
      <div className="pretty-section" style={{ textAlign: 'center', marginTop: 18 }}>
        <Button type="primary" onClick={handleGenerate} disabled={!imgObj} loading={loading} style={{ minWidth: 120, fontSize: 16 }}>
          生成像素画
        </Button>
      </div>
      <div style={{ margin: '32px 0 0 0', textAlign: 'center' }}>
        {loading && <Spin />}
        {canvasUrl && (
          <div>
            <img src={canvasUrl} alt="像素画预览" style={{ border: '1.5px solid #ffd1dc', maxWidth: '100%', margin: '0 auto', borderRadius: 12, boxShadow: '0 2px 12px #ffd1dc44' }} />
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 12 }}>
              <Button onClick={handleDownloadImg}>下载像素画图片</Button>
              <Button onClick={handleDownloadExcel} disabled={usedColors.length === 0}>下载色号清单</Button>
            </div>
          </div>
        )}
      </div>
      <div className="pretty-tip">
        支持自定义像素画宽高，输出带色号和网格线的像素图及色号清单。<br />
        <span style={{ color: '#e75480', fontWeight: 500 }}>温馨提示：</span> 色号仅使用A-M开头标准色。
      </div>
    </div>
  );
}

export default App;
