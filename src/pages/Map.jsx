import BackLink from "../lib/Backlink";

export default function MapPage() {
  return (
    <main className="page-wrap">
      <BackLink />
      <h1 className="page-title">Map</h1>

      <div className="card" style={{display:"grid", gap:12}}>
        <label>Start
          <input className="input" placeholder="My house" />
        </label>
        <label>To
          <input className="input" placeholder="Jim Bob’s Fantastic Foods" />
        </label>
        <button className="btn">Go</button>
      </div>
    </main>
  );
}
