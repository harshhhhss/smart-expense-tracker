import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import ToastContainer from "./components/ToastContainer";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import SharedGroup from "./pages/SharedGroup";
import Analytics from "./pages/Analytics";
import Notifications from "./pages/Notifications";
import LandingPage from "./pages/LandingPage";

const FullPageLoader = () => (
  <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", color:"var(--muted)" }}>
    Loading...
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  return user ? children : <Navigate to="/login" replace />;
};

// "/" serves two audiences: the marketing page to visitors, the dashboard
// to anyone signed in. Waiting on `loading` matters here -- rendering the
// landing page first would flash marketing copy at a returning user on
// every refresh while the session is still being restored.
const RootRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  return user ? <Dashboard /> : <LandingPage />;
};

const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <ToastProvider>
        <ToastContainer />
        <BrowserRouter>
          <Routes>
            <Route path="/login"  element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<RootRoute />} />
            <Route path="/groups" element={
              <ProtectedRoute><SharedGroup /></ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute><Analytics /></ProtectedRoute>
            } />
            <Route path="/notifications" element={
              <ProtectedRoute><Notifications /></ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
