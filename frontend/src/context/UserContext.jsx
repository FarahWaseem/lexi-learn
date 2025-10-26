import { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("userData");
    return storedUser ? JSON.parse(storedUser) : {
      firstName: "Ahmed",
      lastName: "Ali",
      email: "test@example.com",
      avatar: "/src/assets/icons/User Circle.svg"
    };
  });

  const [preferences, setPreferences] = useState(() => {
    const storedPrefs = localStorage.getItem("userPrefs");
    return storedPrefs ? JSON.parse(storedPrefs) : {
      notifications: true,
      darkMode: false,
    };
  });

  useEffect(() => {
    localStorage.setItem("userData", JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem("userPrefs", JSON.stringify(preferences));
  }, [preferences]);

  return (
    <UserContext.Provider value={{ user, setUser, preferences, setPreferences }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
