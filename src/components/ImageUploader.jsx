import { useState, useCallback, useRef } from 'react';

function ImageUploader({ onImagesUpload, isLoading, onClear }) {
  const [previews, setPreviews] = useState([]);
  const [isActive, setIsActive] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = (files) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    onImagesUpload(imageFiles);
    
    const newPreviews = [];
    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result);
        if (newPreviews.length === imageFiles.length) {
          setPreviews(newPreviews);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleClear = () => {
    setPreviews([]);
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
    handleFiles(e.dataTransfer.files);
  }, []);

  const handleChange = (e) => {
    handleFiles(e.target.files);
  };

  return (
    <div className="upload-section">
      <label
        htmlFor="imageInput"
        className={`upload-box ${previews.length > 0 ? 'has-image' : ''} ${isActive ? 'active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="imageInput"
          accept="image/*"
          multiple
          hidden
          ref={inputRef}
          onChange={handleChange}
          disabled={isLoading}
        />
        {previews.length > 0 ? (
          <div className="previews-grid">
            {previews.map((preview, index) => (
              <img key={index} src={preview} className="preview-image show" alt={`Preview ${index + 1}`} />
            ))}
          </div>
        ) : (
          <div className="upload-content">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <h3>Upload Product Images</h3>
            <p>Click or drag images of skincare products (multiple supported)</p>
          </div>
        )}
      </label>
      {previews.length > 0 && !isLoading && (
          <button onClick={handleClear} className="re-upload-btn">
              Clear All
          </button>
      )}
    </div>
  );
}

export default ImageUploader;
