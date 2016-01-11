var logger=require('logger');
var express=require('express');

var app =express();

var database = require('db');
database.populate();

//To read files
var     lazy    = require("lazy"),
        fs  = require("fs");

//Istex coded modules to draw charts
var barchart = require('barchart');
var marimekko=require('marimekko');
var embeddedCircle=require('embeddedCircle');
var timeline=require('timeline');
var bipartite=require('bipartite');

//Model used for bipartite graph
var model=require("clusters");

var d3 = require('d3'), 
jsdom = require('jsdom'),
dataviz='<div id="dataviz-container"></div>';



var resultats=Object();
to_render='generic_ejs.ejs'
page="accueil";

app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/scripts'));

app
.use(express.cookieParser())
.use(express.bodyParser())
.use(function(req,res,next) {
	logger.info(req.url);
	next();
})

.get('/upload', function(req,res) {
	page="upload";
	database.find("experiment").toArray(function(err, items) {
		if (items.length > 0)
			resultats.experiment=items[items.length - 1].periodNumber;
		else 
			resultats.experiment=2;
		res.render('generic_ejs.ejs', {objectResult: resultats, page : page});
	});
})

//---------------------/todo---------------------------------------------------
//---------------------/todo---------------------------------------------------
//---------------------/todo---------------------------------------------------
.get('/todo', function(req,res) {
	page="accueil";
	res.render('generic_ejs.ejs', {objectResult: resultats, page : page});
	/*database.find("todolist").toArray(function(err, items) {
			resultats.mongodb=items;
			res.render('todo.ejs', {objectResult: resultats, "todo" : req.body.newtodo,  layout: 'layout' });
		});	*/
})
.post('/periodNumber', function(req, res) {
	if (req.body.periodNumber != '') {
		database.insert("experiment", {'periodNumber' : req.body.periodNumber});
	}
	res.redirect('/upload');
})
.post('/uploadSclu', function(req, res) {
	name=req.files.sclu.name;
	page="upload";
	if (name.indexOf(".sclu") > -1) {
		logger.debug(req.files.sclu.name);
		logger.debug(req.files.sclu.path);
		logger.debug(req.files.sclu.type);
		logger.debug(req.files.sclu.size);
		new lazy(fs.createReadStream(req.files.sclu.path))
		.lines
		.forEach(function(line){
			line=line.toString();
		    if (line.indexOf("Cl") == -1) {
		    	tab=line.split("\t");
		    	cl=tab[0];
		    	featuresNb=tab[2];
		    	docNb=tab[7];
		    	database.insert("clusterDesc", {'cluster' : cl, 'period' : req.body.periodNumber, 'FeaturesNumber' : featuresNb, 'DocumentNumber' : docNb});
		    }
		}
		);
		resultats.upload="Upload de "+req.files.sclu.name+" réussi.";
		res.render('generic_ejs.ejs', {objectResult: resultats, page : page});
	}
	else {
		resultats.upload="Upload de "+req.files.sclu.name+" : échec. Le fichier n'a pas l'extension sclu !";
		res.render('generic_ejs.ejs', {objectResult: resultats, page : page});
	}
})
.post('/uploadDcsl', function(req, res) {
	name=req.files.dcsl.name;
	page="upload";
	if (name.indexOf(".dcsl") > -1) {
		logger.debug(req.files.dcsl.name);
		logger.debug(req.files.dcsl.path);
		clusterId=0;
		new lazy(fs.createReadStream(req.files.dcsl.path))
		.lines
		.forEach(function(line){
			if (line === undefined) {
			}
			else {
				line=line.toString();
			    if (line.indexOf("Cl") != -1) {
			    	clusterId=line.split(" ")[1];
			    }
			    else {
			    	tab=line.split(" ");
			    	if (tab.length == 2) {
				    	featureWeight=tab[0];
				    	featureName=tab[1];
				    	database.insert("clusterFeatures", {'cluster' : clusterId, 'period' : req.body.periodNumber, 'FeatureWeight' : featureWeight, 'FeatureName' : featureName});
			    	}
			    }
			}
		}
		);
		resultats.upload="Upload de "+req.files.dcsl.name+" réussi.";
		res.render('generic_ejs.ejs', {objectResult: resultats, page : page});
	}
	else {
		resultats.upload="Upload de "+req.files.dcsl.name+" : échec. Le fichier n'a pas l'extension sclu !";
		res.render('generic_ejs.ejs', {objectResult: resultats, page : page});
	}
})
.post('/uploadJson', function(req, res) {
	name=req.files.jsond.name;
	page="upload";
	if (name.indexOf(".json") > -1) {
		logger.debug(req.files.jsond.name);
		logger.debug(req.files.jsond.path);
		fs.readFile(req.files.jsond.path, function (err,data) {
			if (err) {
				logger.debug(err);
				resultats.upload="Upload de "+req.files.jsond.name+" failed : "+err;
				res.render('generic_ejs.ejs', {objectResult: resultats, page : page});
			}
			database.insert("diachrony", {'srcPeriod' : req.body.periodNumberSrc, 'targetPeriod' : req.body.periodNumberTarget, 'json' : JSON.parse(data.toString())});
		});
		resultats.upload="Upload de "+req.files.jsond.name+" réussi.";
		res.render('generic_ejs.ejs', {objectResult: resultats, page : page});
	}
	else {
		resultats.upload="Upload de "+req.files.jsond.name+" : échec. Le fichier n'a pas l'extension sclu !";
		res.render('generic_ejs.ejs', {objectResult: resultats, page : page});
	}
})
//---------------------/todoajouter---------------------------------------------------
//---------------------/todoajouter---------------------------------------------------
//---------------------/todoajouter---------------------------------------------------
.post('/todo/ajouter/', function(req, res) {
	if (req.body.newtodo != '') {
		database.insert("todolist");
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
	database.find("words").toArray(function(err, items) {
		resultats.mongodb=items;
		res.render('words.ejs', {objectResult: resultats});
	});	
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
	embeddedCircle.chart([kernel,source,target], 300,res);

})

//---------------------/timeline---------------------------------------------------
//---------------------/timeline---------------------------------------------------
//---------------------/timeline---------------------------------------------------
.get('/timeline', function(req,res){
	data_timeline=[{"frequency" : [["P1",250],["P2",300],["P3",400]], "total": 950, "name": "Caregiver"},{"frequency" : [["P1",125],["P2",100],["P3",25]], "total": 250, "name": "Nurse"},{"frequency" : [["P1",175],["P2",135],["P3",125]], "total": 435, "name": "Brain"},{"frequency" : [["P1",125],["P2",175],["P3",25]], "total": 250, "name": "Liver"},{"frequency" : [["P1",125],["P2",175],["P3",225]], "total": 250, "name": "Blood"},{"frequency" : [["P1",125],["P2",175],["P3",325]], "total": 250, "name": "Cancer"}];
	timeline.chart(data_timeline, 1000, 600, 2005, 2013, 30,res);
})

//---------------------/barchart---------------------------------------------------
//---------------------/barchart---------------------------------------------------
//---------------------/barchart---------------------------------------------------
.get('/barchart', function(req,res){
	var dataset=[{"object" : "caregiver", "frequency" :10},{"object" : "brain", "frequency" :50},{"object" : "liver", "frequency" :72},{"object" : "mice", "frequency" :12},{"object" : "nurse", "frequency" :35},{"object" : "blood", "frequency" :65},{"object" : "heart", "frequency" :28},{"object" : "disease", "frequency" :47}];
	barchart.chart(dataset,700,200,50,20,res);
})

//---------------------/diachro---------------------------------------------------
//---------------------/diachro---------------------------------------------------
//---------------------/diachro---------------------------------------------------
.get('/diachronie', function(req,res){
	var parsedJSON = require('./public/data/diachro.json');
	clustersSrc={};
	clustersTarget={};
	clustersVanished=[];
	clustersAppeared=[];
	for (i in parsedJSON) {
		cluster=parsedJSON[i];
		if ("state" in cluster) {
			if (cluster.state =="appeared") {
				target=cluster["Cluster target"];
				appeared=new model.Cluster(target);
				appeared.addStateAppeared();
				clustersAppeared.push(appeared);
			}
			else {
				src=cluster["Cluster source"];
				vanished=new model.Cluster(src);
				vanished.addStateVanished();
				clustersVanished.push(vanished);
			}
		}
		else {
			src=cluster["Cluster Source"];
			target=cluster["Cluster Target"];
			kernels=cluster["Kernel Labels"];
			if (typeof(clustersSrc[src]) == "undefined") {
				clustersSrc[src] = new model.Cluster(src);
			}
			if (typeof(clustersTarget[target]) == "undefined") {
				clustersTarget[target] = new model.Cluster(target);
			}
			clustersSrc[src].addTarget(clustersTarget[target]);
			clustersSrc[src].addActivity((cluster["Activity probability : s to t"]+cluster["Activity probability : t to s"])/2);
			list=[];
			for (f in kernels) {
				list.push(kernels[f]);
			}
			clustersSrc[src].addKernel(list, clustersTarget[target]);
		}
	}
	bipartite.chart(clustersSrc,clustersTarget,clustersAppeared,clustersVanished, 1200, 400,50,12, res);
})

//---------------------DEFAULT---------------------------------------------------
//---------------------DEFAULT---------------------------------------------------
//---------------------DEFAULT---------------------------------------------------
.use(function(req,res) {
	res.redirect('/todo');
})


.listen(8080);