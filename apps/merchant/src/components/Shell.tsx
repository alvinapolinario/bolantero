import Link from "next/link";
import { APP_NAME } from "@bolantero/shared";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/products", label: "Products" },
  { href: "/orders", label: "Orders" },
  { href: "/onboarding", label: "Business" },
  { href: "/reports", label: "Sales" },
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
        <p className="badge">{APP_NAME} Merchant</p>
        <h1 style={{ margin: "10px 0 4px" }}>{title}</h1>
        <p className="muted" style={{ margin: 0 }}>
          Keep 100% of product sales. Bolantero earns only from delivery fees.
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
