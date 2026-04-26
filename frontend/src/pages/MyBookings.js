import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Calendar, CreditCard, Timer, Clock, History, List, ExternalLink } from "lucide-react";

const STATUS_MAP = {
  PENDIENTE: { label: "Pendiente", cls: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  CONFIRMADA: { label: "Confirmada", cls: "bg-[#ccff00]/10 text-[#ccff00] border-[#ccff00]/20" },
  CANCELADA: { label: "Cancelada", cls: "bg-red-500/10 text-red-400 border-red-500/20" },
  COMPLETADA: { label: "Completada", cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
};

const timeLabel = (r) => `${r.horaInicio} - ${r.horaFin}`;

// Hook para countdown en tiempo real
function useCountdown(expiresAt) {
  const [timeLeft, setTimeLeft] = useState(() => calcTimeLeft(expiresAt));

  function calcTimeLeft(exp) {
    if (!exp) return null;
    const diff = new Date(exp).getTime() - Date.now();
    return diff > 0 ? diff : 0;
  }

  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      setTimeLeft(calcTimeLeft(expiresAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (timeLeft === null) return null;
  if (timeLeft <= 0) return { minutes: 0, seconds: 0, expired: true };
  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  return { minutes, seconds, expired: false };
}

// Componente que muestra el countdown para una reserva pendiente
function CountdownBadge({ expiresAt }) {
  const countdown = useCountdown(expiresAt);
  if (!countdown) return null;
  if (countdown.expired) return (
    <span className="text-red-400 text-xs font-mono-accent flex items-center gap-1">
      <Timer className="h-3 w-3" /> Expirada
    </span>
  );
  const isUrgent = countdown.minutes < 3;
  return (
    <span className={`text-xs font-mono-accent flex items-center gap-1 ${isUrgent ? "text-red-400 animate-pulse" : "text-yellow-400"}`}>
      <Timer className="h-3 w-3" />
      {String(countdown.minutes).padStart(2, "0")}:{String(countdown.seconds).padStart(2, "0")}
    </span>
  );
}

const FILTERS = [
  { key: "activas", label: "Activas", icon: Clock, states: ["PENDIENTE", "CONFIRMADA"] },
  { key: "historial", label: "Historial", icon: History, states: ["COMPLETADA", "CANCELADA"] },
  { key: "todas", label: "Todas", icon: List, states: null },
];

export default function MyBookings() {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("activas");

  const fetchReservas = () => {
    setLoading(true);
    api.get("/reservas/mis-reservas").then(r => { setReservas(r.data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchReservas(); }, []);

  // Auto-refresh cada 30s para actualizar estados (por si el webhook confirma o el scheduler cancela)
  useEffect(() => {
    const interval = setInterval(fetchReservas, 30000);
    return () => clearInterval(interval);
  }, []);

  const handlePagarMP = (reserva) => {
    // Siempre regenerar el link (la preferencia de MP expira en 15 min)
    api.post(`/reservas/mp-link/${reserva.id}`).then(r => {
      if (r.data.mpInitPoint) {
        window.open(r.data.mpInitPoint, "_blank");
      } else {
        toast.error("No se pudo obtener el link de pago. Intentá nuevamente.");
      }
    }).catch(() => toast.error("Error al obtener el link de pago"));
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center pt-20"><Loader2 className="h-8 w-8 animate-spin text-[#ccff00]" /></div>;
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6" data-testid="my-bookings-page">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="h-6 w-6 text-[#ccff00]" />
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight" data-testid="my-bookings-title">Mis reservas</h1>
        </div>
        <p className="text-sm text-[#A1A1AA] mb-6">Historial y gestion de tus reservas</p>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1 pr-4 -mr-4">
          {FILTERS.map(f => {
            const count = f.states ? reservas.filter(r => f.states.includes(r.estado)).length : reservas.length;
            const isActive = filter === f.key;
            const Icon = f.icon;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 rounded-sm text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? "bg-[#ccff00] text-black"
                    : "bg-[#161618] border border-white/10 text-[#A1A1AA] hover:text-white hover:border-white/20"
                }`}
              >
                <Icon className="h-4 w-4" />
                {f.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-sm font-mono-accent ${
                  isActive ? "bg-black/20 text-black" : "bg-white/5 text-[#A1A1AA]"
                }`}>{count}</span>
              </button>
            );
          })}
        </div>

        {(() => {
          const currentFilter = FILTERS.find(f => f.key === filter);
          const filtered = currentFilter.states ? reservas.filter(r => currentFilter.states.includes(r.estado)) : reservas;

        return filtered.length === 0 ? (
          <div className="text-center py-20 bg-[#161618] border border-white/10 rounded-sm">
            <Calendar className="h-12 w-12 text-[#A1A1AA]/30 mx-auto mb-4" />
            <p className="text-[#A1A1AA]">
              {filter === "activas" ? "No tenes reservas activas" : filter === "historial" ? "No hay reservas en el historial" : "No tenes reservas todavia"}
            </p>
          </div>
        ) : (
          <>
          {/* Banner informativo si hay reservas pendientes de pago */}
          {filtered.some(r => r.estado === "PENDIENTE" && !r.mpPaymentId) && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 bg-[#009ee3]/10 border border-[#009ee3]/20 rounded-sm px-3 sm:px-4 py-2.5 text-xs text-[#A1A1AA] mb-3">
              <span className="text-[#009ee3]">💳</span>
              <span>
                Podés pagar tu seña con tarjeta de débito o crédito{" "}
                <span className="text-white/80">sin necesidad de tener cuenta en Mercado Pago</span>.
              </span>
            </div>
          )}
          {/* Desktop: tabla — Mobile: cards */}
          <div className="hidden md:block bg-[#161618] border border-white/10 rounded-sm overflow-hidden" data-testid="bookings-table">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-[#A1A1AA] text-xs uppercase tracking-wider">Cancha</TableHead>
                  <TableHead className="text-[#A1A1AA] text-xs uppercase tracking-wider">Fecha</TableHead>
                  <TableHead className="text-[#A1A1AA] text-xs uppercase tracking-wider">Horario</TableHead>
                  <TableHead className="text-[#A1A1AA] text-xs uppercase tracking-wider">Precio</TableHead>
                  <TableHead className="text-[#A1A1AA] text-xs uppercase tracking-wider">Seña</TableHead>
                  <TableHead className="text-[#A1A1AA] text-xs uppercase tracking-wider">Estado</TableHead>
                  <TableHead className="text-[#A1A1AA] text-xs uppercase tracking-wider text-right">Accion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(r => {
                  const status = STATUS_MAP[r.estado] || STATUS_MAP.PENDIENTE;
                  const needsPay = r.estado === "PENDIENTE" && !r.mpPaymentId;
                  return (
                    <TableRow key={r.id} className="border-white/5 hover:bg-white/[0.02]" data-testid={`booking-row-${r.id}`}>
                      <TableCell className="text-white font-medium">
                        {r.canchaNombre || "Cancha"}
                        {r.canchaTipo > 0 && <span className="text-xs text-[#A1A1AA] ml-2">F{r.canchaTipo}</span>}
                      </TableCell>
                      <TableCell className="text-white font-mono-accent text-sm">{r.fecha}</TableCell>
                      <TableCell className="text-white font-mono-accent text-sm">{timeLabel(r)}</TableCell>
                      <TableCell className="text-white font-mono-accent">${r.precioTotal?.toLocaleString()}</TableCell>
                      <TableCell className="text-[#ccff00] font-mono-accent font-bold">${r.sena?.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge className={`${status.cls} hover:bg-opacity-10 rounded-sm text-xs w-fit`} data-testid={`booking-status-${r.id}`}>
                            {status.label}
                          </Badge>
                          {r.estado === "PENDIENTE" && r.expiresAt && (
                            <CountdownBadge expiresAt={r.expiresAt} />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {needsPay && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePagarMP(r)}
                              className="text-[#009ee3] hover:text-[#007bb8] hover:bg-[#009ee3]/5 rounded-sm text-xs"
                              data-testid={`pay-btn-${r.id}`}
                            >
                              <ExternalLink className="h-3.5 w-3.5 mr-1" /> Pagar con MP
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile: cards */}
          <div className="md:hidden space-y-3" data-testid="bookings-cards">
            {filtered.map(r => {
              const status = STATUS_MAP[r.estado] || STATUS_MAP.PENDIENTE;
              const needsPay = r.estado === "PENDIENTE" && !r.mpPaymentId;
              return (
                <div key={r.id} className="bg-[#161618] border border-white/10 rounded-sm p-4 space-y-3" data-testid={`booking-card-${r.id}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold">{r.canchaNombre || "Cancha"}</p>
                      <p className="text-[#A1A1AA] text-xs font-mono-accent">{r.fecha} · {timeLabel(r)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className={`${status.cls} rounded-sm text-xs`}>
                        {status.label}
                      </Badge>
                      {r.estado === "PENDIENTE" && r.expiresAt && (
                        <CountdownBadge expiresAt={r.expiresAt} />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-white/5 pt-3">
                    <div className="flex gap-4">
                      <div>
                        <p className="text-[#A1A1AA] text-xs uppercase tracking-wider">Precio</p>
                        <p className="text-white font-mono-accent text-sm">${r.precioTotal?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[#A1A1AA] text-xs uppercase tracking-wider">Seña</p>
                        <p className="text-[#ccff00] font-mono-accent font-bold text-sm">${r.sena?.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {needsPay && (
                        <Button size="sm" onClick={() => handlePagarMP(r)} className="bg-[#009ee3] text-white font-bold hover:bg-[#007bb8] rounded-sm text-xs h-8 px-3" data-testid={`pay-btn-m-${r.id}`}>
                          <CreditCard className="h-3.5 w-3.5 mr-1" /> Pagar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          </>
        );
        })()}
      </div>
    </div>
  );
}
