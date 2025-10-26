import { useUser } from "../../../../context/UserContext"; 
import notificationIcon from "/src/assets/icons/notification.svg";
import "./PreferencesTab.css";

function PreferencesTab() {
  const { preferences, setPreferences } = useUser();

  const handleToggle = (key) => {
    setPreferences({ ...preferences, [key]: !preferences[key] });
  };

  return (
    <div className="preferences-tab">

      <div className="pref-item">
        <div className="pref-left">
          <div className="pref-icon-wrapper">
           <img
            src={notificationIcon}
            alt="Notification Icon"
            className="pref-icon filled"
          />
          </div>

          <div className="pref-texts">
            <h4 className="pref-title">Notifications</h4>
            <p className="pref-description">
              Receive reminders for lessons and progress
            </p>
          </div>
        </div>

        <label className="switch">
          <input
            type="checkbox"
            checked={preferences.notifications}
            onChange={() => handleToggle("notifications")}
          />
          <span className="slider"></span>
        </label>
      </div>

      <div className="pref-item">
        <div className="pref-left">
          <div className="pref-icon-wrapper">
            <img
              src="/src/assets/icons/moon.svg"
              alt="Dark Mode Icon"
              className="pref-icon filled"
            />
          </div>

          <div className="pref-texts">
            <h4 className="pref-title">Dark Mode</h4>
            <p className="pref-description">
              Switch between light and dark themes
            </p>
          </div>
        </div>

        <label className="switch">
          <input
            type="checkbox"
            checked={preferences.darkMode}
            onChange={() => handleToggle("darkMode")}
          />
          <span className="slider"></span>
        </label>
      </div>
    </div>
  );
}

export default PreferencesTab;
