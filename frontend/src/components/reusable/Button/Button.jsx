import React from "react";
import "./Button.css";

function Button({ children, variant = "primary", onClick }) {
  return (
    <button className={`${styles.button} ${styles[variant]}`} onClick={onClick}>
      {children}
    </button>
  );
}

export default Button;
