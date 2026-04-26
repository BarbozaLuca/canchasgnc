import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { GoogleLogin } from "@react-oauth/google";
import api, { formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { LogIn, UserPlus, Loader2, ArrowLeft, Mail, KeyRound, CheckCircle2, Phone, Eye, EyeOff } from "lucide-react";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "login";
  const navigate = useNavigate();
  const { user, login, register, verifyEmail, resendVerification, googleLogin } = useAuth();
  const [showForgot, setShowForgot] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState("");

  if (user) {
    navigate("/canchas", { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 pt-20 pb-12">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">GNC</h1>
          <p className="text-sm text-[#A1A1AA]">{showForgot ? "Recupera tu contraseña" : "Ingresa para reservar tu cancha"}</p>
        </div>
        <div className="bg-[#161618] border border-white/10 rounded-sm p-4 sm:p-6 md:p-8" data-testid="auth-card">
          {showForgot ? (
            <ForgotPasswordFlow onBack={() => setShowForgot(false)} navigate={navigate} login={login} />
          ) : pendingVerificationEmail ? (
            <VerifyEmailFlow
              email={pendingVerificationEmail}
              verifyEmail={verifyEmail}
              resendVerification={resendVerification}
              navigate={navigate}
              onBack={() => setPendingVerificationEmail("")}
            />
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full bg-[#0A0A0A] rounded-sm mb-6" data-testid="auth-tabs">
                <TabsTrigger value="login" className="flex-1 rounded-sm data-[state=active]:bg-[#2A2A2D] data-[state=active]:text-white text-[#A1A1AA]" data-testid="login-tab">
                  <LogIn className="mr-2 h-4 w-4" /> Ingresar
                </TabsTrigger>
                <TabsTrigger value="register" className="flex-1 rounded-sm data-[state=active]:bg-[#2A2A2D] data-[state=active]:text-white text-[#A1A1AA]" data-testid="register-tab">
                  <UserPlus className="mr-2 h-4 w-4" /> Registrarse
                </TabsTrigger>
              </TabsList>
              <TabsContent value="login"><LoginForm login={login} resendVerification={resendVerification} googleLogin={googleLogin} navigate={navigate} onForgot={() => setShowForgot(true)} onRegisterTab={() => setActiveTab("register")} onNeedsVerification={setPendingVerificationEmail} /></TabsContent>
              <TabsContent value="register"><RegisterForm register={register} googleLogin={googleLogin} navigate={navigate} onLoginTab={() => setActiveTab("login")} onNeedsVerification={setPendingVerificationEmail} /></TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}

function LoginForm({ login, resendVerification, googleLogin, navigate, onForgot, onRegisterTab, onNeedsVerification }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      await googleLogin(credentialResponse.credential);
      toast.success("Bienvenido!");
      navigate("/canchas");
    } catch {
      setError("Error al iniciar sesion con Google.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Bienvenido de vuelta!");
      navigate("/canchas");
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;
      if (status === 404) {
        setError("not_found");
      } else if (status === 409) {
        setError("google_user");
      } else if (status === 403 && (data?.detail === "email_not_verified" || data?.message === "email_not_verified" || data?.error === "email_not_verified")) {
        try { await resendVerification(email); } catch { /* ignore */ }
        onNeedsVerification(email);
      } else if (status === 401 || status === 403) {
        setError("Email o contraseña incorrectos.");
      } else {
        setError(formatApiError(data?.detail || data?.message));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" data-testid="login-form">
      {error && error !== "not_found" && error !== "google_user" && (
        <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-sm px-4 py-2 font-medium" data-testid="login-error">
          {error}
        </p>
      )}
      {error === "google_user" && (
        <div className="text-sm bg-blue-500/10 border border-blue-500/20 rounded-sm px-4 py-3" data-testid="login-google-user">
          <p className="text-blue-300 font-medium">Esta cuenta fue creada con Google.</p>
          <p className="text-blue-300/70 text-xs mt-1">Usa el boton "Continuar con Google" de abajo para ingresar.</p>
        </div>
      )}
      {error === "not_found" && (
        <div className="text-sm bg-yellow-500/10 border border-yellow-500/20 rounded-sm px-4 py-3" data-testid="login-not-found">
          <p className="text-yellow-300 font-medium">No existe una cuenta con ese email.</p>
          <button type="button" onClick={onRegisterTab} className="text-[#ccff00] hover:underline font-bold mt-1">
            Registrate aqui
          </button>
        </div>
      )}
      <div>
        {/* Cambié text-[#A1A1AA] por text-white/90 y agregué font-medium */}
        <Label className="text-white/90 font-medium text-xs uppercase tracking-wider mb-2 block">Email</Label>
        <Input 
          data-testid="login-email" 
          type="email" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          required 
          placeholder="tu@email.com" 
          className="bg-[#0A0A0A] border-white/10 text-white placeholder:text-[#A1A1AA]/70 rounded-sm focus:border-[#ccff00] focus:ring-[#ccff00]/20" 
        />
      </div>
      <div>
        {/* Cambié text-[#A1A1AA] por text-white/90 y agregué font-medium */}
        <Label className="text-white/90 font-medium text-xs uppercase tracking-wider mb-2 block">Contraseña</Label>
        <div className="relative">
          <Input
            data-testid="login-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="bg-[#0A0A0A] border-white/10 text-white placeholder:text-[#A1A1AA]/70 rounded-sm focus:border-[#ccff00] focus:ring-[#ccff00]/20 pr-10"
          />
          <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-white transition-colors">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <Button data-testid="login-submit" type="submit" disabled={loading} className="w-full bg-[#ccff00] text-black font-bold uppercase tracking-wide hover:bg-[#b3e600] rounded-sm h-11">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ingresar"}
      </Button>

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
        <div className="relative flex justify-center text-xs"><span className="bg-[#161618] px-3 text-[#A1A1AA]">o continua con</span></div>
      </div>

      <div className="flex justify-center min-w-0 overflow-hidden [&>div]:w-full [&_iframe]:!rounded-sm">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setError("Error al iniciar sesion con Google.")}
          theme="filled_black"
          size="large"
          width="100%"
          text="continue_with"
          shape="rectangular"
        />
      </div>

      <button type="button" onClick={onForgot} className="w-full text-center text-sm text-white/80 hover:text-[#ccff00] mt-4 transition-colors font-medium">
        Olvide mi contraseña
      </button>
      
      {/* Cambié text-[#A1A1AA] por text-white/80 y aumenté el peso de la fuente del botón a font-bold */}
      <p className="text-center text-sm text-white/80 mt-3 font-medium">
        ¿Eres nuevo?{" "}
        <button type="button" onClick={onRegisterTab} className="text-[#ccff00] hover:underline font-bold">
          Presiona aquí
        </button>
      </p>
    </form>
  );
}

function RegisterForm({ register, googleLogin, navigate, onLoginTab, onNeedsVerification }) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [celular, setCelular] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      await googleLogin(credentialResponse.credential);
      toast.success("Cuenta creada con Google!");
      navigate("/canchas");
    } catch {
      setError("Error al registrarse con Google.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setError("La contraseña debe tener al menos 8 caracteres e incluir una letra y un número");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    try {
      const data = await register(nombre, email, password, celular);
      if (data?.requiresVerification) {
        toast.success("Te enviamos un codigo de verificacion");
        onNeedsVerification(data.email || email);
        return;
      }
      toast.success("Cuenta creada con exito!");
      navigate("/canchas");
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;
      if (status === 409) {
        setError("Ya existe una cuenta con ese email. Proba ingresando desde la pestaña \"Ingresar\".");
      } else {
        setError(formatApiError(data?.detail || data?.message));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" data-testid="register-form">
      {error && (
        <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-sm px-4 py-2 font-medium" data-testid="register-error">
          {error}
        </p>
      )}
      <div>
        <Label className="text-white/90 font-medium text-xs uppercase tracking-wider mb-2 block">Nombre completo</Label>
        <Input data-testid="register-name" type="text" value={nombre} onChange={e => setNombre(e.target.value)} required placeholder="Nombre y apellido" className="bg-[#0A0A0A] border-white/10 text-white placeholder:text-[#A1A1AA]/70 rounded-sm focus:border-[#ccff00] focus:ring-[#ccff00]/20" />
      </div>
      <div>
        <Label className="text-white/90 font-medium text-xs uppercase tracking-wider mb-2 block">Email</Label>
        <Input data-testid="register-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="tu@email.com" className="bg-[#0A0A0A] border-white/10 text-white placeholder:text-[#A1A1AA]/70 rounded-sm focus:border-[#ccff00] focus:ring-[#ccff00]/20" />
      </div>
      <div>
        <Label className="text-white/90 font-medium text-xs uppercase tracking-wider mb-2 block">
          Celular
        </Label>
        <div className="relative">
          {/* Cambié el ícono del teléfono para que se vea un poco más claro también */}
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
          <Input data-testid="register-phone" type="tel" value={celular} onChange={e => setCelular(e.target.value)} required placeholder="Ej: 3515551234" className="bg-[#0A0A0A] border-white/10 text-white placeholder:text-[#A1A1AA]/70 rounded-sm focus:border-[#ccff00] focus:ring-[#ccff00]/20 pl-10" />
        </div>
      </div>
      <div>
        <Label className="text-white/90 font-medium text-xs uppercase tracking-wider mb-2 block">Contraseña</Label>
        <div className="relative">
          <Input data-testid="register-password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min. 8 caracteres, 1 letra y 1 número" className="bg-[#0A0A0A] border-white/10 text-white placeholder:text-[#A1A1AA]/70 rounded-sm focus:border-[#ccff00] focus:ring-[#ccff00]/20 pr-10" />
          <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-white transition-colors">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div>
        <Label className="text-white/90 font-medium text-xs uppercase tracking-wider mb-2 block">Confirmar contraseña</Label>
        <div className="relative">
          <Input data-testid="register-confirm-password" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="Repetí la contraseña" className="bg-[#0A0A0A] border-white/10 text-white placeholder:text-[#A1A1AA]/70 rounded-sm focus:border-[#ccff00] focus:ring-[#ccff00]/20 pr-10" />
          <button type="button" onClick={() => setShowConfirmPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-white transition-colors">
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {confirmPassword && password !== confirmPassword && (
          <p className="text-xs text-red-400 mt-1.5">Las contraseñas no coinciden</p>
        )}
      </div>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="terms"
          checked={accepted}
          onChange={e => setAccepted(e.target.checked)}
          className="mt-1 h-4 w-4 rounded-sm border-white/20 bg-[#0A0A0A] accent-[#ccff00] cursor-pointer"
          data-testid="register-terms"
        />
        <label htmlFor="terms" className="text-sm text-white/80 cursor-pointer leading-relaxed font-medium">
          Acepto los{" "}
          <Link to="/terminos" target="_blank" className="text-[#ccff00] hover:underline font-bold">
            términos y condiciones
          </Link>
        </label>
      </div>
      <Button data-testid="register-submit" type="submit" disabled={loading || !accepted} className="w-full bg-[#ccff00] text-black font-bold uppercase tracking-wide hover:bg-[#b3e600] rounded-sm h-11 disabled:opacity-50 disabled:cursor-not-allowed">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear cuenta"}
      </Button>

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
        <div className="relative flex justify-center text-xs"><span className="bg-[#161618] px-3 text-[#A1A1AA]">o registrate con</span></div>
      </div>

      <div className="flex justify-center min-w-0 overflow-hidden [&>div]:w-full [&_iframe]:!rounded-sm">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setError("Error al registrarse con Google.")}
          theme="filled_black"
          size="large"
          width="100%"
          text="signup_with"
          shape="rectangular"
        />
      </div>

      <p className="text-center text-sm text-white/80 mt-4 font-medium">
        Si ya tienes una cuenta,{" "}
        <button type="button" onClick={onLoginTab} className="text-[#ccff00] hover:underline font-bold">
          presiona aquí
        </button>
      </p>
    </form>
  );
}

function ForgotPasswordFlow({ onBack, navigate, login }) {
  const [step, setStep] = useState(1); // 1=email, 2=codigo, 3=nueva password
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      toast.success("Si el email existe, recibiras un codigo");
      setStep(2);
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail || "Error al enviar el codigo"));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setError("La contraseña debe tener al menos 8 caracteres e incluir una letra y un número");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { email, codigo, password });
      toast.success("Contraseña actualizada!");
      setStep(3);
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || "Error al restablecer";
      setError(formatApiError(msg));
    } finally {
      setLoading(false);
    }
  };

  if (step === 3) {
    return (
      <div className="text-center space-y-4">
        <CheckCircle2 className="h-12 w-12 text-[#ccff00] mx-auto" />
        <h3 className="text-lg font-bold text-white">Contraseña actualizada</h3>
        <p className="text-sm text-[#A1A1AA]">Ya podes ingresar con tu nueva contraseña</p>
        <Button onClick={onBack} className="w-full bg-[#ccff00] text-black font-bold uppercase tracking-wide hover:bg-[#b3e600] rounded-sm h-11">
          Volver a ingresar
        </Button>
      </div>
    );
  }

  return (
    <div>
      <button type="button" onClick={onBack} className="flex items-center gap-2 text-sm text-[#A1A1AA] hover:text-white mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Volver
      </button>

      {step === 1 && (
        <form onSubmit={handleSendCode} className="space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <Mail className="h-5 w-5 text-[#ccff00]" />
            <h3 className="text-lg font-bold text-white">Ingresa tu email</h3>
          </div>
          <p className="text-sm text-[#A1A1AA]">Te enviaremos un codigo de 6 digitos para verificar tu identidad.</p>
          {error && <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-sm px-4 py-2">{error}</p>}
          <div>
            <Label className="text-[#A1A1AA] text-xs uppercase tracking-wider mb-2 block">Email</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="tu@email.com" className="bg-[#0A0A0A] border-white/10 text-white placeholder:text-[#A1A1AA]/50 rounded-sm focus:border-[#ccff00] focus:ring-[#ccff00]/20" />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-[#ccff00] text-black font-bold uppercase tracking-wide hover:bg-[#b3e600] rounded-sm h-11">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar codigo"}
          </Button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleResetPassword} className="space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <KeyRound className="h-5 w-5 text-[#ccff00]" />
            <h3 className="text-lg font-bold text-white">Restablecer contraseña</h3>
          </div>
          <p className="text-sm text-[#A1A1AA]">Ingresa el codigo que recibiste en <span className="text-white font-medium">{email}</span> y tu nueva contraseña.</p>
          {error && <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-sm px-4 py-2">{error}</p>}
          <div>
            <Label className="text-[#A1A1AA] text-xs uppercase tracking-wider mb-2 block">Codigo de verificacion</Label>
            <Input type="text" value={codigo} onChange={e => setCodigo(e.target.value)} required placeholder="123456" maxLength={6} inputMode="numeric" className="bg-[#0A0A0A] border-white/10 text-white placeholder:text-[#A1A1AA]/50 rounded-sm focus:border-[#ccff00] focus:ring-[#ccff00]/20 text-center text-base sm:text-lg tracking-wider sm:tracking-widest font-mono" />
          </div>
          <div>
            <Label className="text-[#A1A1AA] text-xs uppercase tracking-wider mb-2 block">Nueva contraseña</Label>
            <div className="relative">
              <Input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min. 8 caracteres, 1 letra y 1 número" className="bg-[#0A0A0A] border-white/10 text-white placeholder:text-[#A1A1AA]/50 rounded-sm focus:border-[#ccff00] focus:ring-[#ccff00]/20 pr-10" />
              <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-white transition-colors">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-[#ccff00] text-black font-bold uppercase tracking-wide hover:bg-[#b3e600] rounded-sm h-11">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cambiar contraseña"}
          </Button>
          <button type="button" onClick={() => { setStep(1); setError(""); }} className="w-full text-center text-sm text-[#A1A1AA] hover:text-[#ccff00] transition-colors">
            No recibi el codigo, reenviar
          </button>
        </form>
      )}
    </div>
  );
}

function VerifyEmailFlow({ email, verifyEmail, resendVerification, navigate, onBack }) {
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await verifyEmail(email, codigo);
      toast.success("Email verificado! Bienvenido");
      navigate("/canchas");
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail || err.response?.data?.message || "Codigo invalido"));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setResending(true);
    try {
      await resendVerification(email);
      toast.success("Codigo reenviado");
    } catch {
      setError("No se pudo reenviar el codigo. Intenta de nuevo.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div>
      <button type="button" onClick={onBack} className="flex items-center gap-2 text-sm text-[#A1A1AA] hover:text-white mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Volver
      </button>
      <form onSubmit={handleVerify} className="space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <Mail className="h-5 w-5 text-[#ccff00]" />
          <h3 className="text-lg font-bold text-white">Verifica tu email</h3>
        </div>
        <p className="text-sm text-[#A1A1AA]">
          Te enviamos un codigo de 6 digitos a <span className="text-white font-medium">{email}</span>. Ingresalo para activar tu cuenta.
        </p>
        {error && <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-sm px-4 py-2">{error}</p>}
        <div>
          <Label className="text-[#A1A1AA] text-xs uppercase tracking-wider mb-2 block">Codigo de verificacion</Label>
          <Input type="text" value={codigo} onChange={e => setCodigo(e.target.value)} required placeholder="123456" maxLength={6} inputMode="numeric" className="bg-[#0A0A0A] border-white/10 text-white placeholder:text-[#A1A1AA]/50 rounded-sm focus:border-[#ccff00] focus:ring-[#ccff00]/20 text-center text-base sm:text-lg tracking-wider sm:tracking-widest font-mono" />
        </div>
        <Button type="submit" disabled={loading} className="w-full bg-[#ccff00] text-black font-bold uppercase tracking-wide hover:bg-[#b3e600] rounded-sm h-11">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verificar y entrar"}
        </Button>
        <button type="button" onClick={handleResend} disabled={resending} className="w-full text-center text-sm text-[#A1A1AA] hover:text-[#ccff00] transition-colors disabled:opacity-50">
          {resending ? "Reenviando..." : "No recibi el codigo, reenviar"}
        </button>
      </form>
    </div>
  );
}
