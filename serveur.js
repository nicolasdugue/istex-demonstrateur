var logger=require('logger');
var express=require('express');
var app =express();

var database = require('db');
database.populate();
logger.info(database.collection_list);

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

.get('/circle', function(req,res){
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

.get('/barchart', function(req,res){
	var dataset = [ 5, 10, 13, 19, 21, 25, 22, 18, 15, 13, 11, 12, 15, 20, 18, 17, 16, 18, 23, 25 ];
	jsdom.env(
		dataviz,
		function(errors, window) {
			var el = window.document.querySelector('#dataviz-container');
			width=800;
			svg = d3.select(el).append("svg")
		        .attr("width", width)
		        .attr("height", 100);
		    svg.selectAll("rect")
			   .data(dataset)
			   .enter()
			   .append("rect")
			   .attr("x", function(d, i) {
				    return i * ( width / dataset.length);
				})
			   .attr("y", 50)
			   .attr("width", width / dataset.length - 2)
			   .attr("height", function(d) {
				    return d;
				});

			svg.selectAll("text").data(dataset).enter()
				.append("text")
			    .attr("x", function(d, i) {
				    return i * ( width / dataset.length) + width / dataset.length /2;
				})
			    .attr("y", 20)
			    .style("text-anchor", "middle")
            	.style("font-size", "10px")
            	.style("font-family", "sans-serif")
            	.style("color", "black")
			    .text(function (d) {
			    	return d;
				});
			var svgsrc = window.document.querySelector('#dataviz-container').innerHTML;
			res.render('barchart.ejs', {objectResult: svgsrc});
		}
	)
})

//---------------------DEFAULT---------------------------------------------------
//---------------------DEFAULT---------------------------------------------------
//---------------------DEFAULT---------------------------------------------------
.use(function(req,res) {
	res.redirect('/todo');
})


.listen(8080);