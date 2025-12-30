import { useEffect, useState } from 'react'
import './App.css'

function App() {
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

export default App
