import React, { useState, useMemo } from "react";
import Sidebar from "../../components/sidebar/Sidebar";
import Toolbar from "../../components/reusable/Toolbar/Toolbar";
import VocabCard from "../../components/reusable/VocabCard/VocabCard";
import Pagination from "../../components/reusable/pagination/pagination";
import Filter from "../../components/reusable/filter/Filter";
import "./VocabsNotebook.css";

function VocabsNotebook() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [showFilter, setShowFilter] = useState(false);
  const [selectedLessons, setSelectedLessons] = useState([]);
  const [order, setOrder] = useState("asc");

  const [tempLessons, setTempLessons] = useState([]);
  const [tempOrder, setTempOrder] = useState("asc");

  const [wordList, setWordList] = useState([
    { lesson: "Lesson 6: In school", word: "Learn", translation: "يتعلم" },
    { lesson: "Lesson 3: Greetings", word: "Hello", translation: "مرحبا" },
    { lesson: "Lesson 1: Shopping", word: "Buy", translation: "يشتري" },
    { lesson: "Lesson 2: Travel", word: "Go", translation: "يذهب" },
  ]);

  const handleDelete = (wordToDelete) => {
    setWordList((prev) => prev.filter((w) => w.word !== wordToDelete));
  };

  const filtered = useMemo(() => {
    let result = wordList.filter((w) =>
      w.word.toLowerCase().includes(search.toLowerCase())
    );

    if (tempLessons.length > 0) {
      result = result.filter((w) => tempLessons.includes(w.lesson));
    }

    result.sort((a, b) =>
      tempOrder === "desc"
        ? b.word.localeCompare(a.word)
        : a.word.localeCompare(b.word)
    );

    return result;
  }, [wordList, search, tempLessons, tempOrder]); 

  const openFilter = () => {
    setTempLessons([...selectedLessons]);
    setTempOrder(order);
    setShowFilter(true);
  };

  const applyFilter = () => {
    setSelectedLessons([...tempLessons]);
    setOrder(tempOrder);
    setShowFilter(false);
  };

  const cancelFilter = () => {
    setTempLessons([...selectedLessons]);
    setTempOrder(order);
    setShowFilter(false);
  };

  const clearFilter = () => {
    setTempLessons([]);
  };

  const uniqueLessons = [...new Set(wordList.map((w) => w.lesson))]; 

  const filterSections = [
    {
      title: "By Lesson",
      options: uniqueLessons.map((lesson) => ({
        label: lesson,
        active: tempLessons.includes(lesson),
        onClick: () => {
          setTempLessons((prev) =>
            prev.includes(lesson)
              ? prev.filter((l) => l !== lesson)
              : [...prev, lesson]
          );
        },
      })),
    },
    {
      title: "Alphabetical Order",
      options: [
        {
          label: "Ascending A–Z",
          icon: "asc",
          active: tempOrder === "asc",
          onClick: () => setTempOrder("asc"),
        },
        {
          label: "Descending Z–A",
          icon: "desc",
          active: tempOrder === "desc",
          onClick: () => setTempOrder("desc"),
        },
      ],
    },
  ];

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
          onFilterClick={openFilter}
        />

        {showFilter && (
          <Filter
            title="Filter Words"
            sections={filterSections}
            onClear={clearFilter}
            onCancel={cancelFilter}
            onDone={applyFilter}
          />
        )}

        <p className="word-count">Totally {filtered.length} words saved</p>

        <div className="vocab-grid">
          {filtered.length > 0 ? (
            filtered.map((item, index) => (
              <VocabCard
                key={index}
                lesson={item.lesson}
                word={item.word}
                translation={item.translation}
                onPlay={() => playSound(item.word)}
                onDelete={() => handleDelete(item.word)} 
              />
            ))
          ) : (
            <p className="no-words">⚠️ No words found.</p>
          )}
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