var logger=require('logger');
var express=require('express');
var app =express();

var database = require('db');
database.populate();
logger.info(database.collection_list);

var barchart = require('barchart');
var marimekko=require('marimekko');
var embeddedCircle=require('embeddedCircle');

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
			logger.info(svgsrc);
			res.render('circle.ejs', {objectResult: svgsrc});
		}
	);
})

//---------------------/marimekko---------------------------------------------------
//---------------------/marimekko---------------------------------------------------
//---------------------/marimekko---------------------------------------------------
.get('/marimekko', function(req,res){
	data_marimekko=[{"market": "Auburn, AL", "segment": "Almond lovers", "value": 3840},
		{"market": "Auburn, AL", "segment": "Berry buyers", "value": 1920},
		{"market": "Auburn, AL", "segment": "Carrots-n-more", "value": 960},
		{"market": "Auburn, AL", "segment": "Delicious-n-new", "value": 400},
		{"market": "Birmingham, AL", "segment": "Almond lovers", "value": 1600},
		{"market": "Birmingham, AL", "segment": "Berry buyers", "value": 1440},
		{"market": "Birmingham, AL", "segment": "Carrots-n-more", "value": 960},
		{"market": "Birmingham, AL", "segment": "Delicious-n-new", "value": 400},
		{"market": "Gainesville, FL", "segment": "Almond lovers", "value": 640},
		{"market": "Gainesville, FL", "segment": "Berry buyers", "value": 960},
		{"market": "Gainesville, FL", "segment": "Carrots-n-more", "value": 640},
		{"market": "Gainesville, FL", "segment": "Delicious-n-new", "value": 400},
		{"market": "Durham, NC", "segment": "Almond lovers", "value": 320},
		{"market": "Durham, NC", "segment": "Berry buyers", "value": 480},
		{"market": "Durham, NC", "segment": "Carrots-n-more", "value": 640},
		{"market": "Durham, NC", "segment": "Delicious-n-new", "value": 400}
		];
	marimekko.chart(data_marimekko, 1000,500,30,res);

})

//---------------------/circles---------------------------------------------------
//---------------------/circles---------------------------------------------------
//---------------------/circles---------------------------------------------------
.get('/circles', function(req,res){
	data_circles=
		{
		 "name": "flare",
		 "children": [
		  {
		   "name": "animate",
		   "children": [
		    {"name": "Easing", "size": 17010},
		    {"name": "FunctionSequence", "size": 5842},
		    {
		     "name": "interpolate",
		     "children": [
		      {"name": "ArrayInterpolator", "size": 1983},
		      {"name": "ColorInterpolator", "size": 2047},
		      {"name": "DateInterpolator", "size": 1375},
		      {"name": "Interpolator", "size": 8746},
		      {"name": "MatrixInterpolator", "size": 2202},
		      {"name": "NumberInterpolator", "size": 1382},
		      {"name": "ObjectInterpolator", "size": 1629},
		      {"name": "PointInterpolator", "size": 1675},
		      {"name": "RectangleInterpolator", "size": 2042}
		     ]
		    },
		    {"name": "ISchedulable", "size": 1041},
		    {"name": "Parallel", "size": 5176},
		    {"name": "Pause", "size": 449},
		    {"name": "Scheduler", "size": 5593},
		    {"name": "Sequence", "size": 5534},
		    {"name": "Transition", "size": 9201},
		    {"name": "Transitioner", "size": 19975},
		    {"name": "TransitionEvent", "size": 1116},
		    {"name": "Tween", "size": 6006}
		   ]
		  },
		  {
		   "name": "data",
		   "children": [
		    {
		     "name": "converters",
		     "children": [
		      {"name": "Converters", "size": 721},
		      {"name": "DelimitedTextConverter", "size": 4294},
		      {"name": "GraphMLConverter", "size": 9800},
		      {"name": "IDataConverter", "size": 1314},
		      {"name": "JSONConverter", "size": 2220}
		     ]
		    },
		    {"name": "DataField", "size": 1759},
		    {"name": "DataSchema", "size": 2165},
		    {"name": "DataSet", "size": 586},
		    {"name": "DataSource", "size": 3331},
		    {"name": "DataTable", "size": 772},
		    {"name": "DataUtil", "size": 3322}
		   ]
		  },
		  {
		   "name": "display",
		   "children": [
		    {"name": "DirtySprite", "size": 8833},
		    {"name": "LineSprite", "size": 1732},
		    {"name": "RectSprite", "size": 3623},
		    {"name": "TextSprite", "size": 10066}
		   ]
		  }
		  ]
		};
	embeddedCircle.chart(data_circles, 600,res);

})

//---------------------/barchart---------------------------------------------------
//---------------------/barchart---------------------------------------------------
//---------------------/barchart---------------------------------------------------
.get('/barchart', function(req,res){
	var dataset=[10,20,30,12,52,17,8,3,35,42,67,8];
	barchart.chart(dataset,800,300,50,20,res);
})

//---------------------DEFAULT---------------------------------------------------
//---------------------DEFAULT---------------------------------------------------
//---------------------DEFAULT---------------------------------------------------
.use(function(req,res) {
	res.redirect('/todo');
})


.listen(8080);