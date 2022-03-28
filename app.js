//jshint esversion:6

require('dotenv').config()
const md5 = require('md5');
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");


//instantiate app
const app = express();

//set templating engine
app.set('view engine', 'ejs');

//use body parser
app.use(bodyParser.urlencoded({extended: true}));

//set static files location
app.use(express.static("public"));



/*--------SETUP DATABASES---------------*/

//connect to mongoose db
mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true});

//create user Schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

//create model for user
const User = new mongoose.model("User", userSchema);




/*-------- ROUTES---------------*/

app.get("/", function(req, res) {
    res.render("home.ejs");
})

app.get("/register", function(req, res) {
    res.render("register.ejs");
})

app.get("/login", function(req, res) {
    res.render("login.ejs");
})


/*--------Register new user---------------*/

app.post("/register", function(req, res){
    const email = req.body.username;
    const password = md5(req.body.password);


    User.findOne({email: email}, function(err, foundUser){
        if (!err) {
            if (foundUser){
                res.send("User already exists")
            } else {
                const newUser = new User({
                    email: email,
                    password: password
                })
                newUser.save(function(err){
                    if (!err) {
                        res.render("secrets");
                    } else {
                        console.log("Cannot create user")
                    }
                })
            }
        } else {
            console.log("Error finding user")
        } 
    })
})

/*--------Login user---------------*/

app.post("/login", function(req, res){
    User.findOne({email: req.body.username}, function(err, foundUser){
        if(!err){
            if (foundUser) {
                if (foundUser.password === md5(req.body.password)) {
                    res.render("secrets")
                } else {
                    res.send("Incorrect password")
                }
            } else {
                res.send("Account does not exist. Please create an account first");
            }
        } else {
            res.send(err);
        }
    })
})






app.listen(3000, function() {
  console.log("Server started on port 3000");
});