import { Link, Route, Routes } from 'react-router-dom';
import './App.css'
import Login from './pages/Login';
import Signup from './pages/Signup';
import { AuthProvider, useAuth } from './auth/AuthContext';

function Home() {
  const { me, logout } = useAuth();

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="bg-white border rounded-2xl shadow-sm p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Spot Diff</h1>
        <p className="text-sm text-gray-500 mt-1">
          프론트 ↔ 백엔드 세션 인증 테스트 화면
        </p>

        <div className="mt-6 rounded-2xl border p-4 bg-gray-50">
          <div className="text-sm text-gray-600">현재 로그인 상태</div>
          <div className="mt-1 text-lg font-semibold">
            {me ? (
              <span>
                {me.username} <span className="text-sm text-gray-500">({me.role})</span>
              </span>
            ) : (
              <span className="text-gray-500">로그아웃</span>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            {me ? (
              <button
                onClick={logout}
                className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-white transition cursor-pointer"
              >
                로그아웃
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-xl bg-black/90 text-white px-4 py-2 text-sm font-medium hover:bg-black/80 transition"
                >
                  로그인
                </Link>
                <Link
                  to="/signup"
                  className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-white transition"
                >
                  회원가입
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Shell() {
  const { me, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="font-semibold tracking-tight">
            Spot Diff
          </Link>

          <nav className="flex items-center gap-2">
            <Link
              to="/"
              className="text-sm px-3 py-1.5 rounded-lg hover:bg-gray-100"
            >
              Home
            </Link>

            {me ? (
              <>
                <span className="text-sm text-gray-600 hidden sm:inline">
                  {me.username} ({me.role})
                </span>
                <button
                  onClick={logout}
                  className="bg-gray-200 text-sm px-3 py-1.5 rounded-lg border hover:bg-gray-100 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm px-3 py-1.5 rounded-lg hover:bg-gray-100"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-gray-200 text-sm px-3 py-1.5 rounded-lg border hover:bg-gray-100 transition"
                >
                  Signup
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </div>
  );
}

export default function App () {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  )
}