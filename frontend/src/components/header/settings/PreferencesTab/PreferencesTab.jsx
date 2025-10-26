import { useUser } from "../../../../context/UserContext";
import { useTheme } from "../../../../context/ThemeContext";
import notificationIcon from "/src/assets/icons/notification.svg";
import moonIcon from "/src/assets/icons/moon.svg";
import "./PreferencesTab.css";

function PreferencesTab() {
  const { preferences, setPreferences } = useUser();
  const { darkMode, toggleTheme } = useTheme();

  // عند تبديل أي توجل (Notifications أو Dark Mode)
  const handleToggle = (key) => {
    // تحديث التفضيلات داخل الكونتكست
    const newPreferences = { ...preferences, [key]: !preferences[key] };
    setPreferences(newPreferences);

    // لو المستخدم غير وضع الثيم، نفّذ toggleTheme فعلاً
    if (key === "darkMode") toggleTheme();
  };

  return (
    <div className="preferences-tab">
      {/* 🔔 Notifications Toggle */}
      <div className="pref-item">
        <div className="pref-left">
          <div className="pref-icon-wrapper">
            <img
              src={notificationIcon}
              alt="Notification Icon"
              className={`pref-icon ${preferences.notifications ? "active" : ""}`}
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

      {/* 🌙 Dark Mode Toggle */}
      <div className="pref-item">
        <div className="pref-left">
          <div className="pref-icon-wrapper">
            <img
              src={moonIcon}
              alt="Dark Mode Icon"
              className={`pref-icon ${darkMode ? "active" : ""}`}
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
            checked={darkMode}
            onChange={() => handleToggle("darkMode")}
          />
          <span className="slider"></span>
        </label>
      </div>
    </div>
  );
}

export default PreferencesTab;