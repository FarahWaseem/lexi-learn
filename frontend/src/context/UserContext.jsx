import { createContext, useState, useContext } from "react";
import { dashboardMockData } from "../data/dashboardMockData";

const UserContext = createContext();

export function UserProvider({ children }) {
  const initialUser = {
    firstName: dashboardMockData.user.firstName || "Ahmed",
    lastName: dashboardMockData.user.lastName || "Ali",
    email: dashboardMockData.user.email || "test@example.com",
    avatar: dashboardMockData.user.avatar || "/src/assets/icons/User Circle.svg",
  };

  const [userData, setUserData] = useState(initialUser);

  return (
    <UserContext.Provider value={{ userData, setUserData }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}