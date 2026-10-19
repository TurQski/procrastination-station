"use client";
export default function DashboardError({ reset }: { reset: () => void }) {
  return <div className="state-card"><h2>Something interrupted this page.</h2><p>Your saved goals remain in your account.</p><button className="secondary-button" onClick={reset}>Try again</button></div>;
}
