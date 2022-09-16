const { validationResult } = require("express-validator");

const HttpError = require("../models/http-error");
const BusModel = require("../models/bus-model");
const StudentModel = require("../models/student-model");

const getAllBuses = async (req, res, next) => {
  if (req.userData.role !== "admin") {
    return next(
      new HttpError("You are not authorized to do this operation!!!", 401)
    );
  }
  let allBuses;

  try {
    allBuses = await BusModel.find({});
  } catch (error) {
    return next(new HttpError("Couldnt get the bus data from the DB", 500));
  }
  if (!allBuses || allBuses.length === 0) {
    return next(new HttpError("No bus found", 404));
  }

  res
    .status(200)
    .json({ buses: allBuses.map((bus) => bus.toObject({ getters: true })) });
};

const getBusById = async (req, res, next) => {
  const { busId } = req.params;

  let bus;

  try {
    bus = await BusModel.findById(busId);
  } catch (error) {
    return next(new HttpError("Couldnt connect db to fetch bus data", 500));
  }

  if (!bus) {
    return next(new HttpError("no buses found with the given id", 404));
  }

  res.json({ bus: bus.toObject({ getters: true }) });
};

const createBus = async (req, res, next) => {
  if (req.userData.role !== "admin") {
    return next(
      new HttpError("You are not authorized to do this operation!!!", 401)
    );
  }
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid inputs are being passed", 422));
  }

  const { schoolName, licensePlate, busDriver, studentHandler } = req.body;

  const newBus = new BusModel({
    schoolName,
    licensePlate,
    busDriver,
    studentHandler,
    students: [],
  });

  try {
    await newBus.save();
  } catch (error) {
    console.log(error);
    return next(
      new HttpError("Failed to create new-bus, please try again later", 500)
    );
  }

  res.status(201).json({ bus: newBus.toObject({ getters: true }) });
};

const updateBus = async (req, res, next) => {
  if (req.userData.role !== "admin") {
    return next(
      new HttpError("You are not authorized to do this operation!!!", 401)
    );
  }
  const { schoolName, busDriver, studentHandler } = req.body;
  const busId = req.params.busId;

  let updatedBus;
  let busCapacity = 0;
  try {
    updatedBus = await BusModel.findById(busId);
  } catch (error) {
    return next(new HttpError("Couldnt get the bus data from the DB", 500));
  }

  if (!updatedBus) {
    return next(new HttpError("No bus found with the given id", 404));
  }

  if (updatedBus.schoolName !== schoolName) {
    updatedBus.schoolName = schoolName;
    updatedBus.students = [];
    try {
      busCapacity = await StudentModel.updateMany(
        { busId: updatedBus._id },
        { busId: null }
      );

      updatedBus.capacity += busCapacity;
    } catch (error) {
      return next(new HttpError("Couldnt change the students busIds", 500));
    }
  }

  updatedBus.busDriver = busDriver;
  updatedBus.studentHandler = studentHandler;

  try {
    await updatedBus.save();
  } catch (error) {
    console.log(error);
    return next(new HttpError("Couldnt access to db to updated bus"));
  }
  res.status(200).json({ bus: updatedBus.toObject({ getters: true }) });
};

const deleteBus = async (req, res, next) => {
  if (req.userData.role !== "admin") {
    return next(
      new HttpError("You are not authorized to do this operation!!!", 401)
    );
  }
  const { busId } = req.params;

  let deletedBus;

  try {
    deletedBus = await BusModel.findById(busId);
  } catch (error) {
    console.log(error);
    return next(new HttpError("Couldnt access to db to delete bus"));
  }

  if (!deletedBus) {
    return next(new HttpError("No bus found with the given bus-id", 404));
  }

  //remove busId from students.
  try {
    await StudentModel.updateMany({ busId: deletedBus._id }, { busId: null });
  } catch (error) {
    return next(
      new HttpError("Couldnt access to db to update students by bus", 500)
    );
  }

  try {
    await deletedBus.remove();
  } catch (error) {
    return next(new HttpError("Couldnt access to db to delete bus", 500));
  }
  res.status(200).json({ message: "Bus Deleted Successfuly" });
};

const populateBus = async (req, res, next) => {
  if (req.userData.role !== "admin") {
    return next(
      new HttpError("You are not authorized to do this operation!!!", 401)
    );
  }
  const { busId } = req.params;

  let busToPopulate;
  let busCapacity;
  try {
    busToPopulate = await BusModel.findById(busId);
  } catch (error) {
    console.log(error);
    return next(new HttpError("Couldnt access to db to delete bus"));
  }

  if (!busToPopulate) {
    return next(new HttpError("No bus found with the given bus-id", 404));
  }

  try {
    const returnData = await StudentModel.updateMany(
      { busId: null, schoolName: busToPopulate.schoolName },
      { busId: busToPopulate._id },
      { new: true }
    );
    busCapacity = returnData.modifiedCount;
  } catch (error) {
    return next(
      new HttpError("Couldnt access to db to update students by bus", 500)
    );
  }

  let students;
  try {
    students = await StudentModel.find({ busId: busToPopulate._id });
  } catch (error) {
    return next(
      new HttpError("Couldnt access to db to update students by bus", 500)
    );
  }

  if (!students) {
    return next(new HttpError("No students found to insert to bus", 404));
  }

  try {
    for (let std of students) {
      busToPopulate.students.push(std);
    }
    busToPopulate.capacity -= busCapacity;
    await busToPopulate.save();
  } catch (error) {}

  res.status(200).json({
    message: "Populated",
    students: students.map((std) => std.toObject({ getters: true })),
  });
};

exports.getAllBuses = getAllBuses;
exports.getBusById = getBusById;
exports.createBus = createBus;
exports.updateBus = updateBus;
exports.deleteBus = deleteBus;
exports.populateBus = populateBus;
