import ErrorScreen from "@/components/ErrorScreen";

export default function NotFound() {
  return <ErrorScreen title="404 — not found" detail="this path doesn't exist on this system." />;
}
