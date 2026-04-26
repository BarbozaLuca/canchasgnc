import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Clock, Calendar, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PagoPendiente() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const externalReference = searchParams.get("external_reference");

  useEffect(() => {
    document.title = "Pago pendiente — CanchaGNC";
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center pt-20 pb-16 px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center">
          <Clock className="h-10 w-10 text-yellow-400" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white tracking-tight">Pago en proceso</h1>
          <p className="text-[#A1A1AA] text-sm leading-relaxed">
            Tu pago está siendo procesado por Mercado Pago. Esto puede tardar unos minutos.
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
            <span className="text-yellow-400 font-semibold text-sm">Procesando</span>
          </div>
        </div>

        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-sm p-3">
          <p className="text-xs text-yellow-400 leading-relaxed">
            Una vez que Mercado Pago confirme el pago, tu reserva se actualizará automáticamente.
            Podés verificar el estado en "Mis reservas".
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={() => navigate("/mis-reservas")}
            className="bg-[#ccff00] text-black font-bold hover:bg-[#b3e600] rounded-sm flex-1 h-12 sm:h-auto"
          >
            <Calendar className="h-4 w-4 mr-2" /> Ver mis reservas
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="border-white/20 text-white hover:bg-white/5 rounded-sm flex-1 h-12 sm:h-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Actualizar estado
          </Button>
        </div>
      </div>
    </div>
  );
}
