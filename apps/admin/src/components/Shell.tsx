"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAME } from "@bolantero/shared";
import { Icon, type IconName } from "@/components/icons";

const groups: { label: string; items: { href: string; label: string; icon: IconName }[] }[] = [
  {
    label: "Operations",
    items: [
      { href: "/dashboard", label: "Overview", icon: "overview" },
      { href: "/verifications", label: "Verifications", icon: "verify" },
      { href: "/merchants", label: "Merchants", icon: "store" },
    ],
  },
  {
    label: "Live ops",
    items: [
      { href: "/deliveries", label: "Deliveries", icon: "delivery" },
      { href: "/trips", label: "Trips", icon: "trip" },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/fees", label: "Fee rules", icon: "fees" },
      { href: "/reports", label: "Reports", icon: "reports" },
    ],
  },
];

export function Shell({
  children,
  title,
  lede,
}: {
  children: React.ReactNode;
  title: string;
  lede?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    document.body.classList.toggle("nav-lock", open);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.classList.remove("nav-lock");
    };
  }, [open]);

  return (
    <div className={open ? "app-frame nav-open" : "app-frame"}>
      <button
        type="button"
        className="sidebar-backdrop"
        aria-label="Close menu"
        tabIndex={open ? 0 : -1}
        onClick={() => setOpen(false)}
      />
      <aside className="sidebar" id="admin-sidebar">
        <Link href="/dashboard" className="sidebar-brand">
          <span className="sidebar-logo">B</span>
          <span>
            <b>{APP_NAME}</b> Admin
          </span>
        </Link>
        <div className="user-panel">
          <span className="user-avatar">A</span>
          <div>
            <strong>Admin</strong>
            <span>Online</span>
          </div>
        </div>
        <nav className="sidebar-nav" aria-label="Admin sections">
          {groups.map((group) => (
            <div key={group.label} className="nav-group">
              <p className="nav-label">{group.label}</p>
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={pathname === item.href ? "active" : undefined}
                  aria-current={pathname === item.href ? "page" : undefined}
                >
                  <Icon name={item.icon} size={16} />
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </aside>
      <div className="app-main">
        <header className="main-header">
          <button
            type="button"
            className="nav-toggle menu-btn"
            aria-expanded={open}
            aria-controls="admin-sidebar"
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name={open ? "close" : "menu"} />
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          </button>
          <span className="header-brand">{APP_NAME} Admin</span>
          <Link href="/login" className="header-user">
            <Icon name="account" size={16} />
            Sign out
          </Link>
        </header>
        <div className="content-header">
          <h1>{title}</h1>
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href="/dashboard">Home</Link>
            <span>/</span>
            <span>{title}</span>
          </nav>
        </div>
        {lede ? <p className="content-lede">{lede}</p> : null}
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
