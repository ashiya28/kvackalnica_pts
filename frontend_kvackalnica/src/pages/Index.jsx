import React from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import YarnCorner from "../components/YarnCorner";

function Index() {
  return (
    <div className="page-container">
      <Header />
      <YarnCorner />

      <h1 className="page-title">KVAČKALNICA</h1>

      <div className="button-group">
        <Link to="/AddNewProject">
          <button className="main-button">DODAJ NOV PROJEKT</button>
        </Link>

        <Link to="/ProjectsInProgress">
          <button className="main-button">NADALJUJ S PROJEKTOM</button>
        </Link>

        <Link to="/FinishedProjects">
          <button className="main-button">KONČANI PROJEKTI</button>
        </Link>
      </div>

      <div className='mb-10'></div>
    </div>
  );
}

export default Index;