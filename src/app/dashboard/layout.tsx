import { StationHeader } from "@/components/design/station-header";
export const metadata = {
  title: "My Momentum - Procrastination Station",
  robots: { index: false, follow: false },
};
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="station-site">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <StationHeader />
      <main id="main" className="standalone-workspace">
        {children}
      </main>
    </div>
  );
}
