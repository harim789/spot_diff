import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useAuth } from "../auth/AuthContext";

export default function Login () {
    const nav = useNavigate();
    const { refreshMe } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState("");

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErr("");
        try {
            await apiFetch("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({ username, password }),
            });

            await refreshMe();
            nav("/");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
            setErr(e?.message || "login failed");
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="bg-white shadow-sm rounded-2xl border border-gray-100 p-6">
                    <h1 className="text-2xl font-semibold tracking-tight">로그인</h1>
                    <p className="text-sm text-gray-500 mt-1">아이디와 비밀번호로 로그인하세요.</p>

                    <form onSubmit={onSubmit} className="mt-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">아이디</label>
                            <input
                                className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400"
                                placeholder="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoComplete="username"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">비밀번호</label>
                            <input
                                className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400"
                                placeholder="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                            />
                        </div>

                        {err && (
                            <div className="rounded-xl border border-red-200 bg-red-100 px-3 py-2 flex justify-center text-sm text-red-600">
                                {err}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full rounded-xl bg-black text-white py-2 font-medium hover:bg-black/90 active:bg-black"
                        >
                            로그인
                        </button>
                    </form>

                    <div className="mt-5 text-sm text-gray-600">
                        계정이 없나요?{" "}
                        <Link 
                            className="font-medium text-black underline-offset-4 hover:underline"
                            to ="/signup"
                        >
                            회원가입
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}