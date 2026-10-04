import Link from "next/link";
import SearchBar from "@/shared/ui/SearchBar";
import ThemeToggle from "@/shared/ui/ThemeToggle";
import { TreeToggle, ChatToggle } from "@/features/layout/ui/LayoutToggles";
import styles from "./Header.module.css";

export default function Header() {
  return (
    <header className={styles.header}>
      <TreeToggle />
      <Link href="/" className={styles.brand}>study-note</Link>
      <SearchBar />
      <ThemeToggle />
      <ChatToggle />
    </header>
  );
}
