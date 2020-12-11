require("dotenv").config({silent: true});

var express = require("express");
var app = express();
const hbs = require('express-handlebars');
const mongoose = require('mongoose');
const indexRouter = require('./controllers/index');
var HTTP_PORT = process.env.PORT || 8080;

function onHttpStart() {
    console.log("Express http server listing on: " + HTTP_PORT);
    }


app.engine('.hbs', hbs({ extname: '.hbs'}));
app.set('view engine', '.hbs');
app.set('views', __dirname + '/views');

//Static folders
app.use(express.static("views"));
app.use(express.static("public"));

app.use('/', indexRouter);


//MONGOOSE CONNECTION
mongoose.connect(process.env.DATABASE_URL, {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true});
const db = mongoose.connection;
db.on('error', error => console.log(error));
db.once('open', () => console.log("Connected to database!"));
mongoose.set('useFindAndModify', false);



app.listen(HTTP_PORT, onHttpStart);

