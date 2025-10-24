import React from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/sidebar/Sidebar";
import Lesson from "./pages/Lessons/Lessons";
import Dashboard from "./pages/Dashboard";
import VocabsNotebook from "./pages/VocabsNotebook/VocabsNotebook";
import LessonSammary from "./pages/LessonSammary/lessonSammary"
//import LessonSession from "./pages/LessonSession/LessonSession"
import Header from "./components/header/Header";
import "./App.css";

function App() {
  console.log("✅ App component rendered");

  return (
    <div className="app-container">
      <Sidebar />
      <div className="content-container">
        <Header />
        <main className="main-content">
          <Routes>
            {/* Default route */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/lesson" element={<Lesson />} />
            <Route path="/vocabsNotebook" element={<VocabsNotebook />} />
            <Route path="/lessonSammary" element={<LessonSammary />} />
            {/* <Route path="/lesson/lessonSession" element={<LessonSession/>} /> */}
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
