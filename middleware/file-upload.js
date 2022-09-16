const multer = require("multer");

const MIME_TYPE = {
  "image/png": "png",
  "image/jpg": "jpg",
  "image/jpeg": "jpeg",
};

const storage = multer.memoryStorage();
const fileUpload = multer({
  //limits: { fileSize: 1000000 },
  storage: storage,
  fileFilter: (req, file, cb) => {
    const isValid = !!MIME_TYPE[file.mimetype];
    let error = isValid ? null : new Error("Invalid MimeType");

    cb(error, isValid);
  },
});

module.exports = fileUpload;

// const fileUpload = multer({
//   limits: 500000,
//   storage: multer.diskStorage({
//     destination: (req, file, cb) => {
//       cb(null, "uploads/images");
//     },
//     filename: (req, file, cb) => {
//       const extension = MIME_TYPE[file.mimetype];
//       cb(
//         null,
//         file.originalname.split(".")[0] + "-" + uuid.v4() + "." + extension
//       );
//     },
//   }),
//   fileFilter: (req, file, cb) => {
//     const isValid = !!MIME_TYPE[file.mimetype];
//     let error = isValid ? null : new Error("Invalid Mime Type");
//     cb(error, isValid);
//   },
// });

// module.exports = fileUpload;
