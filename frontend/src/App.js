import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "sonner";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "@/pages/Landing";
import Auth from "@/pages/Auth";
import Courts from "@/pages/Courts";
import Booking from "@/pages/Booking";
import MyBookings from "@/pages/MyBookings";
import Panel from "@/pages/Panel";
import Terms from "@/pages/Terms";
import Profile from "@/pages/Profile";
import WhatsAppButton from "@/components/WhatsAppButton";
import PagoExito from "@/pages/PagoExito";
import PagoPendiente from "@/pages/PagoPendiente";
import PagoError from "@/pages/PagoError";

function App() {
  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || ""}>
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[#0A0A0A]">
          <Navbar />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/canchas" element={<Courts />} />
            <Route path="/pago/exito" element={<ProtectedRoute><PagoExito /></ProtectedRoute>} />
            <Route path="/pago/pendiente" element={<ProtectedRoute><PagoPendiente /></ProtectedRoute>} />
            <Route path="/pago/error" element={<ProtectedRoute><PagoError /></ProtectedRoute>} />
            <Route path="/terminos" element={<Terms />} />
            <Route path="/reservar/:canchaId" element={
              <ProtectedRoute><Booking /></ProtectedRoute>
            } />
            <Route path="/mis-reservas" element={
              <ProtectedRoute><MyBookings /></ProtectedRoute>
            } />
            <Route path="/perfil" element={
              <ProtectedRoute><Profile /></ProtectedRoute>
            } />
            <Route path="/panel" element={
              <ProtectedRoute roles={["ROLE_STAFF", "ROLE_ADMIN"]}><Panel /></ProtectedRoute>
            } />
          </Routes>
          <WhatsAppButton />
          <Toaster
            theme="dark"
            toastOptions={{
              style: { background: '#161618', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' },
            }}
          />
        </div>
      </BrowserRouter>
    </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
