const express = require("express");
const {
  createHoliday,
  getHolidays,
  deleteHoliday,
} = require("../controller/holidayController");
const { auth } = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");

const router = express.Router();

router.get("/", auth, getHolidays);
router.post("/", auth, isAdmin, createHoliday);
router.delete("/:id", auth, isAdmin, deleteHoliday);

module.exports = router;
