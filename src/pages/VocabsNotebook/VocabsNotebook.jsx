import React, { useState } from "react";
import Sidebar from "../../components/sidebar/Sidebar";
import Toolbar from "../../components/reusable/Toolbar/Toolbar";
import VocabCard from "../../components/reusable/VocabCard/VocabCard";
import Pagination from "../../components/reusable/pagination/pagination";
import "./VocabsNotebook.css";

function VocabsNotebook() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const words = [
    { lesson: "Lesson 6: In school", word: "Learn", translation: "يتعلم" },
    { lesson: "Lesson 3: Greetings", word: "Hello", translation: "مرحبا" },
  ];

  const filtered = words.filter((w) =>
    w.word.toLowerCase().includes(search.toLowerCase())
  );

  const playSound = (word) => {
    const utter = new SpeechSynthesisUtterance(word);
    utter.lang = "en-US";
    speechSynthesis.speak(utter);
  };

  return (
    <div className="vocab-page">
      <Sidebar />
      <div className="vocab-content">
        <Toolbar
          searchValue={search}
          onSearchChange={setSearch}
          onFilterClick={() => console.log("Filter clicked!")}
        />
        
       <p className="word-count">Totally {words.length} words saved</p>

        <div className="vocab-grid">
          {filtered.map((item, index) => (
            <VocabCard
              key={index}
              lesson={item.lesson}
              word={item.word}
              translation={item.translation}
              onPlay={() => playSound(item.word)}
              onDelete={() => console.log("Deleted:", item.word)}
            />
          ))}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={10}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}

export default VocabsNotebook;
