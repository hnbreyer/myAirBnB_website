require("dotenv").config({silent: true});

var express = require("express");
var app = express();
//var path = require("path");
const settings = require("./settings");
var multer = require("multer");
const hbs = require('express-handlebars');
//var nodemailer = require("nodemailer");
//const { extname } = require("path");
const mongoose = require('mongoose');
const indexRouter = require('./controllers/index');
const signupRouter = require('./controllers/signup');
var HTTP_PORT = process.env.PORT || 8080;
//var upload = multer();

function onHttpStart() {
    console.log("Express http server listing on: " + HTTP_PORT);
    }

//email setup

app.engine('.hbs', hbs({ extname: '.hbs'}));
app.set('view engine', '.hbs');
app.set('views', __dirname + '/views');
app.use(express.static("views"));


app.use('/', indexRouter);
//app.use('/', signupRouter);


//ROUTES

mongoose.connect(process.env.DATABASE_URL, {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true});
const db = mongoose.connection;
db.on('error', error => console.log(error));
db.once('open', () => console.log("Connected to database!"));
//////////////////////



/////////////////////
app.listen(HTTP_PORT, onHttpStart);

