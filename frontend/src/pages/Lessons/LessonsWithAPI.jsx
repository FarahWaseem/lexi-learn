import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/sidebar/Sidebar";
import Toolbar from "../../components/reusable/Toolbar/Toolbar";
import LessonCard from "../../components/reusable/lessonCard/LessonCard";
import Pagination from "../../components/reusable/pagination/pagination";
import Filter from "../../components/reusable/filter/Filter";
import LoadingSpinner from "../../components/common/LoadingSpinner/LoadingSpinner.jsx";
import "./Lessons.css";

export default function Lessons() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState([]); 
  const [order, setOrder] = useState("asc");
  const [tempSelectedLesson, setTempSelectedLesson] = useState([]);
  const [tempOrder, setTempOrder] = useState("asc");

  // API state
  const [lessons, setLessons] = useState([]);
  const [completedTopics, setCompletedTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLessons();
  }, []);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('clerk_token') || '';
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

      // Fetch all topics
      const topicsResponse = await fetch(`${apiUrl}/api/topics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!topicsResponse.ok) {
        throw new Error('Failed to fetch topics');
      }

      const topicsData = await topicsResponse.json();
      console.log('📚 Topics:', topicsData);

      // Fetch completed topics
      try {
        const completedResponse = await fetch(`${apiUrl}/api/topics/user/completed`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (completedResponse.ok) {
          const completedData = await completedResponse.json();
          const completedIds = completedData.topics?.map(t => t.topic_id) || [];
          setCompletedTopics(completedIds);
        }
      } catch (err) {
        console.warn('Could not fetch completed topics:', err);
      }

      // Format lessons data
      const formattedLessons = (topicsData.topics || []).map(topic => ({
        id: topic.day_number,
        topicId: topic.topic_id,
        title: topic.topic_name,
        description: topic.description || '',
        status: completedTopics.includes(topic.topic_id) ? 'completed' : 'new'
      }));

      setLessons(formattedLessons);
    } catch (err) {
      console.error('❌ Error fetching lessons:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredLessons = useMemo(() => {
    let result = lessons.filter((l) =>
      l.title.toLowerCase().includes(search.toLowerCase())
    );
    if (tempSelectedLesson.length > 0) {
      result = result.filter((l) => tempSelectedLesson.includes(l.title));
    }
    result.sort((a, b) =>
      tempOrder === "desc" ? b.id - a.id : a.id - b.id
    );
    return result;
  }, [lessons, search, tempSelectedLesson, tempOrder]);

  const openFilter = () => {
    console.log("🟦 [Lessons] openFilter()");
    setTempSelectedLesson([...selectedLesson]);
    setTempOrder(order);
    setShowFilter(true);
  };

  const applyFilter = () => {
    console.log("🟩 [Lessons] applyFilter()", {
      tempSelectedLesson,
      tempOrder,
    });
    setSelectedLesson([...tempSelectedLesson]);
    setOrder(tempOrder);
    setShowFilter(false);
  };

  const cancelFilter = () => {
    console.log("🟥 [Lessons] cancelFilter() → رجوع للقيم القديمة وإغلاق");
    setTempSelectedLesson([...selectedLesson]);
    setTempOrder(order);
    setShowFilter(false);
  };

  const clearFilter = () => {
    console.log("🧹 [Lessons] clearFilter() → تفريغ المؤقت");
    setTempSelectedLesson([]);
  };

  const handleLessonAction = (lesson) => {
    console.log("▶️ Clicked:", lesson);
    
    if (lesson.status === 'completed') {
      // View summary - need to get the actual session ID
      // For now, navigate to the lesson page
      navigate(`/lesson-session?day=${lesson.id}`);
    } else {
      // Start new lesson
      navigate(`/lesson-session?day=${lesson.id}`);
    }
  };

  const filterSections = [
    {
      title: "By Lesson",
      options: lessons.slice(0, 5).map((l) => ({
        label: l.title,
        active: tempSelectedLesson.includes(l.title),
        onClick: () => {
          setTempSelectedLesson((prev) =>
            prev.includes(l.title)
              ? prev.filter((item) => item !== l.title)
              : [...prev, l.title]
          );
          console.log("🏷️ [Lessons] toggle lesson chip:", l.title);
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
          onClick: () => {
            console.log("🔤 [Lessons] order → asc");
            setTempOrder("asc");
          },
        },
        {
          label: "Descending Z–A",
          icon: "desc",
          active: tempOrder === "desc",
          onClick: () => {
            console.log("🔤 [Lessons] order → desc");
            setTempOrder("desc");
          },
        },
      ],
    },
  ];

  if (loading) {
    return (
      <div className="lessons-page">
        <Sidebar />
        <div className="lessons-content">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lessons-page">
        <Sidebar />
        <div className="lessons-content">
          <div className="error-message">
            <h3>⚠️ Error Loading Lessons</h3>
            <p>{error}</p>
            <button onClick={fetchLessons} className="retry-button">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lessons-page">
      <Sidebar />
      <div className="lessons-content">
        <Toolbar
          searchValue={search}
          onSearchChange={setSearch}
          onFilterClick={openFilter}
        />

        {showFilter && (
          <Filter
            title="Filter Lessons"
            sections={filterSections}
            onClear={clearFilter}
            onCancel={cancelFilter}
            onDone={applyFilter}
          />
        )}

        <div className="lessons-grid">
          {filteredLessons.length > 0 ? (
            filteredLessons.map((lesson) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                onAction={() => handleLessonAction(lesson)}
              />
            ))
          ) : (
            <p className="no-lessons">⚠️ No lessons found.</p>
          )}
        </div>

        {/* <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredLessons.length / 12)}
          onPageChange={setCurrentPage}
        /> */}
      </div>
    </div>
  );
}

