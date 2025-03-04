import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Login from './Components/Login';
import Hero from './Components/Hero';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/uploadImage" element={<Hero />} />
      </Routes>
    </Router>
  );
}

export default App;

