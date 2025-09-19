"use client";
import { signIn, useSession } from "next-auth/react";
import { useState } from "react";

export default function DebugSignIn() {
  const { data: session, status } = useSession();
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testDirectRedirect = () => {
    addLog("Testing direct redirect...");
    window.location.href = "/api/auth/signin/spotify";
  };

  const testSignInFunction = async () => {
    addLog("Testing signIn function...");
    try {
      const result = await signIn("spotify", { 
        callbackUrl: window.location.origin,
        redirect: false 
      });
      addLog(`signIn result: ${JSON.stringify(result)}`);
    } catch (error) {
      addLog(`signIn error: ${error}`);
    }
  };

  const testProviders = async () => {
    addLog("Testing providers endpoint...");
    try {
      const response = await fetch("/api/auth/providers");
      const data = await response.json();
      addLog(`Providers: ${JSON.stringify(data)}`);
    } catch (error) {
      addLog(`Providers error: ${error}`);
    }
  };

  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug Sign-In</h1>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Session Status</h2>
        <p>Status: {status}</p>
        <p>Session: {JSON.stringify(session)}</p>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Test Actions</h2>
        <div className="space-x-4">
          <button 
            onClick={testDirectRedirect}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test Direct Redirect
          </button>
          <button 
            onClick={testSignInFunction}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Test signIn Function
          </button>
          <button 
            onClick={testProviders}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Test Providers
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Logs</h2>
        <div className="bg-gray-100 p-4 rounded max-h-96 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index} className="text-sm font-mono mb-1">{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
