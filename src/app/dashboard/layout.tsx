import Link from "next/link";
export const metadata = { title: "My goals — Procrastination Station", robots: { index: false, follow: false } };
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <><a className="skip-link" href="#main">Skip to content</a><header className="site-header"><Link className="brand" href="/"><span className="brand-mark" aria-hidden="true">p<span>.</span></span><span>procrastination<br />station.</span></Link><nav aria-label="Account navigation"><Link className="account-link" href="/dashboard">My goals</Link></nav></header><main id="main" className="dashboard-main">{children}</main><footer><Link className="footer-brand" href="/">procrastination station.</Link><p>One step is a start.</p></footer></>;
}
