import { Route, Routes } from 'react-router-dom';
import { useEffect, useState } from 'react'
import './App.css'
import Login from './pages/Login';
import Signup from './pages/Signup';

function Home() {
  const [msg, setMsg] = useState("loading");

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => setMsg(JSON.stringify(d)))
      .catch((e) => setMsg("failed: " + String(e)));
  }, []);
  
  return (
    <>
      <div style={{ padding: 24 }}>
        <h1>Frontend ↔ Backend 연결 테스트</h1>
        <p>{msg}</p>
      </div>
    </>
  );
}

export default function App() {
  return (
    <div>
      <header>
        <div>

        </div>
      </header>

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </div>
  )
}