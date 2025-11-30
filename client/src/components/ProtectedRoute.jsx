import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();

  // While loading token from localStorage -> don't render anything
  if (loading) return null;

  // If no token after loading -> redirect to landing
  if (!token) return <Navigate to="/" replace />;

  // Otherwise allow the protected page
  return children;
}
