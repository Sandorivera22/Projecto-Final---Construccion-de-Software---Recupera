import React from "react";

function Logo({ inverse = false, compact = false }) {
  return (
    <div className={`brand ${inverse ? "brand--inverse" : ""} ${compact ? "brand--compact" : ""}`}>
      <span className="brand__icon">
        <img src="/assets/archive.svg" alt="" />
      </span>
      <span className="brand__copy">
        <strong>
          Recupera<span>+</span>
        </strong>
        <small>INTEC</small>
      </span>
    </div>
  );
}

export default Logo;
