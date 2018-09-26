require('dotenv').config();
var express         = require("express"),
    app             = express(),
    bodyParser      = require("body-parser"),
    mongoose        = require("mongoose"),
    flash           = require("connect-flash"),
    passport        = require("passport"),
    LocalStrategy   = require("passport-local"),
    methodOverride  = require("method-override"),
    Restaurant      = require("./models/restaurant"),
    Comment         = require("./models/comment"),
    User            = require("./models/user");
//    seedDB          = require("./seeds");

//requiring routes   
var commentRoutes     = require("./routes/comments"),
    restaurantRoutes  = require("./routes/restaurants"),
    indexRoutes       = require("./routes/index");
    
//console.log(process.env.DATABASEURL);
mongoose.connect(process.env.DATABASEURL);
//mongoose.connect('mongodb://rest:yelprest1@ds113853.mlab.com:13853/yelprest');
//mongodb://rest:yelprest1@ds113853.mlab.com:13853/yelprest
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine","ejs");
app.use(express.static(__dirname+ "/public"));
app.use(methodOverride("_method"));
app.use(flash());
app.locals.moment = require('moment');
//seedDB();


// Passport Configuration
app.use(require("express-session")({
    secret:"This is a secret.",
    resave:false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

app.use("/", indexRoutes);
app.use("/restaurants", restaurantRoutes);
app.use("/restaurants/:id/comments",commentRoutes);

app.listen(process.env.PORT, process.env.IP, function(){
    console.log("The YelpRestaurant Server Has Started!");    
});