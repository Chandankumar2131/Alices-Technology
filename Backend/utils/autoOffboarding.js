const moment = require("moment-timezone");
const User = require("../model/User");
const { TZ } = require("./attendanceShift");

const JOB_INTERVAL_MS = 15 * 60 * 1000;
let jobRunning = false;

const autoOffboardEligibleEmployees = async (io, now = moment().tz(TZ)) => {
  if (jobRunning) return { processed: 0, skipped: true };
  jobRunning = true;

  try {
    const startOfToday = moment(now).tz(TZ).startOf("day").toDate();
    const eligible = await User.find({
      accountType: "Employee",
      isActive: true,
      "resignation.status": "Approved",
      "resignation.lastWorkingDay": { $lt: startOfToday },
      "resignation.knowledgeTransferCompleted": true,
      "resignation.assetsReturned": true,
    }).select("_id resignation.lastWorkingDay");

    let processed = 0;
    for (const employee of eligible) {
      const updated = await User.findOneAndUpdate(
        {
          _id: employee._id,
          isActive: true,
          "resignation.status": "Approved",
          "resignation.knowledgeTransferCompleted": true,
          "resignation.assetsReturned": true,
        },
        {
          $set: {
            isActive: false,
            employmentEndDate: employee.resignation.lastWorkingDay,
          },
          $unset: { token: 1 },
          $inc: { sessionVersion: 1 },
          $push: {
            offboardingHistory: {
              action: "Offboarded",
              effectiveDate: employee.resignation.lastWorkingDay,
              reason: "Approved resignation notice period completed",
              remarks: "Automatically offboarded after all handover requirements were completed.",
              actorType: "System",
              performedAt: new Date(),
            },
          },
        },
        { new: true }
      );

      if (!updated) continue;
      processed += 1;
      if (io) io.in(`user:${employee._id}`).disconnectSockets(true);
    }

    if (processed && io) {
      io.to("role:admin").emit("admin:notifications", {
        type: "offboarding",
        processed,
      });
    }

    return { processed, skipped: false };
  } finally {
    jobRunning = false;
  }
};

const startAutoOffboardingJob = (io) => {
  autoOffboardEligibleEmployees(io).catch((error) => {
    console.error("Automatic offboarding failed", error);
  });

  const timer = setInterval(() => {
    autoOffboardEligibleEmployees(io).catch((error) => {
      console.error("Automatic offboarding failed", error);
    });
  }, JOB_INTERVAL_MS);

  timer.unref?.();
  return timer;
};

module.exports = {
  autoOffboardEligibleEmployees,
  startAutoOffboardingJob,
};
