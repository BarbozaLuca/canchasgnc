import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
        <Loader2 className="h-8 w-8 animate-spin text-[#ccff00]" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (roles && !roles.includes(user.rol)) {
    return <Navigate to="/canchas" replace />;
  }

  return children;
}
