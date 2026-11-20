import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Enfernal — o plantão de plataforma",
    template: "%s · Enfernal",
  },
  description:
    "Jogo de plataforma 2D no navegador: uma enfermeira atravessa o hospital pulando em camas, medicando pacientes e fugindo dos pacientes chatos.",
  applicationName: "Enfernal",
  keywords: ["jogo", "plataforma", "enfermeira", "hospital", "Next.js", "canvas"],
  openGraph: {
    title: "Enfernal — o plantão de plataforma",
    description: "Pule de cama em cama, medique os pacientes e sobreviva aos pacientes chatos.",
    type: "website",
    locale: "pt_BR",
  },
};

export const viewport: Viewport = {
  themeColor: "#2a9d8f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
