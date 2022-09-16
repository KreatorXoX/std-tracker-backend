const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const BusSchema = new Schema({
  schoolName: { type: String, required: true },
  licensePlate: { type: String, required: true, minLength: 5 },
  capacity: { type: Number, default: 15 },
  busDriver: {
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true, minLength: 13 },
  },
  studentHandler: {
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true, minLength: 13 },
  },
  students: [{ type: mongoose.Types.ObjectId, required: true, ref: "Student" }],
});

module.exports = mongoose.model("Bus", BusSchema);
