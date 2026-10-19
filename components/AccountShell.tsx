import Link from "next/link";
import AccountMenu from "./AccountMenu";
import ThemeToggle from "./ThemeToggle";
import styles from "./AccountPages.module.css";

export default function AccountShell({ children }: { children: React.ReactNode }) {
  return <main className={`track-page ${styles.page}`} data-track="software">
    <header className="site-header"><div className={`container header-inner ${styles.header}`}>
      <Link className="brand directory-brand" href="/">WantAn<span>Internship</span></Link>
      <div className={styles.actions}><ThemeToggle /><AccountMenu /></div>
    </div></header>
    <div className={styles.content}>{children}</div>
  </main>;
}
