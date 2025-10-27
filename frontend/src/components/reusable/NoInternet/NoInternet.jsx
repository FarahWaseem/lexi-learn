import React from "react";
import "./NoInternet.css";
import Button from "../../reusable/Button/Button";
import zaytoonaSad from "../../../assets/images/zaytoonaNoInternet.png"; // الصورة اللي استخدمتيها في الفيجما

export default function NoInternet({ onRetry }) {
  return (
    <div className="no-internet-container">
      <img src={zaytoonaSad} alt="No Internet" className="no-internet-img" />
      <h2 className="no-internet-title">No Internet Connection</h2>
      <p className="no-internet-subtitle">
        Make sure your internet is connected and try again
      </p>
        <Button variant="primary" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}
