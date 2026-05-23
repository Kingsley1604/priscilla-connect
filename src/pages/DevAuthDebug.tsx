import React from "react";
import { useAuth } from "@/hooks/useAuth";

const DevAuthDebug = () => {
  const { user, session } = useAuth();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Auth Debug</h1>
      <p className="mb-2">This page shows the current `useAuth()` user object and session.</p>
      <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
        {JSON.stringify({ user, session }, null, 2)}
      </pre>
      <div className="mt-4">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={() => {
            try {
              navigator.clipboard.writeText(JSON.stringify({ user, session }, null, 2));
              alert('Auth debug copied to clipboard');
            } catch (e) {
              alert('Failed to copy');
            }
          }}
        >
          Copy JSON
        </button>
      </div>
    </div>
  );
};

export default DevAuthDebug;
