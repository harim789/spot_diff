import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { apiFetch } from "../lib/api"
import { Navigate } from "react-router-dom";
type Level = {
    id: string;
    title: string;
    leftImageUrl: string;
    rightImageUrl: string;
    diffCount: number;
    isPublished: boolean;
    createdAt: string;
};

export default function AdminLevels() {
    const { me } = useAuth();
    const isAdmin = me?.role === "ADMIN";

    const [levels, setLevels] = useState<Level[]>([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const [title, setTitle] = useState("");
    const [isPublished, setIsPublished] = useState(false);
    const [leftFile, setLeftFile] = useState<File | null>(null);
    const [rightFile, setRightFile] = useState<File | null>(null);

    const leftPreview = useMemo(() => (leftFile ? URL.createObjectURL(leftFile) : ""), [leftFile]);
    const rightPreview = useMemo(() => (rightFile ? URL.createObjectURL(rightFile) : ""), [rightFile]);

    useEffect(() => {
        return () => {
            if (leftPreview) URL.revokeObjectURL(leftPreview);
            if (rightPreview) URL.revokeObjectURL(rightPreview);
        };
    }, [leftPreview, rightPreview]);
    
    const load = async () => {
        setErr("");
        setLoading(true);

        try {
            const data = await apiFetch<{ levels: Level[] }>("/api/admin/levels");
            setLevels(data.levels);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
            setErr(e?.message || "failed");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const createLevel = async () => {
        setErr("");
        
        if (!title.trim()) return setErr("title is required");
        if (!leftFile || !rightFile) return setErr("left/right image files are required");

        const fd = new FormData();
        fd.append("title", title.trim());
        fd.append("isPublished", String(isPublished));
        fd.append("leftImage", leftFile);
        fd.append("rightImage", rightFile);

        setLoading(true);
        
        try {
            const res: Response = await apiFetch("/api/admin/levels", {
                method: "POST",
                body: fd,
                credentials: "include",
            });

            if (!res.ok) {
                const j = await res.json().catch(() => null);
                throw new Error(j?.message ||  `HTTP ${res.status}`);
            }

            setTitle("");
            setIsPublished(false);
            setLeftFile(null);
            setRightFile(null);
            await load();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
            setErr(e?.message || "create failed");
        } finally {
            setLoading(false);
        }
    };

    const deleteLevel = async (id: string) => {
        if (!confirm("정말 삭제하시겠습니까?")) return;

        setLoading(true)
        setErr("");

        try {
            await apiFetch(`/api/admin/levels/${id}`, { method: "DELETE" });
            await load();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
            setErr(e?.message || "delete failed");
        } finally {
            setLoading(false);
        }
    };

    if (!me) return <Navigate to="/login" replace />
    if (!isAdmin) return <Navigate to="/" replace />

    return (
        <div className="max-w-6xl mx-auto px-4 py-10">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Admin · Levels</h1>
                    <p className="text-sm text-gray-500 mt-1">레벨 생성 / 이미지 업로드</p>
                </div>
                <button
                    onClick={load}
                    className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-white transition"
                >
                    새로고침
                </button>
            </div>

            {err && (
                <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {err}
                </div>
            )}

            {/* 생성 폼 */}
            <div className="mt-6 bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-semibold">새 레벨 만들기</h2>
                
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-15">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Title</label>
                        <input 
                            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-black/10"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="예: Sample Level"
                        />
                        <label className="mt-4 flex items-center gap-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                checked={isPublished}
                                onChange={(e) => setIsPublished(e.target.checked)}
                            />
                            Published (공개)
                        </label>
                    </div>

                    <div className="text-sm text-gray-600">
                        <div className="font-medium text-gray-800">업로드 규칙</div>
                        <ul className="list-disc ml-5 mt-2 space-y-1">
                            <li>Left Image / Right Image 둘 다 필수</li>
                            <li>이미지는 로컬에서는 uploads 폴더에 저장</li>
                        </ul>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-15">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Left Image</label>
                        <input
                            className="mt-2 block border border-gray-300 w-full text-sm text-gray-700 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-black/10"
                            type="file"
                            accept="image/*"
                            onChange={(e) => setLeftFile(e.target.files?.[0] || null)}
                        />
                        {leftPreview && (
                            <img
                                src={leftPreview}
                                className="mt-3 w-full rounded-xl border object-contain"
                                alt="left preview"
                            />
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Right Image</label>
                        <input
                            className="mt-2 block border border-gray-300 w-full text-sm text-gray-700 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-black/10"
                            type="file"
                            accept="image/*"
                            onChange={(e) => setRightFile(e.target.files?.[0] || null)}
                        />
                        {rightPreview && (
                            <img
                                src={rightPreview}
                                className="mt-3 w-full rounded-xl border object-contain"
                                alt="right preview"
                            />
                        )}
                    </div>
                </div>

                <div className="mt-6 flex gap-2">
                    <button
                        disabled={loading}
                        onClick={createLevel}
                        className="rounded-xl bg-black text-white px-4 py-2 text-sm font-medium hover:bg-black/85 disabled:opacity-60 transition"
                    >
                        {loading ? "Loading..." : "레벨 생성"}
                    </button>
                </div>
             </div>

            {/* 리스트 */}
            <div className="mt-6 bg-white border rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-semibold">레벨 리스트</h2>

                {loading && <div className="mt-3 text-sm text-gray-500">loading...</div>}

                <div className="mt-4 grid grid-cols-1 gap-3">
                {levels.map((lv) => (
                    <div key={lv.id} className="rounded-2xl border p-4 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                        <div className="font-semibold">{lv.title}</div>
                        <div className="text-sm text-gray-500">
                            공개: {String(lv.isPublished)} · diffCount: {lv.diffCount}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">id: {lv.id}</div>
                        </div>
                        <button
                        onClick={() => deleteLevel(lv.id)}
                        className="rounded-xl border px-3 py-1.5 text-sm hover:bg-white"
                        >
                        삭제
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="rounded-xl border bg-gray-50 p-2">
                        <div className="text-xs text-gray-500 px-1 pb-2">LEFT</div>
                        <img src={lv.leftImageUrl} className="w-full rounded-xl border object-contain" />
                        </div>
                        <div className="rounded-xl border bg-gray-50 p-2">
                        <div className="text-xs text-gray-500 px-1 pb-2">RIGHT</div>
                        <img src={lv.rightImageUrl} className="w-full rounded-xl border object-contain" />
                        </div>
                    </div>
                    </div>
                ))}

                {levels.length === 0 && !loading && (
                    <div className="text-sm text-gray-500 mt-2">아직 레벨이 없어.</div>
                )}
                </div>
            </div>
        </div>
    )
}