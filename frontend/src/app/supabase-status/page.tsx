"use client";

import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export default function SupabaseStatusPage() {
  const [status, setStatus] = useState<{
    configured: boolean;
    connected: boolean;
    tablesExist: boolean;
    error?: string;
  }>({ configured: false, connected: false, tablesExist: false });

  useEffect(() => {
    async function checkSupabaseStatus() {
      try {
        // Check if Supabase is configured
        if (!isSupabaseConfigured) {
          setStatus({
            configured: false,
            connected: false,
            tablesExist: false,
            error: 'Supabase environment variables not found'
          });
          return;
        }

        // Test basic connection
        const { data, error } = await supabase.from('teams').select('count', { count: 'exact', head: true });
        
        if (error) {
          setStatus({
            configured: true,
            connected: true,
            tablesExist: false,
            error: error.message
          });
        } else {
          setStatus({
            configured: true,
            connected: true,
            tablesExist: true
          });
        }
      } catch (err) {
        setStatus({
          configured: isSupabaseConfigured,
          connected: false,
          tablesExist: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    checkSupabaseStatus();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-[#FF6B00]">Supabase Status Check</h1>
        
        <div className="space-y-6">
          <div className="border border-[#FF6B00]/20 bg-black/20 backdrop-blur-sm p-6 rounded-2xl">
            <h2 className="text-xl font-semibold mb-4">Configuration Status</h2>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${status.configured ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>{status.configured ? 'Environment variables configured' : 'Environment variables missing'}</span>
            </div>
          </div>

          <div className="border border-[#FF6B00]/20 bg-black/20 backdrop-blur-sm p-6 rounded-2xl">
            <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${status.connected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>{status.connected ? 'Connected to Supabase' : 'Not connected to Supabase'}</span>
            </div>
          </div>

          <div className="border border-[#FF6B00]/20 bg-black/20 backdrop-blur-sm p-6 rounded-2xl">
            <h2 className="text-xl font-semibold mb-4">Database Tables</h2>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${status.tablesExist ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>{status.tablesExist ? 'Database tables exist' : 'Database tables not found'}</span>
            </div>
          </div>

          {status.error && (
            <div className="border border-red-500/20 bg-red-500/10 p-6 rounded-2xl">
              <h2 className="text-xl font-semibold mb-4 text-red-400">Error Details</h2>
              <p className="text-red-300 font-mono text-sm">{status.error}</p>
            </div>
          )}

          {!status.configured && (
            <div className="border border-yellow-500/20 bg-yellow-500/10 p-6 rounded-2xl">
              <h2 className="text-xl font-semibold mb-4 text-yellow-400">Environment Setup Required</h2>
              <div className="space-y-3 text-yellow-200">
                <p>Your Supabase environment variables are not configured:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Check your <code className="bg-black/50 px-2 py-1 rounded">.env.local</code> file</li>
                  <li>Ensure <code className="bg-black/50 px-2 py-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> is set</li>
                  <li>Ensure <code className="bg-black/50 px-2 py-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> is set</li>
                  <li>Restart the development server after making changes</li>
                </ul>
              </div>
            </div>
          )}

          {status.configured && !status.tablesExist && (
            <div className="border border-yellow-500/20 bg-yellow-500/10 p-6 rounded-2xl">
              <h2 className="text-xl font-semibold mb-4 text-yellow-400">Database Setup Required</h2>
              <div className="space-y-3 text-yellow-200">
                <p>To complete the Supabase setup:</p>
                <ol className="list-decimal list-inside space-y-2 ml-4">
                  <li>Go to your Supabase dashboard: <a href="https://cgpdbzevhmdqrndoevro.supabase.co" target="_blank" rel="noopener noreferrer" className="text-[#FF6B00] underline">https://cgpdbzevhmdqrndoevro.supabase.co</a></li>
                  <li>Navigate to the SQL Editor</li>
                  <li>Copy the contents of <code className="bg-black/50 px-2 py-1 rounded">supabase-migration.sql</code> from your project root</li>
                  <li>Paste and execute the migration to create all tables</li>
                  <li>Refresh this page to verify the setup</li>
                </ol>
              </div>
            </div>
          )}

          {status.configured && status.connected && status.tablesExist && (
            <div className="border border-green-500/20 bg-green-500/10 p-6 rounded-2xl">
              <h2 className="text-xl font-semibold mb-4 text-green-400">✅ Setup Complete!</h2>
              <p className="text-green-200">
                Your Supabase database is properly configured and ready to use. 
                You can now use all features of the IGI Contest application.
              </p>
              <div className="mt-4">
                <a 
                  href="/mission" 
                  className="inline-block bg-[#FF6B00] text-white px-6 py-2 rounded-lg hover:bg-[#FF6B00]/80 transition-colors"
                >
                  Go to Mission Dashboard
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}