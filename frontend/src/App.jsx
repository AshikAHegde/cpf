import React from "react";
import Navbar from "./Components/Navbar.jsx";
import Footer from "./Components/Footer.jsx";
import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./Components/Dashboard.jsx";
import Calendar from "./Pages/Calendar.jsx";
import Team from "./Pages/Team.jsx";
import Projects from "./Pages/Projects.jsx";
import Profile from "./Pages/Profile.jsx";
import axios from "axios";

axios.defaults.withCredentials = true;

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
          <Route path="/profile" element={<Profile />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
};

export default App;
