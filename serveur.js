var Engine = require('tingodb')(),
    assert = require('assert');
var winston = require('winston');
var logger = new winston.Logger();
logger.add(winston.transports.File, { filename: 'app.log', level:'debug' });
logger.add(winston.transports.Console, { level: 'debug' });

//Relative path : should always work
var db = new Engine.Db('db', {});

var express=require('express');

var app =express();


var collection = db.collection("todolist");
var resultats=Object();

app
.use(express.cookieParser())
//.use(express.session({secret : 'todotopsecret'}))
.use(express.bodyParser())

.use(function(req,res,next) {
	logger.info(req.url);
	next();
})


.get('/todo', function(req,res) {
	collection.find({}).toArray(function(err, items) {
		resultats.mongodb=items;
		logger.debug("Mongodb : " + resultats.mongodb);
	    res.render('todo.ejs', {objectResult: resultats});

	});
})

.post('/todo/ajouter/', function(req, res) {
	if (req.body.newtodo != '') {
		collection.insert({"todo" : req.body.newtodo});
	}
	res.redirect('/todo');
})

.get('/todo/supprimer/:id', function(req,res){
	if (req.params.id !='') {
		collection.remove({"_id" : new Engine.ObjectID(req.params.id)})
	}
	res.redirect('/todo');
})

.use(function(req,res) {
	res.redirect('/todo');
})

.listen(8080);