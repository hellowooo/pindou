import React from 'react';
import { Upload, Button, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const UploadImage = ({ onImageUpload, imageUrl }) => {
  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件！');
    }
    return isImage;
  };

  const handleChange = (info) => {
    if (info.file.status === 'done' || info.file.status === 'uploading') {
      const reader = new FileReader();
      reader.onload = (e) => {
        onImageUpload(e.target.result);
      };
      reader.readAsDataURL(info.file.originFileObj);
    }
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <Upload
        showUploadList={false}
        beforeUpload={beforeUpload}
        customRequest={({ file, onSuccess }) => {
          setTimeout(() => {
            onSuccess('ok');
          }, 0);
        }}
        onChange={handleChange}
        accept="image/*"
      >
        <Button icon={<UploadOutlined />} type="primary" style={{ background: '#ffb6c1', borderColor: '#ffb6c1' }}>
          上传图片
        </Button>
      </Upload>
      {imageUrl && (
        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <img src={imageUrl} alt="预览" style={{ maxWidth: '100%', maxHeight: 180, borderRadius: 8, border: '2px solid #ffe4ec' }} />
        </div>
      )}
    </div>
  );
};

export default UploadImage; 