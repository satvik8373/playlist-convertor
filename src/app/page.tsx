"use client";
import { signOut, useSession } from "next-auth/react";
import { useCallback, useMemo, useState } from "react";
import Papa from "papaparse";

type TrackRow = {
  name: string;
  artists: string[];
  album: string;
  durationMs: number;
  externalUrl: string | null;
};

export default function Home() {
  const { data: session, status } = useSession();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<TrackRow[]>([]);

  const isAuthed = !!session?.spotify?.accessToken;

  const handleFetch = useCallback(async () => {
    if (!isAuthed) {
      setError("Please sign in with Spotify first");
      return;
    }
    
    setLoading(true);
    setError(null);
    setRows([]);
    try {
      console.log("Fetching playlist:", input);
      const res = await fetch(`/api/playlist?id=${encodeURIComponent(input)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch playlist");
      setRows(json.tracks || []);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [input, isAuthed]);

  const csv = useMemo(() => {
    if (!rows.length) return "";
    const data = rows.map((r) => ({
      Name: r.name,
      Artists: r.artists.join(", "),
      Album: r.album,
      DurationMs: r.durationMs,
      SpotifyURL: r.externalUrl ?? "",
    }));
    return Papa.unparse(data);
  }, [rows]);

  const txt = useMemo(() => {
    if (!rows.length) return "";
    return rows
      .map((r) => `${r.name} - ${r.artists.join(", ")} | ${r.album}`)
      .join("\n");
  }, [rows]);

  const download = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen w-full max-w-5xl mx-auto p-6">
      <header className="flex items-center justify-between py-4">
        <h1 className="text-xl font-semibold">Spotify Playlist Converter</h1>
        {status === "loading" ? (
          <div className="animate-pulse text-sm opacity-70">Loading...</div>
        ) : isAuthed ? (
          <button className="text-sm underline" onClick={() => signOut()}>Sign out</button>
        ) : (
          <button 
            className="text-sm underline hover:text-blue-600 cursor-pointer" 
            onClick={(e) => {
              e.preventDefault();
              console.log("Button clicked - attempting to sign in with Spotify...");
              console.log("Current URL:", window.location.href);
              console.log("Origin:", window.location.origin);
              
              // Try direct redirect first
              window.location.href = "/api/auth/signin/spotify";
            }}
          >
            Sign in with Spotify
          </button>
        )}
      </header>

      <main className="space-y-6">
        <div className="flex gap-2">
          <input
            className="flex-1 px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-transparent"
            placeholder="Enter Spotify playlist URL or ID"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            disabled={!isAuthed || loading || !input}
            className="px-4 py-2 rounded bg-black text-white disabled:opacity-50 dark:bg-white dark:text-black"
            onClick={handleFetch}
          >
            {loading ? "Fetching..." : "Fetch Playlist"}
          </button>
        </div>
        {error && (
          <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
        )}

        {!!rows.length && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm opacity-70">{rows.length} tracks</div>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 rounded border border-gray-300 dark:border-gray-700"
                  onClick={() => download(csv, "playlist.csv", "text/csv;charset=utf-8;")}
                >
                  Download CSV
                </button>
                <button
                  className="px-3 py-1 rounded border border-gray-300 dark:border-gray-700"
                  onClick={() => download(txt, "playlist.txt", "text/plain;charset=utf-8;")}
                >
                  Download TXT
                </button>
              </div>
            </div>
            <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Artists</th>
                    <th className="text-left p-2">Album</th>
                    <th className="text-left p-2">Duration</th>
                    <th className="text-left p-2">Spotify URL</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="p-2">{r.name}</td>
                      <td className="p-2">{r.artists.join(", ")}</td>
                      <td className="p-2">{r.album}</td>
                      <td className="p-2">{Math.round(r.durationMs / 1000)}s</td>
                      <td className="p-2">
                        {r.externalUrl ? (
                          <a className="underline" href={r.externalUrl} target="_blank" rel="noreferrer">Open</a>
                        ) : (
                          <span className="opacity-60">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
