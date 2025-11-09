import BackLink from "../lib/BackLink.jsx";

export default function SavedRestaurants() {
  // fake items for now
  const items = ["Jim Bob’s Fantastic Foods", "Saved #2", "Saved #3", "Saved #4"];

  return (
    <main className="page-wrap">
      <BackLink />
      <h1 className="page-title">Saved Restaurants</h1>
      <div className="list">
        {items.map((name, i) => (
          <div key={i} className="list-item">{name}</div>
        ))}
      </div>
    </main>
  );
}
