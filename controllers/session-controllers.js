const mongoose = require("mongoose");
const HttpError = require("../models/http-error");
const SessionModel = require("../models/session-model");
const StudentModal = require("../models/student-model");

const newSession = async (req, res, next) => {
  if (req.userData.role !== "employee") {
    return next(
      new HttpError("You are not authorized to do this operation!!!", 401)
    );
  }
  const {
    students,
    schoolName,
    busDriver,
    studentHandler,
    date,
    employeeId,
    busId,
  } = req.body;

  const newSess = new SessionModel({
    students,
    schoolName,
    busDriver,
    studentHandler,
    date,
    employeeId,
    busId,
  });

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await newSess.save({ session: sess });

    for (let std of newSess.students) {
      await StudentModal.findByIdAndUpdate(
        std.id,
        {
          isOnTheBus: false,
          wasOnTheBus: false,
        },
        { session: sess }
      );
    }
    await sess.commitTransaction();
  } catch (error) {
    console.log(error);
    return next(new HttpError("couldnt reach DB to create new session", 500));
  }

  res.json({ message: "Session saved successfuly" });
};

const getSessions = async (req, res, next) => {
  if (req.userData.role === "parent") {
    return next(
      new HttpError("You are not authorized to do this operation!!!", 401)
    );
  }
  let sessions;

  try {
    sessions = await SessionModel.find({});
  } catch (error) {
    return next(new HttpError("Couldnt connect db to get sessions", 500));
  }

  res.json({ sessions: sessions });
};

exports.newSession = newSession;
exports.getSessions = getSessions;
