import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useAuth } from "../auth/AuthContext";

type Level = {
  id: string;
  title: string;
  leftImageUrl: string;
  rightImageUrl: string;
  diffCount: number;
};

type CheckRes =
  | { hit: true; diffId: string }
  | { hit: false; alreadyFound?: boolean; diffId?: string };

export default function Play() {
  const { me } = useAuth();
  const { id: levelId } = useParams();
  const [level, setLevel] = useState<Level | null>(null);
  const [err, setErr] = useState("");

  const imgRef = useRef<HTMLImageElement | null>(null);
  const [natural, setNatural] = useState({ w: 0, h: 0 });

  const [attemptId, setAttemptId] = useState<string>("");
  const [startedAtMs, setStartedAtMs] = useState<number>(0);
  const [wrongClicks, setWrongClicks] = useState<number>(0);
  const [found, setFound] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);

  const storageKey = useMemo(() => (levelId ? `attempt:${levelId}` : ""), [levelId]);

  // level 로드
  useEffect(() => {
    if (!levelId) return;

    apiFetch<{ level: Level }>(`/api/levels/${levelId}`)
      .then((data) => setLevel(data.level))
      .catch((e) => setErr(e?.message || "failed"));
  }, [levelId]);

  // 이미지 원본 크기
  const onImgLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    setNatural({ w: img.naturalWidth, h: img.naturalHeight });
  };

  useEffect(() => {
    if (!levelId) return;

    // 로그인 필요
    if (!me) return;

    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        const saved = JSON.parse(raw);
        if (saved?.attemptId) {
          setAttemptId(saved.attemptId);
          setStartedAtMs(saved.startedAtMs || Date.now());
          setWrongClicks(saved.wrongClicks || 0);
          setFound(Array.isArray(saved.found) ? saved.found : []);
          setFinished(Boolean(saved.finished));
          return;
        }
      } catch {}
    }

    // 새 attempt 생성
    (async () => {
      try {
        const data = await apiFetch<{ attemptId: string }>(`/api/attempts/start`, {
          method: "POST",
          body: JSON.stringify({ levelId }),
        });
        const now = Date.now();
        setAttemptId(data.attemptId);
        setStartedAtMs(now);
        setWrongClicks(0);
        setFound([]);
        setFinished(false);

        localStorage.setItem(
          storageKey,
          JSON.stringify({ attemptId: data.attemptId, startedAtMs: now, wrongClicks: 0, found: [], finished: false })
        );
      } catch (e: any) {
        setErr(e?.message || "attempt start failed");
      }
    })();
  }, [levelId, me, storageKey]);

  const screenToOriginal = (clientX: number, clientY: number) => {
    const img = imgRef.current;
    if (!img) return null;
    const rect = img.getBoundingClientRect();
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    if (sx < 0 || sy < 0 || sx > rect.width || sy > rect.height) return null;
    if (natural.w === 0 || natural.h === 0) return null;

    return {
      x: (sx / rect.width) * natural.w,
      y: (sy / rect.height) * natural.h,
    };
  };

  const onClickImage = async (e: React.MouseEvent) => {
    if (!level || !levelId) return;
    if (!attemptId) return;
    if (finished) return;

    setErr("");

    const pos = screenToOriginal(e.clientX, e.clientY);
    if (!pos) return;

    try {
      const res = await apiFetch<CheckRes>(`/api/levels/${levelId}/check`, {
        method: "POST",
        body: JSON.stringify({ x: pos.x, y: pos.y, attemptId }),
      });

      if (res.hit) {
        if (!found.includes(res.diffId)) {
          const next = [...found, res.diffId];
          setFound(next);

          const nextFinished = next.length >= level.diffCount && level.diffCount > 0;
          setFinished(nextFinished);

          localStorage.setItem(
            storageKey,
            JSON.stringify({
              attemptId,
              startedAtMs,
              wrongClicks,
              found: next,
              finished: nextFinished,
            })
          );

          if (nextFinished) {
            const durationMs = Date.now() - startedAtMs;
            await apiFetch(`/api/attempts/finish`, {
              method: "POST",
              body: JSON.stringify({ attemptId, durationMs, wrongClicks }),
            });
          }
        }
      } else {
        if (res.alreadyFound) {
          return;
        }
        const nextWrong = wrongClicks + 1;
        setWrongClicks(nextWrong);
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            attemptId,
            startedAtMs,
            wrongClicks: nextWrong,
            found,
            finished,
          })
        );
      }
    } catch (e: any) {
      setErr(e?.message || "check failed");
    }
  };

  const resetLocal = () => {
    if (!storageKey) return;
    localStorage.removeItem(storageKey);
    location.reload();
  };

  if (!me) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-white border rounded-2xl p-6">
          <div className="text-lg font-semibold">로그인이 필요해</div>
          <Link to="/login" className="mt-4 inline-block rounded-xl bg-black text-white px-4 py-2 text-sm">
            로그인
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{level?.title ?? "Loading..."}</h1>
          {level && (
            <p className="text-sm text-gray-500 mt-1">
              진행: {found.length}/{level.diffCount} · 오답: {wrongClicks}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Link to="/levels" className="text-sm rounded-xl border px-4 py-2 hover:bg-white">
            목록
          </Link>
          <button onClick={resetLocal} className="text-sm rounded-xl border px-4 py-2 hover:bg-white">
            재시작(로컬초기화)
          </button>
        </div>
      </div>

      {err && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </div>
      )}

      {finished && level && (
        <div className="mt-6 rounded-2xl border bg-green-50 px-4 py-3 text-sm text-green-800">
          완료! {found.length}/{level.diffCount} 찾음 · 오답 {wrongClicks} · 소요 {(Date.now() - startedAtMs) / 1000}s
        </div>
      )}

      {level && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border rounded-2xl shadow-sm p-3">
            <div className="text-sm text-gray-500 px-1 pb-2">LEFT (여기 클릭)</div>
            <img
              ref={imgRef}
              src={level.leftImageUrl}
              onLoad={onImgLoad}
              onClick={onClickImage}
              className="w-full rounded-xl border object-contain select-none"
              alt="left"
            />
          </div>

          <div className="bg-white border rounded-2xl shadow-sm p-3">
            <div className="text-sm text-gray-500 px-1 pb-2">RIGHT</div>
            <img src={level.rightImageUrl} className="w-full rounded-xl border object-contain" alt="right" />
          </div>
        </div>
      )}
    </div>
  );
}