import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Loader2, ArrowLeft, CalendarDays, Clock, CreditCard, Timer, AlertCircle, ExternalLink, Phone } from "lucide-react";
import HowToBook from "@/components/HowToBook";

// Genera label "HH:MM - HH:MM" a partir de horaInicio
const timeLabel = (horaInicio, horarios = []) => {
  const slot = horarios.find(s => s.horaInicio === horaInicio);
  if (slot) return `${slot.horaInicio} - ${slot.horaFin}`;
  const [h] = horaInicio.split(":").map(Number);
  return `${horaInicio} - ${String((h + 1) % 24).padStart(2, "0")}:00`;
};

// Countdown timer hook
function useCountdown(expiresAt) {
  const [remaining, setRemaining] = useState(null);
  useEffect(() => {
    if (!expiresAt) return;
    const calc = () => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt) - new Date()) / 1000));
      setRemaining(diff);
      return diff;
    };
    calc();
    const interval = setInterval(() => { if (calc() <= 0) clearInterval(interval); }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);
  if (remaining === null) return null;
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  return { total: remaining, display: `${m}:${s.toString().padStart(2, "0")}` };
}

export default function Booking() {
  const { canchaId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cancha, setCancha] = useState(null);
  const [date, setDate] = useState(null);
  const [horarios, setHorarios] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [diasNoLaborables, setDiasNoLaborables] = useState([]);

  // Booking step: "select" | "payment"
  const [step, setStep] = useState("select");
  const [bookingResult, setBookingResult] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  const countdown = useCountdown(bookingResult?.expiresAt);

  useEffect(() => {
    api.get(`/canchas/${canchaId}`).then(r => { setCancha(r.data); setLoading(false); }).catch(() => { toast.error("Cancha no encontrada"); navigate("/canchas"); });
    api.get("/dias-no-laborables").then(r => setDiasNoLaborables(r.data.map(d => d.fecha))).catch(() => {});
  }, [canchaId, navigate]);

  useEffect(() => {
    if (!date) return;
    setLoadingSlots(true);
    setSelected(null);
    const fecha = format(date, "yyyy-MM-dd");
    api.get(`/reservas/disponibilidad/${canchaId}?fecha=${fecha}`).then(r => { setHorarios(r.data.horarios); setLoadingSlots(false); }).catch(() => setLoadingSlots(false));
  }, [date, canchaId]);

  // Auto-cancel when timer expires
  useEffect(() => {
    if (countdown && countdown.total <= 0 && step === "payment") {
      toast.error("Tiempo agotado. La reserva fue cancelada.");
      setStep("select");
      setBookingResult(null);
      if (date) {
        const fecha = format(date, "yyyy-MM-dd");
        api.get(`/reservas/disponibilidad/${canchaId}?fecha=${fecha}`).then(r => setHorarios(r.data.horarios));
      }
    }
  }, [countdown, step, date, canchaId]);

  const handleConfirm = async () => {
    if (!selected || !date) return;
    setConfirming(true);
    try {
      const { data } = await api.post("/reservas/crear", {
        canchaId: canchaId,
        fecha: format(date, "yyyy-MM-dd"),
        horaInicio: selected.horaInicio,
        horaFin: selected.horaFin,
      });
      setBookingResult(data);
      setShowDialog(false);
      setStep("payment");

      toast.success("¡Reserva creada! Presioná el botón para pagar la seña.");
    } catch (err) {
      const d = err.response?.data;
      const msg = d?.detail || d?.message || d?.reason;
      toast.error(typeof msg === "string" ? msg : "Error al crear la reserva");
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center pt-20"><Loader2 className="h-8 w-8 animate-spin text-[#ccff00]" /></div>;
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6" data-testid="booking-page">
      <div className="max-w-5xl mx-auto">
        {/* Back + Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate("/canchas")} className="flex items-center gap-2 text-white hover:text-white transition-colors text-sm" data-testid="back-to-courts">
            <ArrowLeft className="h-4 w-4" /> Volver a canchas
          </button>
          <HowToBook variant="ghost" />
        </div>

        <div className="mb-10">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto min-w-0">
              <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight truncate" data-testid="booking-court-name">{cancha.nombre}</h1>
              <Badge className="bg-[#ccff00]/10 text-[#ccff00] border-[#ccff00]/20 hover:bg-[#ccff00]/10 rounded-sm shrink-0">Fútbol {cancha.tipo}</Badge>
            </div>
            <p className="font-mono-accent text-[#ccff00] font-bold text-xl sm:text-2xl shrink-0 sm:ml-auto" data-testid="booking-price">
              ${cancha.precio_hora?.toLocaleString()}<span className="text-xs sm:text-sm text-[#A1A1AA] font-normal">/hora</span>
            </p>
          </div>
          {cancha.descripcion && <p className="text-sm text-[#A1A1AA] mt-1">{cancha.descripcion}</p>}
        </div>

        {/* ── Step: Select date & time ── */}
        {step === "select" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 animate-fade-in">
            {/* Calendar */}
            <div className="bg-[#161618] border border-white/10 rounded-sm p-4 sm:p-6" data-testid="booking-calendar-card">
              <div className="flex items-center gap-2 mb-5">
                <CalendarDays className="h-5 w-5 text-[#ccff00]" />
                <h2 className="text-lg font-semibold text-white">Selecciona la fecha</h2>
              </div>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                locale={es}
                fromDate={new Date()}
                toDate={(() => { const d = new Date(); d.setDate(d.getDate() + 10); return d; })()}
                disabled={(d) => diasNoLaborables.includes(d.toISOString().split("T")[0])}
                className="rounded-sm p-3 booking-calendar"
                data-testid="booking-calendar"
              />
            </div>

            {/* Time slots */}
            <div className="bg-[#161618] border border-white/10 rounded-sm p-4 sm:p-6" data-testid="booking-timeslots-card">
              <div className="flex items-center gap-2 mb-5">
                <Clock className="h-5 w-5 text-[#ccff00]" />
                <h2 className="text-lg font-semibold text-white">Selecciona el horario</h2>
              </div>
              {!date ? (
                <div className="flex items-center justify-center h-64 text-[#A1A1AA] text-sm">Primero selecciona una fecha</div>
              ) : loadingSlots ? (
                <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-[#ccff00]" /></div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-3" data-testid="timeslots-grid">
                  {horarios.map(slot => {
                    const isSelected = selected?.horaInicio === slot.horaInicio;
                    const isDisabled = !slot.disponible;
                    return (
                      <button
                        key={slot.horaInicio}
                        onClick={() => !isDisabled && setSelected(slot)}
                        disabled={isDisabled}
                        data-testid={`slot-${slot.horaInicio.replace(":", "")}`}
                        className={`time-slot rounded-sm border px-3 py-3 sm:px-4 sm:py-4 text-center transition-all ${
                          isSelected ? "time-slot-selected"
                          : isDisabled ? "time-slot-disabled border-white/20 text-[#A1A1AA]/60"
                          : "border-white/20 text-white hover:border-[#ccff00]/50 hover:bg-[#ccff00]/5 cursor-pointer"
                        }`}
                      >
                        <p className={`font-mono-accent text-sm font-bold ${isSelected ? "text-black" : ""}`}>
                          {timeLabel(slot.horaInicio, horarios)}
                        </p>
                        <p className={`text-xs mt-1 ${isSelected ? "text-black/70" : isDisabled ? "text-[#A1A1AA]" : "text-[#A1A1AA]"}`}>
                          {isDisabled ? "Ocupado" : "Disponible"}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Summary + Confirm */}
              {selected && date && (
                <div className="mt-6 p-3 sm:p-4 bg-[#ccff00]/5 border border-[#ccff00]/20 rounded-sm" data-testid="booking-summary">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div>
                      <p className="text-xs text-[#A1A1AA] uppercase tracking-wider">Tu reserva</p>
                      <p className="text-white font-semibold mt-1 text-sm sm:text-base">
                        {format(date, "EEEE d 'de' MMMM", { locale: es })} | {timeLabel(selected.horaInicio, horarios)}
                      </p>
                    </div>
                    <p className="font-mono-accent text-[#ccff00] font-bold text-lg sm:text-xl">${cancha.precio_hora?.toLocaleString()}</p>
                  </div>
                  {user && !user.celular ? (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-sm p-3 sm:p-4" data-testid="missing-phone-warning">
                      <div className="flex items-start gap-3">
                        <Phone className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-yellow-300">Necesitamos tu celular</p>
                          <p className="text-xs sm:text-sm text-yellow-200/80 mt-1 leading-relaxed">
                            Cargá un número de contacto para poder reservar. Lo usamos solo si hay un problema con tu turno.
                          </p>
                          <Button asChild className="mt-3 w-full sm:w-auto bg-yellow-400 text-black font-bold uppercase tracking-wide hover:bg-yellow-300 rounded-sm h-10 text-xs sm:text-sm">
                            <Link to="/perfil">Completar mi perfil</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start gap-2 bg-red-500/5 border border-red-500/20 rounded-sm px-3 py-2 mb-3">
                        <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-red-300/80 leading-relaxed">
                          Una vez abonada la seña, <strong className="text-red-300">no se realizan devoluciones</strong> ni se puede cancelar la reserva.
                        </p>
                      </div>
                      <Button onClick={() => setShowDialog(true)} data-testid="confirm-booking-btn" className="w-full bg-[#ccff00] text-black font-bold uppercase tracking-wide hover:bg-[#b3e600] rounded-sm h-11">
                        Reservar y pagar seña
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step: Payment (redirect to MP) ── */}
        {step === "payment" && bookingResult && (
          <div className="max-w-xl mx-auto animate-fade-in" data-testid="payment-step">
            <div className="bg-[#161618] border border-white/10 rounded-sm p-5 sm:p-8">
              {/* Timer */}
              <div className="flex items-center justify-between gap-2 mb-6">
                <div className="flex items-center gap-2 min-w-0">
                  <CreditCard className="h-5 w-5 text-[#ccff00] shrink-0" />
                  <h2 className="text-xl font-semibold text-white truncate">Pagar seña</h2>
                </div>
                {countdown && (
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-sm font-mono-accent text-sm font-bold shrink-0 ${countdown.total <= 120 ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-[#ccff00]/10 text-[#ccff00] border border-[#ccff00]/20"}`} data-testid="payment-timer">
                    <Timer className="h-4 w-4" />
                    {countdown.display}
                  </div>
                )}
              </div>

              {/* Info del pago */}
              <div className="bg-[#0A0A0A] border border-white/10 rounded-sm p-4 space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#A1A1AA]">Cancha</span>
                  <span className="text-white font-semibold">{cancha.nombre}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-[#A1A1AA] shrink-0">Fecha y hora</span>
                  <span className="text-white font-mono-accent text-sm text-right">{date && format(date, "dd/MM/yyyy")} · {timeLabel(bookingResult.horaInicio, horarios)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-white/10 pt-3">
                  <span className="text-sm text-[#A1A1AA]">Seña a pagar</span>
                  <span className="text-[#ccff00] font-mono-accent font-bold text-xl">${bookingResult.sena?.toLocaleString()}</span>
                </div>
              </div>

              {/* Botón de pagar con MP */}
              {bookingResult.mpInitPoint ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-sm px-4 py-3">
                    <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300/90 leading-relaxed">
                      <strong className="text-red-300">Importante:</strong> al abonar la seña confirmás la reserva. El monto <strong className="text-red-300">no es reembolsable</strong> y la reserva no puede cancelarse.
                    </p>
                  </div>
                  <a href={bookingResult.mpInitPoint} className="block">
                    <Button className="w-full bg-[#009ee3] hover:bg-[#0082c4] text-white font-bold uppercase tracking-wide rounded-sm h-12 text-base" data-testid="mp-pay-btn">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Pagar con Mercado Pago
                    </Button>
                  </a>
                  <p className="text-xs text-[#A1A1AA] text-center">
                    Serás redirigido a Mercado Pago para completar el pago de forma segura.
                    Al pagar, tu reserva se confirma automáticamente.
                  </p>
                  <p className="text-xs text-[#A1A1AA] text-center">
                    💳 Podés pagar con tarjeta de débito o crédito <span className="text-white/70">sin necesidad de tener cuenta en Mercado Pago</span>.
                  </p>
                </div>
              ) : (
                <div className="bg-red-500/10 border border-red-500/20 rounded-sm px-4 py-3 text-center">
                  <p className="text-red-400 text-sm">No se pudo generar el link de pago. Intenta nuevamente.</p>
                  <Button onClick={() => { setStep("select"); setBookingResult(null); }} variant="outline" className="mt-3 border-white/20 text-white hover:bg-white/5 rounded-sm">
                    Volver a intentar
                  </Button>
                </div>
              )}

              {/* Warning */}
              <div className="mt-6 flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-sm px-4 py-3">
                <AlertCircle className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-300 leading-relaxed">
                  Tenes <span className="font-bold">{countdown?.display || "15:00"}</span> para completar el pago. Si no se realiza en tiempo, la reserva se cancela automaticamente y el turno queda libre.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#161618] border-white/10 rounded-sm max-h-[90vh] overflow-y-auto" data-testid="confirm-dialog">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Confirmar reserva</DialogTitle>
            <DialogDescription asChild>
              <div className="mt-3 bg-[#009ee3]/10 border border-[#009ee3]/20 rounded-sm px-4 py-3 space-y-2">
                <div className="flex items-start gap-3">
                  <CreditCard className="h-5 w-5 text-[#009ee3] shrink-0 mt-0.5" />
                  <p className="text-sm text-[#009ee3]/90 leading-relaxed">
                    Al confirmar, seras redirigido a <span className="font-bold text-[#009ee3]">Mercado Pago</span> para pagar la seña (50% del turno). Tenes <span className="font-bold">15 minutos</span> para completar el pago.
                  </p>
                </div>
                <div className="flex items-start gap-3 pt-1">
                  <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400 leading-relaxed m-0">
                    Si no se completa el pago en tiempo, la reserva se cancela automaticamente.
                  </p>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex justify-between text-sm">
              <span className="text-[#A1A1AA]">Cancha</span>
              <span className="text-white font-semibold">{cancha?.nombre} (Futbol {cancha?.tipo})</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#A1A1AA]">Fecha</span>
              <span className="text-white">{date && format(date, "dd/MM/yyyy")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#A1A1AA]">Horario</span>
              <span className="text-white font-mono-accent">{selected && timeLabel(selected.horaInicio, horarios)}</span>
            </div>
            <div className="border-t border-white/10 pt-3 flex justify-between">
              <span className="text-[#A1A1AA]">Precio total</span>
              <span className="text-white font-bold font-mono-accent">${cancha?.precio_hora?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A1A1AA]">Seña a pagar (MP)</span>
              <span className="text-[#ccff00] font-bold font-mono-accent text-lg">${Math.round(cancha?.precio_hora * 0.5)?.toLocaleString()}</span>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowDialog(false)} className="border-white/20 text-white hover:bg-white/5 rounded-sm w-full sm:w-auto" data-testid="cancel-dialog-btn">
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={confirming} className="bg-[#ccff00] text-black font-bold hover:bg-[#b3e600] rounded-sm w-full sm:w-auto" data-testid="confirm-dialog-btn">
              {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar y pagar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
