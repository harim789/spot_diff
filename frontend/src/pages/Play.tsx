import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../lib/api";

type Level = {
    id: string;
    title: string;
    leftImageUrl: string;
    rightImageUrl: string;
    diffCount: number;
}

export default function Play () {
    const { id } = useParams();
    const [level, setLevel] = useState<Level | null>(null);
    const [err, setErr] = useState("");

    useEffect(() => {
        apiFetch<{ level: Level }>(`/api/levels/${id}`)
          .then((data) => setLevel(data.level))
          .catch((e) => setErr(e?.message || "failed"));
    }, [id]);

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">{level?.title ?? "Loading..."}</h1>
                    {level && <p className="text-sm text-gray-500 mt-1">총 {level.diffCount}개 찾기</p>}
                </div>
                <Link to="/levels" className="text-sm bg-white rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-200 transition">
                    목록으로
                </Link>
            </div>

            {err && (
                <div className="mt-6 rounded-xl border border-red-200 bg-red-100 px-3 py-2 flex justify-center text-sm text-red-600">
                    {err}
                </div>
            )}

            {level && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white border border-gray-300 rounded-2xl shadow-sm p-3">
                        <div className="text-sm text-gray-500 px-1 pb-2">LEFT</div>
                        <img src={level.leftImageUrl} className="w-full rounded-xl object-contain" />
                    </div>
                    <div className="bg-white border border-gray-300 rounded-2xl shadow-sm p-3">
                        <div className="text-sm text-gray-500 px-1 pb-2">RIGHT</div>
                        <img src={level.rightImageUrl} className="w-full rounded-xl object-contain" />
                    </div>
                </div>
            )}
        </div>
    )
}