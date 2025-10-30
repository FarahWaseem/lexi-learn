import { useState, useEffect } from "react";
import AccountTab from "./AccountTab/AccountTab";
import PreferencesTab from "./PreferencesTab/PreferencesTab";
import { useProfile } from "../../../hooks/useProfile";
import { useUser } from "../../../context/UserContext";
import "./Settings.css";

function Settings({ isOpen, onClose, userData }) {
  const [activeTab, setActiveTab] = useState("account");
  const { profile, loading, saving, updateProfile } = useProfile();
  const { user: localUser, setUser: setLocalUser } = useUser();
  const [hasChanges, setHasChanges] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  // Update local user context when profile is loaded
  useEffect(() => {
    if (profile && !loading) {
      setLocalUser(prev => ({
        ...prev,
        firstName: profile.firstName || prev.firstName,
        lastName: profile.lastName || prev.lastName,
        email: profile.email || prev.email,
      }));
    }
  }, [profile, loading, setLocalUser]);

  // Handle save changes
  const handleSave = async () => {
    if (!hasChanges) {
      onClose();
      return;
    }

    setSaveMessage(null);

    // Save profile changes
    const result = await updateProfile(localUser.firstName, localUser.lastName);

    if (result.success) {
      setSaveMessage({ type: 'success', text: 'Profile updated successfully!' });
      setHasChanges(false);
      
      // Close modal after 1.5 seconds
      setTimeout(() => {
        setSaveMessage(null);
        onClose();
      }, 1500);
    } else {
      setSaveMessage({ type: 'error', text: result.error || 'Failed to update profile' });
    }
  };

  // Track changes
  const handleUserChange = (updatedUser) => {
    setLocalUser(updatedUser);
    setHasChanges(true);
  };

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
          {loading && !profile ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>
          ) : activeTab === "account" ? (
            <AccountTab 
              userData={userData} 
              onClose={onClose}
              onUserChange={handleUserChange}
            />
          ) : (
            <PreferencesTab />
          )}
        </div>

        {saveMessage && (
          <div className={`save-message ${saveMessage.type}`}>
            {saveMessage.text}
          </div>
        )}

        <button 
          className="save-btn" 
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="settings-backdrop" onClick={onClose}></div>
    </div>
  );
}

export default Settings;
