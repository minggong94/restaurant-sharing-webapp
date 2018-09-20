var express     = require("express");
var router      = express.Router({mergeParams: true});
var Restaurant  = require("../models/restaurant");
var Comment     = require("../models/comment");
var middleware  = require("../middleware");

//Comments New
router.get("/new", middleware.isLoggedIn, function(req, res){
    // find Restaurant by id
    console.log(req.params.id);
    Restaurant.findById(req.params.id, function(err, restaurant){
        if(err){
            console.log(err);
        } else {
            req.flash("success", "Successfully added the comment.");
            res.render("comments/new", {restaurant: restaurant});
        }
    })
});

//Comments Create
router.post("/",middleware.isLoggedIn,function(req, res){
   //lookup Restaurant using ID
    Restaurant.findById(req.params.id, function(err, restaurant){
       if(err){
           console.log(err);
           res.redirect("/restaurants");
       } else {
        Comment.create(req.body.comment, function(err, comment){
           if(err){
               console.log(err);
           } else {
               //add username and id to comment
               comment.author.id = req.user._id;
               comment.author.username = req.user.username;
               //save comment
               comment.save();
               restaurant.comments.push(comment);
               restaurant.save();
               console.log(comment);
               res.redirect('/restaurants/' + restaurant._id);
           }
        });
       }
   });
});

//Edit comment
router.get("/:comment_id/edit", middleware.checkCommentOwnership,function(req,res){
    Comment.findById(req.params.comment_id, function(err, foundComment) {
        if(err){
            res.redirect("back");
        } else {
            res.render("comments/edit",{ restaurant_id : req.params.id, comment:foundComment });
        }
    });
});

//Comment Update
router.put("/:comment_id",middleware.checkCommentOwnership, function(req,res){
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updateComment){
        if(err){
            res.redirect("back");
        } else {
            req.flash("success", "Successfully updated the comment.");
            res.redirect("/restaurants/"+req.params.id);
        }
    });
});

// Comment Delete
router.delete("/:comment_id",middleware.checkCommentOwnership,  function(req,res){
    Comment.findByIdAndRemove(req.params.comment_id, function(err){
        if(err){
            res.redirect("back");
        } else {
            req.flash("success", "Successfully deleted the comment.");
            res.redirect("/restaurants/"+ req.params.id);
        }
    });
});

module.exports = router;