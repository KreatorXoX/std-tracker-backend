const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const { validationResult } = require("express-validator");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const sharp = require("sharp");
const HttpError = require("../models/http-error");
const StudentModel = require("../models/student-model");
const BusModel = require("../models/bus-model");
const UserModel = require("../models/user-model");

const AwsCommand = require("../helpers/aws-hook");
const removeStudent = require("../helpers/delete-students");

const getAllStudents = async (req, res, next) => {
  if (req.userData.role !== "admin") {
    return next(
      new HttpError("You are not authorized to do this operation!!!", 401)
    );
  }
  let allStudents;

  try {
    allStudents = await StudentModel.find({});
  } catch (error) {
    return next(
      new HttpError("Couldnt access to the DB to get students data", 500)
    );
  }

  if (!allStudents || allStudents.length === 0) {
    return next(new HttpError("No students found", 404));
  }

  for (const student of allStudents) {
    if (student.imageExp && student.imageExp.getTime() > new Date()) {
      continue;
    }
    console.log("before awscommand");
    const { client, command } = AwsCommand("get", student.imageKey);
    console.log("after awscommand");
    const url = await getSignedUrl(client, command, { expiresIn: 3600 });

    student.image = url;
    student.imageExp = new Date(new Date().getTime() + 1000 * 60 * 60);
    await student.save();
  }

  res.status(200).json({
    students: allStudents.map((student) => student.toObject({ getters: true })),
  });
};

const getStudentById = async (req, res, next) => {
  const { stdId } = req.params;

  let student;

  try {
    student = await StudentModel.findById(stdId);
  } catch (error) {
    return next(
      new HttpError("Couldnt connect to db to get student data", 500)
    );
  }

  if (!student) {
    return next(new HttpError("No students found with the given id", 404));
  }

  if (req.userData.role !== "admin") {
    do {
      if (req.userData.userId === student.parentId.toString()) break;
      return next(
        new HttpError("You are not authorized to do this operation!!!", 401)
      );
    } while (false);
  }

  do {
    if (student.imageExp && student.imageExp.getTime() > new Date()) {
      break;
    }
    const { client, command } = AwsCommand("get", student.imageKey);
    const url = await getSignedUrl(client, command, { expiresIn: 3600 });
    student.image = url;
    student.imageExp = new Date(new Date().getTime() + 1000 * 60 * 60);
    await student.save();
  } while (false);

  res.json({ student: student.toObject({ getters: true }) });
};

const getStudentsByBus = async (req, res, next) => {
  if (req.userData.role === "parent") {
    return next(new HttpError("Forbiden route !!!", 403));
  }
  const { busId } = req.params;

  let students;

  try {
    students = await StudentModel.find({ busId: busId }).populate("busId");
  } catch (error) {
    return next(
      new HttpError("Couldnt access to DB to get the students with busId", 500)
    );
  }

  if (students.length === 0) {
    return next(new HttpError("No student found on the given bus ID", 404));
  }

  for (const student of students) {
    if (student.imageExp && student.imageExp.getTime() > new Date()) {
      continue;
    }
    const { client, command } = AwsCommand("get", student.imageKey);

    const url = await getSignedUrl(client, command, { expiresIn: 3600 });
    student.image = url;
    student.imageExp = new Date(new Date().getTime() + 1000 * 60 * 60);
    await student.save();
  }

  res.status(200).json({
    students: students.map((student) => student.toObject({ getters: true })),
    schoolName: students[0].busId.schoolName,
    busDriver: students[0].busId.busDriver.name,
    studentHandler: students[0].busId.studentHandler.name,
    busId: busId,
  });
};

