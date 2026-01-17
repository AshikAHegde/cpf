import React from "react";
import Navbar from "./Components/Navbar.jsx";
import Footer from "./Components/Footer.jsx";
import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./Pages/Dashboard.jsx";
import Calendar from "./Pages/Calendar.jsx";
import Team from "./Pages/Team.jsx";
import Projects from "./Pages/Projects.jsx";
const App = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/team" element={<Team />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
};

export default App;
 