const express = require("express");

const router = express.Router();

const {
  startBreak,
  endBreak,
  getMyBreaks,
  getTodayBreaks,
} = require("../controller/breakController");

const { auth } =
  require("../middleware/auth");

router.post(
  "/start",
  auth,
  startBreak
);

router.post(
  "/end",
  auth,
  endBreak
);

router.get(
  "/my-breaks",
  auth,
  getMyBreaks
);

router.get(
  "/today",
  auth,
  getTodayBreaks
);

module.exports = router;