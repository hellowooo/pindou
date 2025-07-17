import React, { useState, useRef } from 'react';
import { Layout, Button, message, Spin } from 'antd';
import UploadImage from './components/UploadImage';
import PixelParams from './components/PixelParams';
import ColorSelectorModal from './components/ColorSelectorModal';
import PreviewPanel from './components/PreviewPanel';
import colorTable from './color_table.csv'; // 假设后续用fetch或utils读取
// import { generatePixelArt, exportExcel } from './utils/pixelUtils'; // 需后续实现
import './App.css';

const { Header, Content } = Layout;

// 假数据，实际应通过csv解析
const mockColorList = [
  { code: 'A01', hex: '#ffb6c1' },
  { code: 'B02', hex: '#ffe4ec' },
  { code: 'C03', hex: '#f8bbd0' },
  { code: 'D04', hex: '#f48fb1' },
  { code: 'E05', hex: '#f06292' },
  { code: 'F06', hex: '#ec407a' },
  { code: 'G07', hex: '#e91e63' },
  { code: 'H08', hex: '#d81b60' },
  { code: 'I09', hex: '#c2185b' },
  { code: 'J10', hex: '#ad1457' },
  { code: 'K11', hex: '#880e4f' },
  { code: 'L12', hex: '#ff80ab' },
  { code: 'M13', hex: '#ff4081' },
  { code: 'N14', hex: '#f50057' },
  { code: 'O15', hex: '#c51162' },
];
const defaultAM = mockColorList.filter(c => /^[A-M]/i.test(c.code)).map(c => c.code);

function App() {
  // 主状态
  const [imageUrl, setImageUrl] = useState(null);
  const [originalWidth, setOriginalWidth] = useState(null);
  const [originalHeight, setOriginalHeight] = useState(null);
  const [pixelWidth, setPixelWidth] = useState(32);
  const [pixelHeight, setPixelHeight] = useState(32);
  const [lockRatio, setLockRatio] = useState(true);
  const [colorMethod, setColorMethod] = useState('main');
  const [excludeEdge, setExcludeEdge] = useState(false);
  const [colorModalVisible, setColorModalVisible] = useState(false);
  const [colorList, setColorList] = useState(mockColorList); // 实际应fetch
  const [selectedColors, setSelectedColors] = useState(defaultAM);
  const [pixelImage, setPixelImage] = useState(null);
  const [loading, setLoading] = useState(false);

  // 处理图片上传
  const handleImageUpload = (url) => {
    setImageUrl(url);
    // 获取原始尺寸
    const img = new window.Image();
    img.onload = () => {
      setOriginalWidth(img.width);
      setOriginalHeight(img.height);
      if (lockRatio) {
        const ratio = img.height / img.width;
        setPixelHeight(Math.round(pixelWidth * ratio));
      }
    };
    img.src = url;
  };

  // 处理像素参数变化
  const handleParamsChange = (w, h, lock) => {
    setPixelWidth(w);
    setPixelHeight(h);
    setLockRatio(lock);
  };

  // 处理取色方式变化
  const handleColorMethodChange = (val) => {
    setColorMethod(val);
  };

  // 处理排除边缘像素
  const handleExcludeEdgeChange = (e) => {
    setExcludeEdge(e.target.checked);
  };

  // 处理标准色选择弹窗
  const handleOpenColorModal = () => setColorModalVisible(true);
  const handleCloseColorModal = () => setColorModalVisible(false);
  const handleColorModalOk = () => setColorModalVisible(false);
  const handleColorGroupChange = (vals) => setSelectedColors(vals);
  const handleSelectAll = () => setSelectedColors(colorList.map(c => c.code));
  const handleSelectAM = () => setSelectedColors(colorList.filter(c => /^[A-M]/i.test(c.code)).map(c => c.code));
  const handleClear = () => setSelectedColors([]);

  // 生成像素画（伪代码，需后续实现）
  const handleGenerate = () => {
    if (!imageUrl) {
      message.warning('请先上传图片');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      // 实际应调用像素画算法
      setPixelImage(imageUrl); // 这里仅作演示，实际应为像素画结果
      setLoading(false);
      message.success('像素画生成成功（演示）');
    }, 1000);
  };

  // 导出图片（伪代码）
  const handleExportImage = () => {
    if (!pixelImage) return;
    const a = document.createElement('a');
    a.href = pixelImage;
    a.download = 'pixel-art.png';
    a.click();
  };

  // 导出色号表（伪代码）
  const handleExportExcel = () => {
    message.info('导出色号表功能待实现');
  };

  return (
    <Layout style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #ffe4ec 0%, #fff0f6 100%)' }}>
      <Header style={{ background: 'transparent', boxShadow: 'none', padding: '24px 0 0 0' }}>
        <h1 style={{ color: '#d81b60', fontWeight: 700, fontSize: 32, textAlign: 'center', letterSpacing: 2, marginBottom: 0 }}>
          像素画生成工具
        </h1>
        <div style={{ color: '#ad1457', textAlign: 'center', marginTop: 8, fontSize: 16 }}>
          支持自定义标准色、灵活取色、导出图片和色号表
        </div>
      </Header>
      <Content style={{ maxWidth: 1100, margin: '32px auto', width: '100%' }}>
        <div style={{ display: 'flex', gap: 32 }}>
          {/* 左侧参数区 */}
          <div style={{ flex: 1, minWidth: 320 }}>
            <UploadImage onImageUpload={handleImageUpload} imageUrl={imageUrl} />
            <PixelParams
              width={pixelWidth}
              height={pixelHeight}
              lockRatio={lockRatio}
              onChange={handleParamsChange}
              colorMethod={colorMethod}
              onColorMethodChange={handleColorMethodChange}
              originalWidth={originalWidth}
              originalHeight={originalHeight}
              excludeEdge={excludeEdge}
              onExcludeEdgeChange={handleExcludeEdgeChange}
            />
            <Button
              type="primary"
              style={{ width: '100%', background: '#ffb6c1', borderColor: '#ffb6c1', marginBottom: 12 }}
              onClick={handleGenerate}
              size="large"
            >
              生成像素画
            </Button>
            <Button
              style={{ width: '100%', background: '#ffe4ec', borderColor: '#ffe4ec' }}
              onClick={handleOpenColorModal}
              size="large"
            >
              选择标准色（已选 {selectedColors.length} 个）
            </Button>
          </div>
          {/* 右侧预览区 */}
          <div style={{ flex: 2, minWidth: 400 }}>
            <Spin spinning={loading} tip="生成中...">
              <PreviewPanel
                originalImage={imageUrl}
                pixelImage={pixelImage}
                originalWidth={originalWidth}
                originalHeight={originalHeight}
                onExportImage={handleExportImage}
                onExportExcel={handleExportExcel}
              />
            </Spin>
          </div>
        </div>
        <ColorSelectorModal
          visible={colorModalVisible}
          onOk={handleColorModalOk}
          onCancel={handleCloseColorModal}
          colorList={colorList}
          selectedColors={selectedColors}
          onChange={handleColorGroupChange}
          onSelectAll={handleSelectAll}
          onSelectAM={handleSelectAM}
          onClear={handleClear}
        />
      </Content>
    </Layout>
  );
}

export default App;
