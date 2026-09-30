import "./globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: "Project LOOP - Customer Feedback Intelligence",
  description: "AI-driven multi-tenant customer feedback platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}