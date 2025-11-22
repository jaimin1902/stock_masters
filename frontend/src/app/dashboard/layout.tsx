export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth and navbar are now handled by AppLayout at root level
  return <>{children}</>;
}
