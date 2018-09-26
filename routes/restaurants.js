var express = require("express");
var router = express.Router();
var Restaurant = require("../models/restaurant");
var middleware  = require("../middleware");
var NodeGeocoder = require('node-geocoder');
//Node Geocoder API Configuration 
var options = {
    provider: 'google',
    httpAdapter: 'https',
    apiKey: process.env.GEOCODER_API_KEY,
    formatter: null
};
 
var geocoder = NodeGeocoder(options);

var request = require("request");
//Multer Storge
var multer = require('multer');
var storage = multer.diskStorage({
    filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
//Multer Filter
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
//Storing Image + Filter
var upload = multer({ storage: storage, fileFilter: imageFilter});

//Cloudinary Configurqtion
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

//CREATE - add new restaurant to DB
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res){
    // get data from form and add to restaurants array
    var name = req.body.restaurant.name;
    var desc = req.body.restaurant.description;
    var price = req.body.restaurant.price;
    var author = {
        id: req.user._id,
        username: req.user.username
    }
    geocoder.geocode(req.body.location, function (err, data) {
        if (err || !data.length) {
            req.flash('error', err.message);
            return res.redirect('back');
        }
        cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
            if(err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            // add cloudinary url for the image to the restaurant object under image property
            var image = result.secure_url;
            var imageId = result.public_id;
            var lat = data[0].latitude;
            var lng = data[0].longitude;
            var location = data[0].formattedAddress;
            // eval(require("locus"));
            var newRestaurant = {name: name, image:image, imageId: imageId, description: desc, price:price, author:author, location: location, lat: lat, lng: lng};
            // Create a new restaurant and save to DB
            Restaurant.create(newRestaurant, function(err, newlyCreated){
                if(err){
                    console.log(err);
                } else {
                //redirect back to restaurants page
                    console.log(newlyCreated);
                    res.redirect("/restaurants");
                }
            });
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
    geocoder.geocode(req.body.location, function (err, data) {
        if (err || !data.length) {
            req.flash('error', err.message);
            return res.redirect('back');
        }
            var lat = data[0].latitude;
            var lng = data[0].longitude;
            var location = data[0].formattedAddress;
            
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
                restaurant.location = location;
                restaurant.lat = data[0].latitude;
                restaurant.lng = data[0].longitude;
                restaurant.save();
                // eval(require("locus"));
                req.flash("success", "Successfully updated the restaurant.");
                res.redirect("/restaurants/" + restaurant._id);
            }
        });
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