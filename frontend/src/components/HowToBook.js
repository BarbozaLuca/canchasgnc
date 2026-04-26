import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { HelpCircle, UserPlus, Search, CalendarCheck, CreditCard, CheckCircle2 } from "lucide-react";

const PASOS = [
  {
    icon: <UserPlus className="h-5 w-5" />,
    titulo: "Crea tu cuenta",
    desc: "Registrate con tu nombre, email y una contraseña. Si ya tenes cuenta, simplemente ingresa.",
  },
  {
    icon: <Search className="h-5 w-5" />,
    titulo: "Elegi tu cancha",
    desc: "Navega por las canchas disponibles (Futbol 5 o 7) y hace click en \"Reservar\" en la que prefieras.",
  },
  {
    icon: <CalendarCheck className="h-5 w-5" />,
    titulo: "Selecciona fecha y horario",
    desc: "Elegi el dia y el horario disponible que mas te convenga. Los turnos son de 1 hora.",
  },
  {
    icon: <CreditCard className="h-5 w-5" />,
    titulo: "Paga la seña con Mercado Pago",
    desc: "Tenes 15 minutos para pagar el 50% del turno a traves de Mercado Pago. Podes usar tarjeta, transferencia o dinero en cuenta. Si no se realiza el pago en ese tiempo, la reserva se cancela automaticamente.",
    alerta: "IMPORTANTE: Al confirmar tu reserva vas a ser redirigido a Mercado Pago para completar el pago de la seña. No cierres la ventana hasta que se complete.",
  },
  {
    icon: <CheckCircle2 className="h-5 w-5" />,
    titulo: "Confirmacion automatica",
    desc: "Una vez que Mercado Pago confirma tu pago, tu turno queda confirmado automaticamente. Vas a recibir un email de confirmacion. El resto del monto se abona en el complejo al momento de jugar.",
  },
];

export default function HowToBook({ variant = "outline" }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        onClick={() => setOpen(true)}
        className={
          variant === "outline"
            ? "border-white text-white hover:bg-white/5 rounded-sm px-6 sm:px-8 py-3 text-sm h-12 sm:h-auto w-full sm:w-auto"
            : "bg-[#ccff00]/10 text-[#ccff00] hover:bg-[#ccff00]/20 border border-[#ccff00]/20 rounded-sm px-6 sm:px-8 py-3 text-sm h-12 sm:h-auto w-full sm:w-auto"
       }
       data-testid="how-to-book-btn"
     >
       <HelpCircle className="mr-2 h-4 w-4" /> ¿Cómo reservar?
     </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#161618] border-white/10 rounded-sm max-w-md max-h-[85vh] overflow-y-auto" data-testid="how-to-book-dialog">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-[#ccff00]" /> Cómo reservar tu turno
            </DialogTitle>
            <DialogDescription className="text-[#A1A1AA]">
              Seguí estos pasos para reservar tu cancha
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {PASOS.map((paso, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex-shrink-0 w-9 h-9 rounded-sm bg-[#ccff00]/10 text-[#ccff00] flex items-center justify-center text-sm font-bold">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[#ccff00]">{paso.icon}</span>
                    <p className="text-white font-semibold text-sm">{paso.titulo}</p>
                  </div>
                  <p className="text-[#A1A1AA] text-xs leading-relaxed">{paso.desc}</p>
                  {paso.alerta && (
                    <p className="mt-1.5 text-xs leading-relaxed text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded-sm px-2.5 py-1.5">
                      {paso.alerta}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
