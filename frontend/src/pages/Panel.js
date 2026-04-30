import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Loader2, LayoutDashboard, Calendar, CalendarDays, MapPin, Users, MoreVertical, Plus, Pencil, Trash2, Power, CheckCircle2, DollarSign, TrendingUp, XCircle, CheckCheck, Settings, Search, Ban, Repeat, MessageCircle, Download, Upload, ChevronLeft, ChevronRight, ShieldCheck, AlertCircle } from "lucide-react";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, addDays, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const STATUS_MAP = {
  PENDIENTE: { label: "Pendiente", cls: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  CONFIRMADA: { label: "Confirmada", cls: "bg-[#ccff00]/10 text-[#ccff00] border-[#ccff00]/20" },
  CANCELADA: { label: "Cancelada", cls: "bg-red-500/10 text-red-400 border-red-500/20" },
  COMPLETADA: { label: "Completada", cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
};

export default function Panel() {
  const { user } = useAuth();
  const isAdmin = user?.rol === "ROLE_ADMIN";
  const isStaff = user?.rol === "ROLE_STAFF";
  const [staffPermisos, setStaffPermisos] = useState(null);

  useEffect(() => {
    if (isStaff) {
      api.get("/usuarios/yo").then(r => setStaffPermisos(r.data)).catch(() => {});
    }
  }, [isStaff]);

  // Helper: ¿tiene permiso? Admin siempre sí, staff según flags
  const canDo = (flag) => isAdmin || (isStaff && staffPermisos?.[flag] === true);

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6" data-testid="panel-page">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <LayoutDashboard className="h-6 w-6 text-[#ccff00]" />
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight" data-testid="panel-title">Panel de control</h1>
        </div>
        <p className="text-sm text-[#A1A1AA] mb-8">{isAdmin ? "Gestion completa del complejo" : "Gestion de reservas"}</p>

        <Tabs defaultValue="reservas">
          <TabsList className="bg-[#161618] border border-white/10 rounded-sm h-auto p-1 mb-8 flex justify-start overflow-x-auto flex-nowrap gap-1 w-full" data-testid="panel-tabs">
            <TabsTrigger value="reservas" className="rounded-sm data-[state=active]:bg-[#ccff00] data-[state=active]:text-black text-[#A1A1AA] px-3 sm:px-4 py-2 text-xs sm:text-sm whitespace-nowrap shrink-0" data-testid="tab-reservas">
              <Calendar className="mr-1.5 sm:mr-2 h-4 w-4" /> Reservas
            </TabsTrigger>
            <TabsTrigger value="agenda" className="rounded-sm data-[state=active]:bg-[#ccff00] data-[state=active]:text-black text-[#A1A1AA] px-3 sm:px-4 py-2 text-xs sm:text-sm whitespace-nowrap shrink-0" data-testid="tab-agenda">
              <CalendarDays className="mr-1.5 sm:mr-2 h-4 w-4" /> Agenda
            </TabsTrigger>
            {canDo("puedeGestionarTurnosFijos") && (
              <TabsTrigger value="turnos-fijos" className="rounded-sm data-[state=active]:bg-[#ccff00] data-[state=active]:text-black text-[#A1A1AA] px-3 sm:px-4 py-2 text-xs sm:text-sm whitespace-nowrap shrink-0" data-testid="tab-turnos-fijos">
                <Repeat className="mr-1.5 sm:mr-2 h-4 w-4" /> Turnos fijos
              </TabsTrigger>
            )}
            {canDo("puedeGestionarBloqueos") && (
              <TabsTrigger value="bloqueos" className="rounded-sm data-[state=active]:bg-[#ccff00] data-[state=active]:text-black text-[#A1A1AA] px-3 sm:px-4 py-2 text-xs sm:text-sm whitespace-nowrap shrink-0" data-testid="tab-bloqueos">
                <Ban className="mr-1.5 sm:mr-2 h-4 w-4" /> Bloqueos
              </TabsTrigger>
            )}
            {canDo("puedeVerFacturacion") && (
              <TabsTrigger value="facturacion" className="rounded-sm data-[state=active]:bg-[#ccff00] data-[state=active]:text-black text-[#A1A1AA] px-3 sm:px-4 py-2 text-xs sm:text-sm whitespace-nowrap shrink-0" data-testid="tab-facturacion">
                <DollarSign className="mr-1.5 sm:mr-2 h-4 w-4" /> Facturacion
              </TabsTrigger>
            )}
            {isAdmin && (
              <>
                <TabsTrigger value="canchas" className="rounded-sm data-[state=active]:bg-[#ccff00] data-[state=active]:text-black text-[#A1A1AA] px-3 sm:px-4 py-2 text-xs sm:text-sm whitespace-nowrap shrink-0" data-testid="tab-canchas">
                  <MapPin className="mr-1.5 sm:mr-2 h-4 w-4" /> Canchas
                </TabsTrigger>
                <TabsTrigger value="usuarios" className="rounded-sm data-[state=active]:bg-[#ccff00] data-[state=active]:text-black text-[#A1A1AA] px-3 sm:px-4 py-2 text-xs sm:text-sm whitespace-nowrap shrink-0" data-testid="tab-usuarios">
                  <Users className="mr-1.5 sm:mr-2 h-4 w-4" /> Usuarios
                </TabsTrigger>
                <TabsTrigger value="config" className="rounded-sm data-[state=active]:bg-[#ccff00] data-[state=active]:text-black text-[#A1A1AA] px-3 sm:px-4 py-2 text-xs sm:text-sm whitespace-nowrap shrink-0" data-testid="tab-config">
                  <Settings className="mr-1.5 sm:mr-2 h-4 w-4" /> Config
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="reservas"><ReservasTab canCambiarEstado={canDo("puedeCambiarEstado")} /></TabsContent>
          <TabsContent value="agenda"><AgendaTab canCrear={canDo("puedeCrearReservas")} canCambiarEstado={canDo("puedeCambiarEstado")} /></TabsContent>
          {canDo("puedeGestionarTurnosFijos") && <TabsContent value="turnos-fijos"><TurnosFijosTab /></TabsContent>}
          {canDo("puedeGestionarBloqueos") && <TabsContent value="bloqueos"><BloqueosTab /></TabsContent>}
          {canDo("puedeVerFacturacion") && <TabsContent value="facturacion"><FacturacionTab /></TabsContent>}
          {isAdmin && <TabsContent value="canchas"><CanchasTab /></TabsContent>}
          {isAdmin && <TabsContent value="usuarios"><UsuariosTab /></TabsContent>}
          {isAdmin && <TabsContent value="config"><ConfigTab /></TabsContent>}
        </Tabs>
      </div>
    </div>
  );
}

/* ─── Reservas Tab ─── */
const FILTROS_ESTADO = [
  { key: "TODAS", label: "Todas" },
  { key: "PENDIENTE", label: "Pendientes" },
  { key: "CONFIRMADA", label: "Confirmadas" },
  { key: "COMPLETADA", label: "Completadas" },
  { key: "CANCELADA", label: "Canceladas" },
];

function ReservasTab({ canCambiarEstado = true }) {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("TODAS");
  const [fechaFiltro, setFechaFiltro] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const fetch = () => { api.get("/reservas").then(r => { setReservas(r.data); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { fetch(); }, []);

  const changeStatus = async (id, estado) => {
    try { await api.patch(`/reservas/estado/${id}?estado=${estado}`); toast.success("Estado actualizado"); fetch(); }
    catch { toast.error("Error al cambiar estado"); }
  };

  // Aplicar filtro de búsqueda, estado y fecha
  const busquedaLower = busqueda.toLowerCase().trim();
  const filtradas = reservas
    .filter(r => !busquedaLower || r.usuarioNombre?.toLowerCase().includes(busquedaLower) || r.usuarioEmail?.toLowerCase().includes(busquedaLower))
    .filter(r => filtro === "TODAS" || r.estado === filtro)
    .filter(r => !fechaFiltro || r.fecha === fechaFiltro);

  // Contadores sobre las reservas ya filtradas por fecha y búsqueda
  const base = reservas
    .filter(r => !busquedaLower || r.usuarioNombre?.toLowerCase().includes(busquedaLower) || r.usuarioEmail?.toLowerCase().includes(busquedaLower))
    .filter(r => !fechaFiltro || r.fecha === fechaFiltro);
  const contadores = base.reduce((acc, r) => { acc[r.estado] = (acc[r.estado] || 0) + 1; return acc; }, {});

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[#ccff00]" /></div>;

  return (
    <div className="bg-[#161618] border border-white/10 rounded-sm overflow-x-auto" data-testid="reservas-panel">
      <div className="p-4 border-b border-white/10 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Todas las reservas</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#A1A1AA]" />
              <Input
                type="text"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar usuario..."
                className="bg-[#0A0A0A] border-white/10 text-white rounded-sm text-sm h-8 w-full sm:w-[180px] pl-8"
                data-testid="busqueda-usuario"
              />
            </div>
            <Input
              type="date"
              value={fechaFiltro}
              onChange={e => setFechaFiltro(e.target.value)}
              className="bg-[#0A0A0A] border-white/10 text-white rounded-sm text-sm h-8 w-full sm:w-[150px]"
              data-testid="filtro-fecha"
            />
            {(fechaFiltro || busqueda) && (
              <button
                onClick={() => { setFechaFiltro(""); setBusqueda(""); }}
                className="text-[#A1A1AA] hover:text-white text-xs underline"
                data-testid="limpiar-filtros"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-wrap" data-testid="filtro-estado">
          {FILTROS_ESTADO.map(f => {
            const count = f.key === "TODAS" ? base.length : (contadores[f.key] || 0);
            const isActive = filtro === f.key;
            const stStyle = f.key !== "TODAS" ? STATUS_MAP[f.key] : null;
            return (
              <button
                key={f.key}
                onClick={() => setFiltro(f.key)}
                className={`px-3 py-1.5 text-xs rounded-sm transition-all flex items-center gap-1.5 ${
                  isActive
                    ? "bg-[#ccff00] text-black font-bold"
                    : stStyle
                      ? `${stStyle.cls} hover:opacity-80`
                      : "bg-white/5 text-[#A1A1AA] border border-white/10 hover:bg-white/10"
                }`}
                data-testid={`filtro-${f.key}`}
              >
                {f.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-sm ${isActive ? "bg-black/20 text-black" : "bg-white/10 text-inherit"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {filtradas.length === 0 ? (
        <p className="text-[#A1A1AA] text-center py-16 text-sm">
          {filtro === "TODAS" ? "No hay reservas" : `No hay reservas ${FILTROS_ESTADO.find(f => f.key === filtro)?.label.toLowerCase()}`}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-[#A1A1AA] text-xs uppercase tracking-wider">Usuario</TableHead>
              <TableHead className="text-[#A1A1AA] text-xs uppercase tracking-wider">Cancha</TableHead>
              <TableHead className="text-[#A1A1AA] text-xs uppercase tracking-wider">Fecha</TableHead>
              <TableHead className="text-[#A1A1AA] text-xs uppercase tracking-wider">Horario</TableHead>
              <TableHead className="text-[#A1A1AA] text-xs uppercase tracking-wider">Seña</TableHead>
              <TableHead className="text-[#A1A1AA] text-xs uppercase tracking-wider">Estado</TableHead>
              <TableHead className="text-[#A1A1AA] text-xs uppercase tracking-wider text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtradas.map(r => {
              const st = STATUS_MAP[r.estado] || STATUS_MAP.PENDIENTE;
              return (
                <TableRow key={r.id} className="border-white/5 hover:bg-white/[0.02]" data-testid={`panel-booking-${r.id}`}>
                  <TableCell>
                    <p className="text-white text-sm">{r.usuarioNombre}</p>
                    <p className="text-[#A1A1AA] text-xs">{r.usuarioEmail}</p>
                  </TableCell>
                  <TableCell className="text-white text-sm">{r.canchaNombre}</TableCell>
                  <TableCell className="text-white font-mono-accent text-sm">{r.fecha}</TableCell>
                  <TableCell className="text-white font-mono-accent text-sm">{r.horaInicio} - {r.horaFin}</TableCell>
                  <TableCell className="text-[#ccff00] font-mono-accent font-bold">${r.sena?.toLocaleString()}</TableCell>
                  <TableCell><Badge className={`${st.cls} rounded-sm text-xs`}>{st.label}</Badge></TableCell>
                  <TableCell className="text-right">
                    {canCambiarEstado ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-[#A1A1AA] hover:text-white hover:bg-white/5 rounded-sm h-8 w-8 p-0" data-testid={`booking-actions-${r.id}`}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#161618] border-white/10 rounded-sm">
                          {["PENDIENTE", "CONFIRMADA", "COMPLETADA", "CANCELADA"].map(e => (
                            <DropdownMenuItem key={e} onClick={() => changeStatus(r.id, e)} className="text-[#A1A1AA] hover:text-white focus:text-white focus:bg-white/5 rounded-sm text-sm cursor-pointer">
                              {e}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <span className="text-[#A1A1AA] text-xs">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

/* ─── Facturacion Tab ─── */
function FacturacionTab() {
  const [stats, setStats] = useState(null);
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [desde, setDesde] = useState(() => { const d = new Date(); return d.toISOString().slice(0, 8) + "01"; });
  const [hasta, setHasta] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    Promise.all([api.get("/reservas/facturacion"), api.get("/reservas")])
      .then(([s, r]) => { setStats(s.data); setReservas(r.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[#ccff00]" /></div>;

  // Filtrar movimientos por rango de fecha
  const movimientos = reservas
    .filter(r => r.estado !== "PENDIENTE")
    .filter(r => r.fecha >= desde && r.fecha <= hasta)
    .sort((a, b) => b.fecha.localeCompare(a.fecha) || (b.horaInicio || "").localeCompare(a.horaInicio || ""));

  const totalFiltrado = movimientos
    .filter(r => r.estado === "CONFIRMADA" || r.estado === "COMPLETADA")
    .reduce((sum, r) => sum + (r.precioTotal || 0), 0);

  return (
    <div className="space-y-6" data-testid="facturacion-panel">
      {/* Cards de resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={<DollarSign className="h-5 w-5" />} label="Facturado hoy" value={`$${(stats?.facturadoHoy || 0).toLocaleString()}`} sub={`${stats?.reservasHoy || 0} reservas`} />
        <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Esta semana" value={`$${(stats?.facturadoSemana || 0).toLocaleString()}`} sub={`${stats?.reservasSemana || 0} reservas`} />
        <StatCard icon={<DollarSign className="h-5 w-5" />} label="Este mes" value={`$${(stats?.facturadoMes || 0).toLocaleString()}`} sub={`${stats?.reservasMes || 0} reservas`} accent />
      </div>

      {/* Cards secundarias */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[#161618] border border-white/10 rounded-sm p-4 flex items-center gap-3">
          <div className="bg-blue-500/10 p-2 rounded-sm"><CheckCheck className="h-4 w-4 text-blue-400" /></div>
          <div>
            <p className="text-xs text-[#A1A1AA] uppercase tracking-wider">Completadas este mes</p>
            <p className="text-xl font-bold text-white font-mono-accent">{stats?.completadasMes || 0}</p>
          </div>
        </div>
        <div className="bg-[#161618] border border-white/10 rounded-sm p-4 flex items-center gap-3">
          <div className="bg-red-500/10 p-2 rounded-sm"><XCircle className="h-4 w-4 text-red-400" /></div>
          <div>
            <p className="text-xs text-[#A1A1AA] uppercase tracking-wider">Canceladas este mes</p>
            <p className="text-xl font-bold text-white font-mono-accent">{stats?.canceladasMes || 0}</p>
          </div>
        </div>
      </div>

      {/* Gráfico de facturación diaria */}
      {(() => {
        const hoy = new Date();
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const diasDelMes = {};
        // Inicializar todos los días del mes hasta hoy
        for (let d = new Date(inicioMes); d <= hoy; d.setDate(d.getDate() + 1)) {
          diasDelMes[d.toISOString().slice(0, 10)] = 0;
        }
        // Sumar facturación por día
        reservas
          .filter(r => r.estado === "CONFIRMADA" || r.estado === "COMPLETADA")
          .filter(r => r.fecha >= inicioMes.toISOString().slice(0, 10) && r.fecha <= hoy.toISOString().slice(0, 10))
          .forEach(r => {
            if (diasDelMes[r.fecha] !== undefined) {
              diasDelMes[r.fecha] += r.estado === "COMPLETADA" ? (r.precioTotal || 0) : (r.sena || 0);
            }
          });
        const chartData = Object.entries(diasDelMes).map(([fecha, monto]) => ({
          fecha: fecha.slice(5), // "MM-DD"
          monto,
        }));
        return (
          <div className="bg-[#161618] border border-white/10 rounded-sm p-4">
            <h2 className="text-lg font-semibold text-white mb-1">Facturacion diaria</h2>
            <p className="text-xs text-[#A1A1AA] mb-4">Ingresos cobrados por dia en el mes actual</p>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMonto" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ccff00" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ccff00" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                  <XAxis dataKey="fecha" tick={{ fill: "#A1A1AA", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#A1A1AA", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: "#161618", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: "#fff", fontSize: 13 }}
                    formatter={(value) => [`$${value.toLocaleString()}`, "Facturado"]}
                    labelFormatter={(label) => `Dia ${label}`}
                  />
                  <Area type="monotone" dataKey="monto" stroke="#ccff00" strokeWidth={2} fill="url(#colorMonto)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })()}

      {/* Tabla de movimientos */}
      <div className="bg-[#161618] border border-white/10 rounded-sm overflow-hidden">
        <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Movimientos</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <Input type="date" value={desde} onChange={e => setDesde(e.target.value)} className="bg-[#0A0A0A] border-white/10 text-white rounded-sm text-sm h-8 w-[120px] sm:w-[140px]" data-testid="fecha-desde" />
            <span className="text-[#A1A1AA] text-sm">a</span>
            <Input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className="bg-[#0A0A0A] border-white/10 text-white rounded-sm text-sm h-8 w-[120px] sm:w-[140px]" data-testid="fecha-hasta" />
            <Button
              variant="outline"
              size="sm"
              className="border-white/10 text-[#A1A1AA] hover:text-white hover:bg-white/5 rounded-sm h-8 gap-1.5"
              onClick={async () => {
                try {
                  const token = localStorage.getItem("gnc_token");
                  const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/reservas/facturacion/exportar?desde=${desde}&hasta=${hasta}`, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  if (!res.ok) throw new Error();
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `facturacion_${desde}_a_${hasta}.xlsx`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success("Excel descargado");
                } catch { toast.error("Error al exportar"); }
              }}
              data-testid="exportar-excel-btn"
            >
              <Download className="h-3.5 w-3.5" /> Excel
            </Button>
          </div>
        </div>
        {movimientos.length === 0 ? (
          <p className="text-[#A1A1AA] text-center py-12 text-sm">No hay movimientos en el rango seleccionado</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-[#A1A1AA] text-xs uppercase tracking-wider">Fecha</TableHead>
                  <TableHead className="text-[#A1A1AA] text-xs uppercase tracking-wider">Cancha</TableHead>
                  <TableHead className="text-[#A1A1AA] text-xs uppercase tracking-wider">Usuario</TableHead>
                  <TableHead className="text-[#A1A1AA] text-xs uppercase tracking-wider">Horario</TableHead>
                  <TableHead className="text-[#A1A1AA] text-xs uppercase tracking-wider">Precio</TableHead>
                  <TableHead className="text-[#A1A1AA] text-xs uppercase tracking-wider">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimientos.map(r => {
                  const st = STATUS_MAP[r.estado] || STATUS_MAP.PENDIENTE;
                  return (
                    <TableRow key={r.id} className="border-white/5 hover:bg-white/[0.02]">
                      <TableCell className="text-white font-mono-accent text-sm">{r.fecha}</TableCell>
                      <TableCell className="text-white text-sm">{r.canchaNombre}</TableCell>
                      <TableCell>
                        <p className="text-white text-sm">{r.usuarioNombre}</p>
                        <p className="text-[#A1A1AA] text-xs">{r.usuarioEmail}</p>
                      </TableCell>
                      <TableCell className="text-white font-mono-accent text-sm">{r.horaInicio} - {r.horaFin}</TableCell>
                      <TableCell className="text-[#ccff00] font-mono-accent font-bold">${r.precioTotal?.toLocaleString()}</TableCell>
                      <TableCell><Badge className={`${st.cls} rounded-sm text-xs`}>{st.label}</Badge></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <div className="p-4 border-t border-white/10 flex justify-between items-center">
              <span className="text-[#A1A1AA] text-sm">{movimientos.length} movimientos</span>
              <span className="text-[#ccff00] font-mono-accent font-bold text-lg">Total: ${totalFiltrado.toLocaleString()}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div className={`bg-[#161618] border rounded-sm p-5 ${accent ? "border-[#ccff00]/30" : "border-white/10"}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`p-2 rounded-sm ${accent ? "bg-[#ccff00]/10 text-[#ccff00]" : "bg-white/5 text-[#A1A1AA]"}`}>{icon}</div>
        <span className="text-xs text-[#A1A1AA] uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-2xl font-bold font-mono-accent ${accent ? "text-[#ccff00]" : "text-white"}`}>{value}</p>
      <p className="text-xs text-[#A1A1AA] mt-1">{sub}</p>
    </div>
  );
}

/* ─── Canchas Tab ─── */
function CanchasTab() {
  const [canchas, setCanchas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(null);
  const [form, setForm] = useState({ nombre: "", descripcion: "", tipo: "5", precio_hora: "" });
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const fetchCanchas = () => { api.get("/canchas/todas").then(r => { setCanchas(r.data); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { fetchCanchas(); }, []);

  const openCreate = () => { setForm({ nombre: "", descripcion: "", tipo: "5", precio_hora: "" }); setImageFile(null); setImagePreview(null); setDialog("crear"); };
  const openEdit = (c) => {
    setForm({ nombre: c.nombre, descripcion: c.descripcion, tipo: String(c.tipo), precio_hora: String(c.precio_hora) });
    setImageFile(null);
    setImagePreview(c.imagen_url || null);
    setDialog(c);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Solo se permiten imagenes"); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const save = async () => {
    setSaving(true);
    try {
      const body = { ...form, tipo: parseInt(form.tipo), precio_hora: parseFloat(form.precio_hora) };
      let canchaId;
      if (dialog === "crear") {
        const res = await api.post("/canchas/crear", body);
        canchaId = res.data.id;
        toast.success("Cancha creada");
      } else {
        await api.patch(`/canchas/editar/${dialog.id}`, body);
        canchaId = dialog.id;
        toast.success("Cancha actualizada");
      }
      if (imageFile && canchaId) {
        const fd = new FormData();
        fd.append("imagen", imageFile);
        await api.post(`/canchas/imagen/${canchaId}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      }
      setDialog(null); fetchCanchas();
    } catch { toast.error("Error al guardar"); }
    finally { setSaving(false); }
  };

  const toggleActive = async (c) => {
    try { await api.patch(`/canchas/desactivar/${c.id}`); toast.success(c.activa ? "Desactivada" : "Activada"); fetchCanchas(); } catch { toast.error("Error"); }
  };

  const deleteCancha = async (c) => {
    try { await api.delete(`/canchas/eliminar/${c.id}`); toast.success("Eliminada"); fetchCanchas(); } catch { toast.error("Error"); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[#ccff00]" /></div>;

  return (
    <div data-testid="canchas-panel">
      <div className="bg-[#161618] border border-white/10 rounded-sm overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Gestion de canchas</h2>
          <Button onClick={openCreate} className="bg-[#ccff00] text-black font-bold hover:bg-[#b3e600] rounded-sm text-xs h-9 px-4" data-testid="create-court-btn">
            <Plus className="h-4 w-4 mr-1" /> Nueva cancha
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-[#A1A1AA] text-xs uppercase tracking-wider">Nombre</TableHead>
              <TableHead className="text-[#A1A1AA] text-xs uppercase tracking-wider">Tipo</TableHead>
              <TableHead className="text-[#A1A1AA] text-xs uppercase tracking-wider">Precio/h</TableHead>
              <TableHead className="text-[#A1A1AA] text-xs uppercase tracking-wider">Estado</TableHead>
              <TableHead className="text-[#A1A1AA] text-xs uppercase tracking-wider text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {canchas.map(c => (
              <TableRow key={c.id} className="border-white/5 hover:bg-white/[0.02]" data-testid={`court-row-${c.id}`}>
                <TableCell>
                  <p className="text-white font-medium">{c.nombre}</p>
                  <p className="text-[#A1A1AA] text-xs truncate max-w-[120px] sm:max-w-[200px]">{c.descripcion}</p>
                </TableCell>
                <TableCell><Badge className="bg-[#ccff00]/10 text-[#ccff00] border-[#ccff00]/20 rounded-sm text-xs">F{c.tipo}</Badge></TableCell>
                <TableCell className="text-[#ccff00] font-mono-accent font-bold">${c.precio_hora?.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge className={`rounded-sm text-xs ${c.activa ? "bg-[#ccff00]/10 text-[#ccff00] border-[#ccff00]/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                    {c.activa ? "Activa" : "Inactiva"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(c)} className="text-[#A1A1AA] hover:text-white hover:bg-white/5 rounded-sm h-8 w-8 p-0" data-testid={`edit-court-${c.id}`}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => toggleActive(c)} className="text-[#A1A1AA] hover:text-white hover:bg-white/5 rounded-sm h-8 w-8 p-0" data-testid={`toggle-court-${c.id}`}><Power className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteCancha(c)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-sm h-8 w-8 p-0" data-testid={`delete-court-${c.id}`}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialog !== null} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="bg-[#161618] border-white/10 rounded-sm" data-testid="court-dialog">
          <DialogHeader>
            <DialogTitle className="text-white">{dialog === "crear" ? "Nueva cancha" : "Editar cancha"}</DialogTitle>
            <DialogDescription className="text-[#A1A1AA]">Completa los datos de la cancha</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-[#A1A1AA] text-xs uppercase tracking-wider mb-2 block">Nombre</Label>
              <Input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} className="bg-[#0A0A0A] border-white/10 text-white rounded-sm" data-testid="court-name-input" />
            </div>
            <div>
              <Label className="text-[#A1A1AA] text-xs uppercase tracking-wider mb-2 block">Descripcion</Label>
              <Input value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} className="bg-[#0A0A0A] border-white/10 text-white rounded-sm" data-testid="court-desc-input" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-[#A1A1AA] text-xs uppercase tracking-wider mb-2 block">Tipo</Label>
                <Select value={form.tipo} onValueChange={v => setForm({...form, tipo: v})}>
                  <SelectTrigger className="bg-[#0A0A0A] border-white/10 text-white rounded-sm" data-testid="court-type-select"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#161618] border-white/10 rounded-sm">
                    <SelectItem value="5" className="text-white focus:bg-white/10 focus:text-white">Futbol 5</SelectItem>
                    <SelectItem value="7" className="text-white focus:bg-white/10 focus:text-white">Futbol 7</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#A1A1AA] text-xs uppercase tracking-wider mb-2 block">Precio/hora</Label>
                <Input type="number" value={form.precio_hora} onChange={e => setForm({...form, precio_hora: e.target.value})} className="bg-[#0A0A0A] border-white/10 text-white rounded-sm" data-testid="court-price-input" />
              </div>
            </div>
            <div>
              <Label className="text-[#A1A1AA] text-xs uppercase tracking-wider mb-2 block">Imagen</Label>
              {imagePreview && (
                <div className="mb-3 relative rounded-sm overflow-hidden border border-white/10">
                  <img src={imagePreview.startsWith("blob:") || imagePreview.startsWith("http") ? imagePreview : `${process.env.REACT_APP_BACKEND_URL || ""}${imagePreview}`} alt="Preview" className="w-full h-32 object-cover" />
                </div>
              )}
              <label className="flex items-center gap-2 cursor-pointer px-4 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-sm hover:bg-white/5 transition-colors" data-testid="court-image-input">
                <Upload className="h-4 w-4 text-[#A1A1AA]" />
                <span className="text-sm text-[#A1A1AA]">{imageFile ? imageFile.name : "Elegir imagen..."}</span>
                <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)} className="border-white/20 text-white hover:bg-white/5 rounded-sm">Cancelar</Button>
            <Button onClick={save} disabled={saving} className="bg-[#ccff00] text-black font-bold hover:bg-[#b3e600] rounded-sm" data-testid="save-court-btn">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── Usuarios Tab ─── */
const PERMISOS_LABELS = [
  { key: "puedeVerReservas",        label: "Ver reservas",          desc: "Acceso al panel, reservas y agenda" },
  { key: "puedeCrearReservas",      label: "Crear reservas",        desc: "Crear reservas presenciales desde la agenda" },
  { key: "puedeCambiarEstado",      label: "Cambiar estado",        desc: "Confirmar, completar o cancelar reservas" },
  { key: "puedeGestionarBloqueos",  label: "Gestionar bloqueos",    desc: "Crear y eliminar bloqueos de horarios" },
  { key: "puedeGestionarTurnosFijos", label: "Gestionar turnos fijos", desc: "Crear y eliminar turnos fijos" },
  { key: "puedeVerFacturacion",     label: "Ver facturación",       desc: "Ver estadísticas y reportes de facturación" },
];

function UsuariosTab() {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroRol, setFiltroRol] = useState("TODOS");
  const [busqueda, setBusqueda] = useState("");
  const [dialogPermisos, setDialogPermisos] = useState(null); // usuario seleccionado
  const [permisos, setPermisos] = useState({});
  const [savingPermisos, setSavingPermisos] = useState(false);

  const fetchData = async () => {
    try {
      const [u, r] = await Promise.all([api.get("/usuarios"), api.get("/roles")]);
      setUsuarios(u.data); setRoles(r.data);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const openPermisos = (u) => {
    setPermisos({
      puedeVerReservas: u.puedeVerReservas,
      puedeCrearReservas: u.puedeCrearReservas,
      puedeCambiarEstado: u.puedeCambiarEstado,
      puedeGestionarBloqueos: u.puedeGestionarBloqueos,
      puedeGestionarTurnosFijos: u.puedeGestionarTurnosFijos,
      puedeVerFacturacion: u.puedeVerFacturacion,
    });
    setDialogPermisos(u);
  };

  const savePermisos = async () => {
    setSavingPermisos(true);
    try {
      await api.patch(`/usuarios/permisos/${dialogPermisos.id}`, permisos);
      toast.success("Permisos actualizados");
      setDialogPermisos(null);
      fetchData();
    } catch { toast.error("Error al guardar permisos"); }
    finally { setSavingPermisos(false); }
  };

  const changeRole = async (uid, rolId) => {
    try { await api.patch(`/usuarios/cambiar-rol/${uid}?rolId=${rolId}`); toast.success("Rol actualizado"); fetchData(); }
    catch { toast.error("Error al cambiar rol"); }
  };

  const toggleUser = async (u) => {
    try { await api.patch(`/usuarios/desactivar/${u.id}`); toast.success(u.activo ? "Desactivado" : "Activado"); fetchData(); }
    catch { toast.error("Error"); }
  };

  const busquedaLower = busqueda.toLowerCase().trim();
  const buscados = usuarios.filter(u => !busquedaLower || u.nombre?.toLowerCase().includes(busquedaLower) || u.email?.toLowerCase().includes(busquedaLower));
  const filtrados = filtroRol === "TODOS" ? buscados : buscados.filter(u => u.rol_nombre === filtroRol);
  const contadores = buscados.reduce((acc, u) => { acc[u.rol_nombre] = (acc[u.rol_nombre] || 0) + 1; return acc; }, {});

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[#ccff00]" /></div>;

  return (
    <div className="bg-[#161618] border border-white/10 rounded-sm overflow-x-auto" data-testid="usuarios-panel">
      <div className="p-4 border-b border-white/10 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Gestion de usuarios</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#A1A1AA]" />
              <Input
                type="text"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar usuario..."
                className="bg-[#0A0A0A] border-white/10 text-white rounded-sm text-sm h-8 w-full sm:w-[180px] pl-8"
                data-testid="busqueda-usuario-tab"
              />
            </div>
            <Badge className="bg-white/5 text-[#A1A1AA] border-white/10 rounded-sm">{filtrados.length} usuarios</Badge>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-wrap" data-testid="filtro-rol">
          <button
            onClick={() => setFiltroRol("TODOS")}
            className={`px-3 py-1.5 text-xs rounded-sm transition-all flex items-center gap-1.5 ${
              filtroRol === "TODOS"
                ? "bg-[#ccff00] text-black font-bold"
                : "bg-white/5 text-[#A1A1AA] border border-white/10 hover:bg-white/10"
            }`}
            data-testid="filtro-rol-TODOS"
          >
            Todos
            <span className={`text-[10px] px-1.5 py-0.5 rounded-sm ${filtroRol === "TODOS" ? "bg-black/20 text-black" : "bg-white/10"}`}>{buscados.length}</span>
          </button>
          {roles.map(r => {
            const rolName = r.nombre;
            const label = rolName.replace("ROLE_", "");
            const count = contadores[rolName] || 0;
            const isActive = filtroRol === rolName;
            return (
              <button
                key={r.id}
                onClick={() => setFiltroRol(rolName)}
                className={`px-3 py-1.5 text-xs rounded-sm transition-all flex items-center gap-1.5 ${
                  isActive
                    ? "bg-[#ccff00] text-black font-bold"
                    : "bg-white/5 text-[#A1A1AA] border border-white/10 hover:bg-white/10"
                }`}
                data-testid={`filtro-rol-${label}`}
              >
                {label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-sm ${isActive ? "bg-black/20 text-black" : "bg-white/10"}`}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>
      {filtrados.length === 0 ? (
        <p className="text-[#A1A1AA] text-center py-16 text-sm">No hay usuarios con ese rol</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-[#A1A1AA] text-xs uppercase tracking-wider">Nombre</TableHead>
              <TableHead className="text-[#A1A1AA] text-xs uppercase tracking-wider">Email</TableHead>
              <TableHead className="text-[#A1A1AA] text-xs uppercase tracking-wider">Rol</TableHead>
              <TableHead className="text-[#A1A1AA] text-xs uppercase tracking-wider">Estado</TableHead>
              <TableHead className="text-[#A1A1AA] text-xs uppercase tracking-wider text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados.map(u => (
              <TableRow key={u.id} className="border-white/5 hover:bg-white/[0.02]" data-testid={`user-row-${u.id}`}>
                <TableCell className="text-white font-medium">{u.nombre}</TableCell>
                <TableCell className="text-[#A1A1AA] text-sm">{u.email}</TableCell>
                <TableCell>
                  <Select value={u.rol_id} onValueChange={(v) => changeRole(u.id, v)}>
                    <SelectTrigger className="w-full sm:w-[140px] bg-[#0A0A0A] border-white/10 text-white rounded-sm text-xs h-8" data-testid={`role-select-${u.id}`}>
                      <SelectValue>{u.rol_nombre || "..."}</SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-[#161618] border-white/10 rounded-sm">
                      {roles.map(r => (
                        <SelectItem key={r.id} value={r.id} className="text-white focus:bg-white/10 focus:text-white text-xs">
                          {r.nombre.replace("ROLE_", "")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Badge className={`rounded-sm text-xs ${u.activo ? "bg-[#ccff00]/10 text-[#ccff00] border-[#ccff00]/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                    {u.activo ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {u.rol_nombre === "ROLE_STAFF" && (
                      <Button variant="ghost" size="sm" onClick={() => openPermisos(u)} className="text-[#A1A1AA] hover:text-[#ccff00] hover:bg-white/5 rounded-sm h-8 w-8 p-0" title="Gestionar permisos" data-testid={`permisos-user-${u.id}`}>
                        <ShieldCheck className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => toggleUser(u)} className="text-[#A1A1AA] hover:text-white hover:bg-white/5 rounded-sm h-8 w-8 p-0" data-testid={`toggle-user-${u.id}`}>
                      <Power className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Dialog: gestión de permisos de staff */}
      <Dialog open={dialogPermisos !== null} onOpenChange={(o) => !o && setDialogPermisos(null)}>
        <DialogContent className="bg-[#161618] border-white/10 rounded-sm">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#ccff00]" />
              Permisos de {dialogPermisos?.nombre}
            </DialogTitle>
            <DialogDescription className="text-[#A1A1AA]">
              Definí qué puede hacer este staff en el panel
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {PERMISOS_LABELS.map(p => (
              <div key={p.key} className="flex items-start justify-between gap-4 py-2 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-white text-sm font-medium">{p.label}</p>
                  <p className="text-[#A1A1AA] text-xs">{p.desc}</p>
                </div>
                <button
                  onClick={() => setPermisos(prev => ({ ...prev, [p.key]: !prev[p.key] }))}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${permisos[p.key] ? "bg-[#ccff00]" : "bg-white/20"}`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg transition-transform ${permisos[p.key] ? "translate-x-4" : "translate-x-0"}`} />
                </button>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-white/10 text-white hover:bg-white/10" onClick={() => setDialogPermisos(null)}>Cancelar</Button>
            <Button className="bg-[#ccff00] text-black hover:bg-[#b8e600] font-semibold rounded-sm" onClick={savePermisos} disabled={savingPermisos}>
              {savingPermisos ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Guardar permisos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── Bloqueos Tab ─── */
function generarSlotsHorarios(apertura = "17:00", cierre = "01:00") {
  const slots = [];
  let [h] = apertura.split(":").map(Number);
  const [hFin] = cierre.split(":").map(Number);
  for (let i = 0; i < 24; i++) {
    const inicio = `${String(h).padStart(2, "0")}:00`;
    const next = (h + 1) % 24;
    const fin = `${String(next).padStart(2, "0")}:00`;
    slots.push({ inicio, fin });
    if (next === hFin) break;
    h = next;
  }
  return slots;
}

const CELL_STYLES = {
  LIBRE:      { label: "Libre",      bg: "bg-white/5",       text: "text-white/90 font-medium",     border: "border-white/10" },
  PENDIENTE:  { label: "Pendiente",  bg: "bg-yellow-500/15", text: "text-yellow-300 font-semibold", border: "border-yellow-500/50" },
  CONFIRMADA: { label: "Confirmada", bg: "bg-[#ccff00]/15",  text: "text-[#ccff00] font-bold",      border: "border-[#ccff00]/50" },
  COMPLETADA: { label: "Completada", bg: "bg-blue-500/15",   text: "text-blue-300 font-semibold",   border: "border-blue-500/50" },
  BLOQUEADO:  { label: "Bloqueado",  bg: "bg-red-500/15",    text: "text-red-300 font-semibold",    border: "border-red-500/50" },
  TURNO_FIJO: { label: "Turno fijo", bg: "bg-purple-500/15", text: "text-purple-300 font-semibold", border: "border-purple-500/50" },
};

const JS_DAY_TO_JAVA = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];

function AgendaTab({ canCrear = true, canCambiarEstado = true }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [reservas, setReservas] = useState([]);
  const [canchas, setCanchas] = useState([]);
  const [bloqueos, setBloqueos] = useState([]);
  const [turnosFijos, setTurnosFijos] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Dialog: crear reserva (celda libre)
  const [dialogLibre, setDialogLibre] = useState(null); // { slot, cancha }
  const [nombreCliente, setNombreCliente] = useState("");
  const [savingLibre, setSavingLibre] = useState(false);

  // Dialog: detalle + cambiar estado (celda ocupada)
  const [dialogOcupada, setDialogOcupada] = useState(null); // reserva object
  const [nuevoEstado, setNuevoEstado] = useState("");
  const [savingEstado, setSavingEstado] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/reservas"),
      api.get("/canchas/todas"),
      api.get("/bloqueos"),
      api.get("/turnos-fijos"),
      api.get("/config-pago/publica"),
    ]).then(([res, can, bloq, tf, cfg]) => {
      setReservas(res.data);
      setCanchas(can.data.filter(c => c.activa));
      setBloqueos(bloq.data);
      setTurnosFijos(tf.data);
      setConfig(cfg.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#ccff00]" /></div>;

  const slots = generarSlotsHorarios(config?.horaApertura || "17:00", config?.horaCierre || "01:00");
  const fechaStr = format(selectedDate, "yyyy-MM-dd");
  const javaDay = JS_DAY_TO_JAVA[selectedDate.getDay()];

  function getCellStatus(slot, cancha) {
    const norm = (t) => t ? t.substring(0, 5) : "";
    const bloq = bloqueos.find(b => String(b.canchaId) === String(cancha.id) && b.fecha === fechaStr && norm(b.horaInicio) === slot.inicio);
    if (bloq) return { status: "BLOQUEADO", data: bloq };
    const res = reservas.find(r => String(r.canchaId) === String(cancha.id) && r.fecha === fechaStr && norm(r.horaInicio) === slot.inicio && r.estado !== "CANCELADA");
    if (res) return { status: res.estado, data: res };
    const tf = turnosFijos.find(t => String(t.canchaId) === String(cancha.id) && t.diaSemana === javaDay && norm(t.horaInicio) === slot.inicio && t.activo && (!t.fechaFin || t.fechaFin >= fechaStr));
    if (tf) return { status: "TURNO_FIJO", data: tf };
    return { status: "LIBRE", data: null };
  }

  async function handleCrearReserva() {
    if (!nombreCliente.trim()) return;
    setSavingLibre(true);
    try {
      const res = await api.post("/reservas/crear-admin", {
        canchaId: dialogLibre.cancha.id,
        fecha: fechaStr,
        horaInicio: dialogLibre.slot.inicio + ":00",
        horaFin: dialogLibre.slot.fin + ":00",
        nombrePresencial: nombreCliente.trim(),
      });
      setReservas(prev => [...prev, res.data]);
      setDialogLibre(null);
      setNombreCliente("");
      toast.success("Reserva creada correctamente");
    } catch {
      toast.error("Error al crear la reserva");
    } finally {
      setSavingLibre(false);
    }
  }

  async function handleCambiarEstado() {
    if (!nuevoEstado || nuevoEstado === dialogOcupada.estado) return;
    setSavingEstado(true);
    try {
      await api.patch(`/reservas/estado/${dialogOcupada.id}?estado=${nuevoEstado}`);
      setReservas(prev => prev.map(r => r.id === dialogOcupada.id ? { ...r, estado: nuevoEstado } : r));
      setDialogOcupada(null);
      toast.success("Estado actualizado");
    } catch {
      toast.error("Error al cambiar el estado");
    } finally {
      setSavingEstado(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header: navegación de fecha */}
      <div className="flex items-center justify-center gap-3">
        <Button variant="outline" size="icon" className="h-9 w-9 border-white/10 bg-[#161618] text-white hover:bg-white/10" onClick={() => setSelectedDate(d => subDays(d, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="border-white/10 bg-[#161618] text-white hover:bg-white/10 px-4 min-w-[240px] justify-center gap-2">
              <CalendarDays className="h-4 w-4 text-[#ccff00]" />
              <span className="capitalize">{format(selectedDate, "EEEE d 'de' MMMM, yyyy", { locale: es })}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-[#161618] border-white/10" align="center">
            <CalendarPicker mode="single" selected={selectedDate} onSelect={(d) => { if (d) { setSelectedDate(d); setPopoverOpen(false); } }} initialFocus />
          </PopoverContent>
        </Popover>
        <Button variant="outline" size="icon" className="h-9 w-9 border-white/10 bg-[#161618] text-white hover:bg-white/10" onClick={() => setSelectedDate(d => addDays(d, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-3 justify-center">
        {Object.entries(CELL_STYLES).map(([key, s]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-sm ${s.bg} ${s.border} border`} />
            <span className="text-xs text-white">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Grilla */}
      <div className="overflow-x-auto border border-white/10 rounded-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-white text-xs uppercase tracking-wider sticky left-0 bg-[#161618] z-10 w-[100px] border-r border-white/10">Horario</TableHead>
              {canchas.map(c => (
                <TableHead key={c.id} className="text-white text-xs uppercase tracking-wider text-center min-w-[140px]">{c.nombre}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {slots.map(slot => (
              <TableRow key={slot.inicio} className="border-white/5 hover:bg-transparent">
                <TableCell className="text-white font-mono text-xs sticky left-0 bg-[#161618] z-10 py-1.5 border-r border-white/10 whitespace-nowrap">
                  {slot.inicio} - {slot.fin}
                </TableCell>
                {canchas.map(cancha => {
                  const cell = getCellStatus(slot, cancha);
                  const s = CELL_STYLES[cell.status];
                  const clickable = (cell.status === "LIBRE" && canCrear) ||
                    (["PENDIENTE", "CONFIRMADA", "COMPLETADA"].includes(cell.status) && canCambiarEstado);
                  return (
                    <TableCell key={cancha.id} className="p-1">
                      <div
                        onClick={clickable ? () => {
                          if (cell.status === "LIBRE") {
                            setNombreCliente("");
                            setDialogLibre({ slot, cancha });
                          } else {
                            setNuevoEstado(cell.data.estado);
                            setDialogOcupada(cell.data);
                          }
                        } : undefined}
                        className={`${s.bg} ${s.border} border rounded-sm px-2 py-1.5 min-h-[44px] flex flex-col justify-center ${clickable ? "cursor-pointer hover:opacity-75 transition-opacity" : ""}`}
                      >
                        <span className={`text-xs font-medium ${s.text}`}>{s.label}</span>
                        {cell.data?.nombrePresencial && <span className="text-[10px] text-white truncate">{cell.data.nombrePresencial}</span>}
                        {!cell.data?.nombrePresencial && cell.data?.usuarioNombre && <span className="text-[10px] text-white truncate">{cell.data.usuarioNombre}</span>}
                        {cell.status === "BLOQUEADO" && cell.data?.motivo && <span className="text-[10px] text-white truncate">{cell.data.motivo}</span>}
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Dialog: crear reserva presencial */}
      <Dialog open={dialogLibre !== null} onOpenChange={(o) => !o && setDialogLibre(null)}>
        <DialogContent className="bg-[#161618] border-white/10 rounded-sm">
          <DialogHeader>
            <DialogTitle className="text-white">Nueva reserva</DialogTitle>
            <DialogDescription className="text-white">
              {dialogLibre && `${dialogLibre.cancha.nombre}  ·  ${fechaStr}  ·  ${dialogLibre.slot.inicio} – ${dialogLibre.slot.fin}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label className="text-white text-sm">Nombre del cliente</Label>
            <Input
              className="bg-[#0A0A0A] border-white/10 text-white rounded-sm"
              placeholder="Ej: Juan Pérez"
              value={nombreCliente}
              onChange={e => setNombreCliente(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCrearReserva()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-white/10 text-white hover:bg-white/10" onClick={() => setDialogLibre(null)}>Cancelar</Button>
            <Button className="bg-[#ccff00] text-black hover:bg-[#b8e600] font-semibold rounded-sm" onClick={handleCrearReserva} disabled={!nombreCliente.trim() || savingLibre}>
              {savingLibre ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirmar reserva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: detalle de reserva + cambiar estado */}
      <Dialog open={dialogOcupada !== null} onOpenChange={(o) => !o && setDialogOcupada(null)}>
        <DialogContent className="bg-[#161618] border-white/10 rounded-sm">
          <DialogHeader>
            <DialogTitle className="text-white">Reserva #{dialogOcupada?.id}</DialogTitle>
            <DialogDescription className="text-[#A1A1AA]">Detalle y cambio de estado</DialogDescription>
          </DialogHeader>
          {dialogOcupada && (
            <div className="space-y-4 py-1">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <span className="text-[#A1A1AA]">Cliente</span>
                <span className="text-white font-medium">{dialogOcupada.nombrePresencial || dialogOcupada.usuarioNombre}</span>
                <span className="text-[#A1A1AA]">Cancha</span>
                <span className="text-white">{dialogOcupada.canchaNombre}</span>
                <span className="text-[#A1A1AA]">Fecha</span>
                <span className="text-white">{dialogOcupada.fecha}</span>
                <span className="text-[#A1A1AA]">Horario</span>
                <span className="text-white">{String(dialogOcupada.horaInicio).substring(0,5)} – {String(dialogOcupada.horaFin).substring(0,5)}</span>
                <span className="text-[#A1A1AA]">Total</span>
                <span className="text-white">${Number(dialogOcupada.precioTotal).toLocaleString("es-AR")}</span>
                <span className="text-[#A1A1AA]">Seña</span>
                <span className="text-[#ccff00] font-semibold">${Number(dialogOcupada.sena).toLocaleString("es-AR")}</span>
                <span className="text-[#A1A1AA]">Estado actual</span>
                <Badge className={STATUS_MAP[dialogOcupada.estado]?.cls + " w-fit"}>{STATUS_MAP[dialogOcupada.estado]?.label}</Badge>
              </div>
              <div className="space-y-1.5 pt-1 border-t border-white/10">
                <Label className="text-white text-sm">Cambiar estado</Label>
                <Select value={nuevoEstado} onValueChange={setNuevoEstado}>
                  <SelectTrigger className="bg-[#0A0A0A] border-white/10 text-white rounded-sm">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#161618] border-white/10">
                    {["CONFIRMADA", "COMPLETADA", "CANCELADA"].map(e => (
                      <SelectItem key={e} value={e} className="text-white">{STATUS_MAP[e]?.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" className="border-white/10 text-white hover:bg-white/10" onClick={() => setDialogOcupada(null)}>Cancelar</Button>
            <Button className="bg-[#ccff00] text-black hover:bg-[#b8e600] font-semibold rounded-sm" onClick={handleCambiarEstado} disabled={!nuevoEstado || nuevoEstado === dialogOcupada?.estado || savingEstado}>
              {savingEstado ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── Turnos Fijos Tab ─── */
const DIAS_SEMANA = [
  { value: "MONDAY", label: "Lunes" },
  { value: "TUESDAY", label: "Martes" },
  { value: "WEDNESDAY", label: "Miercoles" },
  { value: "THURSDAY", label: "Jueves" },
  { value: "FRIDAY", label: "Viernes" },
  { value: "SATURDAY", label: "Sabado" },
  { value: "SUNDAY", label: "Domingo" },
];

const DIA_LABEL = Object.fromEntries(DIAS_SEMANA.map(d => [d.value, d.label]));

function TurnosFijosTab() {
  const [turnos, setTurnos] = useState([]);
  const [canchas, setCanchas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ usuarioId: "", canchaId: "", diaSemana: "", horaInicio: "", horaFin: "", fechaFin: "" });

  const fetchTurnos = () => {
    setLoading(true);
    api.get("/turnos-fijos").then(r => { setTurnos(r.data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchTurnos();
    api.get("/canchas/todas").then(r => setCanchas(r.data)).catch(() => {});
    api.get("/usuarios").then(r => setUsuarios(r.data)).catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!form.usuarioId || !form.canchaId || !form.diaSemana || !form.horaInicio || !form.horaFin) {
      toast.error("Completa todos los campos");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/turnos-fijos", form);
      toast.success("Turno fijo creado!");
      setShowForm(false);
      setForm({ usuarioId: "", canchaId: "", diaSemana: "", horaInicio: "", horaFin: "", fechaFin: "" });
      fetchTurnos();
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.detail || "Error al crear turno fijo");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await api.patch(`/turnos-fijos/toggle/${id}`);
      fetchTurnos();
    } catch { toast.error("Error"); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/turnos-fijos/${id}`);
      toast.success("Turno fijo eliminado");
      fetchTurnos();
    } catch { toast.error("Error al eliminar"); }
  };

  // Generar opciones de hora desde config (simplificado: usa los slots del bloqueo)
  const horasOpciones = [];
  for (let h = 0; h < 24; h++) {
    const val = `${String(h).padStart(2, "0")}:00`;
    horasOpciones.push(val);
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[#ccff00]" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Repeat className="h-5 w-5 text-[#ccff00]" /> Turnos fijos
          </h2>
          <p className="text-sm text-[#A1A1AA] mt-1">Reservas recurrentes semanales asignadas a usuarios</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-[#ccff00] text-black font-bold hover:bg-[#b3e600] rounded-sm text-sm">
          <Plus className="h-4 w-4 mr-2" /> Nuevo turno fijo
        </Button>
      </div>

      {/* Table */}
      <div className="bg-[#161618] border border-white/10 rounded-sm overflow-x-auto">
        {turnos.length === 0 ? (
          <div className="text-center py-16">
            <Repeat className="h-10 w-10 text-[#A1A1AA]/20 mx-auto mb-3" />
            <p className="text-[#A1A1AA] text-sm">No hay turnos fijos configurados</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-[#A1A1AA] text-xs uppercase tracking-wider">Dia</TableHead>
                <TableHead className="text-[#A1A1AA] text-xs uppercase tracking-wider">Horario</TableHead>
                <TableHead className="text-[#A1A1AA] text-xs uppercase tracking-wider">Cancha</TableHead>
                <TableHead className="text-[#A1A1AA] text-xs uppercase tracking-wider">Usuario</TableHead>
                <TableHead className="text-[#A1A1AA] text-xs uppercase tracking-wider">Vigencia</TableHead>
                <TableHead className="text-[#A1A1AA] text-xs uppercase tracking-wider">Estado</TableHead>
                <TableHead className="text-[#A1A1AA] text-xs uppercase tracking-wider text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {turnos.map(t => {
                const vencido = t.fechaFin && new Date(t.fechaFin) < new Date(new Date().toISOString().split("T")[0]);
                return (
                <TableRow key={t.id} className={`border-white/5 hover:bg-white/[0.02] ${vencido ? "opacity-50" : ""}`}>
                  <TableCell className="text-white font-medium">{DIA_LABEL[t.diaSemana] || t.diaSemana}</TableCell>
                  <TableCell className="text-white font-mono-accent text-sm">{t.horaInicio} - {t.horaFin}</TableCell>
                  <TableCell className="text-white">{t.canchaNombre}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-white text-sm">{t.usuarioNombre}</p>
                      <p className="text-[#A1A1AA] text-xs">{t.usuarioEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {t.fechaFin ? (
                      <span className={`font-mono-accent ${vencido ? "text-red-400" : "text-[#A1A1AA]"}`}>
                        Hasta {t.fechaFin}
                      </span>
                    ) : (
                      <span className="text-[#A1A1AA]">Indefinido</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={`rounded-sm text-xs ${t.activo && !vencido ? "bg-[#ccff00]/10 text-[#ccff00] border-[#ccff00]/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                      {vencido ? "Vencido" : t.activo ? "Activo" : "Pausado"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleToggle(t.id)}
                        className={`rounded-sm text-xs h-8 px-2 ${t.activo ? "text-yellow-400 hover:bg-yellow-400/10" : "text-[#ccff00] hover:bg-[#ccff00]/10"}`}
                        title={t.activo ? "Pausar" : "Activar"}>
                        <Power className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)}
                        className="text-red-400 hover:bg-red-400/10 rounded-sm text-xs h-8 px-2">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-[#161618] border-white/10 rounded-sm">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2"><Repeat className="h-5 w-5 text-[#ccff00]" /> Nuevo turno fijo</DialogTitle>
            <DialogDescription className="text-[#A1A1AA]">Asignar un turno semanal recurrente a un usuario</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Usuario */}
            <div>
              <Label className="text-[#A1A1AA] text-xs uppercase tracking-wider mb-2 block">Usuario</Label>
              <Select value={String(form.usuarioId)} onValueChange={v => setForm(f => ({ ...f, usuarioId: Number(v) }))}>
                <SelectTrigger className="bg-[#0A0A0A] border-white/10 text-white rounded-sm">
                  <SelectValue placeholder="Seleccionar usuario" />
                </SelectTrigger>
                <SelectContent className="bg-[#161618] border-white/10">
                  {usuarios.filter(u => u.activo !== false).map(u => (
                    <SelectItem key={u.id} value={String(u.id)} className="text-white focus:bg-white/5 focus:text-white">
                      {u.nombre} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Cancha */}
            <div>
              <Label className="text-[#A1A1AA] text-xs uppercase tracking-wider mb-2 block">Cancha</Label>
              <Select value={String(form.canchaId)} onValueChange={v => setForm(f => ({ ...f, canchaId: Number(v) }))}>
                <SelectTrigger className="bg-[#0A0A0A] border-white/10 text-white rounded-sm">
                  <SelectValue placeholder="Seleccionar cancha" />
                </SelectTrigger>
                <SelectContent className="bg-[#161618] border-white/10">
                  {canchas.filter(c => c.activa !== false).map(c => (
                    <SelectItem key={c.id} value={String(c.id)} className="text-white focus:bg-white/5 focus:text-white">
                      {c.nombre} (F{c.tipo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Dia de la semana */}
            <div>
              <Label className="text-[#A1A1AA] text-xs uppercase tracking-wider mb-2 block">Dia de la semana</Label>
              <Select value={form.diaSemana} onValueChange={v => setForm(f => ({ ...f, diaSemana: v }))}>
                <SelectTrigger className="bg-[#0A0A0A] border-white/10 text-white rounded-sm">
                  <SelectValue placeholder="Seleccionar dia" />
                </SelectTrigger>
                <SelectContent className="bg-[#161618] border-white/10">
                  {DIAS_SEMANA.map(d => (
                    <SelectItem key={d.value} value={d.value} className="text-white focus:bg-white/5 focus:text-white">
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Horario */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-[#A1A1AA] text-xs uppercase tracking-wider mb-2 block">Hora inicio</Label>
                <Select value={form.horaInicio} onValueChange={v => {
                  const fin = `${String((parseInt(v) + 1) % 24).padStart(2, "0")}:00`;
                  setForm(f => ({ ...f, horaInicio: v, horaFin: fin }));
                }}>
                  <SelectTrigger className="bg-[#0A0A0A] border-white/10 text-white rounded-sm">
                    <SelectValue placeholder="Inicio" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#161618] border-white/10">
                    {horasOpciones.map(h => (
                      <SelectItem key={h} value={h} className="text-white focus:bg-white/5 focus:text-white">{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#A1A1AA] text-xs uppercase tracking-wider mb-2 block">Hora fin</Label>
                <Input value={form.horaFin} disabled className="bg-[#0A0A0A] border-white/10 text-[#A1A1AA] rounded-sm" />
              </div>
            </div>
            {/* Fecha fin */}
            <div>
              <Label className="text-[#A1A1AA] text-xs uppercase tracking-wider mb-2 block">Vigente hasta (opcional)</Label>
              <Input
                type="date"
                value={form.fechaFin}
                onChange={e => setForm(f => ({ ...f, fechaFin: e.target.value }))}
                min={new Date().toISOString().split("T")[0]}
                className="bg-[#0A0A0A] border-white/10 text-white rounded-sm [color-scheme:dark]"
                placeholder="Dejar vacio = indefinido"
              />
              <p className="text-[10px] text-[#A1A1AA] mt-1">Si no se define, el turno fijo se repite indefinidamente</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)} className="border-white/20 text-white hover:bg-white/5 rounded-sm">
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={submitting} className="bg-[#ccff00] text-black font-bold hover:bg-[#b3e600] rounded-sm">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear turno fijo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BloqueosTab() {
  const [bloqueos, setBloqueos] = useState([]);
  const [canchas, setCanchas] = useState([]);
  const [slotsHorarios, setSlotsHorarios] = useState([]);
  const [diasNoLaborables, setDiasNoLaborables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDiaForm, setShowDiaForm] = useState(false);
  const [savingDia, setSavingDia] = useState(false);
  const [diaForm, setDiaForm] = useState({ fecha: "", motivo: "" });
  const [form, setForm] = useState({ canchaId: "", fecha: "", slot: "", motivo: "" });

  const fetchData = async () => {
    try {
      const [b, c, cfg, d] = await Promise.all([api.get("/bloqueos"), api.get("/canchas/todas"), api.get("/config-pago/publica"), api.get("/dias-no-laborables")]);
      setBloqueos(b.data);
      setCanchas(c.data);
      setSlotsHorarios(generarSlotsHorarios(cfg.data.horaApertura || "17:00", cfg.data.horaCierre || "01:00"));
      setDiasNoLaborables(d.data);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    if (!form.canchaId || !form.fecha || !form.slot) { toast.error("Cancha, fecha y horario son obligatorios"); return; }
    const isTodoDia = form.slot === "todos";
    const slot = isTodoDia ? null : slotsHorarios[parseInt(form.slot)];
    setSaving(true);
    try {
      await api.post("/bloqueos", {
        cancha_id: form.canchaId,
        fecha: form.fecha,
        hora_inicio: isTodoDia ? undefined : slot.inicio,
        hora_fin: isTodoDia ? undefined : slot.fin,
        motivo: form.motivo || "Bloqueado por admin",
        todo_dia: isTodoDia,
      });
      toast.success("Horario bloqueado");
      setForm({ canchaId: "", fecha: "", slot: "", motivo: "" });
      setShowForm(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error al bloquear");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/bloqueos/${id}`);
      toast.success("Bloqueo eliminado");
      fetchData();
    } catch { toast.error("Error al eliminar"); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[#ccff00]" /></div>;

  return (
    <div className="space-y-6" data-testid="bloqueos-panel">
      <div className="bg-[#161618] border border-white/10 rounded-sm overflow-hidden">
        <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Bloqueos de horarios</h2>
            <p className="text-xs text-[#A1A1AA] mt-1">Marca horarios como no disponibles (mantenimiento, eventos privados, etc.)</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="bg-[#ccff00] text-black font-bold hover:bg-[#b3e600] rounded-sm text-sm h-9 px-4">
            <Plus className="h-4 w-4 mr-1" /> Nuevo bloqueo
          </Button>
        </div>

        {showForm && (
          <div className="p-4 border-b border-white/10 bg-[#0A0A0A] space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <Label className="text-[#A1A1AA] text-xs uppercase tracking-wider mb-2 block">Cancha</Label>
                <Select value={form.canchaId} onValueChange={v => setForm({ ...form, canchaId: v })}>
                  <SelectTrigger className="bg-[#161618] border-white/10 text-white rounded-sm text-sm h-9">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#161618] border-white/10 rounded-sm">
                    {canchas.map(c => (
                      <SelectItem key={c.id} value={c.id} className="text-white focus:bg-white/10 focus:text-white text-sm">
                        {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#A1A1AA] text-xs uppercase tracking-wider mb-2 block">Fecha</Label>
                <Input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} className="bg-[#161618] border-white/10 text-white rounded-sm text-sm h-9" />
              </div>
              <div>
                <Label className="text-[#A1A1AA] text-xs uppercase tracking-wider mb-2 block">Horario</Label>
                <Select value={form.slot} onValueChange={v => setForm({ ...form, slot: v })}>
                  <SelectTrigger className="bg-[#161618] border-white/10 text-white rounded-sm text-sm h-9">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#161618] border-white/10 rounded-sm">
                    <SelectItem value="todos" className="text-[#ccff00] font-semibold focus:bg-white/10 focus:text-[#ccff00] text-sm">
                      Todos los horarios
                    </SelectItem>
                    {slotsHorarios.map((s, i) => (
                      <SelectItem key={i} value={String(i)} className="text-white focus:bg-white/10 focus:text-white text-sm">
                        {s.inicio} - {s.fin}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#A1A1AA] text-xs uppercase tracking-wider mb-2 block">Motivo</Label>
                <Input value={form.motivo} onChange={e => setForm({ ...form, motivo: e.target.value })} placeholder="Ej: Mantenimiento" className="bg-[#161618] border-white/10 text-white rounded-sm text-sm h-9" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={saving} className="bg-[#ccff00] text-black font-bold hover:bg-[#b3e600] rounded-sm text-sm h-9 px-6">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : form.slot === "todos" ? "Bloquear todo el dia" : "Bloquear horario"}
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)} className="text-[#A1A1AA] hover:text-white rounded-sm text-sm h-9">
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {bloqueos.length === 0 ? (
          <div className="text-center py-16">
            <Ban className="h-10 w-10 text-[#A1A1AA]/30 mx-auto mb-3" />
            <p className="text-[#A1A1AA] text-sm">No hay horarios bloqueados</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-[#A1A1AA] text-xs uppercase tracking-wider">Cancha</TableHead>
                <TableHead className="text-[#A1A1AA] text-xs uppercase tracking-wider">Fecha</TableHead>
                <TableHead className="text-[#A1A1AA] text-xs uppercase tracking-wider">Horario</TableHead>
                <TableHead className="text-[#A1A1AA] text-xs uppercase tracking-wider">Motivo</TableHead>
                <TableHead className="text-[#A1A1AA] text-xs uppercase tracking-wider text-right">Accion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bloqueos.map(b => (
                <TableRow key={b.id} className="border-white/5 hover:bg-white/[0.02]">
                  <TableCell className="text-white font-medium">{b.canchaNombre}</TableCell>
                  <TableCell className="text-white font-mono-accent text-sm">{b.fecha}</TableCell>
                  <TableCell className="text-white font-mono-accent text-sm">{b.horaInicio} - {b.horaFin}</TableCell>
                  <TableCell>
                    <Badge className="bg-red-500/10 text-red-400 border-red-500/20 rounded-sm text-xs">{b.motivo || "Bloqueado"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(b.id)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-sm h-8 w-8 p-0">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Días no laborables */}
      <div className="bg-[#161618] border border-white/10 rounded-sm overflow-hidden">
        <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Dias no laborables</h2>
            <p className="text-xs text-[#A1A1AA] mt-1">Feriados, eventos o dias que el complejo permanece cerrado. Se bloquean todas las canchas automaticamente.</p>
          </div>
          <Button onClick={() => setShowDiaForm(!showDiaForm)} className="bg-[#ccff00] text-black font-bold hover:bg-[#b3e600] rounded-sm text-sm h-9 px-4">
            <Plus className="h-4 w-4 mr-1" /> Agregar dia
          </Button>
        </div>

        {showDiaForm && (
          <div className="p-4 border-b border-white/10 bg-[#0A0A0A] space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-[#A1A1AA] text-xs uppercase tracking-wider mb-2 block">Fecha</Label>
                <Input type="date" value={diaForm.fecha} onChange={e => setDiaForm({ ...diaForm, fecha: e.target.value })} className="bg-[#161618] border-white/10 text-white rounded-sm text-sm h-9" />
              </div>
              <div>
                <Label className="text-[#A1A1AA] text-xs uppercase tracking-wider mb-2 block">Motivo</Label>
                <Input value={diaForm.motivo} onChange={e => setDiaForm({ ...diaForm, motivo: e.target.value })} placeholder="Ej: Feriado nacional" className="bg-[#161618] border-white/10 text-white rounded-sm text-sm h-9" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={async () => {
                if (!diaForm.fecha) { toast.error("La fecha es obligatoria"); return; }
                setSavingDia(true);
                try {
                  await api.post("/dias-no-laborables", { fecha: diaForm.fecha, motivo: diaForm.motivo || "Cerrado" });
                  toast.success("Dia no laborable agregado");
                  setDiaForm({ fecha: "", motivo: "" });
                  setShowDiaForm(false);
                  fetchData();
                } catch (err) { toast.error(err.response?.data?.detail || "Error al agregar"); }
                finally { setSavingDia(false); }
              }} disabled={savingDia} className="bg-[#ccff00] text-black font-bold hover:bg-[#b3e600] rounded-sm text-sm h-9 px-6">
                {savingDia ? <Loader2 className="h-4 w-4 animate-spin" /> : "Agregar"}
              </Button>
              <Button variant="ghost" onClick={() => setShowDiaForm(false)} className="text-[#A1A1AA] hover:text-white rounded-sm text-sm h-9">
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {diasNoLaborables.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-10 w-10 text-[#A1A1AA]/30 mx-auto mb-3" />
            <p className="text-[#A1A1AA] text-sm">No hay dias no laborables cargados</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-[#A1A1AA] text-xs uppercase tracking-wider">Fecha</TableHead>
                <TableHead className="text-[#A1A1AA] text-xs uppercase tracking-wider">Motivo</TableHead>
                <TableHead className="text-[#A1A1AA] text-xs uppercase tracking-wider text-right">Accion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {diasNoLaborables.map(d => (
                <TableRow key={d.id} className="border-white/5 hover:bg-white/[0.02]">
                  <TableCell className="text-white font-mono-accent text-sm">{d.fecha}</TableCell>
                  <TableCell>
                    <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 rounded-sm text-xs">{d.motivo || "Cerrado"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={async () => {
                      try { await api.delete(`/dias-no-laborables/${d.id}`); toast.success("Dia eliminado"); fetchData(); }
                      catch { toast.error("Error al eliminar"); }
                    }} className="text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-sm h-8 w-8 p-0">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

/* ─── Config Tab ─── */
function ConfigTab() {
  const [emailRemitente, setEmailRemitente] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailConfigured, setEmailConfigured] = useState(false);
  const [ubicacionUrl, setUbicacionUrl] = useState("");
  const [horaApertura, setHoraApertura] = useState("17:00");
  const [horaCierre, setHoraCierre] = useState("01:00");
  const [whatsapp, setWhatsapp] = useState("");
  // Mercado Pago — OAuth
  const [mpOauth, setMpOauth] = useState({ conectado: false, userId: null, expiresAt: null, via: null });
  const [conectandoMp, setConectandoMp] = useState(false);
  const [desconectandoMp, setDesconectandoMp] = useState(false);
  // Mercado Pago — token manual (modo avanzado)
  const [mpToken, setMpToken] = useState("");
  const [mpTokenConfigured, setMpTokenConfigured] = useState(false);
  const [mpTokenMasked, setMpTokenMasked] = useState("");
  const [mpTokenTipo, setMpTokenTipo] = useState("");
  const [showMpToken, setShowMpToken] = useState(false);
  const [showManualToken, setShowManualToken] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingUbicacion, setSavingUbicacion] = useState(false);
  const [savingHorario, setSavingHorario] = useState(false);
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);
  const [savingMpToken, setSavingMpToken] = useState(false);

  useEffect(() => {
    api.get("/config-pago/full")
      .then(r => {
        setEmailRemitente(r.data.emailRemitente || "");
        setEmailConfigured(r.data.emailConfigured === "true");
        setUbicacionUrl(r.data.ubicacionUrl || "");
        setHoraApertura(r.data.horaApertura || "17:00");
        setHoraCierre(r.data.horaCierre || "01:00");
        setWhatsapp(r.data.whatsapp || "");
        setMpTokenConfigured(r.data.mpTokenConfigured === "true");
        setMpTokenMasked(r.data.mpTokenMasked || "");
        setMpTokenTipo(r.data.mpTokenTipo || "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Cargar estado OAuth
    api.get("/oauth/mercadopago/status")
      .then(r => setMpOauth(r.data))
      .catch(() => {});

    // Detectar vuelta del callback OAuth (MP redirige con ?mp=connected/cancelled/error)
    const params = new URLSearchParams(window.location.search);
    const mpResult = params.get("mp");
    if (mpResult === "connected") {
      toast.success("¡Cuenta de Mercado Pago vinculada exitosamente!");
      api.get("/oauth/mercadopago/status").then(r => setMpOauth(r.data)).catch(() => {});
      // Limpiar query params de la URL sin recargar
      window.history.replaceState({}, "", window.location.pathname + "?tab=config");
    } else if (mpResult === "cancelled") {
      toast.error("Vinculación cancelada.");
      window.history.replaceState({}, "", window.location.pathname + "?tab=config");
    } else if (mpResult === "error") {
      const reason = params.get("reason");
      toast.error(reason === "invalid_state"
        ? "El proceso expiró. Intentá vincular de nuevo."
        : "Error al vincular con Mercado Pago. Intentá de nuevo.");
      window.history.replaceState({}, "", window.location.pathname + "?tab=config");
    }
  }, []);

  const handleSaveEmail = async () => {
    if (!emailRemitente.trim()) { toast.error("El email es obligatorio"); return; }
    setSavingEmail(true);
    try {
      const body = { emailRemitente: emailRemitente.trim() };
      if (emailPassword.trim()) body.emailPassword = emailPassword.trim();
      const r = await api.patch("/config-pago/email", body);
      setEmailRemitente(r.data.emailRemitente);
      setEmailConfigured(r.data.emailConfigured === "true");
      setEmailPassword("");
      toast.success("Configuracion de email actualizada");
    } catch { toast.error("Error al guardar email"); }
    finally { setSavingEmail(false); }
  };

  const handleSaveUbicacion = async () => {
    setSavingUbicacion(true);
    try {
      const r = await api.patch("/config-pago/ubicacion", { ubicacionUrl: ubicacionUrl.trim() });
      setUbicacionUrl(r.data.ubicacionUrl);
      toast.success("Ubicacion actualizada");
    } catch { toast.error("Error al guardar ubicacion"); }
    finally { setSavingUbicacion(false); }
  };

  const handleConectarMp = async () => {
    setConectandoMp(true);
    try {
      const r = await api.get("/oauth/mercadopago/connect");
      // Redirigir al usuario a la pantalla de autorización de MP
      window.location.href = r.data.url;
    } catch {
      toast.error("No se pudo iniciar la vinculación con Mercado Pago.");
      setConectandoMp(false);
    }
  };

  const handleDesconectarMp = async () => {
    if (!window.confirm("¿Seguro que querés desvincular la cuenta de Mercado Pago? Los pagos dejarán de funcionar hasta que vuelvas a vincular.")) return;
    setDesconectandoMp(true);
    try {
      await api.post("/oauth/mercadopago/disconnect");
      setMpOauth({ conectado: false, userId: null, expiresAt: null, via: null });
      toast.success("Cuenta de Mercado Pago desvinculada.");
    } catch {
      toast.error("Error al desvincular. Intentá de nuevo.");
    } finally {
      setDesconectandoMp(false);
    }
  };

  const handleSaveMpToken = async () => {
    const trimmed = mpToken.trim();
    if (trimmed && !/^(APP_USR|TEST)-[A-Za-z0-9-]{20,}$/.test(trimmed)) {
      toast.error("El token debe empezar con APP_USR- o TEST-");
      return;
    }
    setSavingMpToken(true);
    try {
      const r = await api.patch("/config-pago/mp-token", { mpAccessToken: trimmed });
      setMpTokenConfigured(r.data.mpTokenConfigured === "true");
      setMpTokenMasked(r.data.mpTokenMasked || "");
      setMpTokenTipo(r.data.mpTokenTipo || "");
      setMpToken("");
      setShowMpToken(false);
      toast.success(trimmed ? "Token de Mercado Pago guardado" : "Token removido. Se usara el del servidor.");
    } catch (e) {
      toast.error(e.response?.data?.error || "Error al guardar token de MP");
    } finally {
      setSavingMpToken(false);
    }
  };

  const handleSaveHorario = async () => {
    if (!horaApertura || !horaCierre) { toast.error("Apertura y cierre son obligatorios"); return; }
    setSavingHorario(true);
    try {
      const r = await api.patch("/config-pago/horario", { horaApertura, horaCierre });
      setHoraApertura(r.data.horaApertura);
      setHoraCierre(r.data.horaCierre);
      toast.success("Horario actualizado");
    } catch { toast.error("Error al guardar horario"); }
    finally { setSavingHorario(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[#ccff00]" /></div>;

  return (
    <div className="max-w-xl" data-testid="config-panel">

      {/* Mercado Pago — OAuth + manual */}
      <div className="bg-[#161618] border border-white/10 rounded-sm overflow-hidden mt-6" data-testid="mp-token-section">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Mercado Pago</h2>
          <p className="text-xs text-[#A1A1AA] mt-1">
            Vinculá tu cuenta para que los pagos de seña se acrediten directamente en tu Mercado Pago.
          </p>
        </div>
        <div className="p-6 space-y-5">

          {/* Estado OAuth */}
          {mpOauth.conectado ? (
            <div className="bg-[#ccff00]/5 border border-[#ccff00]/20 rounded-sm p-4 space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-[#ccff00]">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-semibold text-sm">Cuenta vinculada</span>
                </div>
                <span className="text-[10px] uppercase tracking-wider bg-green-500/20 text-green-300 border border-green-500/30 rounded-sm px-2 py-0.5">Activo</span>
              </div>
              <div className="text-xs text-[#A1A1AA] space-y-1">
                {mpOauth.userId && <p>ID de cuenta MP: <span className="font-mono-accent text-white/70">{mpOauth.userId}</span></p>}
                {mpOauth.expiresAt && <p>Token válido hasta: <span className="text-white/70">{mpOauth.expiresAt}</span> (se renueva automáticamente)</p>}
              </div>
              <Button
                onClick={handleDesconectarMp}
                disabled={desconectandoMp}
                variant="outline"
                className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 rounded-sm h-10 text-sm"
                data-testid="mp-disconnect-btn"
              >
                {desconectandoMp ? <Loader2 className="h-4 w-4 animate-spin" /> : "Desvincular cuenta"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {!mpTokenConfigured && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-sm px-3 py-2">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-300/90 leading-relaxed">
                    No hay cuenta vinculada. Los pagos con Mercado Pago no funcionarán hasta que vincules tu cuenta.
                  </p>
                </div>
              )}
              <Button
                onClick={handleConectarMp}
                disabled={conectandoMp}
                className="w-full bg-[#009ee3] hover:bg-[#0082c4] text-white font-bold uppercase tracking-wide rounded-sm h-12 text-sm"
                data-testid="mp-connect-btn"
              >
                {conectandoMp
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Redirigiendo...</>
                  : <><svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-1.97 9.23c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L6.24 14.425l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.576.161z"/></svg>
                    Vincular con Mercado Pago
                  </>
                }
              </Button>
              <p className="text-xs text-[#A1A1AA]/70 text-center">
                Serás redirigido a Mercado Pago para autorizar la app de forma segura. No necesitás copiar ni pegar ningún código.
              </p>
            </div>
          )}

          {/* Modo avanzado: token manual */}
          <div className="border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={() => setShowManualToken(v => !v)}
              className="flex items-center gap-2 text-xs text-[#A1A1AA]/60 hover:text-[#A1A1AA] w-full"
            >
              <ChevronRight className={`h-3 w-3 transition-transform ${showManualToken ? "rotate-90" : ""}`} />
              Configuración avanzada (token manual)
            </button>

            {showManualToken && (
              <div className="mt-4 space-y-4">
                <p className="text-xs text-[#A1A1AA]/70">
                  Si la vinculación automática no funciona, podés ingresar tu Access Token directamente desde{" "}
                  <a href="https://www.mercadopago.com.ar/developers/panel/app" target="_blank" rel="noopener noreferrer" className="text-[#ccff00] hover:underline">
                    Mercado Pago Developers
                  </a>.
                </p>
                {mpTokenConfigured && (
                  <div className="flex items-center gap-2 text-xs text-[#ccff00] bg-[#ccff00]/5 border border-[#ccff00]/20 rounded-sm px-3 py-2">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Token manual activo: <span className="font-mono-accent text-white/60">{mpTokenMasked}</span></span>
                    {mpTokenTipo === "TEST" && <span className="ml-auto text-[10px] bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 rounded-sm px-1.5 py-0.5">TEST</span>}
                    {mpTokenTipo === "PROD" && <span className="ml-auto text-[10px] bg-green-500/20 text-green-300 border border-green-500/30 rounded-sm px-1.5 py-0.5">PROD</span>}
                  </div>
                )}
                <div className="relative">
                  <Input
                    type={showMpToken ? "text" : "password"}
                    value={mpToken}
                    onChange={e => setMpToken(e.target.value)}
                    placeholder={mpTokenConfigured ? "••••••••••••••••••••" : "APP_USR-..."}
                    className="bg-[#0A0A0A] border-white/10 text-white rounded-sm focus:border-[#ccff00] font-mono-accent text-sm pr-20"
                    data-testid="config-mp-token"
                    autoComplete="off"
                  />
                  {mpToken && (
                    <button type="button" onClick={() => setShowMpToken(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#A1A1AA] hover:text-white uppercase tracking-wider">
                      {showMpToken ? "Ocultar" : "Ver"}
                    </button>
                  )}
                </div>
                <Button onClick={handleSaveMpToken} disabled={savingMpToken}
                  className="w-full bg-white/10 text-white font-bold hover:bg-white/20 rounded-sm h-10 text-sm"
                  data-testid="config-save-mp-token-btn">
                  {savingMpToken ? <Loader2 className="h-4 w-4 animate-spin" /> : (mpTokenConfigured && !mpToken.trim() ? "Borrar token manual" : "Guardar token manual")}
                </Button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Email config */}
      <div className="bg-[#161618] border border-white/10 rounded-sm overflow-hidden mt-6">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Notificaciones por email</h2>
          <p className="text-xs text-[#A1A1AA] mt-1">Cuando se confirma una reserva, se le envia un email al usuario con los datos del turno</p>
        </div>
        <div className="p-6 space-y-5">
          {emailConfigured && (
            <div className="flex items-center gap-2 text-sm text-[#ccff00] bg-[#ccff00]/5 border border-[#ccff00]/20 rounded-sm px-3 py-2">
              <CheckCircle2 className="h-4 w-4" /> Email configurado correctamente
            </div>
          )}
          <div>
            <Label className="text-[#A1A1AA] text-xs uppercase tracking-wider mb-2 block">Email de Gmail</Label>
            <Input
              type="email"
              value={emailRemitente}
              onChange={e => setEmailRemitente(e.target.value)}
              placeholder="Ej: tucomplejo@gmail.com"
              className="bg-[#0A0A0A] border-white/10 text-white rounded-sm focus:border-[#ccff00]"
              data-testid="config-email"
            />
          </div>
          <div>
            <Label className="text-[#A1A1AA] text-xs uppercase tracking-wider mb-2 block">
              App Password de Gmail
              {emailConfigured && <span className="normal-case tracking-normal text-[#A1A1AA]/60 ml-2">(dejar vacio para mantener la actual)</span>}
            </Label>
            <Input
              type="password"
              value={emailPassword}
              onChange={e => setEmailPassword(e.target.value)}
              placeholder={emailConfigured ? "••••••••••••" : "Ej: abcd efgh ijkl mnop"}
              className="bg-[#0A0A0A] border-white/10 text-white rounded-sm focus:border-[#ccff00]"
              data-testid="config-email-password"
            />
            <p className="text-xs text-[#A1A1AA]/60 mt-2">
              Genera una App Password en tu cuenta de Google: Seguridad → Verificacion en 2 pasos → Contraseñas de aplicaciones
            </p>
          </div>
          <Button
            onClick={handleSaveEmail}
            disabled={savingEmail}
            className="w-full bg-[#ccff00] text-black font-bold hover:bg-[#b3e600] rounded-sm h-11"
            data-testid="config-save-email-btn"
          >
            {savingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar email"}
          </Button>
        </div>
      </div>

      {/* Ubicación */}
      <div className="bg-[#161618] border border-white/10 rounded-sm overflow-hidden mt-6">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Ubicacion del complejo</h2>
          <p className="text-xs text-[#A1A1AA] mt-1">Pega el link de Google Maps para que los usuarios puedan encontrar el complejo</p>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <Label className="text-[#A1A1AA] text-xs uppercase tracking-wider mb-2 block">Link de Google Maps</Label>
            <Input
              type="url"
              value={ubicacionUrl}
              onChange={e => setUbicacionUrl(e.target.value)}
              placeholder="https://maps.google.com/..."
              className="bg-[#0A0A0A] border-white/10 text-white rounded-sm focus:border-[#ccff00]"
              data-testid="config-ubicacion"
            />
            <p className="text-xs text-[#A1A1AA]/60 mt-2">
              Busca tu complejo en Google Maps → Compartir → Copiar enlace
            </p>
          </div>
          {ubicacionUrl && (
            <a href={ubicacionUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[#ccff00] hover:underline">
              <MapPin className="h-4 w-4" /> Ver en Google Maps
            </a>
          )}
          <Button
            onClick={handleSaveUbicacion}
            disabled={savingUbicacion}
            className="w-full bg-[#ccff00] text-black font-bold hover:bg-[#b3e600] rounded-sm h-11"
            data-testid="config-save-ubicacion-btn"
          >
            {savingUbicacion ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar ubicacion"}
          </Button>
        </div>
      </div>

      {/* Horario de apertura/cierre */}
      <div className="bg-[#161618] border border-white/10 rounded-sm overflow-hidden mt-6">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Horario del complejo</h2>
          <p className="text-xs text-[#A1A1AA] mt-1">Configura la hora de apertura y cierre. Los turnos se generan automaticamente en slots de 1 hora</p>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[#A1A1AA] text-xs uppercase tracking-wider mb-2 block">Apertura</Label>
              <Input
                type="time"
                value={horaApertura}
                onChange={e => setHoraApertura(e.target.value)}
                className="bg-[#0A0A0A] border-white/10 text-white rounded-sm focus:border-[#ccff00]"
                data-testid="config-hora-apertura"
              />
            </div>
            <div>
              <Label className="text-[#A1A1AA] text-xs uppercase tracking-wider mb-2 block">Cierre</Label>
              <Input
                type="time"
                value={horaCierre}
                onChange={e => setHoraCierre(e.target.value)}
                className="bg-[#0A0A0A] border-white/10 text-white rounded-sm focus:border-[#ccff00]"
                data-testid="config-hora-cierre"
              />
            </div>
          </div>
          <div className="bg-[#0A0A0A] border border-white/10 rounded-sm p-4">
            <p className="text-xs text-[#A1A1AA] uppercase tracking-wider mb-3">Vista previa</p>
            <p className="text-white font-mono-accent font-bold">{horaApertura} - {horaCierre}</p>
          </div>
          <Button
            onClick={handleSaveHorario}
            disabled={savingHorario}
            className="w-full bg-[#ccff00] text-black font-bold hover:bg-[#b3e600] rounded-sm h-11"
            data-testid="config-save-horario-btn"
          >
            {savingHorario ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar horario"}
          </Button>
        </div>
      </div>

      {/* WhatsApp */}
      <div className="bg-[#161618] border border-white/10 rounded-sm overflow-hidden mt-6">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-[#25D366]" />
            <h2 className="text-lg font-semibold text-white">WhatsApp del complejo</h2>
          </div>
          <p className="text-xs text-[#A1A1AA] mt-1">Se muestra un boton flotante en toda la app para que los usuarios te contacten directo</p>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <Label className="text-[#A1A1AA] text-xs uppercase tracking-wider mb-2 block">Numero de WhatsApp</Label>
            <Input
              type="tel"
              value={whatsapp}
              onChange={e => setWhatsapp(e.target.value)}
              placeholder="Ej: 5493515551234"
              className="bg-[#0A0A0A] border-white/10 text-white rounded-sm focus:border-[#ccff00]"
              data-testid="config-whatsapp"
            />
            <p className="text-xs text-[#A1A1AA]/60 mt-2">
              Formato internacional sin + ni espacios. Ej: 549 + cod. area + numero → 5493515551234. Dejalo vacio para ocultar el boton.
            </p>
          </div>
          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-[#25D366] hover:underline"
            >
              <MessageCircle className="h-4 w-4" /> Probar enlace de WhatsApp
            </a>
          )}
          <Button
            onClick={async () => {
              setSavingWhatsapp(true);
              try {
                const r = await api.patch("/config-pago/whatsapp", { whatsapp: whatsapp.trim() });
                setWhatsapp(r.data.whatsapp);
                window.dispatchEvent(new Event("whatsapp-updated"));
                toast.success("WhatsApp actualizado");
              } catch { toast.error("Error al guardar WhatsApp"); }
              finally { setSavingWhatsapp(false); }
            }}
            disabled={savingWhatsapp}
            className="w-full bg-[#ccff00] text-black font-bold hover:bg-[#b3e600] rounded-sm h-11"
            data-testid="config-save-whatsapp-btn"
          >
            {savingWhatsapp ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar WhatsApp"}
          </Button>
        </div>
      </div>
    </div>
  );
}
