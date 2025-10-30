import React from "react";
import { useUser } from "../../../../context/UserContext";
import "./AccountTab.css";

function AccountTab({ onClose, onUserChange }) {
  const { user, setUser } = useUser();

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const updatedUser = { ...user, avatar: reader.result };
        setUser(updatedUser);
        if (onUserChange) onUserChange(updatedUser);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    document.getElementById("avatarInput").click();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedUser = { ...user, [name]: value };
    setUser(updatedUser);
    if (onUserChange) onUserChange(updatedUser);
  };

  return (
    <div className="account-tab">
      <div className="profile-img-wrapper">
        <img
          src={user.avatar || "/src/assets/icons/User Circle.svg"}
          alt="User Avatar"
          className="profile-img"
        />

        <div className="edit-photo-btn" onClick={triggerFileInput}>
          <img
            src="/src/assets/icons/camera.svg"
            alt="Edit"
            className="camera-icon"
          />
        </div>

        <input
          id="avatarInput"
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleImageChange}
        />
      </div>

      <div className="form-group">
        <label>Full Name</label>
        <div className="name-inputs">
          <div className="input-container">
            <img src="/src/assets/icons/user.svg" alt="user" className="icon" />
            <input
              type="text"
              name="firstName"
              value={user.firstName}
              onChange={handleChange}
              placeholder="First name"
            />
          </div>

          <div className="input-container">
            <img src="/src/assets/icons/user.svg" alt="user" className="icon" />
            <input
              type="text"
              name="lastName"
              value={user.lastName}
              onChange={handleChange}
              placeholder="Last name"
            />
          </div>
        </div>
      </div>

      <div className="form-group">
        <label>Email</label>
        <div className="input-container">
          <img src="/src/assets/icons/sms.svg" alt="email" className="icon" />
          <input
            type="email"
            name="email"
            value={user.email}
            onChange={handleChange}
            placeholder="example@email.com"
          />
        </div>
      </div>
    </div>
  );
}

export default AccountTab;