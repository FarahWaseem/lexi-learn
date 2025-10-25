import React, { useState, useMemo } from "react";
import "./lessonSammary.css";
import HeaderStats from "./HeaderStats";
import LessonRecapCard from "./LessonRecapCard";
import NewVocabs from "./NewVocabs/NewVocabs.jsx";  
import GrammarFeedbackCard from "./GrammarFeedbackCard" 
import PositivePointsCard from "./PositivePointsCard/PositivePointsCard.jsx" 
import Button from "../../components/reusable/Button/Button.jsx";

export default function LessonSammary() {
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
          <GrammarFeedbackCard/>
          <PositivePointsCard/>
          {/* <NewVocabs/> */}
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