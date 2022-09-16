const express = require("express");

const authCheck = require("../middleware/auth-check");

const sessionControllers = require("../controllers/session-controllers");

const router = express.Router();

router.use(authCheck);

router.get("/", sessionControllers.getSessions);

router.post("/", sessionControllers.newSession);

module.exports = router;
