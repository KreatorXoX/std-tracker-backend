const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const sessionSchema = new Schema({
  date: {
    type: String,
    required: true,
  },
  students: [
    {
      id: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      image: {
        type: String,
        required: true,
      },
      isOnTheBus: {
        type: Boolean,
        default: false,
      },
      wasOnTheBus: {
        type: Boolean,
        default: false,
      },
    },
  ],
  schoolName: { type: String, required: true },
  busDriver: { type: String, required: true },
  studentHandler: { type: String, required: true },
  employeeId: { type: String, required: true },
  busId: { type: String, required: true },
});

module.exports = mongoose.model("Session", sessionSchema);
