var logger=require('logger');
var express=require('express');
var app =express();

var database = require('db');
database.populate();

var barchart = require('barchart');
var marimekko=require('marimekko');
var embeddedCircle=require('embeddedCircle');
var timeline=require('timeline');

var d3 = require('d3'), 
jsdom = require('jsdom'),
dataviz='<div id="dataviz-container"></div>';

var resultats=Object();

app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/scripts'));

app
.use(express.cookieParser())
.use(express.bodyParser())
.use(function(req,res,next) {
	logger.info(req.url);
	next();
})

//---------------------/todo---------------------------------------------------
//---------------------/todo---------------------------------------------------
//---------------------/todo---------------------------------------------------
.get('/todo', function(req,res) {
	logger.debug("/todo");
	database.find("todolist").toArray(function(err, items) {
			logger.debug(items);
			resultats.mongodb=items;
			res.render('todo.ejs', {objectResult: resultats});
		});	
})
//---------------------/todoajouter---------------------------------------------------
//---------------------/todoajouter---------------------------------------------------
//---------------------/todoajouter---------------------------------------------------
.post('/todo/ajouter/', function(req, res) {
	if (req.body.newtodo != '') {
		database.insert("todolist", {"todo" : req.body.newtodo});
	}
	res.redirect('/todo');
})
//---------------------/todo/supprimer/---------------------------------------------------
//---------------------/todo/supprimer/---------------------------------------------------
//---------------------/todo/supprimer/---------------------------------------------------
.get('/todo/supprimer/:id', function(req,res){
	if (req.params.id !='') {
		database.remove("todolist",{"_id" : new database.engine.ObjectID(req.params.id)});
	}
	res.redirect('/todo');
})
//---------------------/words---------------------------------------------------
//---------------------/words---------------------------------------------------
//---------------------/words---------------------------------------------------
.get('/words', function(req,res){
	logger.debug("/words");
	database.find("words").toArray(function(err, items) {
		logger.debug(items);
		resultats.mongodb=items;
		res.render('words.ejs', {objectResult: resultats});
	});	
})

//---------------------/simple-circle---------------------------------------------------
//---------------------/simple-circle---------------------------------------------------
//---------------------/simple-circle---------------------------------------------------
.get('/simple-circle', function(req,res){
	jsdom.env(
		dataviz,
		function(errors, window) {
		// this callback function pre-renders the dataviz inside the html document, then export result into a static file

			var el = window.document.querySelector('#dataviz-container')
				, circleId = 'a2324';  // say, this value was dynamically retrieved from some database

			// generate the dataviz
			d3.select(el)
				.append('svg:svg')
					.attr('width', 600)
					.attr('height', 300)
					.append('circle')
						.attr('cx', 300)
						.attr('cy', 150)
						.attr('r', 30)
						.attr('fill', '#26963c')
						.attr('id', circleId); // say, this value was dynamically retrieved from some database
			// save result in an html file, we could also keep it in memory, or export the interesting fragment into a database for later use
			var svgsrc = window.document.querySelector('#dataviz-container').innerHTML;
			res.render('circle.ejs', {objectResult: svgsrc});
		}
	);
})

//---------------------/marimekko---------------------------------------------------
//---------------------/marimekko---------------------------------------------------
//---------------------/marimekko---------------------------------------------------
.get('/marimekko', function(req,res){
	data_marimekko=[{"feature": "Caregivers", "cluster": "Cluster1", "value": 7.9},
		{"feature": "Mice", "cluster": "Cluster2", "value": 3.2},
		{"feature": "Brain", "cluster": "Cluster1", "value": 6.5},
		{"feature": "Rat", "cluster": "Cluster2", "value": 8},
		{"feature": "Brain", "cluster": "Cluster3", "value": 1.8},
		{"feature": "Blood", "cluster": "Cluster4", "value": 2.6},
		{"feature": "Liver", "cluster": "Cluster1", "value":4.35},
		{"feature": "Cancer", "cluster": "Cluster2", "value": 6.9},
		{"feature": "Nurse", "cluster": "Cluster3", "value": 6.1},
		{"feature": "Depression", "cluster": "Cluster4", "value": 3.152},
		{"feature": "Neuroscience", "cluster": "Cluster1", "value": 2.8},
		{"feature": "Surgery", "cluster": "Cluster2", "value": 5.72},
		{"feature": "Hospital", "cluster": "Cluster3", "value": 4.72},
		{"feature": "Life", "cluster": "Cluster4", "value": 6.28}
		];
	marimekko.chart(data_marimekko, 1000,500,30,res);

})

