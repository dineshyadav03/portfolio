import Prompt from "@/components/Prompt";
import styles from "./SectionPage.module.css";

export default function SectionPage({
  command,
  children,
}: {
  command: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Prompt command={command} />
      <div className={styles.content}>{children}</div>
    </div>
  );
}
