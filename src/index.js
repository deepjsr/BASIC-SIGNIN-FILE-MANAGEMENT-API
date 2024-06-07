const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const collection = require("./config");
const User = require("./config");
const multer = require("multer");
const session = require("express-session");
const File = require("./file");

const app = express();
const PORT = 3000;

// Convert into JSON format
app.use(express.json());

// Parse URL data
app.use(express.urlencoded({ extended: false }));

// Use EJS as view engine
app.set("view engine", "ejs");
app.set("views", path.resolve("./src/views"));

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
const upload = multer({ storage: storage });

app.get("/", (req, res) => {
  res.render("login");
});

app.get("/users/:id", async (req,res)=>{
  const _id=req.params.id;
    const userDataById = await User.findById({_id});
res.send(userDataById)
});

app.get("/users", async (req,res)=>{
    const userData = await User.find({});
res.send(userData);
})
app.get("/signup", (req, res) => {
  res.render("signup");
});

app.get("/admin", (req, res) => {
  res.render("signup");
});
// Middleware
app.use(
  session({
    secret: "TeriMehman*0", // Replace with your secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set secure to true in production with HTTPS
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
  const { email, password} = req.body;
  try {
    const check = await User.findOne({ email });
    console.log(check,"fromdb");
    if (!check) {
      return res.send("User cannot found");
    } else {
      // compare password
      const isPasswordMatch = await bcrypt.compare(password, check.password);
      // Save user id in session
      req.session.user_id =check. _id;
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
    return res.status(500).send("Server Error");
  }
});

// Route to fetch user by ID
app.get("/users/:id", async (req, res) => {
    try {
      const _id = req.params.id;
      const userDataById = await User.findById(_id);
      if (!userDataById) {
        return res.status(404).send('User not found');
      }
  
      res.send(userDataById);
    } catch (error) {
      console.error(error);
      res.status(500).send('An error occurred');
    }
  });
  
  // Route to change user role to admin
  app.put("/users/:id/make-admin", async (req, res) => {
    try {
      const _id = req.params.id;
      const user = await User.findById(_id);
  console.log(user);
      if (!user) {
        return res.status(404).send('User not found');
      }
  
      user.role = 'ADMIN';
      await user.save();
  
      res.send(`User with ID ${_id} is now an admin`);
    } catch (error) {
      console.error(error);
      res.status(500).send('An error occurred');
    }
  });

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
