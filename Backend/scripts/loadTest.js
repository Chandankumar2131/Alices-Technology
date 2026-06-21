const targetUrl = process.env.TARGET_URL || "http://localhost:4000/health";
const totalRequests = Number(process.env.REQUESTS || 200);
const concurrency = Number(process.env.CONCURRENCY || 20);

let completed = 0;
let ok = 0;
let failed = 0;
const durations = [];
const startedAt = Date.now();

const runRequest = async () => {
  const started = Date.now();

  try {
    const response = await fetch(targetUrl);
    const duration = Date.now() - started;
    durations.push(duration);

    if (response.ok) {
      ok += 1;
    } else {
      failed += 1;
    }
  } catch (_error) {
    failed += 1;
    durations.push(Date.now() - started);
  } finally {
    completed += 1;
  }
};

const worker = async () => {
  while (completed < totalRequests) {
    await runRequest();
  }
};

const percentile = (values, pct) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(Math.ceil((pct / 100) * sorted.length) - 1, sorted.length - 1);
  return sorted[index];
};

const main = async () => {
  await Promise.all(Array.from({ length: concurrency }, worker));

  const totalMs = Date.now() - startedAt;
  const average =
    durations.length === 0
      ? 0
      : durations.reduce((sum, value) => sum + value, 0) / durations.length;

  console.log(JSON.stringify(
    {
      targetUrl,
      totalRequests,
      concurrency,
      ok,
      failed,
      totalSeconds: Number((totalMs / 1000).toFixed(2)),
      requestsPerSecond: Number((totalRequests / (totalMs / 1000)).toFixed(2)),
      averageMs: Number(average.toFixed(2)),
      p95Ms: percentile(durations, 95),
      p99Ms: percentile(durations, 99),
    },
    null,
    2
  ));
};

main();
