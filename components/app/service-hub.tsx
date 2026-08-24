import Link from "next/link";
import { ArrowRight, ChevronRight, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand/brand-logo";
import styles from "./service-hub.module.css";

export { styles as serviceHubStyles };

export function ServiceMobileHeader({ action }: { action?: ReactNode }) {
  return (
    <header className={styles.mobileHeader}>
      <BrandLogo href="/home" compact />
      {action}
    </header>
  );
}

export function ServiceHubIntro({ title, description }: { title: string; description: string }) {
  return (
    <header className={styles.intro}>
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  );
}

export function HubPrimaryTask({
  icon: Icon,
  title,
  description,
  cta,
  href,
  secondary,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  cta: string;
  href: string;
  secondary?: { label: string; href: string };
}) {
  return (
    <section className={styles.primaryTask} aria-labelledby="hub-primary-task">
      <span className={styles.primaryIcon}><Icon size={27} aria-hidden="true" /></span>
      <div className={styles.primaryCopy}>
        <h2 id="hub-primary-task">{title}</h2>
        <p>{description}</p>
      </div>
      <div className={styles.primaryActions}>
        <Link href={href} className={styles.primaryButton}>
          {cta} <ArrowRight size={18} aria-hidden="true" />
        </Link>
        {secondary ? (
          <Link href={secondary.href} className={styles.secondaryLink}>
            {secondary.label} <ChevronRight size={16} aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </section>
  );
}

export function HubList({
  title,
  trailing,
  children,
}: {
  title: string;
  trailing?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={styles.listSection}>
      <header className={styles.listHeading}>
        <h2>{title}</h2>
        {trailing}
      </header>
      <div className={styles.rows}>{children}</div>
    </section>
  );
}

export function HubRow({
  icon: Icon,
  title,
  description,
  status,
  href,
  tone = "neutral",
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  status?: string;
  href: string;
  tone?: "neutral" | "violet" | "mint";
}) {
  return (
    <Link href={href} className={styles.row}>
      <span className={`${styles.rowIcon} ${styles[`rowIcon_${tone}`]}`}>
        <Icon size={21} aria-hidden="true" />
      </span>
      <span className={styles.rowCopy}>
        <strong>{title}</strong>
        {description ? <small>{description}</small> : null}
      </span>
      {status ? <span className={styles.rowStatus}>{status}</span> : null}
      <ChevronRight size={20} aria-hidden="true" />
    </Link>
  );
}

export function HubUtilityLinks({ children }: { children: ReactNode }) {
  return <nav className={styles.utilityLinks} aria-label="관련 기능">{children}</nav>;
}

export function HubUtilityLink({ icon: Icon, href, children }: { icon: LucideIcon; href: string; children: ReactNode }) {
  return (
    <Link href={href}>
      <Icon size={20} aria-hidden="true" />
      <span>{children}</span>
      <ChevronRight size={18} aria-hidden="true" />
    </Link>
  );
}
