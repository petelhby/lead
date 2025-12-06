// src/app/(app)/projects/layout.tsx
export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  // Никакой собственной <html>/<body> разметки — используем общий RootLayout
  return <>{children}</>;
}
