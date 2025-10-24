import React, { useState, useMemo } from "react";
import "./lessonSammary.css";
import HeaderStats from "./HeaderStats";
import LessonRecapCard from "./LessonRecapCard";


export default function LessonSammary() {
return ( 
     <div className="lessonSammary">
          <div className="lessonSammary__top">
            <HeaderStats />
          </div>
           <div className="dashboard__item reminder">
          <LessonRecapCard />
          </div>
           <div className="dashboard__item reminder">
          <LessonRecapCard />
          </div>
          </div>
); 
}