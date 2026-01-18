import { Link, Navigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "../lib/api";

type Level = {
  id: string;
  title: string;
  leftImageUrl: string;
  rightImageUrl: string;
  diffCount: number;
  isPublished: boolean;
};

type Diff = {
  id: string;
  levelId: string;
  x: number;
  y: number;
  r: number;
};

export default function AdminDiffEditor() {
  const { me } = useAuth();
  const isAdmin = me?.role === "ADMIN";
  const { id } = useParams(); // levelId

  const [level, setLevel] = useState<Level | null>(null);
  const [diffs, setDiffs] = useState<Diff[]>([]);
  const [err, setErr] = useState("");
  const [radius, setRadius] = useState(24);

  // 이미지 실제 렌더 영역(화면 좌표) 계산을 위해 ref
  const imgRef = useRef<HTMLImageElement | null>(null);

  // 원본 이미지 크기 (naturalWidth/Height)
  const [natural, setNatural] = useState({ w: 0, h: 0 });

  const loadAll = async () => {
    if (!id) return;
    setErr("");

    try {
      const list = await apiFetch<{ levels: Level[] }>("/api/admin/levels");
      const found = list.levels.find((x) => x.id === id) || null;
      setLevel(found);

      const d = await apiFetch<{ diffs: Diff[] }>(
        `/api/admin/levels/${id}/diffs`,
      );
      setDiffs(d.diffs);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setErr(e?.messsage || "failed");
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAll();
  }, [id]);

  const onImageLoaded = () => {
    const img = imgRef.current;
    if (!img) return;
    setNatural({ w: img.naturalWidth, h: img.naturalHeight });
  };

  // 화면 클릭 -> 원본 좌표로 반환
  const screenToOriginal = (clientX: number, clientY: number) => {
    const img = imgRef.current;
    if (!img) return null;
    const rect = img.getBoundingClientRect();

    const sx = clientX - rect.left;
    const sy = clientY - rect.top;

    if (sx < 0 || sy < 0 || sx > rect.width || sy > rect.height) return null;
    if (natural.w === 0 || natural.h === 0) return null;

    const ox = (sx / rect.width) * natural.w;
    const oy = (sy / rect.height) * natural.h;

    return { x: ox, y: oy };
  };

  // 원본 좌표 -> 화면 좌표(오버레이 그릴 때)
  const originalToscreen = (ox: number, oy: number, or: number) => {
    const img = imgRef.current;
    if (!img) return null;
    const rect = img.getBoundingClientRect();
    if (natural.w === 0 || natural.h === 0) return null;

    const sx = (ox / natural.w) * rect.width;
    const sy = (oy / natural.h) * rect.height;
    const sr = (or / natural.w) * rect.width;

    return { x: sx, y: sy, r: sr, w: rect.width, h: rect.height };
  };

  const overlays = useMemo(() => {
    return (
      diffs
        // eslint-disable-next-line react-hooks/refs
        .map((d) => {
          const s = originalToscreen(d.x, d.y, d.r);
          if (!s) return null;
          return { ...d, sx: s.x, sy: s.y, sr: s.r, vw: s.w, vh: s.h };
        })
        .filter(Boolean) as Array<
        Diff & { sx: number; sy: number; sr: number; vw: number; vh: number }
      >
    );
  }, [diffs, natural.w, natural.h]);

  const addDiffByClick = async (e: React.MouseEvent) => {
    if (!id) return;
    setErr("");

    const pos = screenToOriginal(e.clientX, e.clientY);
    if (!pos) return;

    // 서버에 저장
    try {
      await apiFetch(`/api/admin/levels/${id}/diffs`, {
        method: "POST",
        body: JSON.stringify({ x: pos.x, y: pos.y, r: radius }),
      });
      // 다시 불러오기
      const d = await apiFetch<{ diffs: Diff[] }>(
        `/api/admin/levels/${id}/diffs`,
      );
      setDiffs(d.diffs);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setErr(e?.message || "add diff failed");
    }
  };

  const deleteDiff = async (diffId: string) => {
    setErr("");
    try {
      await apiFetch(`/api/admin/diffs/${diffId}`, { method: "DELETE" });
      setDiffs((prev) => prev.filter((d) => d.id !== diffId));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setErr(e?.message || "delete diff failed");
    }
  };

  if (!me) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  if (!id) return <Navigate to="/admin/levels" replace />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Admin · Diff Editor
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            이미지 위를 클릭해서 원형(diff)을 저장합니다.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/admin/levels"
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm bg-gray-300/60 hover:bg-white transition"
          >
            레벨 목록
          </Link>
          <button
            onClick={loadAll}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm bg-gray-300/60 hover:bg-white transition"
          >
            새로고침
          </button>
        </div>
      </div>

      {err && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </div>
      )}

      {level && (
        <div className="mt-6 bg-white border rounded-2xl shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-lg font-semibold">{level.title}</div>
              <div className="text-sm text-gray-500">
                diffCount: {level.diffCount}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-700">반지름(r):</div>
              <input
                type="range"
                min={8}
                max={80}
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
              />
              <div className="text-sm font-medium w-5 text-right">{radius}</div>
            </div>
          </div>

          <div className="mt-6">
            <div className="text-sm font-medium text-gray-700 mb-2">
              LEFT 이미지 (여기에 찍으면 저장됨)
            </div>

            {/* 이미지 + 오버레이 */}
            <div className="relative inline-block">
              <img
                ref={imgRef}
                src={level.leftImageUrl}
                onLoad={onImageLoaded}
                onClick={addDiffByClick}
                className="max-w-full rounded-xl border select-none"
                alt="left"
              />

              {/* 오버레이는 img 위에 절대 위치 */}
              <svg
                className="absolute left-0 top-0 pointer-events-none"
                style={{
                  width:
                    // eslint-disable-next-line react-hooks/refs
                    imgRef.current?.getBoundingClientRect().width ?? "100%",
                  height:
                    // eslint-disable-next-line react-hooks/refs
                    imgRef.current?.getBoundingClientRect().height ?? "100%",
                }}
                // eslint-disable-next-line react-hooks/refs
                viewBox={`0 0 ${imgRef.current?.getBoundingClientRect().width ?? 1} ${
                  // eslint-disable-next-line react-hooks/refs
                  imgRef.current?.getBoundingClientRect().height ?? 1
                }`}
              >
                {overlays.map((d) => (
                  <circle
                    key={d.id}
                    cx={d.sx}
                    cy={d.sy}
                    r={d.sr}
                    fill="none"
                    strokeWidth="2"
                    stroke="red"
                  />
                ))}
              </svg>
            </div>

            <p className="mt-3 text-xs text-gray-500">
              * 클릭은 LEFT 기준으로만 찍어도 됨(원본 좌표 저장). 오른쪽은 Step
              8에서 검증에 사용.
            </p>
          </div>
        </div>
      )}

      {/* diff 목록 */}
      <div className="mt-6 bg-white border rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Diff 목록</h2>
          <span className="text-sm text-gray-500">{diffs.length}개</span>
        </div>

        <div className="mt-4 space-y-2">
          {diffs.map((d, idx) => (
            <div
              key={d.id}
              className="rounded-xl border p-3 flex items-center justify-between"
            >
              <div className="text-sm">
                <span className="font-medium">#{idx + 1}</span>{" "}
                <span className="text-gray-600">
                  x={d.x}, y={d.y}, r={d.r}
                </span>
              </div>
              <button
                onClick={() => deleteDiff(d.id)}
                className="rounded-lg border px-3 py-1.5 text-sm hover:bg-white"
              >
                삭제
              </button>
            </div>
          ))}

          {diffs.length === 0 && (
            <div className="text-sm text-gray-500">
              아직 diff가 없어. 이미지 위를 클릭해봐.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
