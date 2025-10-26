import React from "react";
import { Link } from "react-router-dom";

export default function Welcome() {
  return (
    <>
      <section className="hero">
        <h1>Nom Nom Wheel</h1>

        <div className="star-row" aria-hidden="true">
          {Array.from({length: 12}).map((_,i)=><span className="star" key={i} />)}
        </div>

        <p className="subtitle">
          Spin to discover your next bite. Save favorites. Tune your tastes.
        </p>

        <div className="gap-16 mt-24">
          <Link to="/signup">
            <button className="btn btn-primary btn-lg">Sign-Up</button>
          </Link>
          <Link to="/login">
            <button className="btn btn-primary btn-lg">Login</button>
          </Link>
        </div>
      </section>
    </>
  );
}
