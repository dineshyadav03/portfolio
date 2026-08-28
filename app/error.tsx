"use client";

import ErrorScreen from "@/components/ErrorScreen";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorScreen
      title="connection lost"
      detail={error.message || "something went wrong loading this section."}
      onRetry={reset}
    />
  );
}
