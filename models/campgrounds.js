let mongoose = require("mongoose");
let review = require('../models/review');
let campgroundschema = new mongoose.Schema({
  title: String,
  price: Number,
  description: String,
  location: String,
  image: String,
  reviews: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "review",
    }
  ],
});

campgroundschema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        await review.deleteMany({
            _id: {
                $in: doc.reviews
            }
        })
    }
})

let campground = mongoose.model("Campground", campgroundschema);

module.exports = campground;
