import React from "react";

function LoadingState({ message = "Cargando...", fullScreen = false }) {
  return (
    <div className={`loading-state ${fullScreen ? "loading-state--fullscreen" : ""}`}>
      <div className="spinner-border text-danger" role="status" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

export default LoadingState;
