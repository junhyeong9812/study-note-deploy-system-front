import Link from "next/link";
import SearchBar from "@/shared/ui/SearchBar";
import ThemeToggle from "@/shared/ui/ThemeToggle";
import { TreeToggle, ChatToggle } from "@/features/layout/ui/LayoutToggles";

export default function Header() {
  return (
    <header style={{
      display: "flex", alignItems: "center", gap: "1.5rem", padding: "0.75rem 1.5rem",
      borderBottom: "1px solid var(--line)", position: "sticky", top: 0,
      background: "var(--bg)", zIndex: 10,
    }}>
      <TreeToggle />
      <Link href="/" style={{ fontWeight: 700, color: "var(--fg)" }}>study-note</Link>
      <SearchBar />
      <ThemeToggle />
      <ChatToggle />
    </header>
  );
}