const getStudentsByParent = async (req, res, next) => {
  const { parentId } = req.params;

  if (req.userData.role !== "admin") {
    do {
      if (req.userData.userId === parentId) break;
      return next(
        new HttpError("You are not authorized to do this operation!!!", 401)
      );
    } while (false);
  }

  let parent;

  try {
    parent = await UserModel.findById(parentId).populate("children");
  } catch (error) {
    return next(
      new HttpError(
        "Couldnt access to DB to get the students from parents",
        500
      )
    );
  }

  if (!parent) {
    return next(
      new HttpError("No parent found in relation with the students", 404)
    );
  }

  for (const child of parent.children) {
    if (child.imageExp && child.imageExp.getTime() > new Date()) {
      continue;
    }
    const { client, command } = AwsCommand("get", child.imageKey);

    const url = await getSignedUrl(client, command, { expiresIn: 3600 });
    child.image = url;
    child.imageExp = new Date(new Date().getTime() + 1000 * 60 * 60);
    await child.save();
  }

  res.status(200).json({
    students: parent.children.map((child) => child.toObject({ getters: true })),
  });
};

const createStudent = async (req, res, next) => {
  if (req.userData.role !== "admin") {
    return next(
      new HttpError("You are not authorized to do this operation!!!", 401)
    );
  }

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid inputs are being passed", 422));
  }

  const { parentId } = req.params;

  const {
    name,
    schoolName,
    age,
    bloodType,
    alergies,
    knownDiseases,
    emergencyContacts,
  } = req.body;

  const contacts = JSON.parse(emergencyContacts);
  let parent;

  try {
    parent = await UserModel.findById(parentId);
  } catch (error) {
    return next(new HttpError("Couldnt access to DB to get the parent", 500));
  }

  if (!parent) {
    return next(
      new HttpError("Couldnt find a parent with the given parent id", 404)
    );
  }

  let bus;

  try {
    bus = await BusModel.findOne({ schoolName: schoolName });
  } catch (error) {
    return next(new HttpError("Couldnt access to DB to get the bus", 500));
  }

  if (!bus) {
    return next(new HttpError("Couldnt find a bus with the given bus id", 404));
  }

  const resizedImage = await sharp(req.file.buffer)
    .resize({ width: 700, height: 700, fit: "contain" })
    .jpeg()
    .toBuffer();

  const imageName = uuidv4() + "." + req.file.originalname;

  const { client, command } = AwsCommand("put", imageName, resizedImage);

  try {
    await client.send(command);
    req.imageKey = imageName;
  } catch (error) {
    return next(
      new HttpError(
        "Something went wrong trying to upload image file to the Amazon S3",
        500
      )
    );
  }

  const newStudent = new StudentModel({
    name,
    imageKey: imageName,
    schoolName,
    age,
    bloodType,
    alergies,
    knownDiseases,
    emergencyContacts: [...contacts],
    busId: bus._id,
    parentId,
  });

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await newStudent.save({ session: sess });
    parent.children.push(newStudent);
    bus.students.push(newStudent);
    bus.capacity -= 1;
    await parent.save({ session: sess });
    await bus.save({ session: sess });
    await sess.commitTransaction();
  } catch (error) {
    console.log(error);
    return next(
      new HttpError("Something went wrong trying to create student", 500)
    );
  }

  res.status(201).json({ student: newStudent.toObject({ getters: true }) });
};

