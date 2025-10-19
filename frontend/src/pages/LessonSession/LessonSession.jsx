import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../../components/sidebar/Sidebar";
import Header from "../../components/header/Header";
import SearchBar from "../../components/reusable/searchBar/SearchBar";
import { sampleLessons } from "../../data/lessons";
import "./LessonSession.css";
import { FiSearch } from "react-icons/fi";
import { IoSend } from "react-icons/io5";

export default function LessonSession() {
  const [lesson, setLesson] = useState(sampleLessons["shopping"]);
  const [state, setState] = useState("idle"); // idle | loading | active | completed
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [vocab, setVocab] = useState(lesson.vocabulary);
  const chatRef = useRef(null);

  // auto scroll down
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const startLesson = () => {
    setState("loading");
    setTimeout(() => {
      setState("active");
      setMessages([
        {
          sender: "ai",
          text: `Welcome to the ${lesson.topic} lesson! ${lesson.iceBreaker.description}`,
        },
      ]);
    }, 1000);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = { sender: "user", text: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // simulate AI response
    setTimeout(() => {
      const randomWord = vocab[Math.floor(Math.random() * vocab.length)];
      const aiMsg = {
        sender: "ai",
        text: `Interesting! Remember the word "${randomWord}".`,
      };
      setMessages((prev) => [...prev, aiMsg]);
    }, 1200);
  };

  return (
    <div className="lesson-session">
      <Sidebar />
      <div className="lesson-body">
        <Header title={lesson.topic} />
        <div className="lesson-main">
          <div className="chat-section">
            <div className="chat-box" ref={chatRef}>
              {messages.map((msg, i) => (
                <div key={i} className={`msg ${msg.sender}`}>
                  {msg.text}
                </div>
              ))}

              {state === "idle" && (
                <button className="lesson-btn start" onClick={startLesson}>
                  Start Lesson
                </button>
              )}

              {state === "loading" && (
                <div className="loading">Preparing lesson...</div>
              )}
            </div>

            {state === "active" && (
              <div className="chat-input">
                <SearchBar
                  value={input}
                  onChange={setInput}
                  placeholder="Type your answer..."
                  trailingIcon={
                    <IoSend
                      onClick={handleSend}
                      style={{ cursor: "pointer", fontSize: "20px" }}
                    />
                  }
                />
              </div>
            )}
          </div>

          <div className="vocab-section">
            <h3>Vocabulary</h3>
            <ul>
              {vocab.map((word, i) => (
                <li key={i}>{word}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
