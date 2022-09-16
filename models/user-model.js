const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  password: { type: String, required: true },
  imageKey: { type: String, required: true },
  image: { type: String },
  imageExp: { type: Date },
  role: {
    type: String,
    enum: ["parent", "admin", "employee"],
    default: "parent",
  },
  children: [{ type: mongoose.Types.ObjectId, ref: "Student" }],
  busId: { type: mongoose.Types.ObjectId, ref: "Bus" },
});

module.exports = mongoose.model("User", UserSchema);
