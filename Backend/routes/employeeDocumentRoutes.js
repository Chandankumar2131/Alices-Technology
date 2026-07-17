const express = require("express");
const { auth } = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");
const controller = require("../controller/employeeDocumentController");

const router = express.Router();
router.get("/my", auth, controller.getMyDocuments);
router.post("/my", auth, controller.uploadDocument);
router.delete("/my/:id", auth, controller.deleteDocument);
router.get("/:id/access", auth, controller.accessDocument);
router.get("/employee/:employeeId", auth, isAdmin, controller.getEmployeeDocuments);
router.patch("/:id/review", auth, isAdmin, controller.reviewDocument);
module.exports = router;
