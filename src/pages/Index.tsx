import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";

type IconName = Parameters<typeof Icon>[0]["name"];

type Screen = "home" | "map" | "history" | "stats" | "challenges" | "profile" | "notifications";

const ROUTES_API = "https://functions.poehali.dev/83697f31-5c0f-4026-be7e-ff8677f2beda";

// Простой постоянный ID пользователя в localStorage
function getUserId(): string {
  let id = localStorage.getItem("stepmap_uid");
  if (!id) {
    id = "u_" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem("stepmap_uid", id);
  }
  return id;
}

async function apiSaveRoute(data: {
  distance_m: number;
  elapsed_sec: number;
  points: { lat: number; lon: number }[];
  note: string;
}): Promise<{ ok: boolean; id?: number }> {
  const res = await fetch(ROUTES_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-User-Id": getUserId() },
    body: JSON.stringify(data),
  });
  return res.json();
}

async function apiFetchRoutes(): Promise<DbRoute[]> {
  const res = await fetch(ROUTES_API, {
    headers: { "X-User-Id": getUserId() },
  });
  const data = await res.json();
  return data.routes || [];
}

async function apiDeleteRoute(id: number): Promise<void> {
  await fetch(`${ROUTES_API}?id=${id}`, {
    method: "DELETE",
    headers: { "X-User-Id": getUserId() },
  });
}

interface DbRoute {
  id: number;
  date: string;
  distance_m: number;
  elapsed_sec: number;
  points: { lat: number; lon: number }[];
  note: string;
  created_at: string;
}

const NAV_ITEMS = [
  { id: "home", icon: "Footprints", label: "Главная" },
  { id: "map", icon: "Map", label: "Карта" },
  { id: "history", icon: "Clock", label: "История" },
  { id: "stats", icon: "BarChart2", label: "Статистика" },
  { id: "challenges", icon: "Trophy", label: "Челленджи" },
  { id: "profile", icon: "User", label: "Профиль" },
];

