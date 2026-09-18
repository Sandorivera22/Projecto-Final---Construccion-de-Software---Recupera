import React from "react";

function ErrorState({ message, onRetry }) {
  return (
    <div className="alert alert-danger d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-0">
      <span>{message}</span>
      {onRetry ? (
        <button className="btn btn-sm btn-outline-danger" type="button" onClick={onRetry}>
          Reintentar
        </button>
      ) : null}
    </div>
  );
}

export default ErrorState;
