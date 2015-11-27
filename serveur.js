var Engine = require('tingodb')(),
    assert = require('assert');

//Relative path : should always work
var db = new Engine.Db('db', {});

var express=require('express');

var app =express();

var collection = db.collection("todolist");

app
.use(express.cookieParser())
//.use(express.session({secret : 'todotopsecret'}))
.use(express.bodyParser())

//Si la variable de session todolist est vide Alors on la crée
/*.use(function(req,res,next) {
	if (typeof(req.session.todolist) == 'undefined') {
		req.session.todolist=[];
	}
	console.log(req.url);
	next();
})*/



.get('/todo', function(req,res) {
	console.log("\n---------LIST--------\n");
	theValues=collection.find({}).toArray(function(err, items) {
		res.render('todo.ejs', {todolist: items});
	});
	
})

.post('/todo/ajouter/', function(req, res) {
	console.log("\n---------ADD---------\n");
	if (req.body.newtodo != '') {
		collection.insert({"todo" : req.body.newtodo});
	}
	res.redirect('/todo');
})

.get('/todo/supprimer/:id', function(req,res){
	console.log("\n---------Delete--------\n");
	console.log(req.params.id);
	if (req.params.id !='') {
		collection.remove({"_id" : new Engine.ObjectID(req.params.id)})
	}
	res.redirect('/todo');
})

.use(function(req,res) {
	console.log("\n---------UNKNOWN--------\n");
	res.redirect('/todo');
})

.listen(8080);