// --- HOME SCREEN ---
function HomeScreen({ onNav }: { onNav: (s: Screen) => void }) {
  const steps = 7842;
  const goal = 10000;
  const percent = Math.round((steps / goal) * 100);
  const circumference = 2 * Math.PI * 54;
  const strokeDash = circumference - (percent / 100) * circumference;

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <p className="text-sm text-white/40 font-golos">Среда, 2 апреля</p>
          <h1 className="text-2xl font-bold font-montserrat gradient-text">StepMap</h1>
        </div>
        <button
          onClick={() => onNav("notifications")}
          className="relative w-11 h-11 glass-card-sm flex items-center justify-center"
        >
          <Icon name="Bell" size={20} className="text-white/70" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-[var(--grad-green)] rounded-full" />
        </button>
      </div>

      {/* Main Steps Card */}
      <div className="glass-card p-6 animate-fade-up delay-100 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20"
          style={{ background: "radial-gradient(circle at 70% 30%, rgba(34,209,122,0.3) 0%, transparent 60%)" }}
        />
        <div className="flex items-center gap-6 relative z-10">
          <div className="relative shrink-0">
            <svg width="124" height="124" viewBox="0 0 124 124">
              <circle cx="62" cy="62" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
              <circle
                cx="62" cy="62" r="54"
                fill="none"
                stroke="url(#ringGrad)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDash}
                transform="rotate(-90 62 62)"
                style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.22,1,0.36,1)" }}
              />
              <defs>
                <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22d17a" />
                  <stop offset="100%" stopColor="#4f8ef7" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black font-montserrat text-white leading-none">{percent}%</span>
              <span className="text-[10px] text-white/40 font-golos">цели</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-4xl font-black font-montserrat text-white leading-none">
              {steps.toLocaleString("ru")}
            </p>
            <p className="text-white/40 text-sm mt-1 font-golos">из {goal.toLocaleString("ru")} шагов</p>
            <div className="mt-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "rgba(34,209,122,0.2)" }}>
                  <Icon name="Route" size={12} className="text-[var(--grad-green)]" />
                </div>
                <span className="text-sm text-white/70 font-golos">5.6 км</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "rgba(79,142,247,0.2)" }}>
                  <Icon name="Flame" size={12} className="text-[var(--grad-blue)]" />
                </div>
                <span className="text-sm text-white/70 font-golos">312 ккал</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-5 relative z-10">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${percent}%` }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-white/30 font-golos">0</span>
            <span className="text-xs text-white/30 font-golos">{goal.toLocaleString("ru")}</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 animate-fade-up delay-200">
        <button
          onClick={() => onNav("map")}
          className="glass-card p-4 text-left transition-all active:scale-95"
        >
          <div className="w-10 h-10 rounded-2xl mb-3 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(34,209,122,0.3), rgba(79,142,247,0.2))" }}>
            <Icon name="Navigation" size={20} className="text-[var(--grad-green)]" />
          </div>
          <p className="text-sm font-semibold font-golos text-white">Смотреть маршрут</p>
          <p className="text-xs text-white/40 mt-0.5 font-golos">GPS активен</p>
        </button>
        <button
          onClick={() => onNav("challenges")}
          className="glass-card p-4 text-left transition-all active:scale-95"
        >
          <div className="w-10 h-10 rounded-2xl mb-3 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.3), rgba(244,114,182,0.2))" }}>
            <Icon name="Trophy" size={20} className="text-[var(--grad-purple)]" />
          </div>
          <p className="text-sm font-semibold font-golos text-white">Челленджи</p>
          <p className="text-xs text-white/40 mt-0.5 font-golos">3 активных</p>
        </button>
      </div>

      {/* Today Activity */}
      <div className="glass-card p-5 animate-fade-up delay-300">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold font-golos text-white">Активность сегодня</h2>
          <button onClick={() => onNav("stats")} className="text-xs text-[var(--grad-green)] font-golos">Подробнее →</button>
        </div>
        <div className="flex items-end gap-1.5 h-16">
          {[40, 65, 45, 80, 55, 90, 75, 85, 78, 92, 70, 88].map((h, i) => (
            <div key={i} className="flex-1 rounded-t-sm"
              style={{
                height: `${h}%`,
                background: i === 11
                  ? "linear-gradient(180deg, #22d17a, #4f8ef7)"
                  : i > 8
                    ? "rgba(34,209,122,0.3)"
                    : "rgba(255,255,255,0.07)"
              }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-white/30 font-golos">6:00</span>
          <span className="text-[10px] text-white/30 font-golos">Сейчас</span>
        </div>
      </div>

      {/* Achievements */}
      <div className="animate-fade-up delay-400">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold font-golos text-white">Достижения</h2>
          <button className="text-xs text-[var(--grad-green)] font-golos">Все →</button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {[
            { icon: "🏃", title: "Марафонец", desc: "50 км пройдено", done: true },
            { icon: "🔥", title: "На огне", desc: "7 дней подряд", done: true },
            { icon: "🌅", title: "Ранняя пташка", desc: "До 7 утра", done: false },
            { icon: "🏔️", title: "Горный козёл", desc: "500 м набора", done: false },
          ].map((a, i) => (
            <div key={i} className={`shrink-0 p-3 rounded-2xl text-center w-24 ${a.done ? "achievement-badge" : "glass-card-sm opacity-50"}`}>
              <div className="text-2xl mb-1">{a.icon}</div>
              <p className="text-xs font-semibold font-golos text-white leading-tight">{a.title}</p>
              <p className="text-[9px] text-white/40 font-golos mt-0.5">{a.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Вычисление расстояния между двумя GPS-точками (формула Haversine)
function calcDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type GeoPoint = { lat: number; lon: number };

// Преобразует GPS-координаты в SVG-координаты (400×320)
function geoToSvg(points: GeoPoint[], w = 400, h = 320): { x: number; y: number }[] {
  if (points.length === 0) return [];
  const lats = points.map((p) => p.lat);
  const lons = points.map((p) => p.lon);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLon = Math.min(...lons), maxLon = Math.max(...lons);
  const pad = 40;
  const rangeX = maxLon - minLon || 0.001;
  const rangeY = maxLat - minLat || 0.001;
  return points.map((p) => ({
    x: pad + ((p.lon - minLon) / rangeX) * (w - pad * 2),
    y: h - pad - ((p.lat - minLat) / rangeY) * (h - pad * 2),
  }));
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// --- MAP SCREEN ---
function MapScreen() {
  const [tracking, setTracking] = useState(false);
  const [points, setPoints] = useState<GeoPoint[]>([]);
  const [currentPos, setCurrentPos] = useState<GeoPoint | null>(null);
  const [distanceM, setDistanceM] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsReady, setGpsReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const savedPointsRef = useRef<GeoPoint[]>([]);
  const savedDistRef = useRef(0);
  const savedElapsedRef = useRef(0);

  // Запрашиваем начальную позицию при монтировании
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError("GPS не поддерживается браузером");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentPos({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setGpsReady(true);
      },
      () => setGpsError("Разрешите доступ к геолокации"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setSaved(false);
    setTracking(false);
  }, []);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) return;
    setPoints([]);
    setDistanceM(0);
    setElapsed(0);
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newPt: GeoPoint = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setCurrentPos(newPt);
        setPoints((prev) => {
          if (prev.length > 0) {
            const last = prev[prev.length - 1];
            const d = calcDistance(last.lat, last.lon, newPt.lat, newPt.lon);
            if (d < 3) return prev; // фильтруем шум < 3 м
            setDistanceM((dm) => dm + d);
          }
          return [...prev, newPt];
        });
      },
      (err) => {
        setGpsError(err.message);
        stopTracking();
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 }
    );
    setTracking(true);
  }, [stopTracking]);

  useEffect(() => () => stopTracking(), [stopTracking]);

  // При остановке сохраняем снимок данных для кнопки «Сохранить»
  const handleStop = useCallback(() => {
    savedPointsRef.current = points;
    savedDistRef.current = distanceM;
    savedElapsedRef.current = elapsed;
    stopTracking();
  }, [points, distanceM, elapsed, stopTracking]);

  const handleSave = useCallback(async (note = "") => {
    setSaving(true);
    try {
      await apiSaveRoute({
        distance_m: savedDistRef.current,
        elapsed_sec: savedElapsedRef.current,
        points: savedPointsRef.current,
        note,
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }, []);

  const svgPoints = geoToSvg(points);
  const polyline = svgPoints.map((p) => `${p.x},${p.y}`).join(" ");
  const lastPt = svgPoints[svgPoints.length - 1];
  const firstPt = svgPoints[0];
  const distKm = (distanceM / 1000).toFixed(2);
  const pace = elapsed > 0 && distanceM > 0
    ? `${((elapsed / 60) / (distanceM / 1000)).toFixed(1)} мин/км`
    : "—";

  return (
    <div className="flex flex-col gap-4 pb-4">
      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <h2 className="text-xl font-bold font-montserrat text-white">Маршрут</h2>
          <p className="text-sm text-white/40 font-golos">
            {tracking ? "Запись идёт..." : gpsReady ? "GPS готов" : "Определяю позицию..."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`gps-dot ${!gpsReady ? "opacity-40" : ""}`} />
          <span className="text-xs font-golos font-semibold" style={{ color: "var(--grad-green)" }}>
            {tracking ? "REC" : "GPS"}
          </span>
        </div>
      </div>

      {/* GPS Error */}
      {gpsError && (
        <div className="rounded-2xl p-4 text-sm font-golos text-white/80 animate-fade-up"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
          ⚠️ {gpsError}
        </div>
      )}

      {/* Current Position Info */}
      {currentPos && (
        <div className="glass-card-sm px-4 py-2.5 flex items-center gap-3 animate-fade-up">
          <Icon name="MapPin" size={14} style={{ color: "var(--grad-green)" }} />
          <span className="text-xs font-golos text-white/70">
            {currentPos.lat.toFixed(5)}, {currentPos.lon.toFixed(5)}
          </span>
          {tracking && (
            <span className="ml-auto text-xs font-semibold font-golos" style={{ color: "var(--grad-pink)" }}>
              ● LIVE
            </span>
          )}
        </div>
      )}

      {/* Map SVG Canvas */}
      <div className="map-placeholder map-grid rounded-3xl overflow-hidden relative animate-scale-in delay-100" style={{ height: 320 }}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 320">
          {/* Сетка */}
          <defs>
            <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22d17a" />
              <stop offset="100%" stopColor="#4f8ef7" />
            </linearGradient>
          </defs>

          {/* Линия маршрута */}
          {svgPoints.length >= 2 && (
            <polyline
              points={polyline}
              fill="none"
              stroke="url(#routeGrad)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: "drop-shadow(0 0 6px rgba(34,209,122,0.7))" }}
            />
          )}

          {/* Начальная точка */}
          {firstPt && (
            <circle cx={firstPt.x} cy={firstPt.y} r="6" fill="#22d17a"
              style={{ filter: "drop-shadow(0 0 6px #22d17a)" }} />
          )}

          {/* Текущая / конечная точка */}
          {lastPt && svgPoints.length >= 2 && (
            <>
              <circle cx={lastPt.x} cy={lastPt.y} r="10" fill="rgba(79,142,247,0.2)">
                <animate attributeName="r" values="8;14;8" dur="1.8s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.8s" repeatCount="indefinite" />
              </circle>
              <circle cx={lastPt.x} cy={lastPt.y} r="6" fill="#4f8ef7"
                style={{ filter: "drop-shadow(0 0 8px #4f8ef7)" }} />
            </>
          )}

          {/* Заглушка если нет точек */}
          {points.length === 0 && (
            <text x="200" y="165" textAnchor="middle" fill="rgba(255,255,255,0.2)"
              fontSize="13" fontFamily="Golos Text, sans-serif">
              {tracking ? "Двигайтесь — маршрут появится..." : "Нажмите «Начать» для записи"}
            </text>
          )}
        </svg>

        {/* Точки отсчёта */}
        {points.length > 0 && (
          <>
            <div className="absolute top-4 left-4 glass-card-sm px-3 py-1.5">
              <p className="text-xs text-white/70 font-golos">🟢 Старт</p>
            </div>
            {tracking && (
              <div className="absolute bottom-4 right-4 glass-card-sm px-3 py-1.5">
                <p className="text-xs font-golos font-semibold" style={{ color: "var(--grad-blue)" }}>
                  📌 {points.length} точек
                </p>
              </div>
            )}
          </>
        )}

        {!tracking && points.length === 0 && gpsReady && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2">🗺️</div>
              <p className="text-sm text-white/40 font-golos">Маршрут отобразится здесь</p>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 animate-fade-up delay-200">
        {[
          { icon: "Route", label: "Расстояние", value: `${distKm} км`, color: "var(--grad-green)" },
          { icon: "Clock", label: "Время", value: formatTime(elapsed), color: "var(--grad-blue)" },
          { icon: "Zap", label: "Темп", value: pace, color: "var(--grad-purple)" },
        ].map((s, i) => (
          <div key={i} className="glass-card p-3 text-center">
            <Icon name={s.icon as IconName} size={18} style={{ color: s.color }} className="mx-auto mb-1" />
            <p className="text-sm font-bold font-montserrat text-white leading-tight">{s.value}</p>
            <p className="text-[10px] text-white/40 font-golos">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Control Button */}
      <button
        onClick={tracking ? handleStop : startTracking}
        disabled={!gpsReady && !tracking}
        className="w-full py-4 rounded-2xl font-bold font-golos text-base transition-all active:scale-95 disabled:opacity-40"
        style={{
          background: tracking
            ? "linear-gradient(135deg, rgba(239,68,68,0.85), rgba(251,146,60,0.85))"
            : "linear-gradient(135deg, #22d17a, #4f8ef7)",
          color: tracking ? "white" : "#0a1628",
          boxShadow: tracking ? "0 4px 24px rgba(239,68,68,0.3)" : "0 4px 24px rgba(34,209,122,0.3)"
        }}
      >
        {tracking
          ? `⏹ Остановить · ${formatTime(elapsed)}`
          : gpsReady
            ? "▶ Начать запись маршрута"
            : "⏳ Определяю GPS..."}
      </button>

      {/* Saved route summary after stop */}
      {!tracking && savedPointsRef.current.length > 1 && (
        <div className="glass-card p-4 animate-scale-in"
          style={{ border: `1px solid ${saved ? "rgba(34,209,122,0.4)" : "rgba(34,209,122,0.2)"}` }}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{saved ? "✅" : "🗺️"}</span>
            <div>
              <p className="text-sm font-bold font-golos text-white">
                {saved ? "Маршрут сохранён в историю!" : "Маршрут записан"}
              </p>
              <p className="text-xs text-white/50 font-golos">
                {(savedDistRef.current / 1000).toFixed(2)} км · {formatTime(savedElapsedRef.current)} · {savedPointsRef.current.length} точек
              </p>
            </div>
            {!saved && (
              <button
                onClick={() => handleSave()}
                disabled={saving}
                className="ml-auto text-xs font-golos px-3 py-1.5 rounded-xl transition-all disabled:opacity-50"
                style={{ background: "rgba(34,209,122,0.15)", color: "var(--grad-green)", border: "1px solid rgba(34,209,122,0.3)" }}
              >
                {saving ? "⏳..." : "Сохранить"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Interesting places */}
      <div className="animate-fade-up delay-300">
        <h3 className="font-bold font-golos text-white mb-3">Рядом интересные места</h3>
        <div className="flex flex-col gap-2">
          {[
            { icon: "☕", name: "Кофейня «Брю»", dist: "120 м", type: "Кафе", fav: true },
            { icon: "🌳", name: "Центральный парк", dist: "340 м", type: "Парк", fav: false },
            { icon: "🛒", name: "Супермаркет «Фреш»", dist: "510 м", type: "Магазин", fav: false },
          ].map((p, i) => (
            <div key={i} className="glass-card-sm p-3 flex items-center gap-3">
              <div className="text-2xl w-10 h-10 flex items-center justify-center">{p.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold font-golos text-white">{p.name}</p>
                <p className="text-xs text-white/40 font-golos">{p.type} · {p.dist}</p>
              </div>
              <button className={`text-lg ${p.fav ? "opacity-100" : "opacity-30"}`}>
                {p.fav ? "⭐" : "☆"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const ROUTE_COLORS = ["#22d17a", "#4f8ef7", "#a855f7", "#fb923c", "#f472b6"];

function formatRouteDate(isoDate: string): string {
  const d = new Date(isoDate);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Сегодня";
  if (d.toDateString() === yesterday.toDateString()) return "Вчера";
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short", weekday: "short" });
}

// --- HISTORY SCREEN ---
function HistoryScreen() {
  const [activeTab, setActiveTab] = useState<"day" | "week" | "month">("week");
  const [routes, setRoutes] = useState<DbRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    apiFetchRoutes()
      .then(setRoutes)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: number) => {
    await apiDeleteRoute(id);
    setRoutes((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSaveNote = async (id: number) => {
    // Оптимистично обновляем UI
    setRoutes((prev) => prev.map((r) => r.id === id ? { ...r, note: noteText } : r));
    setEditingId(null);
  };

  // График расстояний по последним 7 дням
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().slice(0, 10);
    const dayRoutes = routes.filter((r) => r.date === dateStr || r.created_at?.slice(0, 10) === dateStr);
    const totalM = dayRoutes.reduce((acc, r) => acc + r.distance_m, 0);
    return {
      day: d.toLocaleDateString("ru-RU", { weekday: "short" }).slice(0, 2),
      val: totalM,
    };
  });
  const maxVal = Math.max(...last7.map((d) => d.val), 1);

  return (
    <div className="flex flex-col gap-4 pb-4">
      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <h2 className="text-xl font-bold font-montserrat text-white">История маршрутов</h2>
          <p className="text-sm text-white/40 font-golos mt-0.5">
            {loading ? "Загружаю..." : `${routes.length} маршрутов сохранено`}
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); apiFetchRoutes().then(setRoutes).finally(() => setLoading(false)); }}
          className="w-9 h-9 glass-card-sm flex items-center justify-center"
        >
          <Icon name="RefreshCw" size={16} className="text-white/50" />
        </button>
      </div>

      <div className="glass-card-sm p-1.5 flex gap-1 animate-fade-up delay-100">
        {(["day", "week", "month"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 py-2 rounded-xl text-sm font-semibold font-golos transition-all"
            style={{
              background: activeTab === tab ? "linear-gradient(135deg, #22d17a, #4f8ef7)" : "transparent",
              color: activeTab === tab ? "#0a1628" : "rgba(255,255,255,0.5)"
            }}
          >
            {tab === "day" ? "День" : tab === "week" ? "Неделя" : "Месяц"}
          </button>
        ))}
      </div>

      {/* График по дням */}
      <div className="glass-card p-4 animate-fade-up delay-150">
        <h3 className="text-sm font-semibold font-golos text-white/60 mb-3">Километры по дням</h3>
        <div className="flex items-end gap-2 h-20">
          {last7.map(({ day, val }, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-t-lg transition-all"
                style={{
                  height: `${val > 0 ? Math.max((val / maxVal) * 64, 8) : 4}px`,
                  background: i === 6
                    ? "linear-gradient(180deg, #22d17a, #4f8ef7)"
                    : val > 0
                      ? "rgba(255,255,255,0.18)"
                      : "rgba(255,255,255,0.04)"
                }}
              />
              <span className="text-[9px] text-white/30 font-golos">{day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Список маршрутов */}
      <div className="flex flex-col gap-3 animate-fade-up delay-200">
        {loading && (
          <div className="glass-card p-8 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl mb-2 animate-spin">⚙️</div>
              <p className="text-sm text-white/40 font-golos">Загружаю маршруты...</p>
            </div>
          </div>
        )}

        {!loading && routes.length === 0 && (
          <div className="glass-card p-8 text-center">
            <div className="text-4xl mb-3">🗺️</div>
            <p className="text-sm font-semibold font-golos text-white">Нет сохранённых маршрутов</p>
            <p className="text-xs text-white/40 font-golos mt-1">Запишите первую прогулку на вкладке «Карта»</p>
          </div>
        )}

        {!loading && routes.map((r, i) => {
          const color = ROUTE_COLORS[i % ROUTE_COLORS.length];
          const distKm = (r.distance_m / 1000).toFixed(2);
          return (
            <div key={r.id} className="glass-card p-4 flex gap-3 items-start">
              <div className="w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center"
                style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
                <Icon name="MapPin" size={18} style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold font-golos text-white">{formatRouteDate(r.created_at || r.date)}</p>
                  <div className="flex items-center gap-2">
                    <span className="status-done">{distKm} км</span>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="text-white/20 hover:text-red-400 transition-colors"
                    >
                      <Icon name="Trash2" size={12} />
                    </button>
                  </div>
                </div>
                <div className="flex gap-3 mt-1">
                  <span className="text-xs text-white/40 font-golos">📍 {r.points?.length ?? 0} точек</span>
                  <span className="text-xs text-white/40 font-golos">⏱ {formatTime(r.elapsed_sec)}</span>
                </div>

                {editingId === r.id ? (
                  <div className="flex gap-2 mt-2">
                    <input
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      className="flex-1 text-xs rounded-lg px-2 py-1 font-golos outline-none"
                      style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "white" }}
                      placeholder="Заметка к маршруту..."
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveNote(r.id)}
                      className="text-xs px-2 py-1 rounded-lg font-golos font-semibold"
                      style={{ background: "rgba(34,209,122,0.2)", color: "var(--grad-green)" }}
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-xs px-2 py-1 rounded-lg font-golos text-white/30"
                    >
                      ✕
                    </button>
                  </div>
                ) : r.note ? (
                  <button
                    onClick={() => { setEditingId(r.id); setNoteText(r.note); }}
                    className="text-xs mt-1.5 text-white/60 font-golos bg-white/5 px-2 py-1 rounded-lg inline-block text-left"
                  >
                    {r.note} ✏️
                  </button>
                ) : (
                  <button
                    onClick={() => { setEditingId(r.id); setNoteText(""); }}
                    className="text-xs mt-1.5 text-white/25 font-golos"
                  >
                    + Добавить заметку
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- STATS SCREEN ---
function StatsScreen() {
  const stats = [
    { icon: "Footprints", label: "Средние шаги/день", value: "7 287", unit: "шагов", color: "var(--grad-green)" },
    { icon: "Route", label: "Всего пройдено", value: "128.4", unit: "км", color: "var(--grad-blue)" },
    { icon: "Flame", label: "Калорий сожжено", value: "4 820", unit: "ккал", color: "var(--grad-orange)" },
    { icon: "Clock", label: "Время активности", value: "31.5", unit: "часов", color: "var(--grad-purple)" },
  ];

  return (
    <div className="flex flex-col gap-4 pb-4">
      <div className="animate-fade-up">
        <h2 className="text-xl font-bold font-montserrat text-white">Статистика</h2>
        <p className="text-sm text-white/40 font-golos">Апрель 2026</p>
      </div>

      <div className="grid grid-cols-2 gap-3 animate-fade-up delay-100">
        {stats.map((s, i) => (
          <div key={i} className="glass-card p-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
              style={{ background: `${s.color}20` }}>
              <Icon name={s.icon as IconName} size={18} style={{ color: s.color }} />
            </div>
            <p className="text-2xl font-black font-montserrat text-white">{s.value}</p>
            <p className="text-xs text-white/40 font-golos mt-0.5">{s.unit}</p>
            <p className="text-xs text-white/50 font-golos mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="glass-card p-5 animate-fade-up delay-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold font-golos text-white">Тренд по неделям</h3>
          <span className="text-xs font-golos font-semibold" style={{ color: "var(--grad-green)" }}>▲ +12%</span>
        </div>
        <div className="flex items-end gap-2 h-24">
          {[62, 75, 58, 88, 71, 90, 84, 92, 78, 95, 87, 100].map((h, i) => (
            <div key={i} className="flex-1 rounded-t-lg"
              style={{
                height: `${h}%`,
                background: i >= 10 ? "linear-gradient(180deg, #22d17a, #4f8ef7)" : "rgba(255,255,255,0.1)"
              }}
            />
          ))}
        </div>
      </div>

      <div className="animate-fade-up delay-300">
        <h3 className="font-bold font-golos text-white mb-3">Рекомендации</h3>
        <div className="flex flex-col gap-2.5">
          {[
            { icon: "🌅", title: "Утренние прогулки", desc: "Ходьба утром сжигает на 20% больше калорий" },
            { icon: "💪", title: "Увеличь темп", desc: "Ты на 2 158 шагов от дневной цели" },
            { icon: "😴", title: "Отдых важен", desc: "В последние 2 дня активность снизилась" },
          ].map((r, i) => (
            <div key={i} className="glass-card-sm p-4 flex gap-3">
              <span className="text-2xl">{r.icon}</span>
              <div>
                <p className="text-sm font-semibold font-golos text-white">{r.title}</p>
                <p className="text-xs text-white/50 font-golos mt-0.5">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-5 animate-fade-up delay-400"
        style={{ background: "linear-gradient(135deg, rgba(34,209,122,0.1), rgba(79,142,247,0.08))" }}>
        <div className="flex items-center gap-4">
          <div className="text-4xl">🏆</div>
          <div>
            <p className="text-xs text-white/40 font-golos">Лучший день месяца</p>
            <p className="text-xl font-black font-montserrat text-white">14 230 шагов</p>
            <p className="text-sm font-golos" style={{ color: "var(--grad-green)" }}>29 марта, воскресенье</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- CHALLENGES SCREEN ---
function ChallengesScreen() {
  const leaders = [
    { rank: 1, name: "Алексей К.", steps: 98420, avatar: "🏃", medal: "🥇" },
    { rank: 2, name: "Мария С.", steps: 87310, avatar: "🚶", medal: "🥈" },
    { rank: 3, name: "Вы", steps: 74580, avatar: "😊", medal: "🥉" },
    { rank: 4, name: "Игорь Т.", steps: 68200, avatar: "🏃", medal: "" },
    { rank: 5, name: "Анна В.", steps: 52100, avatar: "🚶", medal: "" },
  ];

  return (
    <div className="flex flex-col gap-4 pb-4">
      <div className="animate-fade-up">
        <h2 className="text-xl font-bold font-montserrat text-white">Челленджи</h2>
        <p className="text-sm text-white/40 font-golos">Соревнуйся с друзьями</p>
      </div>

      <div className="rounded-3xl p-5 animate-scale-in delay-100 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.3), rgba(244,114,182,0.2))", border: "1px solid rgba(168,85,247,0.3)" }}>
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #a855f7, transparent)", transform: "translate(30%, -30%)" }} />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="status-active">АКТИВЕН</span>
            <span className="text-xs text-white/40 font-golos">Осталось 3 дня</span>
          </div>
          <h3 className="text-lg font-bold font-montserrat text-white">10К шагов за неделю</h3>
          <p className="text-sm text-white/60 font-golos mt-1">Участников: 12 человек</p>
          <div className="mt-3">
            <div className="flex justify-between text-xs font-golos mb-1">
              <span className="text-white/60">Твой прогресс</span>
              <span className="text-white font-semibold">74 580 / 70 000</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: "100%" }} />
            </div>
            <p className="text-xs font-semibold font-golos mt-1" style={{ color: "var(--grad-green)" }}>✅ Цель достигнута!</p>
          </div>
        </div>
      </div>

      <div className="glass-card p-5 animate-fade-up delay-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold font-golos text-white">Таблица лидеров</h3>
          <span className="text-xs text-white/40 font-golos">Апрель 2026</span>
        </div>
        <div className="flex flex-col gap-2">
          {leaders.map((l, i) => (
            <div key={i} className={`leaderboard-row flex items-center gap-3 p-3 rounded-2xl ${l.name === "Вы" ? "ring-1 ring-green-400/30" : ""}`}>
              <span className="w-6 text-sm font-bold font-montserrat text-white/60">{l.medal || `#${l.rank}`}</span>
              <span className="text-xl">{l.avatar}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold font-golos text-white">{l.name}</p>
              </div>
              <p className="text-sm font-bold font-montserrat"
                style={{ color: i === 0 ? "var(--grad-green)" : "rgba(255,255,255,0.7)" }}>
                {l.steps.toLocaleString("ru")}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-5 animate-fade-up delay-300">
        <h3 className="font-bold font-golos text-white mb-3">Пригласить друзей</h3>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-xl px-3 py-2.5 text-sm font-golos outline-none"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "white"
            }}
            placeholder="Имя или телефон..."
          />
          <button className="btn-gradient px-4 py-2.5 rounded-xl text-sm font-golos">
            Позвать
          </button>
        </div>
      </div>

      <div className="animate-fade-up delay-400">
        <h3 className="font-bold font-golos text-white mb-3">Поделиться маршрутом</h3>
        <div className="flex gap-2">
          {[
            { icon: "Share2", label: "Ссылка", color: "var(--grad-blue)" },
            { icon: "MessageCircle", label: "Telegram", color: "var(--grad-green)" },
            { icon: "Heart", label: "Поделиться", color: "var(--grad-pink)" },
          ].map((s, i) => (
            <button key={i} className="flex-1 glass-card-sm py-3 flex flex-col items-center gap-1 active:scale-95 transition-all">
              <Icon name={s.icon as IconName} size={20} style={{ color: s.color }} />
              <span className="text-[10px] text-white/50 font-golos">{s.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- PROFILE SCREEN ---
function ProfileScreen() {
  const [notifGoal, setNotifGoal] = useState(true);
  const [notifRemind, setNotifRemind] = useState(true);
  const [trackBg, setTrackBg] = useState(false);

  return (
    <div className="flex flex-col gap-4 pb-4">
      <div className="glass-card p-5 text-center animate-scale-in relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ background: "linear-gradient(135deg, #22d17a, #4f8ef7, #a855f7)" }} />
        <div className="relative z-10">
          <div className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-4xl"
            style={{
              background: "linear-gradient(135deg, rgba(34,209,122,0.3), rgba(79,142,247,0.3))",
              border: "2px solid rgba(34,209,122,0.4)"
            }}>
            😊
          </div>
          <h2 className="text-xl font-bold font-montserrat text-white">Алёна Морозова</h2>
          <p className="text-sm text-white/40 font-golos">@alena_m · с марта 2026</p>
          <div className="flex justify-center gap-6 mt-4">
            <div className="text-center">
              <p className="text-xl font-black font-montserrat text-white">128</p>
              <p className="text-xs text-white/40 font-golos">км</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <p className="text-xl font-black font-montserrat text-white">32</p>
              <p className="text-xs text-white/40 font-golos">дня</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <p className="text-xl font-black font-montserrat text-white">7</p>
              <p className="text-xs text-white/40 font-golos">медалей</p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-5 animate-fade-up delay-100">
        <h3 className="font-bold font-golos text-white mb-4">Мои цели</h3>
        <div className="flex flex-col gap-3">
          {[
            { label: "Шагов в день", value: "10 000", icon: "Footprints", color: "var(--grad-green)" },
            { label: "Км в неделю", value: "35 км", icon: "Route", color: "var(--grad-blue)" },
            { label: "Калорий в день", value: "400 ккал", icon: "Flame", color: "var(--grad-orange)" },
          ].map((g, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: `${g.color}20` }}>
                  <Icon name={g.icon as IconName} size={16} style={{ color: g.color }} />
                </div>
                <span className="text-sm text-white/70 font-golos">{g.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold font-golos text-white">{g.value}</span>
                <button className="text-white/30">
                  <Icon name="Pencil" size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-5 animate-fade-up delay-200">
        <h3 className="font-bold font-golos text-white mb-4">Уведомления</h3>
        <div className="flex flex-col gap-4">
          {[
            { label: "Достижение цели", desc: "Когда выполнена дневная норма", val: notifGoal, set: setNotifGoal },
            { label: "Напоминание о прогулке", desc: "Если долго нет активности", val: notifRemind, set: setNotifRemind },
            { label: "Фоновая запись GPS", desc: "Отслеживать маршрут в фоне", val: trackBg, set: setTrackBg },
          ].map((n, i) => (
            <div key={i} className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold font-golos text-white">{n.label}</p>
                <p className="text-xs text-white/40 font-golos">{n.desc}</p>
              </div>
              <button
                onClick={() => n.set(!n.val)}
                className="w-12 h-6 rounded-full transition-all relative shrink-0"
                style={{ background: n.val ? "linear-gradient(90deg, #22d17a, #4f8ef7)" : "rgba(255,255,255,0.1)" }}
              >
                <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
                  style={{ left: n.val ? "calc(100% - 22px)" : "2px" }} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-5 animate-fade-up delay-300">
        <h3 className="font-bold font-golos text-white mb-4">Синхронизация</h3>
        <div className="flex flex-col gap-2">
          {[
            { icon: "⌚", name: "Apple Health", status: "подключено", connected: true },
            { icon: "🏃", name: "Google Fit", status: "не подключено", connected: false },
            { icon: "📱", name: "Samsung Health", status: "не подключено", connected: false },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <span className="text-xl">{s.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold font-golos text-white">{s.name}</p>
                <p className="text-xs font-golos"
                  style={{ color: s.connected ? "var(--grad-green)" : "rgba(255,255,255,0.3)" }}>
                  {s.status}
                </p>
              </div>
              <button className="text-xs font-golos px-3 py-1.5 rounded-xl transition-all"
                style={{
                  background: s.connected ? "rgba(239,68,68,0.1)" : "rgba(34,209,122,0.1)",
                  color: s.connected ? "#ef4444" : "var(--grad-green)",
                  border: `1px solid ${s.connected ? "rgba(239,68,68,0.2)" : "rgba(34,209,122,0.2)"}`
                }}>
                {s.connected ? "Отключить" : "Подключить"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- NOTIFICATIONS SCREEN ---
function NotificationsScreen() {
  const notifs = [
    { icon: "🎯", title: "Цель достигнута!", desc: "Ты прошёл 10 000 шагов сегодня", time: "5 мин назад", type: "achievement", unread: true },
    { icon: "🏆", title: "Ты лидер недели!", desc: "98 420 шагов за апрель — 1-е место", time: "1 час назад", type: "challenge", unread: true },
    { icon: "👣", title: "Время прогуляться", desc: "Ты давно не выходил на улицу", time: "3 часа назад", type: "reminder", unread: false },
    { icon: "🔥", title: "7-дневная серия!", desc: "Ты активен 7 дней подряд", time: "Вчера", type: "streak", unread: false },
    { icon: "📍", title: "Маршрут сохранён", desc: "Прогулка в парке · 5.6 км", time: "Вчера", type: "route", unread: false },
    { icon: "🤝", title: "Приглашение от Алексея", desc: "Присоединись к челленджу «Май-марафон»", time: "2 дня назад", type: "invite", unread: false },
  ];

  const colors: Record<string, string> = {
    achievement: "var(--grad-green)",
    challenge: "var(--grad-purple)",
    reminder: "var(--grad-orange)",
    streak: "var(--grad-pink)",
    route: "var(--grad-blue)",
    invite: "#22d1d1",
  };

  return (
    <div className="flex flex-col gap-4 pb-4">
      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <h2 className="text-xl font-bold font-montserrat text-white">Уведомления</h2>
          <p className="text-sm text-white/40 font-golos">2 непрочитанных</p>
        </div>
        <button className="text-xs font-golos" style={{ color: "var(--grad-green)" }}>Прочитать все</button>
      </div>

      <div className="flex flex-col gap-2 animate-fade-up delay-100">
        {notifs.map((n, i) => (
          <div key={i}
            className="glass-card-sm p-4 flex gap-3 items-start"
            style={{
              background: n.unread ? "rgba(34,209,122,0.05)" : undefined,
              border: n.unread ? "1px solid rgba(34,209,122,0.1)" : undefined,
            }}
          >
            <div className="w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center text-xl"
              style={{ background: `${colors[n.type]}18` }}>
              {n.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold font-golos text-white">{n.title}</p>
                {n.unread && <div className="w-2 h-2 rounded-full shrink-0" style={{ background: "var(--grad-green)" }} />}
              </div>
              <p className="text-xs text-white/50 font-golos mt-0.5">{n.desc}</p>
              <p className="text-[10px] text-white/25 font-golos mt-1">{n.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- MAIN APP ---
export default function Index() {
  const [screen, setScreen] = useState<Screen>("home");

  const handleNav = (s: Screen) => {
    setScreen(s);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderScreen = () => {
    switch (screen) {
      case "home": return <HomeScreen onNav={handleNav} />;
      case "map": return <MapScreen />;
      case "history": return <HistoryScreen />;
      case "stats": return <StatsScreen />;
      case "challenges": return <ChallengesScreen />;
      case "profile": return <ProfileScreen />;
      case "notifications": return <NotificationsScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      <div className="geo-bg" />

      <div className="fixed pointer-events-none z-0"
        style={{
          width: 200, height: 200, top: "40%", right: "5%",
          background: "linear-gradient(135deg, rgba(79,142,247,0.06), rgba(168,85,247,0.04))",
          borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%",
          filter: "blur(40px)"
        }}
      />
      <div className="fixed pointer-events-none z-0"
        style={{
          width: 150, height: 150, top: "20%", left: "5%",
          background: "linear-gradient(135deg, rgba(34,209,122,0.05), rgba(79,142,247,0.03))",
          borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
          filter: "blur(30px)"
        }}
      />

      <div className="relative z-10 max-w-md mx-auto px-4 pt-6 pb-24">
        <div key={screen} className="animate-fade-up">
          {renderScreen()}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-4">
        <div className="flex gap-1 max-w-md w-full px-2 py-2"
          style={{
            borderRadius: "1.75rem",
            background: "rgba(10,16,30,0.88)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.07)"
          }}>
          {NAV_ITEMS.map(item => {
            const active = screen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id as Screen)}
                className="nav-item flex-1 flex flex-col items-center py-2 rounded-2xl transition-all"
                style={{
                  background: active
                    ? "linear-gradient(135deg, rgba(34,209,122,0.2), rgba(79,142,247,0.15))"
                    : "transparent",
                  transform: active ? "translateY(-4px)" : "none"
                }}
              >
                <Icon
                  name={item.icon as IconName}
                  size={20}
                  style={{ color: active ? "var(--grad-green)" : "rgba(255,255,255,0.3)" }}
                />
                <span
                  className="text-[9px] mt-0.5 font-golos font-semibold"
                  style={{ color: active ? "var(--grad-green)" : "rgba(255,255,255,0.3)" }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}