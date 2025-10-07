import "./App.css";
import { AuthProvider, useAuth } from "./components/auth/AuthContext";
import Login from "./components/Login";
import Signup from "./components/Signup";
import DashboardRouter from "./components/DashboardRouter";
import { useState } from "react";

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [showSignup, setShowSignup] = useState(false);

  if (isAuthenticated) {
    return <DashboardRouter />;
  }

  return (
    <div className="min-h-screen">
      <div className="absolute right-4 top-4 z-10">
        <button
          onClick={() => setShowSignup((v) => !v)}
          className="px-3 py-1.5 rounded-md bg-white/80 backdrop-blur border text-sm font-medium hover:bg-white"
        >
          {showSignup ? "Have an account? Log in" : "New here? Create account"}
        </button>
      </div>
      {showSignup ? <Signup /> : <Login />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
