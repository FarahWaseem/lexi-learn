// frontend/src/pages/LessonSammary/lessonSammary.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "./lessonSammary.css";
import HeaderStats from "./HeaderStats";
import LessonRecapCard from "./LessonRecapCard";
// 👇 إحنا مش بنستخدم NewVocabs حالياً (معلّق بالكومنت) فـ لا نستوردُه لتجنّب تحذير unused
// import NewVocabs from "./NewVocabs/NewVocabs.jsx";
import GrammarFeedbackCard from "./GrammarFeedbackCard";
import PositivePointsCard from "./PositivePointsCard/PositivePointsCard.jsx";
import Button from "../../components/reusable/Button/Button.jsx";

export default function LessonSammary() {
  const navigate = useNavigate();

  const handleDone = () => {
    // بديل سريع للتصدير PDF (لو لاحقاً بدك jsPDF رجّعيه)
    window.print();
  };

  const handleCancel = () => {
    // الذهاب لدفتر المفردات
    navigate("/vocabsNotebook");
  };

  return (
    <div className="lessonSammary">
      <Button variant="primary" onClick={handleDone} id="btn-done">
        Download as PDF
      </Button>

      <div className="lessonSammary__top">
        <HeaderStats />
      </div>

      <div className="dashboard__item reminder">
        <LessonRecapCard />
      </div>

      <div className="dashboard__item reminder">
        <GrammarFeedbackCard />
        <PositivePointsCard />
        {/* لو حابة ترجعي الكومبوننت، شيّلي الكومنت عن السطرين الجايين
            وارجعي الاستيراد فوق
        <NewVocabs />
        */}
      </div>

      <div className="filter-footer">
        <Button variant="secondary" onClick={handleCancel} id="btn-cancel">
          Vocabulary NoteBook
        </Button>
        <Button variant="primary" onClick={handleDone} id="btn-done">
          Next Lesson
        </Button>
      </div>
    </div>
  );
}
