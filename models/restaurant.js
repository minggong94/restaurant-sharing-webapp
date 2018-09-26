var mongoose = require("mongoose");
 
var restaurantSchema = new mongoose.Schema({
   name: { type: String, required: true},
   price: String, 
   image: String,
   imageId: String,
   description: String,
   location: String,
   lat: Number,
   lng: Number,
   createdAt: { type: Date, default: Date.now },
   author : {
      id: {
         type: mongoose.Schema.Types.ObjectId,
         ref:"User"
      },
      username: String,
   },
   comments: [
      {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Comment"
      }
   ]
});
 
module.exports = mongoose.model("Restaurant", restaurantSchema);