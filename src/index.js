const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const collection = require("./config");
const User = require("./config");
const multer = require("multer");
const session = require("express-session");
const cors = require("cors");
const File = require("./file");
const app = express();
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

// Swager UI
const swaggerUi = require("swagger-ui-express");
const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Node JS API Project for mongodb",
      version: "1.0.0",
    },
    servers: [
      {
        url: process.env.DATABASE,
      },
    ],
  },
  apis: ["index.js"],
};

const swaggerSpec = swaggerJSDoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
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
    if (
      file.mimetype == "image/png" ||
      file.mimetype == "image/jpeg" ||
      file.mimetype == "image/jpg"
    ) {
      file.mimetype = cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error("Only .png,.jpeg allowed!"));
    }
  },
  limits: { fileSize: maxSize },
});

app.get("/", (req, res) => {
  res.render("login");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

/**
 * @swagger
 * components:
 *   schemas:
 *     user:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         email:
 *           type: string
 *         password:
 *           type: string
 *         role:
 *           type: string
 *         cretedAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *            type: string
 *            format: date-time
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     userPost:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *         password:
 *           type: string
 *
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: This API is used to get all users using GET method
 *     description: This API is used to get all users using GET method
 *     responses:
 *       200:
 *         description: To GET ALL USER
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/user'
 */

app.get("/users", async (req, res) => {
  const userData = await User.find({});
  res.send(userData);
});

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: This API is used to get a user by ID using GET method
 *     description: This API is used to get a user by ID using GET method
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Numeric ID required
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: To GET USER BY ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/user'
 *
 */

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

/**
 * @swagger
 * components:
 *   schemas:
 *     files:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         clientName:
 *           type: string
 *         taglines:
 *           type: string
 *         image:
 *           type: string
 *         status:
 *           type: string
 *         rejectReason:
 *           type: string
 *         cretedBy:
 *           type: string
 *         cretedAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *            type: string
 *            format: date-time
 */

/**
 * @swagger
 * /files:
 *   get:
 *     summary: This API is used to get all files using GET method
 *     description: This API is used to get all files using GET method
 *     responses:
 *       200:
 *         description: To GET ALL FILES
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/files'
 */

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
    cookie: { secure: false }, // Set secure to true in production with HTTPS
  })
);

/**
 * @swagger
 * /signup:
 *   post:
 *     summary: This API is used to register a new user to the database by POST method
 *     description: This API is used to register a new user to the database using POST method
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/userPost'
 *     responses:
 *       200:
 *         description: added successfully
 */

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

/**
 * @swagger
 * /login:
 *   post:
 *     summary: This API is used to login a existing user to the database by POST method
 *     description: This API is used to login a exiting user to the database using POST method
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/userPost'
 *     responses:
 *       200:
 *         description: added successfully
 */

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const check = await User.findOne({ email });
    if (!check) {
      return res.status(401).send("User cannot found");
    } else {
      // compare password
      const isPasswordMatch = await bcrypt.compare(password, check.password);

      // Save user id in session
      req.session.user_id = check._id;
      const userData = await User.findById({ _id: req.session.user_id });

      if (!isPasswordMatch) {
        return res.send("Check Password Or Email");
      }
      if (check.role === "ADMIN") {
        //  return res.json({ message: userData });

        return res.render("admindashboard");
      } else {
        // res.json({ message: userData });
        return res.render("userdashboard");
      }
    }
  } catch (error) {
    console.log(error);
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     filePost:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         clientName:
 *           type: string
 *         taglines:
 *           type: string
 *
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     filePost:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         clientName:
 *           type: string
 *         taglines:
 *           type: string
 *
 */

/**
 * @swagger
 * /files:
 *   post:
 *     summary: This API is used to register a new file to the database by POST method
 *     description: This API is used to register a new file to the database using POST method
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/filePost'
 *     responses:
 *       200:
 *         description: added successfully
 */

app.post("/files", upload.single("image"), async (req, res) => {
  console.log(req.body, "files");
  const { title, description, clientName, taglines } = req.body;
  console.log(req.session.user_id, "session id");
  try {
    const newFile = await File.create({
      title,
      description,
      clientName,
      taglines,
      uploadedBy: req.session.user_id,
      image: `/uploads/${req.file.filename}`,
    });
    const fileDataById = await File.findById(newFile._id);
    return res.status(201).json({ message: fileDataById });
  } catch (err) {
    console.error(err);
    return res.status(500).send(err);
  }
});

/**
 * @swagger
 * /users/{id}/make-admin:
 *   put:
 *     summary: This API is used to update a user as Admin in the database using PUT method
 *     description: This API is used to update a user as Admin in the database using PUT method
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Numeric ID required
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/user'
 */

// Route to UPDATE user role to admin
app.put("/users/:id/make-admin", async (req, res) => {
  try {
    const _id = req.params.id;
    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).send("User not found");
    } else if (user.role == "ADMIN") {
      return res.send("Already an admin");
    }
    user.role = "ADMIN";
    await user.save();

    res.send(`User with ID ${_id} is now an admin`);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred");
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     filePut:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *         rejectReason:
 *           type: string
 *
 *
 */

/**
 * @swagger
 * /file/{id}:
 *   put:
 *     summary: This API is used to update a file's Status in the database using PUT method
 *     description: This API is used to update a file's status as an Admin in the database using PUT method
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Numeric ID required
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/filePut'
 *     responses:
 *       200:
 *         description: Updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/user'
 */

// Update file status
app.put("/file/:id", async (req, res) => {
  console.log(req.body, req.params.id);
  try {
    const resourceId = req.params.id;
    const updates = req.body;

    if (!["UNAPPROVED", "APPROVED", "REJECTED"].includes(updates.status)) {
      return res.status(400).send({ error: "Invalid status value" });
    } else if (updates.status === "REJECTED" && !updates.rejectReason) {
      return res
        .status(400)
        .send({ error: "Reject reason is required when status is REJECTED" });
    }
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

/**
 * @swagger
 * /files/{id}:
 *   delete:
 *     summary: This API is used to delete a user as an Admin in the database using DELETE method
 *     description: This API is used to delete a user as an Admin in the database using DELETE method
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Numeric ID required
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/user'
 */

// Delete request
app.delete("/files/:id", async (req, res) => {
  const file = await File.findOneAndDelete({ _id: req.params.id });
  if (file) {
    res.status(200).json({ message: "Deleted successfully" });
  } else {
    res.status(404).json({ message: "File not found" });
  }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(
    `Server running on http://localhost:` +
      `${port}` +
      `\n Read Documentation here: http://localhost:3000/api-docs`
  );
});
