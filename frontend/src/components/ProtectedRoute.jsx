import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import LoadingState from "./LoadingState";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children }) {
  const location = useLocation();
  const { session, loading } = useAuth();

  if (loading) {
    return <LoadingState fullScreen message="Cargando tu sesión..." />;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

export default ProtectedRoute;
