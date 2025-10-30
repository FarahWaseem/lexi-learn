import React, { useState, useEffect } from "react";
import Sidebar from "../../components/sidebar/Sidebar";
import Toolbar from "../../components/reusable/Toolbar/Toolbar";
import VocabCard from "../../components/reusable/VocabCard/VocabCard";
import Pagination from "../../components/reusable/pagination/pagination";
import Filter from "../../components/reusable/filter/Filter";
import { useVocabNotebook, useDeleteWord } from "../../hooks/useVocabNotebook";
import "./VocabsNotebook.css";

function VocabsNotebook() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedLessons, setSelectedLessons] = useState([]);
  const [order, setOrder] = useState("asc");
  const [tempLessons, setTempLessons] = useState([]);
  const [tempOrder, setTempOrder] = useState("asc");

  // Fetch vocabulary data from backend
  const {
    words,
    totalWords,
    uniqueLessons,
    pagination,
    loading,
    error,
    refetch,
  } = useVocabNotebook({
    page: currentPage,
    limit: 10,
    search,
    lesson: selectedLessons.length === 1 ? selectedLessons[0] : '',
    sortBy: 'word',
    sortOrder: order,
    autoFetch: true,
  });

  const { deleteWord, loading: deleteLoading } = useDeleteWord();

  const handleDelete = async (wordId) => {
    try {
      await deleteWord(wordId);
      // Refetch the list after deletion
      refetch();
    } catch (error) {
      console.error('Failed to delete word:', error);
      alert('Failed to delete word. Please try again.');
    }
  }; 

  // Refetch when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1); // Reset to first page when filters change
    } else {
      refetch();
    }
  }, [search, selectedLessons, order]);

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

  // Show loading state
  if (loading && words.length === 0) {
    return (
      <div className="vocab-page">
        <Sidebar />
        <div className="vocab-content">
          <p className="loading-message">Loading vocabulary...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && words.length === 0) {
    return (
      <div className="vocab-page">
        <Sidebar />
        <div className="vocab-content">
          <p className="error-message">Error: {error}</p>
          <button onClick={refetch}>Retry</button>
        </div>
      </div>
    );
  }

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

        <p className="word-count">
          Totally {totalWords} word{totalWords !== 1 ? 's' : ''} saved
        </p>

        <div className="vocab-grid">
          {words.length > 0 ? (
            words.map((item) => (
              <VocabCard
                key={item.id}
                lesson={item.lesson}
                word={item.word}
                translation={item.translation}
                onPlay={() => playSound(item.word)}
                onDelete={() => handleDelete(item.id)}
              />
            ))
          ) : (
            <p className="no-words">⚠️ No words found.</p>
          )}
        </div>

        {pagination && pagination.totalPages > 1 && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
}

export default VocabsNotebook;