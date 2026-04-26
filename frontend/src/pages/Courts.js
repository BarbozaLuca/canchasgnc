import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import HowToBook from "@/components/HowToBook";

const DEFAULT_IMG = "https://infodeportes.com.ar/wp-content/uploads/2022/02/Invertiran-77-millones-para-licitar-cuatro-canchas-de-cesped-sintetico-para-municipios.png";
const BACKEND = process.env.REACT_APP_BACKEND_URL || "";

export default function Courts() {
  const { user } = useAuth();
  const [canchas, setCanchas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [horaApertura, setHoraApertura] = useState("17:00");
  const [horaCierre, setHoraCierre] = useState("01:00");

  useEffect(() => {
    api.get("/canchas").then(r => { setCanchas(r.data); setLoading(false); }).catch(() => setLoading(false));
    api.get("/config-pago/publica").then(r => {
      setHoraApertura(r.data.horaApertura || "17:00");
      setHoraCierre(r.data.horaCierre || "01:00");
    }).catch(() => {});
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#ccff00]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6" data-testid="courts-page">
      <div className="max-w-7xl mx-auto">
        <p className="overline mb-3">Complejo GNC</p>
        <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter text-white mb-4" data-testid="courts-title">
          Nuestras canchas
        </h1>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-12">
          <p className="text-base text-white/100 max-w-lg">
            Elegí la cancha que mejor se adapte a tu partido. Turnos de 1 hora, de {horaApertura} a {horaCierre}.
          </p>
          <HowToBook variant="ghost" />
        </div>

        {canchas.length === 0 ? (
          <p className="text-[#A1A1AA] text-center py-20">No hay canchas disponibles en este momento.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {canchas.map((c, i) => (
              <div key={c.id} className={`court-card group relative overflow-hidden rounded-sm border border-white/10 bg-[#161618] animate-fade-in`} style={{ animationDelay: `${i * 0.1}s` }} data-testid={`court-card-${c.id}`}>
                <div className="aspect-[16/9] overflow-hidden relative">
                  <img src={c.imagen_url ? (c.imagen_url.startsWith("http") ? c.imagen_url : `${BACKEND}${c.imagen_url}`) : DEFAULT_IMG} alt={c.nombre} onError={e => { e.target.src = DEFAULT_IMG; }} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#161618] via-transparent to-transparent" />
                </div>
                <div className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg sm:text-xl font-semibold text-white">{c.nombre}</h3>
                    <Badge className="bg-[#ccff00]/10 text-[#ccff00] border-[#ccff00]/20 hover:bg-[#ccff00]/10 rounded-sm">
                      Fútbol {c.tipo}
                    </Badge>
                  </div>
                  <p className="text-sm text-[#A1A1AA] mb-6 leading-relaxed">{c.descripcion}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono-accent text-[#ccff00] font-bold text-2xl">
                        ${c.precio_hora?.toLocaleString()}
                      </p>
                      <p className="text-xs text-[#A1A1AA]">por hora</p>
                    </div>
                    <Link to={user ? `/reservar/${c.id}` : "/auth"}>
                      <Button data-testid={`reserve-btn-${c.id}`} className="bg-[#ccff00] text-black font-bold uppercase tracking-wide hover:bg-[#b3e600] rounded-sm text-sm px-6 py-2.5 h-auto">
                        Reservar
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
