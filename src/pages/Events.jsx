import BackLink from "../lib/Backlink";

export default function EventsPage() {
  const events = [
    { title: "Event 1", desc: "(Event Description)" },
    { title: "Event 2", desc: "(Event Description)" },
    { title: "Event 3", desc: "(Event Description)" },
    { title: "Event 4", desc: "(Event Description)" },
    { title: "Event 5", desc: "(Event Description)" },
    { title: "Event 6", desc: "(Event Description)" },
  ];

  return (
    <main className="page-wrap">
      <BackLink />
      <h1 className="page-title">Events</h1>
      <div className="list">
        {events.map((e, i) => (
          <div key={i} className="list-item">
            <strong>{e.title}</strong><br />{e.desc}
          </div>
        ))}
      </div>
    </main>
  );
}
