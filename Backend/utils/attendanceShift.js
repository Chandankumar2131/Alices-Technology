const moment = require("moment-timezone");

const TZ = "Asia/Kolkata";
const CHECK_IN_START = { hour: 19, minute: 0 };
const CHECK_IN_END = { hour: 19, minute: 10 };
const CHECK_OUT_TIME = { hour: 5, minute: 0 };

const getShiftDate = (time = moment().tz(TZ)) => {
  const localTime = moment(time).tz(TZ);
  return localTime.hour() < 12
    ? localTime.clone().subtract(1, "day").format("YYYY-MM-DD")
    : localTime.format("YYYY-MM-DD");
};

const getShiftBoundary = (shiftDate, boundary) =>
  moment.tz(
    `${shiftDate} ${String(boundary.hour).padStart(2, "0")}:${String(
      boundary.minute
    ).padStart(2, "0")}`,
    "YYYY-MM-DD HH:mm",
    TZ
  );

module.exports = {
  TZ,
  CHECK_IN_START,
  CHECK_IN_END,
  CHECK_OUT_TIME,
  getShiftDate,
  getShiftBoundary,
};
