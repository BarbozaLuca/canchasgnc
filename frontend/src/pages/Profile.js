import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api, { formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, User, Mail, Phone, KeyRound, CheckCircle2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";

export default function Profile() {
  const { user, logout, refreshUser } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPerfil = () => {
    setLoading(true);
    api.get("/perfil")
      .then(r => { setPerfil(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchPerfil(); }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center pt-20"><Loader2 className="h-8 w-8 animate-spin text-[#ccff00]" /></div>;
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-lg mx-auto">
        <Link to="/canchas" className="inline-flex items-center gap-2 text-sm text-[#A1A1AA] hover:text-white transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> Volver
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-sm bg-[#ccff00]/10 flex items-center justify-center">
            <User className="h-6 w-6 text-[#ccff00]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Mi perfil</h1>
            <p className="text-sm text-[#A1A1AA]">{perfil?.rol?.replace("ROLE_", "")}</p>
          </div>
        </div>

        <div className="mt-8 space-y-6">
          <InfoSection perfil={perfil} onUpdate={() => { fetchPerfil(); refreshUser(); }} />
          <EmailSection perfil={perfil} onUpdate={() => { fetchPerfil(); refreshUser(); }} logout={logout} />
          {!user?.googleUser && <PasswordSection />}
        </div>
      </div>
    </div>
  );
}

/* ─── Nombre y Celular ─── */
function InfoSection({ perfil, onUpdate }) {
  const [nombre, setNombre] = useState("");
  const [celular, setCelular] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (perfil) {
      setNombre(perfil.nombre || "");
      setCelular(perfil.celular || "");
    }
  }, [perfil]);

  const handleSave = async () => {
    if (!nombre.trim()) { toast.error("El nombre es obligatorio"); return; }
    setSaving(true);
    try {
      await api.patch("/perfil", { nombre: nombre.trim(), celular: celular.trim() });
      toast.success("Perfil actualizado");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onUpdate();
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.message || "Error al guardar"));
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = perfil && (nombre.trim() !== perfil.nombre || (celular.trim() || "") !== (perfil.celular || ""));

  return (
    <div className="bg-[#161618] border border-white/10 rounded-sm p-6">
      <div className="flex items-center gap-2 mb-5">
        <User className="h-4 w-4 text-[#ccff00]" />
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Datos personales</h2>
      </div>
      <div className="space-y-4">
        <div>
          <Label className="text-[#A1A1AA] text-xs uppercase tracking-wider mb-2 block">Nombre completo</Label>
          <Input
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Nombre y apellido"
            className="bg-[#0A0A0A] border-white/10 text-white placeholder:text-[#A1A1AA]/50 rounded-sm focus:border-[#ccff00] focus:ring-[#ccff00]/20"
          />
        </div>
        <div>
          <Label className="text-[#A1A1AA] text-xs uppercase tracking-wider mb-2 block">Celular</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A1A1AA]" />
            <Input
              value={celular}
              onChange={e => setCelular(e.target.value)}
              placeholder="Ej: 3515551234"
              className="bg-[#0A0A0A] border-white/10 text-white placeholder:text-[#A1A1AA]/50 rounded-sm focus:border-[#ccff00] focus:ring-[#ccff00]/20 pl-10"
            />
          </div>
          <p className="text-[10px] text-[#A1A1AA] mt-1">Opcional. Para que el complejo pueda contactarte</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="bg-[#ccff00] text-black font-bold uppercase tracking-wide hover:bg-[#b3e600] rounded-sm h-10 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <><CheckCircle2 className="h-4 w-4 mr-2" /> Guardado</> : "Guardar cambios"}
        </Button>
      </div>
    </div>
  );
}

/* ─── Email ─── */
function EmailSection({ perfil, onUpdate, logout }) {
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (perfil) setEmail(perfil.email || "");
  }, [perfil]);

  const handleSave = async () => {
    if (!email.trim()) { toast.error("El email es obligatorio"); return; }
    setSaving(true);
    try {
      const { data } = await api.patch("/perfil/email", { email: email.trim() });
      toast.success(data.message);
      if (data.message.includes("Vuelve a iniciar")) {
        setTimeout(() => logout(), 2000);
      } else {
        onUpdate();
      }
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.message || err.response?.data?.detail || "Error al cambiar email"));
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = perfil && email.trim().toLowerCase() !== perfil.email;

  return (
    <div className="bg-[#161618] border border-white/10 rounded-sm p-6">
      <div className="flex items-center gap-2 mb-5">
        <Mail className="h-4 w-4 text-[#ccff00]" />
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Email</h2>
      </div>
      <div className="space-y-4">
        <div>
          <Label className="text-[#A1A1AA] text-xs uppercase tracking-wider mb-2 block">Email</Label>
          <Input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="bg-[#0A0A0A] border-white/10 text-white placeholder:text-[#A1A1AA]/50 rounded-sm focus:border-[#ccff00] focus:ring-[#ccff00]/20"
          />
          {hasChanges && (
            <p className="text-[10px] text-yellow-400 mt-1">Al cambiar el email tendras que volver a iniciar sesion</p>
          )}
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="bg-[#ccff00] text-black font-bold uppercase tracking-wide hover:bg-[#b3e600] rounded-sm h-10 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cambiar email"}
        </Button>
      </div>
    </div>
  );
}

