var express = require("express");
var app = express();
//var path = require("path");
var multer = require("multer");
const hbs = require('express-handlebars');
//var nodemailer = require("nodemailer");
//const { extname } = require("path");

//var upload = multer();

const indexRouter = require('./controllers/index');

//email setup


var HTTP_PORT = process.env.PORT || 8080;

app.engine('.hbs', hbs({extname: '.hbs'}));
app.set('view engine', '.hbs');
app.set('views', __dirname + '/views');
app.use(express.static("views"));


app.use('/', indexRouter);
//app.use('/room_listing', indexRouter);

//ROUTES



//////////////////////
//register-user is the action of the form


/////////////////////
app.listen(HTTP_PORT);