import { useState } from "react";

function PreferencesTab() {
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="preferences-tab">
      <div className="toggle-row">
        <div>
          <h4>Notifications</h4>
          <p>Receive reminders for lessons and progress</p>
        </div>
        <label className="switch">
          <input
            type="checkbox"
            checked={notifications}
            onChange={() => setNotifications(!notifications)}
          />
          <span className="slider"></span>
        </label>
      </div>
    </div>
  );
}

export default PreferencesTab;
