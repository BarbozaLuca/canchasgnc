import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { User, LogOut, Calendar, LayoutDashboard, ChevronDown, Menu, X } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isLanding = location.pathname === "/";
  const [mobileOpen, setMobileOpen] = useState(false);

  const isStaffOrAdmin = user?.rol === "ROLE_STAFF" || user?.rol === "ROLE_ADMIN";

  // Cierra el menú mobile al navegar
  const closeMobile = () => setMobileOpen(false);

  return (
    <nav className={`glass-header fixed top-0 left-0 right-0 z-50 ${isLanding ? "" : ""}`} data-testid="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2" data-testid="navbar-logo" onClick={closeMobile}>
          <span className="text-2xl font-black uppercase tracking-tighter text-white">GNC</span>
        </Link>

        {/* Nav links — desktop */}
        <div className="hidden sm:flex items-center gap-1">
          <NavLink to="/canchas" active={location.pathname === "/canchas"}>Canchas</NavLink>
          {user && <NavLink to="/mis-reservas" active={location.pathname === "/mis-reservas"}>Mis reservas</NavLink>}
          {isStaffOrAdmin && <NavLink to="/panel" active={location.pathname === "/panel"}>Panel</NavLink>}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {user && <NotificationBell />}

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="sm:hidden w-12 h-12 flex items-center justify-center text-white hover:bg-white/5 rounded-sm transition-colors"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* User menu — desktop */}
          {user ? (
            <div className="hidden sm:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-white hover:bg-white/5 rounded-sm gap-2 px-3" data-testid="user-menu-trigger">
                    <div className="w-7 h-7 rounded-sm bg-[#ccff00]/10 flex items-center justify-center">
                      <User className="h-3.5 w-3.5 text-[#ccff00]" />
                    </div>
                    <span className="text-sm hidden lg:inline">{user.nombre}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-[#A1A1AA]" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#161618] border-white/10 rounded-sm w-48" data-testid="user-menu-content">
                  <div className="px-3 py-2">
                    <p className="text-sm text-white font-medium">{user.nombre}</p>
                    <p className="text-xs text-[#A1A1AA]">{user.email}</p>
                    <p className="text-xs text-[#ccff00] mt-1 font-mono-accent">{user.rol?.replace("ROLE_", "")}</p>
                  </div>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem asChild className="text-[#A1A1AA] hover:text-white focus:text-white focus:bg-white/5 rounded-sm cursor-pointer">
                    <Link to="/perfil"><User className="h-4 w-4 mr-2" /> Mi perfil</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="text-[#A1A1AA] hover:text-white focus:text-white focus:bg-white/5 rounded-sm cursor-pointer">
                    <Link to="/canchas"><Calendar className="h-4 w-4 mr-2" /> Canchas</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="text-[#A1A1AA] hover:text-white focus:text-white focus:bg-white/5 rounded-sm cursor-pointer">
                    <Link to="/mis-reservas"><Calendar className="h-4 w-4 mr-2" /> Mis reservas</Link>
                  </DropdownMenuItem>
                  {isStaffOrAdmin && (
                    <DropdownMenuItem asChild className="text-[#A1A1AA] hover:text-white focus:text-white focus:bg-white/5 rounded-sm cursor-pointer">
                      <Link to="/panel"><LayoutDashboard className="h-4 w-4 mr-2" /> Panel</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem onClick={logout} className="text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-red-400/5 rounded-sm cursor-pointer" data-testid="logout-btn">
                    <LogOut className="h-4 w-4 mr-2" /> Cerrar sesion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 sm:gap-2">
              <Link to="/auth">
                <Button variant="ghost" className="text-white hover:bg-white/5 rounded-sm text-sm px-2.5 sm:px-3" data-testid="nav-login-btn">
                  Ingresar
                </Button>
              </Link>
              <Link to="/auth?tab=register">
                <Button className="bg-[#ccff00] text-black font-bold hover:bg-[#b3e600] rounded-sm text-sm px-3 sm:px-4 h-9" data-testid="nav-register-btn">
                  Registrarse
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile menu ── */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-white/10 bg-[#0A0A0A]/95 backdrop-blur-lg animate-fade-in max-h-[80vh] overflow-y-auto">
          <div className="px-4 py-4 space-y-1">
            {/* User info (if logged in) */}
            {user && (
              <div className="px-3 py-3 mb-2 bg-white/5 rounded-sm">
                <p className="text-sm text-white font-medium">{user.nombre}</p>
                <p className="text-xs text-[#A1A1AA]">{user.email}</p>
                <p className="text-xs text-[#ccff00] mt-1 font-mono-accent">{user.rol?.replace("ROLE_", "")}</p>
              </div>
            )}

            {/* Nav links */}
            <MobileNavLink to="/canchas" active={location.pathname === "/canchas"} onClick={closeMobile}>
              <Calendar className="h-4 w-4" /> Canchas
            </MobileNavLink>

            {user && (
              <>
                <MobileNavLink to="/mis-reservas" active={location.pathname === "/mis-reservas"} onClick={closeMobile}>
                  <Calendar className="h-4 w-4" /> Mis reservas
                </MobileNavLink>
                <MobileNavLink to="/perfil" active={location.pathname === "/perfil"} onClick={closeMobile}>
                  <User className="h-4 w-4" /> Mi perfil
                </MobileNavLink>
                {isStaffOrAdmin && (
                  <MobileNavLink to="/panel" active={location.pathname === "/panel"} onClick={closeMobile}>
                    <LayoutDashboard className="h-4 w-4" /> Panel
                  </MobileNavLink>
                )}
              </>
            )}

            {/* Auth buttons or Logout */}
            <div className="pt-3 border-t border-white/10 mt-3">
              {user ? (
                <button
                  onClick={() => { logout(); closeMobile(); }}
                  className="flex items-center gap-3 w-full px-3 py-3 text-red-400 hover:bg-red-400/5 rounded-sm text-sm font-medium transition-colors"
                >
                  <LogOut className="h-4 w-4" /> Cerrar sesion
                </button>
              ) : (
                <div className="flex gap-2">
                  <Link to="/auth" onClick={closeMobile} className="flex-1">
                    <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/5 rounded-sm h-11 text-sm">
                      Ingresar
                    </Button>
                  </Link>
                  <Link to="/auth?tab=register" onClick={closeMobile} className="flex-1">
                    <Button className="w-full bg-[#ccff00] text-black font-bold hover:bg-[#b3e600] rounded-sm h-11 text-sm">
                      Registrarse
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

function NavLink({ to, active, children }) {
  return (
    <Link
      to={to}
      className={`px-3 py-1.5 rounded-sm text-sm transition-colors ${
        active ? "text-[#ccff00] bg-[#ccff00]/5" : "text-white hover:text-white hover:bg-white/5"
      }`}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ to, active, onClick, children }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-3 rounded-sm text-sm font-medium transition-colors ${
        active ? "text-[#ccff00] bg-[#ccff00]/5" : "text-white hover:bg-white/5"
      }`}
    >
      {children}
    </Link>
  );
}
