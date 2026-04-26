import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Users, ChevronRight, Navigation, UserPlus } from "lucide-react";
import HowToBook from "@/components/HowToBook";

const HERO_BG = "https://images.pexels.com/photos/35898730/pexels-photo-35898730.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";
const DEFAULT_IMG = "https://infodeportes.com.ar/wp-content/uploads/2022/02/Invertiran-77-millones-para-licitar-cuatro-canchas-de-cesped-sintetico-para-municipios.png";
const BACKEND = process.env.REACT_APP_BACKEND_URL || "";

export default function Landing() {
  const { user } = useAuth();
  const [canchas, setCanchas] = useState([]);
  const [ubicacionUrl, setUbicacionUrl] = useState("");
  const [horaApertura, setHoraApertura] = useState("17:00");
  const [horaCierre, setHoraCierre] = useState("01:00");

  useEffect(() => {
    api.get("/canchas").then(r => setCanchas(r.data)).catch(() => {});
    api.get("/config-pago/publica").then(r => {
      setUbicacionUrl(r.data.ubicacionUrl || "");
      setHoraApertura(r.data.horaApertura || "17:00");
      setHoraCierre(r.data.horaCierre || "01:00");
    }).catch(() => {});
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center" data-testid="hero-section">
        <img src={HERO_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="hero-overlay absolute inset-0" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-32 w-full">
          <div className="max-w-3xl">
            <p className="overline animate-fade-in mb-4">Complejo deportivo</p>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tighter text-white animate-fade-in mb-6 leading-[0.9]" data-testid="hero-title">
              GNC
            </h1>
            <p className="text-base sm:text-lg text-white animate-fade-in animate-fade-in-delay-1 mb-10 max-w-lg leading-relaxed">
              Reserva tu cancha de fútbol 5 o 7 en segundos. Abierto todos los días de {horaApertura} a {horaCierre}.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 animate-fade-in animate-fade-in-delay-2">
              <Link to={user ? "/canchas" : "/auth"} className="w-full sm:w-auto">
                <Button data-testid="hero-cta-button" className="w-full sm:w-auto bg-[#ccff00] text-black font-bold uppercase tracking-wide hover:bg-[#b3e600] rounded-sm px-8 py-3 text-sm h-12 sm:h-auto">
                  Reservar ahora
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              {!user && (
                <Link to="/auth?tab=register" className="w-full sm:w-auto">
                  <Button data-testid="hero-register-button" className="w-full sm:w-auto bg-white text-black font-bold uppercase tracking-wide hover:bg-white/90 rounded-sm px-8 py-3 text-sm h-12 sm:h-auto">
                    <UserPlus className="mr-2 h-4 w-4" /> Crear cuenta
                  </Button>
                </Link>
              )}
              <Link to="/canchas" className="w-full sm:w-auto">
                <Button variant="outline" data-testid="hero-view-courts-button" className="w-full sm:w-auto border-white text-white hover:bg-white/5 rounded-sm px-6 sm:px-8 py-3 text-sm h-12 sm:h-auto">
                  Ver canchas
                </Button>
              </Link>
              <div className="w-full sm:w-auto">
                <HowToBook />
              </div>
              {ubicacionUrl && (
                <a href={ubicacionUrl} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white/5 rounded-sm px-6 py-3 text-sm h-12 sm:h-auto">
                    <Navigation className="mr-2 h-4 w-4" /> Cómo llegar
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Info strip */}
      <section className="bg-[#161618] border-y border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 divide-y divide-white/5 sm:divide-y-0">
          <div className="flex items-center gap-4" data-testid="info-horario">
            <div className="w-12 h-12 rounded-sm bg-[#ccff00]/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-[#ccff00]" />
            </div>
            <div>
              <p className="text-sm text-[#A1A1AA]">Horario</p>
              <p className="text-white font-semibold font-mono-accent">{horaApertura} - {horaCierre}</p>
            </div>
          </div>
          <div className="flex items-center gap-4" data-testid="info-canchas">
            <div className="w-12 h-12 rounded-sm bg-[#ccff00]/10 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-[#ccff00]" />
            </div>
            <div>
              <p className="text-sm text-[#A1A1AA]">Canchas disponibles</p>
              <p className="text-white font-semibold">{canchas.length} Canchas</p>
            </div>
          </div>
          <div className="flex items-center gap-4" data-testid="info-modalidad">
            <div className="w-12 h-12 rounded-sm bg-[#ccff00]/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-[#ccff00]" />
            </div>
            <div>
              <p className="text-sm text-[#A1A1AA]">Modalidades</p>
              <p className="text-white font-semibold">Fútbol 5 y 7</p>
            </div>
          </div>
        </div>
      </section>

      {/* Courts preview */}
      {canchas.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <p className="overline mb-3">Nuestras canchas</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-12 tracking-tight">
            Elegí tu cancha
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {canchas.slice(0, 4).map((c, i) => (
              <div key={c.id} className={`court-card group relative overflow-hidden rounded-sm border border-white/10 bg-[#161618] animate-fade-in animate-fade-in-delay-${i % 3 + 1}`}>
                <div className="aspect-[16/9] overflow-hidden">
                  <img src={c.imagen_url ? (c.imagen_url.startsWith("http") ? c.imagen_url : `${BACKEND}${c.imagen_url}`) : DEFAULT_IMG} alt={c.nombre} onError={e => { e.target.src = DEFAULT_IMG; }} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-semibold text-white">{c.nombre}</h3>
                    <Badge className="bg-[#ccff00]/10 text-[#ccff00] border-[#ccff00]/20 hover:bg-[#ccff00]/10 rounded-sm">
                      Fútbol {c.tipo}
                    </Badge>
                  </div>
                  <p className="text-sm text-[#A1A1AA] mb-4 line-clamp-2">{c.descripcion}</p>
                  <div className="flex items-center justify-between">
                    <p className="font-mono-accent text-[#ccff00] font-bold text-lg">
                      ${c.precio_hora?.toLocaleString()}<span className="text-xs text-[#A1A1AA] font-normal">/hora</span>
                    </p>
                    <Link to={user ? `/reservar/${c.id}` : "/auth"}>
                      <Button data-testid={`book-court-${c.id}`} className="bg-[#ccff00] text-black font-bold uppercase tracking-wide hover:bg-[#b3e600] rounded-sm text-xs px-5 py-2 h-auto">
                        Reservar
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link to="/canchas">
              <Button variant="outline" data-testid="view-all-courts-btn" className="border-white/20 text-white hover:bg-white/5 rounded-sm px-8 py-3 text-sm h-auto">
                Ver todas las canchas
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-2xl font-black uppercase tracking-tighter text-white">GNC</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-4">
            {ubicacionUrl && (
              <a href={ubicacionUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-white hover:text-[#ccff00] transition-colors">
                <MapPin className="h-4 w-4" /> Ubicación
              </a>
            )}
            <Link to="/terminos" className="text-sm text-white hover:text-[#ccff00] transition-colors">
              Términos y condiciones
            </Link>
            <p className="text-xs sm:text-sm text-white">Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
