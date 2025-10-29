import { useState } from "react";
import AccountTab from "./AccountTab/AccountTab";
import PreferencesTab from "./PreferencesTab/PreferencesTab";
import "./Settings.css";

function Settings({ isOpen, onClose, userData }) {
  const [activeTab, setActiveTab] = useState("account");

  if (!isOpen) return null;

  return (
    <div className="settings-overlay">
      <div className="settings-modal">
        <div className="settings-header">
          <h2>Settings</h2>
          <div className="settings-tabs">
            <button
              className={`settings-tab ${activeTab === "account" ? "active" : ""}`}
              onClick={() => setActiveTab("account")}
            >
              Account
            </button>
            <button
              className={`settings-tab ${activeTab === "preferences" ? "active" : ""}`}
              onClick={() => setActiveTab("preferences")}
            >
              Preferences
            </button>
          </div>
        </div>

        <div className="settings-content">
          {activeTab === "account" ? (
            <AccountTab userData={userData} onClose={onClose} />
          ) : (
            <PreferencesTab />
          )}
        </div>

        <button className="save-btn" onClick={onClose}>Save Changes</button>
      </div>

      <div className="settings-backdrop" onClick={onClose}></div>
    </div>
  );
}

export default Settings;
