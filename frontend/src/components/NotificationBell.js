import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { toast } from "sonner";
import { Bell, Loader2, Volume2, VolumeX, XCircle, Check, CheckCheck, CircleDot, CheckCircle2 } from "lucide-react";

const POLL_INTERVAL = 15000;

function playUserNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 660;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.frequency.value = 880;
    osc2.type = "sine";
    gain2.gain.setValueAtTime(0.25, ctx.currentTime + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
    osc2.start(ctx.currentTime + 0.2);
    osc2.stop(ctx.currentTime + 0.6);
  } catch {}
}

function requestBrowserNotification(title, body) {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon: "/favicon.ico", badge: "/favicon.ico" });
  }
}

const TIPO_CONFIG = {
  CONFIRMADA: { icon: CheckCircle2, color: "text-[#ccff00]", bg: "bg-[#ccff00]/10", label: "Confirmada" },
  CANCELADA: { icon: XCircle, color: "text-red-400", bg: "bg-red-400/10", label: "Cancelada" },
  COMPLETADA: { icon: Check, color: "text-blue-400", bg: "bg-blue-400/10", label: "Completada" },
};

// ────────────────────────────────────────
// User Bell (for all users including staff)
// ────────────────────────────────────────
function UserBell({ soundEnabled, setSoundEnabled }) {
  const [count, setCount] = useState(0);
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const prevCountRef = useRef(0);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const fetchCount = useCallback(async () => {
    try {
      const { data } = await api.get("/notificaciones/count");
      const newCount = data.count;
      if (newCount > prevCountRef.current && prevCountRef.current > 0) {
        if (soundEnabled) playUserNotificationSound();
        requestBrowserNotification("Nueva notificacion", "Tenes una actualizacion en tus reservas");
        toast.info("Tenes una nueva notificacion!", {
          action: { label: "Ver", onClick: () => {} },
        });
      }
      prevCountRef.current = newCount;
      setCount(newCount);
    } catch {}
  }, [soundEnabled]);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchCount]);

  useEffect(() => {
    if (!open) return;
    setLoadingList(true);
    api.get("/notificaciones")
      .then(r => { setNotifs(r.data.slice(0, 10)); setLoadingList(false); })
      .catch(() => setLoadingList(false));
  }, [open]);

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    try {
      await api.patch("/notificaciones/leer-todas");
      setNotifs(prev => prev.map(n => ({ ...n, leida: true })));
      setCount(0);
      prevCountRef.current = 0;
    } catch {}
  };

  const handleMarkRead = async (nid) => {
    try {
      await api.patch(`/notificaciones/leer/${nid}`);
      setNotifs(prev => prev.map(n => n.id === nid ? { ...n, leida: true } : n));
      setCount(prev => Math.max(0, prev - 1));
      prevCountRef.current = Math.max(0, prevCountRef.current - 1);
    } catch {}
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Ahora";
    if (mins < 60) return `Hace ${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Hace ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Hace ${days}d`;
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative text-[#A1A1AA] hover:text-white hover:bg-white/5 rounded-sm h-9 w-9 p-0"
          data-testid="user-notification-bell"
        >
          <Bell className={`h-5 w-5 ${count > 0 ? "text-[#ccff00] animate-pulse" : ""}`} />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-5 min-w-5 px-1 rounded-full bg-[#ccff00] text-black text-[10px] font-black flex items-center justify-center">
              {count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-[#161618] border-white/10 rounded-sm w-[calc(100vw-2rem)] sm:w-80 max-w-sm p-0">
        {/* Header */}
        <div className="p-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white">Notificaciones</h3>
            {count > 0 && (
              <Badge className="bg-[#ccff00]/10 text-[#ccff00] border-[#ccff00]/20 rounded-sm text-[10px] px-1.5 h-5">
                {count}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {count > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[#A1A1AA] hover:text-[#ccff00] transition-colors"
                title="Marcar todas como leidas"
              >
                <CheckCheck className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); setSoundEnabled(!soundEnabled); }}
              className="text-[#A1A1AA] hover:text-white transition-colors"
              title={soundEnabled ? "Silenciar" : "Activar sonido"}
            >
              {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* List */}
        <div className="max-h-80 overflow-y-auto">
          {loadingList ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-[#ccff00]" /></div>
          ) : notifs.length === 0 ? (
            <div className="py-8 text-center">
              <Bell className="h-8 w-8 text-[#A1A1AA]/20 mx-auto mb-2" />
              <p className="text-[#A1A1AA] text-xs">Sin notificaciones</p>
            </div>
          ) : (
            notifs.map(n => {
              const config = TIPO_CONFIG[n.tipo] || TIPO_CONFIG.CONFIRMADA;
              const Icon = config.icon;
              return (
                <div
                  key={n.id}
                  className={`p-3 border-b border-white/5 transition-colors cursor-pointer hover:bg-white/[0.02] ${!n.leida ? "bg-[#ccff00]/[0.03]" : ""}`}
                  onClick={() => { if (!n.leida) handleMarkRead(n.id); }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-sm ${config.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${config.color}`}>
                          {config.label}
                        </span>
                        <span className="text-[10px] text-[#A1A1AA]/60 flex-shrink-0">
                          {timeAgo(n.createdAt)}
                        </span>
                      </div>
                      <p className={`text-xs leading-relaxed ${n.leida ? "text-[#A1A1AA]" : "text-white"}`}>
                        {n.mensaje}
                      </p>
                    </div>
                    {!n.leida && (
                      <CircleDot className="h-2.5 w-2.5 text-[#ccff00] flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {notifs.length > 0 && (
          <div className="p-2 border-t border-white/10">
            <Link to="/mis-reservas" onClick={() => setOpen(false)}>
              <Button variant="ghost" className="w-full text-[#ccff00] hover:text-[#b3e600] hover:bg-[#ccff00]/5 rounded-sm text-xs h-8">
                Ver mis reservas
              </Button>
            </Link>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ────────────────────────────────────────
// Main Export
// ────────────────────────────────────────
export default function NotificationBell() {
  const { user } = useAuth();
  const [soundEnabled, setSoundEnabled] = useState(true);

  if (!user) return null;

  return <UserBell soundEnabled={soundEnabled} setSoundEnabled={setSoundEnabled} />;
}
