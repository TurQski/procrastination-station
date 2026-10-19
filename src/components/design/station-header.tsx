import Link from "next/link";
import { ArrowUpRight, Layers3 } from "lucide-react";

export function StationHeader() {
  return (
    <header className="site-header">
      <Link href="/" className="brand">
        <span className="brand-icon">
          <Layers3 size={22} />
        </span>
        <span>
          procrastination<span className="brand-light">station</span>
          <span className="brand-dot">.</span>
        </span>
      </Link>
      <nav aria-label="Main navigation">
        <Link href="/#how-it-works">How it works</Link>
        <Link href="/#your-progress">Your workspace</Link>
        <span className="nav-divider" />
        <Link href="/dashboard" className="nav-dashboard">
          Open dashboard <ArrowUpRight size={15} />
        </Link>
      </nav>
    </header>
  );
}
