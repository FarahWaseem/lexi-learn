import { createContext, useContext, useState } from "react";

const LessonContext = createContext(null);

export function LessonProvider({ children }) {
  const [lessonHeader, setLessonHeader] = useState(null);
  return (
    <LessonContext.Provider value={{ lessonHeader, setLessonHeader }}>
      {children}
    </LessonContext.Provider>
  );
}

export const useLessonHeader = () => useContext(LessonContext);