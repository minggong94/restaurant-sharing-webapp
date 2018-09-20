//all the middleware goes here
var Restaurant = require("../models/restaurant");
var Comment    = require("../models/comment");
var middlewareObj = {};

middlewareObj.checkCampgroundOwnership = function(req, res, next){
    // Is the user logged in?
    if(req.isAuthenticated()){
        Restaurant.findById(req.params.id, function(err, foundRestaurant){
            if (err){
                req.flash("error", "The restaurant is not exit");
                res.redirect("back");
            } else {
                    // Added this block, to check if foundRestaurant exists, and if it doesn't to throw an error via connect-flash and send us back to the homepage
                    if (!foundRestaurant) {
                        req.flash("error", "Item not found.");
                        return res.redirect("back");
                    }
                    // If the upper condition is true this will break out of the middleware and prevent the code below to crash our application
                // does user own the Restaurant? 
                //req.user._id is a String
                //foundRestaurant.author.id is a Mongoose object
                if(foundRestaurant.author.id.equals(req.user._id) || req.user.isAdmin){
                    next();
                } else {
                    req.flash("error", "You are not promised to do that");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "You need to login to do that.");
        res.redirect("back");
    }
}

middlewareObj.checkCommentOwnership = function(req, res, next){
    // Is the user logged in?
    if(req.isAuthenticated()){
        Comment.findById(req.params.comment_id, function(err, foundComment){
            if (err){
                req.flash("error", "The comment is not exit");
                res.redirect("back");
            } else {
                // does user own the Restaurant? 
                //req.user._id is a String
                //foundRestaurant.author.id is a Mongoose object
                if(foundComment.author.id.equals(req.user._id) || req.user.isAdmin){
                    next();
                } else {
                    req.flash("error", "You are not promised to do that");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "You need to login to do that.");
        res.redirect("back");
    }
}

middlewareObj.isLoggedIn = function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "You need to login to do that.");
    res.redirect("/login");
}


module.exports = middlewareObj;