const updateStudent = async (req, res, next) => {
  const {
    name,
    schoolName,
    alergies,
    knownDiseases,
    bloodType,
    age,
    isComing,
  } = req.body;

  const { stdId } = req.params;

  let updatedStudent;

  try {
    updatedStudent = await StudentModel.findById(stdId).populate("parentId");
  } catch (error) {
    return next(
      new HttpError("Couldnt access to DB to get the student data", 500)
    );
  }

  if (!updatedStudent) {
    return next(new HttpError("Couldnt find a student with the given id", 404));
  }

  if (updatedStudent.parentId.id !== req.userData.userId) {
    do {
      if (req.userData.role === "admin") {
        break;
      }

      return next(
        new HttpError("You are not authorized to do this operation!!!", 401)
      );
    } while (false);
  }

  let newBus;
  let oldBus;

  if (schoolName !== updatedStudent.schoolName) {
    try {
      oldBus = await BusModel.findById(updatedStudent.busId);
    } catch (error) {
      return next(
        new HttpError("Couldnt access to DB to get the bus data", 500)
      );
    }

    if (!oldBus) {
      return next(new HttpError("Couldnt find a bus with the given id", 404));
    }

    try {
      newBus = await BusModel.findOne({ schoolName: schoolName });
    } catch (error) {
      return next(
        new HttpError("Couldnt access to DB to get the bus data", 500)
      );
    }

    if (!newBus) {
      return next(new HttpError("Couldnt find a bus with the given id", 404));
    }
    updatedStudent.schoolName = schoolName
      ? schoolName
      : updatedStudent.schoolName;
    updatedStudent.busId = newBus._id ? newBus._id : updatedStudent.busId;

    try {
      const sess = await mongoose.startSession();
      sess.startTransaction();
      oldBus.students.pull(updatedStudent);
      oldBus.capacity += 1;
      newBus.students.push(updatedStudent);
      newBus.capacity -= 1;
      await oldBus.save({ session: sess });
      await newBus.save({ session: sess });
      await sess.commitTransaction();
    } catch (error) {
      return next(
        new HttpError("Couldnt update bus info for the student", 500)
      );
    }
  }

  updatedStudent.name = name;
  updatedStudent.age = age;
  updatedStudent.bloodType = bloodType;
  updatedStudent.alergies = alergies;
  updatedStudent.knownDiseases = knownDiseases;
  updatedStudent.isComing =
    isComing !== updatedStudent.isComing ? isComing : updatedStudent.isComing;

  try {
    await updatedStudent.save();
  } catch (error) {
    return next(new HttpError("Couldnt update student", 500));
  }

  res.status(200).json({ student: updatedStudent.toObject({ getters: true }) });
};

const deleteStudent = async (req, res, next) => {
  if (req.userData.role !== "admin") {
    return next(
      new HttpError("You are not authorized to do this operation!!!", 401)
    );
  }

  const { stdId } = req.params;
  try {
    await removeStudent(stdId);
  } catch (error) {
    return next(new HttpError("Couldnt connect to db to delete", 500));
  }

  res.status(200).json({ message: "Deletion Successful" });
};

const onTheBusToggler = async (req, res, next) => {
  if (req.userData.role !== "employee") {
    return next(
      new HttpError("You are not authorized to do this operation!!!", 401)
    );
  }

  const studentId = req.params.stdId;
  const studentState = req.body.state;

  let student;
  try {
    student = await StudentModel.findById(studentId);
  } catch (error) {
    return next(
      new HttpError("Couldnt connect to db to update the props", 500)
    );
  }

  student.isOnTheBus = studentState;
  student.wasOnTheBus = true;
  try {
    await student.save();
  } catch (error) {
    return next(new HttpError("Couldnt update student", 500));
  }

  res.status(200).json({ message: "Presence Status updated successfuly" });
};

// const getLocation = async (req, res, next) => {
//   if (req.userData.role !== "employee") {
//     return next(new HttpError("Forbiden route !!!", 403));
//   }
//   const { stdId } = req.params;

//   let student;
//   try {
//     student = await StudentModel.findById(stdId);
//   } catch (error) {
//     return next(new HttpError("Couldnt connect to db", 500));
//   }

//   if (!student) {
//     return next(new HttpError("No students found with the given id", 404));
//   }

//   res.json({ location: student.location });
// };

const updateLocation = async (req, res, next) => {
  if (req.userData.role !== "employee") {
    return next(
      new HttpError("You are not authorized to do this operation!!!", 401)
    );
  }
  const { lat, lng } = req.body;
  const { stdId } = req.params;

  let student;
  try {
    student = await StudentModel.findById(stdId);
  } catch (error) {
    return next(new HttpError("Couldnt connect to db", 500));
  }

  if (!student) {
    return next(new HttpError("No students found with the given id", 404));
  }

  student.location.lat = lat;
  student.location.lng = lng;

  try {
    await student.save();
  } catch (error) {
    return next(new HttpError("Couldnt update student location", 500));
  }

  res.status(200).json({ message: "Location updated successfuly" });
};

exports.getAllStudents = getAllStudents;
exports.getStudentById = getStudentById;
exports.getStudentsByBus = getStudentsByBus;
exports.getStudentsByParent = getStudentsByParent;
exports.createStudent = createStudent;
exports.updateStudent = updateStudent;
exports.deleteStudent = deleteStudent;
exports.onTheBusToggler = onTheBusToggler;
//exports.getLocation = getLocation;
exports.updateLocation = updateLocation;
