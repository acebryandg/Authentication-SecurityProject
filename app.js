//jshint esversion:6

require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose")


//instantiate app
const app = express();

//set templating engine
app.set('view engine', 'ejs');

//use body parser
app.use(bodyParser.urlencoded({extended: true}));

//set static files location
app.use(express.static("public"));


//use express-session
app.use(session({
    secret: 'Our little secret.',
    resave: false,
    saveUninitialized: false,
  }))

//initialize passport and initialize passport session
app.use(passport.initialize());
app.use(passport.session());


/*--------SETUP DATABASES---------------*/

//connect to mongoose db
mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true});

//create user Schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  active: Boolean
});

//set up passport local mongoose - used to hash and salt password and save to the mongo db database
userSchema.plugin(passportLocalMongoose);

//create model for user
const User = new mongoose.model("User", userSchema);

//set up passport local mongoose to create a local login strategy
passport.use(User.createStrategy());

//set up passport to serialize and deserialize our user
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



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

//mavview pag authenticated si user
app.get("/secrets", function(req, res){
    if (req.isAuthenticated()){
        res.render("secrets");
    } else{
        res.redirect("/login");
    }
});

/*--------Logout user---------------*/
app.get("/logout", function(req, res) {
    req.logout();
    res.redirect('/');
});


/*--------Register new user---------------*/

app.post("/register", function(req, res){
   
    User.register({username:req.body.username}, req.body.password, function(err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
                //hindi na res.render, kasi if logged in pa din yung session ng user, dapat mavview niya pa din yung secrets page. Before kasi, maviview mo lang yung secrets page via the register or login route, so need mo isetup yung /secrets route
            });
        }
      
      });
});

/*--------Login user---------------*/

app.post("/login", passport.authenticate("local",
{
    successRedirect: "/secrets",
    failureRedirect: "/login"
}
));








app.listen(3000, function() {
  console.log("Server started on port 3000");
});