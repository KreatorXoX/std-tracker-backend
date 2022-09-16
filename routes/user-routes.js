const express = require("express");
const { check } = require("express-validator");

const fileUpload = require("../middleware/file-upload");
const authCheck = require("../middleware/auth-check");

const userControllers = require("../controllers/user-controllers");

const router = express.Router();

router.post("/login", userControllers.loginUser);

router.use(authCheck);

router.get("/user/:userId", userControllers.getUserById);
//router.get("/:stdId", userControllers.getParentByStudentId);
router.get("/byRole/:role", userControllers.getUsers);

router.post(
  "/register",
  fileUpload.single("image"),
  [
    check("name").notEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 5 }),
  ],
  userControllers.registerUser
);

router.patch("/:userId", userControllers.updateUser);

router.delete("/:userId", userControllers.deleteUser);

module.exports = router;
