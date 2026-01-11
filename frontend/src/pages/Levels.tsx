import { useEffect, useState } from "react"
import { apiFetch } from "../lib/api";
import { Link } from "react-router-dom";

type Level = {
    id: string;
    title: string;
    leftImageUrl: string;
    rightImageUrl: string;
    diffCount: number;
};

export default function Levels () {
    const [levels, setLevels] = useState<Level[]>([]);
    const [err, setErr] = useState("");

    useEffect(() => {
        apiFetch<{levels: Level[]}>("/api/levels")
          .then((data) => setLevels(data.levels))
          .catch((e) => setErr(e?.message || "failed"));
    }, []);

    return (
        <div className="max-w-5xl mx-auto px-4 py-10">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">레벨 목록</h1>
                <p className="text-sm text-gray-500 mt-1">공개된 레벨만 표시됩니다.</p>
            </div>

            {err && (
                <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {err}
                </div>
            )}

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-2 gap-4">
                {levels.map((level) => (
                    <Link 
                        key={level.id}
                        to={`/play/${level.id}`}
                        className="bg-white border-gray-100 rounded-2xl shadow-sm p-5 hover:bg-gray-50 transition"
                    >
                        <div className="text-lg font-semibold">{level.title}</div>
                        <div className="mt-1 text-sm text-gray-500">찾을 개수: {level.diffCount}</div>
                        <div className="mt-3 text-sm text-gray-600">클릭해서 플레이</div>
                    </Link>
                ))}
            </div>

            {levels.length === 0 && !err && (
                <div className="mt-10 text-sm text-gray-500">
                    공개된 레벨이 없어요!
                </div>
            )}
        </div>
    );
}