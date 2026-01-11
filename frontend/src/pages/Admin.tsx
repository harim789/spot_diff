import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext"
import { apiFetch } from "../lib/api";
import { Navigate } from "react-router-dom";

export default function Admin () {
    const { me } = useAuth();
    const [data, setData] = useState<string>("");

    if (!me) return <Navigate to="/login" replace />;
    if (me.role !== "ADMIN") <Navigate to="/" replace />;

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
        apiFetch("/api/admin/health")
          .then((d) => setData(JSON.stringify(d)))
          .catch((e) => setData("failed: " + String(e.message || e)));
    }, []);

    return (
        <div className="max-w-5xl mx-auto px-4 py-10">
            <div className="bg-white shadow-sm rounded-2xl border border-gray-100 p-6">
                <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
                <p className="text-sm text-gray-500 mt-1">/api/admin/* 는 관리자만 접근 가능합니다.</p>

                <div className="mt-6 rounded-2xl border border-gray-100 p-4 bg-gray-100 text-sm">
                    {data || "loading..."}
                </div>
            </div>
        </div>
    )
}