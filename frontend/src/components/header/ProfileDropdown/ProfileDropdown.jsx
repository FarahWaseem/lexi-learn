import "./ProfileDropdown.css";

function ProfileDropdown({ onSettingsClick, onLogoutClick }) {
  return (
    <div className="profile-dropdown">
      <div className="dropdown-item active" onClick={onSettingsClick}>
        <div className="icon-wrapper green">
          <img
            src="/src/assets/icons/setting-2.svg"
            alt="Settings"
            className="icon"
          />
        </div>
        <span className="label">Settings</span>
      </div>

      <div className="dropdown-item red" onClick={onLogoutClick}>
        <div className="icon-wrapper red-bg">
          <img
            src="/src/assets/icons/Logout icon.svg"
            alt="Logout"
            className="icon"
          />
        </div>
        <span className="label">Logout</span>
      </div>
    </div>
  );
}

export default ProfileDropdown;
