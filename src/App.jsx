import React from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/sidebar/Sidebar";
import Lesson from "./pages/Lesson";
import Dashboard from "./pages/Dashboard";
import VocabsNotebook from "./pages/VocabsNotebook";
import Header from "./components/header/Header";
import "./App.css"; // رح نضيف فيه التنسيقات

function App() {
  return (
    <div className="app-container">
  <Sidebar />
  
  <div className="content-container">
    <Header />
    <main className="main-content">
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/lesson" element={<Lesson />} />
        <Route path="/vocabsNotebook" element={<VocabsNotebook />} />
      </Routes>
    </main>
  </div>
</div>

  );
}

export default App;
