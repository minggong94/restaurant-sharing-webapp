var express = require("express");
var router = express.Router();
var Restaurant = require("../models/restaurant");
var middleware  = require("../middleware");
var request = require("request");
var multer = require('multer');
var storage = multer.diskStorage({
    filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({
    cloud_name: 'minggong4va', 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

//INDEX - show all restaurants
router.get("/", function(req, res){
    var noMatch = '';
    if(req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        Restaurant.find({name: regex}, function(err, allRestaurants){
            if(err){
                console.log(err);
            } else {
                if(allRestaurants.length < 1) {
                    noMatch = "No Results, Please Try Again.";
                }
                res.render("restaurants/index", {restaurants: allRestaurants, noMatch: noMatch});
            }
        });
    } else {
        Restaurant.find({}, function(err, allRestaurants){
            if(err){
                console.log(err);
            } else {
                res.render("restaurants/index", {restaurants: allRestaurants, noMatch:noMatch, page:'restaurants'});
            }
        });
    }
});


//Create - add new restaurant to DB
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res) {
    cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
        if(err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
    // add cloudinary url for the image to the restaurant object under image property
        req.body.restaurant.image = result.secure_url;
        req.body.restaurant.imageId = result.public_id;
    // add author to restaurant
        req.body.restaurant.author = {
            id: req.user._id,
            username: req.user.username,
        }
        Restaurant.create(req.body.restaurant, function(err, restaurant) {
            if (err) {
                req.flash('error', err.message);
                return res.redirect('back');
            }
            res.redirect('/restaurants/' + restaurant.id);
        });
    });
});

// New - show form to create new restaurant
router.get("/new", middleware.isLoggedIn, function(req,res){
    res.render("restaurants/new");
});

// Show - shows more info about one restaurant
router.get("/:id",function(req, res) {
    //find the restaurant with provided ID
    //render show template with that restaurant
    Restaurant.findById(req.params.id).populate("comments").exec(function(err, foundRestaurant){
        if(err){
            console.log(err);
        } else {
            console.log(foundRestaurant);
            res.render("restaurants/show", {restaurant:foundRestaurant});
        }
    });
});

// EDIT restaurant route
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res) {
    Restaurant.findById(req.params.id, function(err, foundRestaurant) {
        if(err) {
            console.log(err);
        } else {
            res.render("restaurants/edit", {restaurant:foundRestaurant});
        }
    });
});


//UPDATE restaurants route
router.put("/:id", middleware.checkCampgroundOwnership, upload.single('image'), function(req, res) {
    Restaurant.findById (req.params.id, async function(err, restaurant){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            if(req.file){
                try {
                    await cloudinary.v2.uploader.destroy(restaurant.imageId);
                    var result = await cloudinary.v2.uploader.upload(req.file.path);
                    restaurant.imageId = result.public_id;
                    restaurant.image = result.secure_url;
                } catch (err){
                    req.flash("error", err.massage);
                    return res.redirect("back");
                }
            }
            restaurant.name = req.body.restaurant.name;
            restaurant.description = req.body.restaurant.description;
            restaurant.price = req.body.restaurant.price;
            restaurant.save();
            // eval(require("locus"));
            req.flash("success", "Successfully updated the restaurant.");
            res.redirect("/restaurants/" + restaurant._id);
        }
    });
});

//DESTORY campground route
router.delete("/:id", middleware.checkCampgroundOwnership, function(req,res){
    Restaurant.findById(req.params.id, async function(err,restaurant){
        if(err){
            req.flash("error", err.message);
            return res.redirect("back");
        }
        try{
            await cloudinary.v2.uploader.destroy(restaurant.imageId);
            restaurant.remove();
            req.flash("success", "Successfully deleted the restaurant.");
            res.redirect("/restaurants");
        } catch (err) {
            if(err){
                req.flash("error", err.message);
                return res.redirect("back");
            }
        }
    });
});

// Define escapeRegex function for search feature
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}


module.exports = router;