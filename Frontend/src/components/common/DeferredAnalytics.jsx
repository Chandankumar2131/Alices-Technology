import { useEffect, useState } from "react";

export default function DeferredAnalytics() {
  const [AnalyticsComponent, setAnalyticsComponent] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const start = () => {
      import("@vercel/analytics/react").then((mod) => {
        if (!cancelled) setAnalyticsComponent(() => mod.Analytics);
      });
    };

    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(start, { timeout: 2000 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(id);
      };
    }

    const id = window.setTimeout(start, 1200);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, []);

  return AnalyticsComponent ? <AnalyticsComponent /> : null;
}
