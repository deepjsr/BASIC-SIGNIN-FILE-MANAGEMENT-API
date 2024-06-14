const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const collection = require("./config");
const User = require("./config");
const multer = require("multer");
const session = require("express-session");
const cors=require('cors');
const File = require("./file");
const app = express();
const PORT = 3000;

// Convert into JSON format
app.use(express.json());

// Parse URL data
app.use(express.urlencoded({ extended: false }));

// Cors
app.use(cors());

// Use EJS as view engine
app.set("view engine", "ejs");
app.set("views", path.resolve("../src/views"));

// static file
app.use(express.static("public"));

// upload file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(`./public/uploads/`));
  },
  filename: function (req, file, cb) {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  },
});

const maxSize = 50 * 1024 * 1024; //file size is 50 mb
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype == "image/png" || file.mimetype == "image/jpeg" || file.mimetype=="image/jpg") {
      file.mimetype = cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error("Only .png,.jpeg allowed!"));
    }
  },
  limits: { fileSize: maxSize },
});

// GET routs
app.get("/", (req, res) => {
  res.render("login");
});

app.get("/users/:id", async (req, res) => {
  const _id = req.params.id;
  const userDataById = await User.findById({ _id });
  res.send(userDataById);
});

app.get("/users", async (req, res) => {
  const userData = await User.find({});
  res.send(userData);
});
app.get("/signup", (req, res) => {
  res.render("signup");
});

app.get("/admin", (req, res) => {
  res.render("signup");
});

app.get("/files", async (req, res) => {
  const allFiles = await File.find({});
  res.send(allFiles);
});
// Middleware
app.use(
  session({
    secret: "Teri34Mehman*0", // Replace with your secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }, // Set secure to true in production with HTTPS
  })
);
// Register user
app.post("/signup", async (req, res) => {
  //   const { email, password } = req.body;
  const data = { email: req.body.email, password: req.body.password };

  // Checking for existing user
  //   const exsitingUser = await User.findOne({ email: email });
  const exsitingUser = await User.findOne({ email: data.email });
  if (!exsitingUser) {
    // Hash the password using bcrypt
    const saltRounds = 10;
    const hashPassword = await bcrypt.hash(data.password, saltRounds);
    data.password = hashPassword;
    const userData = await User.insertMany(data);
    console.log(userData);
    return res.status(201).send("User created");
  } else {
    return res.send("User already existed please choose diffrent email");
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const check = await User.findOne({ email });
    console.log(check, "fromdb");
    if (!check) {
      return res.send("User cannot found");
    } else {
      // compare password
      const isPasswordMatch = await bcrypt.compare(password, check.password);
      // Save user id in session
      req.session.user_id = check._id;
      const userData = await User.findById({ _id: req.session.user_id });

      if (!isPasswordMatch) {
        res.send("Check password Or Email");
      }
      if (check.role === "ADMIN") {
        return res.render("admindashboard");
      } else {
        return res.render("userdashboard");
      }
    }
  } catch (error) {
    console.log(error);
  }
});

app.post("/files", upload.single("image"), async (req, res) => {
console.log(req.body,'files');
  const { title, description, clientName, taglines } = req.body;

  try {
    await File.create({
      title,
      description,
      clientName,
      taglines,
      uploadedBy: req.session.user_id,
      image: `/uploads/${req.file.filename}`,
    });

    return res.status(201).send("File created Successfully");
  } catch (err) {
    console.error(err);
    return res.status(500).send(err);
  }
});

// Route to fetch user by ID
app.get("/users/:id", async (req, res) => {
  try {
    const _id = req.params.id;
    const userDataById = await User.findById(_id);
    if (!userDataById) {
      return res.status(404).send("User not found");
    }

    res.send(userDataById);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred");
  }
});

// Route to change user role to admin
app.put("/users/:id/make-admin", async (req, res) => {
  try {
    const _id = req.params.id;
    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).send("User not found");
    }

    user.role = "ADMIN";
    await user.save();

    res.send(`User with ID ${_id} is now an admin`);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred");
  }
});

// Update file status
app.put("/file/:id", async (req, res) => {
  console.log(req.body, req.params.id);
  try {
    const resourceId = req.params.id;
    const updates = req.body;

    if (!["UNAPPROVED", "APPROVED", "REJECTED"].includes(updates.status)) {
      return res.status(400).send({ error: "Invalid status value" });
    }else if (updates.status === 'REJECTED' && !updates.rejectReason) {
      return res.status(400).send({ error: 'Reject reason is required when status is REJECTED' });
    }
    File.findOneAndUpdate();
    const resource = await File.findByIdAndUpdate(resourceId, updates, {
      new: true,
      runValidators: true,
    });

    if (!resource) {
      return res.status(404).send({ error: "Resource not found" });
    }

    res.send(resource);
  } catch (error) {
    res.status(500).send({ error: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
