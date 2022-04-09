//jshint esversion:6

require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose")
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')


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
    secret: process.env.SECRET,
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
  active: Boolean,
  googleId: String,
  secret: String
});


//set up passport local mongoose - used to hash and salt password and save to the mongo db database
userSchema.plugin(passportLocalMongoose);

//add findOrCreate plugin
userSchema.plugin(findOrCreate);

//create models
const User = new mongoose.model("User", userSchema);

//set up passport local mongoose to create a local login strategy
passport.use(User.createStrategy());

//set up passport to serialize and deserialize our user
passport.serializeUser(function(user, done) {
    done(null, user);
});
passport.deserializeUser(function(user, done) {
    done(null, user);
});

//set up google strategy
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    //need mo ilagay sa schema si googleId  
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


/*-------- ROUTES---------------*/

app.get("/", function(req, res) {
    res.render("home.ejs");
})

//google authentication
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets', 
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect('/secrets');
  });

app.get("/register", function(req, res) {
    res.render("register.ejs");
})

app.get("/login", function(req, res) {
    res.render("login.ejs");
})

//mavview pag authenticated si user
app.get("/secrets", function(req, res){
    User.find({"secret": {$ne: null}}, function(err,foundUsers){
      if (err){
        console.log(err);
      } else {
        if (foundUsers) {
          res.render("secrets", {usersWithSecrets: foundUsers});
        }
      }
    })
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

/*--------Submit Secret---------------*/

app.get("/submit", function(req, res){
    if (req.isAuthenticated()){
      res.render("submit");
    } else {
      res.redirect("/login");
    };
});

app.post("/submit", function(req, res){
  const submittedSecret = req.body.secret;
  
  
  User.findById(req.user._id, function(err, foundUser){
    if (err){
      console.log(err);
    } else {
      if (foundUser) {
        foundUser.secret = submittedSecret;
        foundUser.save(function(){
          res.redirect("/secrets");
        })
      }
    }
  })

});








app.listen(3000, function() {
  console.log("Server started on port 3000");
});