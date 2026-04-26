import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { XCircle, Calendar, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PagoError() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const externalReference = searchParams.get("external_reference");

  useEffect(() => {
    document.title = "Pago rechazado — CanchaGNC";
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center pt-20 pb-16 px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
          <XCircle className="h-10 w-10 text-red-400" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white tracking-tight">Pago no realizado</h1>
          <p className="text-[#A1A1AA] text-sm leading-relaxed">
            El pago no pudo ser procesado. Tu reserva sigue pendiente — podés intentar pagar nuevamente desde "Mis reservas" antes de que expire el tiempo.
          </p>
        </div>

        <div className="bg-[#161618] border border-white/10 rounded-sm p-4 space-y-2 text-left">
          {externalReference && (
            <div className="flex justify-between">
              <span className="text-sm text-[#A1A1AA]">Reserva</span>
              <span className="text-white font-mono-accent text-sm">#{externalReference}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-sm text-[#A1A1AA]">Estado</span>
            <span className="text-red-400 font-semibold text-sm">Rechazado</span>
          </div>
        </div>

        <div className="bg-red-500/5 border border-red-500/20 rounded-sm p-3">
          <p className="text-xs text-red-400 leading-relaxed">
            Si el problema persiste, probá con otro medio de pago o contactanos por WhatsApp.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={() => navigate("/mis-reservas")}
            className="bg-[#ccff00] text-black font-bold hover:bg-[#b3e600] rounded-sm flex-1 h-12 sm:h-auto"
          >
            <Calendar className="h-4 w-4 mr-2" /> Ir a mis reservas
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/canchas")}
            className="border-white/20 text-white hover:bg-white/5 rounded-sm flex-1 h-12 sm:h-auto"
          >
            Ver canchas <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
