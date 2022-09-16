const express = require("express");
const { check } = require("express-validator");

const authCheck = require("../middleware/auth-check");

const busesControllers = require("../controllers/buses-controllers");

const router = express.Router();

router.use(authCheck);

router.get("/", busesControllers.getAllBuses);
router.get("/:busId", busesControllers.getBusById);

router.post(
  "/",
  [
    check("schoolName").notEmpty(),
    check("licensePlate").notEmpty(),
    check("busDriver").notEmpty(),
    check("studentHandler").notEmpty(),
  ],
  busesControllers.createBus
);

router.patch("/:busId", busesControllers.updateBus);
router.patch("/:busId/populate", busesControllers.populateBus);

router.delete("/:busId", busesControllers.deleteBus);

module.exports = router;
