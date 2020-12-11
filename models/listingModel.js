const mongoose = require('mongoose');

mongoose.Promise = require("bluebird");

const listingSchema = new mongoose.Schema({
    "listingName": {
        type: String,
        unique: true},
    "price": Number,
    "servicefee": Number,
    "location": String,
    "details": String,
    "host": String,
    "filename": {
        type: String,
        unique: true
    } 
});

module.exports = mongoose.model("listings", listingSchema);