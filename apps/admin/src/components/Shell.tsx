import Link from "next/link";
import { APP_NAME } from "@bolantero/shared";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/verifications", label: "Verifications" },
  { href: "/merchants", label: "Merchants" },
  { href: "/deliveries", label: "Live Deliveries" },
  { href: "/fees", label: "Fee Rules" },
  { href: "/reports", label: "Reports" },
];

export function Shell({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <main className="shell">
      <header style={{ marginBottom: 20 }}>
        <p className="badge">{APP_NAME} Admin</p>
        <h1 style={{ margin: "10px 0 4px" }}>{title}</h1>
        <p className="muted" style={{ margin: 0 }}>
          Identity review, approvals, pricing, and delivery operations.
        </p>
      </header>
      <nav className="nav">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ))}
        <Link href="/login">Account</Link>
      </nav>
      {children}
    </main>
  );
}
