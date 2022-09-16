const express = require("express");
const { check } = require("express-validator");

const fileUpload = require("../middleware/file-upload");
const authCheck = require("../middleware/auth-check");

const studentsControllers = require("../controllers/students-controllers");

const router = express.Router();

router.use(authCheck);

router.get("/", studentsControllers.getAllStudents);
router.get("/:stdId", studentsControllers.getStudentById);
//router.get("/:stdId/location", studentsControllers.getLocation);
router.get("/bus/:busId", studentsControllers.getStudentsByBus);
router.get("/parent/:parentId", studentsControllers.getStudentsByParent);

router.post(
  "/new/:parentId",
  fileUpload.single("image"),
  [
    check("name").notEmpty(),
    check("age").isInt({ min: 3 }),
    check("bloodType").notEmpty(),
    check("schoolName").notEmpty(),
  ],
  studentsControllers.createStudent
);

router.patch("/:stdId", studentsControllers.updateStudent);
router.patch("/:stdId/onTheBus", studentsControllers.onTheBusToggler);
router.patch("/:stdId/location", studentsControllers.updateLocation);

router.delete("/:stdId", studentsControllers.deleteStudent);

module.exports = router;
