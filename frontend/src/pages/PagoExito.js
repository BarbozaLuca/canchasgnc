import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Calendar, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PagoExito() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get("payment_id");
  const externalReference = searchParams.get("external_reference");

  useEffect(() => {
    document.title = "Pago exitoso — CanchaGNC";
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center pt-20 pb-16 px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-20 h-20 rounded-full bg-[#ccff00]/10 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-[#ccff00]" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white tracking-tight">¡Pago exitoso!</h1>
          <p className="text-[#A1A1AA] text-sm leading-relaxed">
            Tu seña fue acreditada correctamente. Tu turno está confirmado.
          </p>
        </div>

        <div className="bg-[#161618] border border-white/10 rounded-sm p-4 space-y-2 text-left">
          {externalReference && (
            <div className="flex justify-between">
              <span className="text-sm text-[#A1A1AA]">Reserva</span>
              <span className="text-white font-mono-accent text-sm">#{externalReference}</span>
            </div>
          )}
          {paymentId && (
            <div className="flex justify-between">
              <span className="text-sm text-[#A1A1AA]">ID de pago</span>
              <span className="text-white font-mono-accent text-sm">#{paymentId}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-sm text-[#A1A1AA]">Estado</span>
            <span className="text-[#ccff00] font-semibold text-sm">Confirmada</span>
          </div>
        </div>

        <p className="text-xs text-[#A1A1AA]">
          El resto del monto se abona en el complejo al momento de jugar.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={() => navigate("/mis-reservas")}
            className="bg-[#ccff00] text-black font-bold hover:bg-[#b3e600] rounded-sm flex-1 h-12 sm:h-auto"
          >
            <Calendar className="h-4 w-4 mr-2" /> Ver mis reservas
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/canchas")}
            className="border-white/20 text-white hover:bg-white/5 rounded-sm flex-1 h-12 sm:h-auto"
          >
            Reservar otra cancha <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
