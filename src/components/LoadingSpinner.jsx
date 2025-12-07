function LoadingSpinner({ loadingText }) {
  return (
    <div className="loading-section">
      <div className="spinner"></div>
      <p id="loadingText">{loadingText}</p>
    </div>
  );
}

export default LoadingSpinner;
