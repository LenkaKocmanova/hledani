import "./App.css";
import { useState } from "react";

function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [savedFile, setSavedFile] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const search = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setError("");
    setSavedFile("");

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Search failed.");
      }

      setResults(data.results || []);
      setSavedFile(data.savedFile || "");
    } catch (err) {
      setResults([]);
      setError(err.message || "Search failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadResults = () => {
    if (!results.length) return;
    const safeName =
      query
        .trim()
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/(^-|-$)/g, "")
        .toLowerCase() || "results";
    const payload = { query: query.trim(), results };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${safeName}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div>
        <h1>Hledání</h1>
        <div className="card">
          <div>
            <label htmlFor="search">Hledat:</label>
            <input
              type="text"
              id="search"
              placeholder="Hledat..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          
          </div>
          <div className="button-container">
            <button onClick={search} disabled={isLoading}>
              {isLoading ? "Hledám..." : "Hledat"}
            </button>
            <button onClick={downloadResults} disabled={!results.length}>
              Stáhnout JSON
            </button>
          </div>
        </div>
        <div className="card">
          <p>Výsledky hledání:</p>
          {error && <p>{error}</p>}
          {savedFile && <p>Uloženo na serveru: {savedFile}</p>}
          <ul>
            {results.map((r) => (
              <li key={r.position}>
                <a href={r.link} target="_blank" rel="noreferrer">
                  {r.title}
                </a>
                <p>{r.snippet}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

export default App;
