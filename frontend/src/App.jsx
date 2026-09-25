import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MyReports from "./pages/MyReports";
import ReportForm from "./pages/ReportForm";
import SearchReports from "./pages/SearchReports";
import ReportDetail from "./pages/ReportDetail";
import Matches from "./pages/Matches";
import ClaimProcess from "./pages/ClaimProcess";
import Profile from "./pages/Profile";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mis-objetos"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <MyReports />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/buscar-objetos"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SearchReports />
                </AppLayout>
              </ProtectedRoute>
            }
          />

                      <Route
              path="/matches"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Matches />
                  </AppLayout>
                </ProtectedRoute>
              }
            />    
          <Route
            path="/objetos/:id"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ReportDetail />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reportar/:type"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ReportForm />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mis-objetos/editar/:id"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ReportForm />
                </AppLayout>
              </ProtectedRoute>
            }
          />

                    <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Profile />
                </AppLayout>
              </ProtectedRoute>
            }
          />

                  <Route
          path="/reclamacion"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ClaimProcess />
              </AppLayout>
            </ProtectedRoute>
          }
        />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
