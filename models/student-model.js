const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const StudentSchema = new Schema({
  name: { type: String, required: true },
  imageKey: { type: String, required: true },
  image: { type: String },
  imageExp: { type: Date },
  schoolName: { type: String, required: true },
  isComing: { type: Boolean, default: true },
  isOnTheBus: { type: Boolean, default: false },
  wasOnTheBus: { type: Boolean, default: false },
  age: { type: Number, required: true },
  bloodType: { type: String, required: true, maxLength: 2 },
  alergies: [{ type: String }],
  knownDiseases: [{ type: String }],
  emergencyContacts: [
    {
      name: {
        type: String,
        required: true,
      },
      howRelated: {
        type: String,
        required: true,
      },
      phoneNumber: {
        type: String,
        required: true,
      },
    },
  ],
  parentId: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
  busId: { type: mongoose.Types.ObjectId, required: true, ref: "Bus" },
  location: {
    lat: { type: String, default: "" },
    lng: { type: String, default: "" },
  },
});

module.exports = mongoose.model("Student", StudentSchema);