/* ─── Contrasena ─── */
function PasswordSection() {
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [showActual, setShowActual] = useState(false);
  const [showNueva, setShowNueva] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    if (!actual) { toast.error("Ingresa tu contraseña actual"); return; }
    if (nueva.length < 6) { toast.error("La nueva contraseña debe tener al menos 6 caracteres"); return; }
    setSaving(true);
    try {
      await api.patch("/perfil/password", { passwordActual: actual, passwordNueva: nueva });
      toast.success("Contraseña actualizada");
      setActual("");
      setNueva("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.message || err.response?.data?.detail || "Error al cambiar contraseña"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#161618] border border-white/10 rounded-sm p-6">
      <div className="flex items-center gap-2 mb-5">
        <KeyRound className="h-4 w-4 text-[#ccff00]" />
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Contraseña</h2>
      </div>
      {success ? (
        <div className="flex items-center gap-3 py-4">
          <CheckCircle2 className="h-5 w-5 text-[#ccff00]" />
          <p className="text-sm text-white">Contraseña actualizada correctamente</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <Label className="text-[#A1A1AA] text-xs uppercase tracking-wider mb-2 block">Contraseña actual</Label>
            <div className="relative">
              <Input
                type={showActual ? "text" : "password"}
                value={actual}
                onChange={e => setActual(e.target.value)}
                placeholder="Tu contraseña actual"
                className="bg-[#0A0A0A] border-white/10 text-white placeholder:text-[#A1A1AA]/50 rounded-sm focus:border-[#ccff00] focus:ring-[#ccff00]/20 pr-10"
              />
              <button type="button" onClick={() => setShowActual(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-white transition-colors">
                {showActual ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <Label className="text-[#A1A1AA] text-xs uppercase tracking-wider mb-2 block">Nueva contraseña</Label>
            <div className="relative">
              <Input
                type={showNueva ? "text" : "password"}
                value={nueva}
                onChange={e => setNueva(e.target.value)}
                placeholder="Min. 6 caracteres"
                className="bg-[#0A0A0A] border-white/10 text-white placeholder:text-[#A1A1AA]/50 rounded-sm focus:border-[#ccff00] focus:ring-[#ccff00]/20 pr-10"
              />
              <button type="button" onClick={() => setShowNueva(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-white transition-colors">
                {showNueva ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving || !actual || nueva.length < 6}
            className="bg-[#ccff00] text-black font-bold uppercase tracking-wide hover:bg-[#b3e600] rounded-sm h-10 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cambiar contraseña"}
          </Button>
        </div>
      )}
    </div>
  );
}