//---------------------/circles---------------------------------------------------
//---------------------/circles---------------------------------------------------
//---------------------/circles---------------------------------------------------
.get('/circles', function(req,res){
	kernel=
		{
		   "name": "Kernel",
		   "children": [
		    {"name": "Liver", "size": 17010},
		    {"name": "Brain", "size": 5842},
		    {"name": "ADN", "size": 1041},
		    {"name": "Sequence", "size": 5176},
		    {"name": "Blood", "size": 449},
		    {"name": "Heart", "size": 5593},
		    {"name": "Pump", "size": 5534},
		    {"name": "Neurology", "size": 9201},
		    {"name": "Surgery", "size": 19975},
		   ]
		  }
		;
	source={
		   "name": "Prevalent in source",
		   "children": [
		    {"name": "Caregivers", "size": 1759},
		    {"name": "Nurse", "size": 2165},
		    {"name": "Hospital", "size": 586},
		    {"name": "Familly", "size": 3331},
		    {"name": "Senescence", "size": 772},
		    {"name": "Woman", "size": 3322}
		   ]
		  };
	target={
		   "name": "Prevalent in target",
		   "children": [
		    {"name": "Mices", "size": 8833},
		    {"name": "Rats", "size": 1732},
		    {"name": "Meds", "size": 3623},
		    {"name": "Cell", "size": 10066}
		   ]
		  }
		  ;
	embeddedCircle.chart([kernel,source,target], 250,res);

})

//---------------------/timeline---------------------------------------------------
//---------------------/timeline---------------------------------------------------
//---------------------/timeline---------------------------------------------------
.get('/timeline', function(req,res){
	data_timeline=[{"frequency" : [["P1",250],["P2",300],["P3",400]], "total": 950, "name": "Caregiver"},{"frequency" : [["P1",125],["P2",100],["P3",25]], "total": 250, "name": "Nurse"},{"frequency" : [["P1",175],["P2",135],["P3",125]], "total": 435, "name": "Brain"},{"frequency" : [["P1",125],["P2",175],["P3",25]], "total": 250, "name": "Liver"},{"frequency" : [["P1",125],["P2",175],["P3",225]], "total": 250, "name": "Blood"},{"frequency" : [["P1",125],["P2",175],["P3",325]], "total": 250, "name": "Cancer"}];
	timeline.chart(data_timeline, 600, 650, 2005, 2013, 30,res);
})

//---------------------/barchart---------------------------------------------------
//---------------------/barchart---------------------------------------------------
//---------------------/barchart---------------------------------------------------
.get('/barchart', function(req,res){
	var dataset=[{"object" : "caregiver", "frequency" :10},{"object" : "brain", "frequency" :50},{"object" : "liver", "frequency" :72},{"object" : "mice", "frequency" :12},{"object" : "nurse", "frequency" :35},{"object" : "blood", "frequency" :65},{"object" : "heart", "frequency" :28},{"object" : "disease", "frequency" :47}];
	barchart.chart(dataset,700,300,50,20,res);
})

//---------------------DEFAULT---------------------------------------------------
//---------------------DEFAULT---------------------------------------------------
//---------------------DEFAULT---------------------------------------------------
.use(function(req,res) {
	res.redirect('/todo');
})


.listen(8080);