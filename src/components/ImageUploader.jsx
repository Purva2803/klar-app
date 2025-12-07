import { useState, useCallback, useRef } from 'react';

function ImageUploader({ onImageUpload, isLoading, onClear }) {
  const [preview, setPreview] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      onImageUpload(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClear = () => {
    setPreview(null);
    if (inputRef.current) {
      inputRef.current.value = null;
    }
    onClear();
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsActive(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsActive(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsActive(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, []);

  const handleChange = (e) => {
    const file = e.target.files[0];
    handleFile(file);
  };

  return (
    <div className="upload-section">
      <label
        htmlFor="imageInput"
        className={`upload-box ${preview ? 'has-image' : ''} ${isActive ? 'active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="imageInput"
          accept="image/*"
          hidden
          ref={inputRef}
          onChange={handleChange}
          disabled={isLoading}
        />
        {preview ? (
          <img src={preview} className="preview-image show" alt="Preview" />
        ) : (
          <div className="upload-content">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <h3>Upload Product Image</h3>
            <p>Click or drag an image of any skincare product</p>
          </div>
        )}
      </label>
      {preview && !isLoading && (
          <button onClick={handleClear} className="re-upload-btn">
              Change Image
          </button>
      )}
    </div>
  );
}

export default ImageUploader;
