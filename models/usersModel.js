const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    "fname": String,
    "lname": String,
    "email": {
        "type": String,
        "unique": true},
    "psw": String,
    "role": {
        "type": String,
        "default": 'user' 
    }
});

module.exports = mongoose.model('users', userSchema);