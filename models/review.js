const { string } = require('joi');
let mongoose = require('mongoose');

let reviewschema = new mongoose.Schema({
    body : String,
    rating : Number,
});

let review = mongoose.model('review',reviewschema);
module.exports = review;