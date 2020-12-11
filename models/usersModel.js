const mongoose = require('mongoose');

mongoose.Promise = require("bluebird");

const userSchema = new mongoose.Schema({
    "username": {
        type: String,
        unique: true},
    "fname": String,
    "lname": String,
    "email": {
        type: String,
        unique: true},
    "psw": String,
    "isAdmin": {
        type: Boolean,
        default: false
    },
}, {strict: false});

module.exports = mongoose.model("users", userSchema);