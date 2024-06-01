const express = require("express");
const { default: mongoose } = require("mongoose");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const bcrypt = require("bcrypt");
const { requireAuth } = require("./middleware/authMiddleware.js");
const multer = require('multer')
const fs = require('fs')

// Model Imports
const User = require("./models/User.js");
const BlogPostModel = require("./models/BlogPost.js");


const secret = bcrypt.genSaltSync(10);
const jwtSecret = process.env.JWT_SECRET;
module.exports = jwtSecret

// middleware
app.use(express.json());
app.use(
  cors({
    credentials: true,
    origin: "https://depathway360.org", 
    // was localhost 
  })
);
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads')) 

//upload middleware
const uploadMiddleware = multer({dest: 'uploads/'})


// DB Conection
mongoose.connect(process.env.MONGO_URL);

app.get("/test", (req, res) => {
  res.json("Test Ok");
});

app.post("/register", requireAuth, async (req, res) => {
  const { username, password } = req.body;

  // Hashing the pwd
  const hashPwd = bcrypt.hashSync(password, secret);

  // Sending userinfo to the database

  try {
    const userDoc = await User.create({
      username,
      password: hashPwd,
    });

    res.json(hashPwd);
  } catch (err) {
    res.status(422).json(err);
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const userDoc = await User.findOne({ username }); // looks for user data with this info in the database.

  if (userDoc) {
    const passOk = bcrypt.compareSync(password, userDoc.password); // this checks if the password we pass is the same witht the one in the database

    if (passOk) {
      jwt.sign(
        { username: userDoc.username, id: userDoc._id },
        jwtSecret, 
        {},
        (err, token) => {
          if (err) throw err;
          res
            .cookie("token", token, {
              httpOnly: true,
              secure: true,
              sameSite: "None",
            })
            .json("Pass ok"); 
        }
      );
    } else {
      res.json("Password not ok ");
    }
  } else {
    res.status(422).json("Not found");
  }
});

app.post('/publish', uploadMiddleware.single('file'), async (req, res) => {

  // the code below ads an extention name to the file name so it can save  correctly then saves it in our uploads dir
  const {originalname, path} = req.file;
  const parts = originalname.split('.')
  const ext = parts[parts.length - 1]
  const newPath = path+ "." +ext;
  fs.renameSync(path, newPath);


  // Grabbing the content from the frontend 
  const {title, body} = req.body
  const blogpostDoc = await BlogPostModel.create({
    title,
    image: newPath,
    body
  })

  res.json(blogpostDoc); 
})

app.get('/publish', async(req, res) => {
  const posts = await BlogPostModel.find() 
  .sort({createdAt: -1})
  .limit(30) 
 
  res.json(posts)
})

// to update a post
app.put('/publish', uploadMiddleware.single("file"), async (req, res) => {
  let newPath = null
  if (req.file) {
    // the code below ads an extention name to the file name so it can save  correctly then saves it in our uploads dir
    const { originalname, path } = req.file;
    const parts = originalname.split(".");
    const ext = parts[parts.length - 1];
    newPath = path + "." + ext;
    fs.renameSync(path, newPath);
  }

  const {id, title, body} = req.body;

  // this finds the post with the id and updates it with the following info
  let postDoc = await BlogPostModel.findByIdAndUpdate(id, {
    title,
    body,
  });

  // postDoc.updateOne({title, body, image: newPath? newPath : postDoc.image }) 

  res.json(postDoc)

  // res.json(updatedpostDoc);  
});

app.get('/publish/:id', async (req, res) => { 
  const {id} = req.params; 
  
  const postDoc = await BlogPostModel.findById(id)
  res.json(postDoc)
})

app.post('/publish/:id', async (req, res) => {
  const {postId} = req.body;
  const postDoc = await BlogPostModel.findByIdAndDelete(postId);

  res.json("DEleted"); 
})

app.listen(4000);    
