const metrics = {
  startedAt: new Date(),
  totalRequests: 0,
  statusCodes: {},
  totalResponseTimeMs: 0,
  slowRequests: 0,
};

const requestMetrics = (req, res, next) => {
  const started = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - started) / 1e6;
    metrics.totalRequests += 1;
    metrics.totalResponseTimeMs += durationMs;
    metrics.statusCodes[res.statusCode] = (metrics.statusCodes[res.statusCode] || 0) + 1;

    if (durationMs > 1000) {
      metrics.slowRequests += 1;
      console.warn(
        `[slow-request] ${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs.toFixed(0)}ms`
      );
    }
  });

  next();
};

const getMetrics = () => ({
  uptimeSeconds: Math.round(process.uptime()),
  startedAt: metrics.startedAt,
  totalRequests: metrics.totalRequests,
  averageResponseTimeMs:
    metrics.totalRequests === 0
      ? 0
      : Number((metrics.totalResponseTimeMs / metrics.totalRequests).toFixed(2)),
  slowRequests: metrics.slowRequests,
  statusCodes: metrics.statusCodes,
  memory: process.memoryUsage(),
});

module.exports = {
  requestMetrics,
  getMetrics,
};
