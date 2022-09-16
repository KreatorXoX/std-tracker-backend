const express = require("express");
const mongoose = require("mongoose");
const AwsCommand = require("./helpers/aws-hook");

const HttpError = require("./models/http-error");
const sessionRoutes = require("./routes/session-routes");
const userRoutes = require("./routes/user-routes");
const studentsRoutes = require("./routes/students-routes");
const busesRoutes = require("./routes/buses-routes");

const app = express();

//for parsing the data attached to req.body
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// app.use(
//   "/uploads/images",
//   express.static(path.join(__dirname, "uploads", "images"))
// );

//for cors settings
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, PATCH, DELETE");
  next();
});

//setting different types of api call endpoints
app.use("/api/students", studentsRoutes);
app.use("/api/users", userRoutes);
app.use("/api/buses", busesRoutes);
app.use("/api/sessions", sessionRoutes);

//for unsupported routes
app.use((req, res, next) => {
  const error = new HttpError("Could not find this route", 404);
  throw error;
});

//for errors thrown in the routes
app.use(async (error, req, res, next) => {
  if (req.file) {
    const { client, command } = AwsCommand("delete", req.imageKey);
    console.log(client);
    console.log(command);
    if (client) {
      await client.send(command);
    }

    fs.unlink(req.file.path, (err) => {
      console.log(err);
    });
  }

  if (res.headersSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occured" });
});

try {
  mongoose
    .connect(
      `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.7xrkj.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`
    )
    .then(() => {
      console.log("db connected");
      app.listen(process.env.PORT || 5000, () => {
        console.log("started listening on port 5000");
      });
    });
} catch (error) {
  console.log(error);
}
