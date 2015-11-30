var express=require('express');
var app =express();


var d3 = require('d3'), 
jsdom = require('jsdom'),
dataviz='<div id="dataviz-container"></div>';

var resultats=Object();

app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/scripts'));

app
.use(express.cookieParser())
.use(express.bodyParser())

//---------------------/todo---------------------------------------------------
//---------------------/todo---------------------------------------------------
//---------------------/todo---------------------------------------------------
.get('/marimekko', function(req,res) {
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

	jsdom.env(
		dataviz,
		function(errors, window) {
			var width = 960,
			    height = 500,
			    margin = 30;

			var x = d3.scale.linear()
			    .range([0, width - 3 * margin]);

			var y = d3.scale.linear()
			    .range([0, height - 2 * margin]);

			var z = d3.scale.category10();

			var n = d3.format(",d"),
			    p = d3.format("%");
			var el = window.document.querySelector('#dataviz-container');

			var svg = d3.select(el).append("svg")
			    .attr("width", width)
			    .attr("height", height)
			  .append("g")
			    .attr("transform", "translate(" + 2 * margin + "," + margin + ")");

			data=data_marimekko;

			var offset = 0;

			// Nest values by segment. We assume each segment+market is unique.
			var segments = d3.nest()
			  .key(function(d) { return d.segment; })
			  .entries(data);

			// Compute the total sum, the per-segment sum, and the per-market offset.
			// You can use reduce rather than reduceRight to reverse the ordering.
			// We also record a reference to the parent segment for each market.
			var sum = segments.reduce(function(v, p) {
			return (p.offset = v) + (p.sum = p.values.reduceRight(function(v, d) {
			  d.parent = p;
			  return (d.offset = v) + d.value;
			}, 0));
			}, 0);

			// Add x-axis ticks.
			var xtick = svg.selectAll(".x") // .x can be replaced by blbl, it doesn't matter because no ".x" nodes exist
			  .data(x.ticks(10)) //Number of ticks, 
			.enter().append("g") // enter allows to create nodes "g" for each data 
			  .attr("class", "x") // nodes g will be of class x
			  .attr("transform", function(d) { return "translate(" + x(d) + "," + y(1) + ")"; }); //y(1) ?

			//Tick lines
			xtick.append("line")
			  .attr("y2", 5)
			  .style("stroke", "#000");

			xtick.append("text")
			  .attr("y", 8)
			  .attr("text-anchor", "middle")
			  .attr("dy", ".71em")
			  .attr("font-size", "14px")
			  .text(p);

			// Add y-axis ticks.
			var ytick = svg.selectAll(".y")
			  .data(y.ticks(10))
			.enter().append("g")
			  .attr("class", "y")
			  .attr("transform", function(d) { return "translate(0," + y(1 - d) + ")"; });

			ytick.append("line")
			  .attr("x1", -5)
			  .style("stroke", "#000");

			ytick.append("text")
			  .attr("x", -8)
			  .attr("text-anchor", "end")
			  .attr("dy", ".35em")
			  .attr("font-size", "14px")
			  .text(p);

			// Add a group for each segment.
			var segments = svg.selectAll(".segment")
			  .data(segments)
			.enter().append("g")
			  .attr("class", "segment")
			  .attr("xlink:title", function(d) { return d.key; })
			  .attr("transform", function(d) { return "translate(" + x(d.offset / sum) + ")"; });

			// Add a rect for each market.
			var markets = segments.selectAll(".market")
			  .data(function(d) { return d.values; })
			.enter().append("g").attr("class", "segment-desc")
			//.append("a")
			//  .attr("class", "market")
			//  .attr("xlink:title", function(d) { return d.market + " " + d.parent.key + ": " + n(d.value); });

		    

		    markets.append("rect")
		      .attr("y", function(d) { return y(d.offset / d.parent.sum); })
		      .attr("height", function(d) { return y(d.value / d.parent.sum); })
		      .attr("width", function(d) { return x(d.parent.sum / sum); })
		      .style("fill", function(d) { return z(d.market)+";stroke-width:1px;stroke:rgb(0,0,0);fill-opacity: 0.3;" });

		    segments.selectAll(".segment-desc").append("text").attr("class", "text-desc")
		    	//.attr("font-size", "12px")
		    	.attr("y", function(d) { console.log(d); return y(d.offset / d.parent.sum) + 20; })
		    	.attr("x", function(d) { return d.parent.sum / sum + 10; })
		    	.text(function(d) { return d.market +  ": " + n(d.value); });


		var svgsrc = window.document.querySelector('#dataviz-container').innerHTML;
		res.render('marmiekko.ejs', {objectResult: svgsrc});
	}
	);
})

//---------------------DEFAULT---------------------------------------------------
//---------------------DEFAULT---------------------------------------------------
//---------------------DEFAULT---------------------------------------------------
.use(function(req,res) {
	res.redirect('/marimekko');
})


.listen(8080);