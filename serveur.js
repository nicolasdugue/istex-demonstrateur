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

//---------------------/timeline---------------------------------------------------
//---------------------/timeline---------------------------------------------------
//---------------------/timeline---------------------------------------------------
.get('/timeline', function(req,res){
	data_timeline=[{"articles": [[2010, 6], [2011, 10], [2012, 11], [2013, 23], [2006, 1]], "total": 51, "name": "The Journal of neuroscience : the official journal of the Society for Neuroscience"}, {"articles": [[2008, 1], [2010, 3], [2011, 4], [2012, 17], [2013, 10]], "total": 35, "name": "Nature neuroscience"}, {"articles": [[2009, 1], [2010, 2], [2011, 8], [2012, 13], [2013, 11]], "total": 35, "name": "PloS one"}, {"articles": [[2007, 1], [2009, 3], [2010, 5], [2011, 7], [2012, 9], [2013, 9]], "total": 34, "name": "Nature"}, {"articles": [[2009, 2], [2010, 3], [2011, 4], [2012, 8], [2013, 9]], "total": 26, "name": "Neuron"}, {"articles": [[2009, 2], [2010, 2], [2011, 3], [2012, 9], [2013, 7]], "total": 23, "name": "Proceedings of the National Academy of Sciences of the United States of America"}, {"articles": [[2008, 1], [2010, 5], [2011, 10], [2012, 3], [2013, 3]], "total": 22, "name": "Nature methods"}, {"articles": [[2007, 1], [2009, 1], [2010, 3], [2011, 4], [2012, 4], [2013, 8]], "total": 21, "name": "Current opinion in neurobiology"}, {"articles": [[2006, 1], [2009, 3], [2010, 4], [2011, 1], [2012, 2], [2013, 7]], "total": 18, "name": "Science (New York, N.Y.)"}, {"articles": [[2010, 2], [2011, 4], [2012, 6], [2013, 4], [2007, 1]], "total": 17, "name": "Current biology : CB"}, {"articles": [[2010, 1], [2011, 3], [2012, 8], [2013, 3]], "total": 15, "name": "Journal of neurophysiology"}, {"articles": [[2009, 1], [2012, 4], [2013, 9]], "total": 14, "name": "Frontiers in neural circuits"}, {"articles": [[2012, 1], [2013, 13]], "total": 14, "name": "Brain research"}, {"articles": [[2009, 2], [2010, 1], [2011, 2], [2013, 8]], "total": 13, "name": "Frontiers in molecular neuroscience"}, {"articles": [[2008, 1], [2010, 2], [2011, 3], [2012, 3], [2013, 4]], "total": 13, "name": "The Journal of biological chemistry"}, {"articles": [[2009, 1], [2010, 1], [2011, 8], [2012, 2]], "total": 12, "name": "Conference proceedings : ... Annual International Conference of the IEEE Engineering in Medicine and Biology Society. IEEE Engineering in Medicine and Biology Society. Conference"}, {"articles": [[2012, 12]], "total": 12, "name": "Progress in brain research"}, {"articles": [[2009, 1], [2010, 1], [2012, 4], [2013, 6]], "total": 12, "name": "Journal of neuroscience methods"}, {"articles": [[2011, 3], [2012, 5], [2013, 3]], "total": 11, "name": "Journal of visualized experiments : JoVE"}, {"articles": [[2011, 1], [2012, 2], [2013, 8]], "total": 11, "name": "Neuroscience research"}, {"articles": [[2008, 1], [2010, 2], [2011, 5], [2012, 2]], "total": 10, "name": "Cell"}, {"articles": [[2012, 10]], "total": 10, "name": "Biological psychiatry"}, {"articles": [[2009, 1], [2011, 1], [2012, 5], [2013, 1]], "total": 8, "name": "The Journal of physiology"}, {"articles": [[2010, 2], [2012, 4], [2013, 1]], "total": 7, "name": "Nature protocols"}, {"articles": [[2013, 7]], "total": 7, "name": "Behavioural brain research"}, {"articles": [[2011, 5], [2013, 1]], "total": 6, "name": "Experimental physiology"}, {"articles": [[2011, 1], [2012, 1], [2013, 4]], "total": 6, "name": "Neuropharmacology"}, {"articles": [[2011, 1], [2012, 2], [2013, 2]], "total": 5, "name": "Neuroscience"}, {"articles": [[2011, 2], [2013, 3]], "total": 5, "name": "Nature communications"}, {"articles": [[2009, 1], [2010, 1], [2011, 1], [2012, 1], [2013, 1]], "total": 5, "name": "Neurosurgery"}];
	timeline.chart(data_timeline, 600, 650, 2005, 2013, 20,res);
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