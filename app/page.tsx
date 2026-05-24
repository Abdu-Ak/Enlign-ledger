"use client";

import React, { useState, useEffect } from "react";
import LoginScreen from "@/components/LoginScreen";
import Dashboard from "@/components/Dashboard";


export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);


  // Verify authentication status on initial mount
  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth");
      const data = await res.json();
      
      if (res.ok && data.authenticated) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error("Session verification failed:", err);
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Screen transition: Loading state
  if (isAuthenticated === null) {
    return (
      <div className="relative flex flex-col flex-1 items-center justify-center min-h-screen" style={{ background: "var(--bg)" }}>
        {/* Clean slate light-mode pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

        <div className="flex flex-col items-center gap-3.5 z-10">
          <div className="h-9 w-9 rounded-full border-3 border-slate-200 border-t-slate-800 animate-spin" />
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-500">Verifying Secure Session...</span>
        </div>
      </div>
    );
  }

  // Router dispatcher
  if (isAuthenticated === false) {
    return <LoginScreen onSuccess={() => setIsAuthenticated(true)} />;
  }

  return <Dashboard onLogout={() => setIsAuthenticated(false)} />;
}
