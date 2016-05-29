var logger=require('logger');
var express=require('express');

var app =express();

var database = require('db');
var currentDb="demo";
database.populate();

//To read files
var     lazy    = require("lazy"),
        LineByLineReader = require('line-by-line'),
        fs  = require("fs");

//Istex coded modules to draw charts
var barchart = require('barchart');
var marimekko=require('marimekko');
var embeddedCircle=require('embeddedCircle');
var timeline=require('timeline');
var bipartite=require('bipartite');
var sankey=require('sankey');

var assert = require('assert');

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

app.use(express.cookieParser());
app.use(express.session({secret: 'abrqtkkeijjkeldcfg'}))
.use(express.bodyParser())
.use(function(req,res,next) {
	logger.info(req.url);
	next();
})



.use(function(req,res,next) {
	resultats.listDb=[];
	database.findNoDb("experiment").toArray(function(err, items) {
		first=true;
		if (items !== undefined) {
			for (it in items) {
				if (first) {
					currentDb=items[it].database;
					first=false;
				}
				resultats.listDb.push(items[it].database);
			}
		}
		logger.debug(resultats.listDb);
		next();
	});
})

.use(function(req,res,next) {
	if (req.session.currentDb !== undefined)
		currentDb=req.session.currentDb;
	resultats.currentDb=currentDb;
	logger.debug("Current DB : " + currentDb);
	next();
})

.use(function(req,res,next) {
	if (req.session.nbLabel !== undefined)
		resultats.nbLabel=req.session.nbLabel;
	else {
		req.session.nbLabel=2;
	}
	next();
})



.use(function(req,res,next) {
	database.find("experiment", currentDb).toArray(function(err, items) {
		if (items.length > 0) {
			resultats.experiment=items[items.length - 1].periodNumber;
		}
		else
			resultats.experiment=2;
		next();
	});
})

.use(function(req,res,next) {
	if ((req.url.indexOf("getCluster") == -1) && (req.url.indexOf("get_graph") == -1)) {
		req.session.previousPageActuelle=req.session.previousPageSuivante;
		req.session.previousPageSuivante=req.url;
		logger.info(req.session.previousPageActuelle);
	}
	next();
})

.get('/emptycurrentdb', function(req,res) {
	where=Object();
	where.database=currentDb;
	database.clearAllWhere(where);
	var index=resultats.listDb.indexOf(currentDb);
	if(index!==-1) {
	    resultats.listDb.splice(index, 1);
	}
	if (resultats.listDb.length > 0)
		resultats.currentDb=currentDb=req.session.currentDb=resultats.listDb[0];
	else
		resultats.listDb=currentDb=req.session.currentDb=undefined;
	res.redirect('/upload');
})
.get('/emptydb', function(req,res) {
	database.clearAll();
	resultats.listDb=[];
	resultats.listDb=currentDb=req.session.currentDb=undefined;
	res.redirect('/upload');
})

.get('/currentDb', function(req,res) {
	logger.debug(req.session.previousPage);
	req.session.currentDb=req.query.db;
	if (req.session.previousPageActuelle !== undefined)
		res.redirect(req.session.previousPageActuelle);
	else
		res.redirect("/");
})



.get('/upload', function(req,res) {
	page="upload";
	res.render('generic_ejs.ejs', {objectResult: resultats, page : page});
})

.post('/addExperiment', function(req, res) {
	req.session.currentDb=req.body.expe;
	resultats.currentDb=req.body.expe;
	currentDb=resultats.currentDb;
	if (req.body.expe != '') {
		database.insert("experiment", {'periodNumber' : 3}, currentDb);
		
	}
	res.redirect('/upload');
})


.get('/getCluster', function(req,res) {
	database.find("clusterDesc", currentDb).toArray(function(err, items) {
		if (items !== undefined) {
			if (req.query.cluster.indexOf("Classe") == -1) {
				resultats.cluster=req.query.cluster.split("-")[0].substring(1);
			}
			else
				resultats.cluster=req.query.cluster.split("-")[0].slice(-1);
			resultats.period=req.query.period;
			var data_cluster=Object();
			logger.debug("Cluster : " +resultats.cluster);
			logger.debug("Period : " +resultats.period)
			for (i in items) {
				if (items[i].period == resultats.period) {
					if (items[i].cluster == resultats.cluster) {
						data_cluster.size=items[i].DocumentNumber;
						break;
					}
				}
			}
			database.find("clusterFeatures", currentDb).sort({ "FeatureWeight" : -1 }).toArray(function(err, items) {
				logger.debug("Items returned for getCluster");
				data_cluster.desc=[];
				//logger.debug("Cluster : " +resultats.cluster);
				//logger.debug("Period : " +resultats.period)
				if (items !== undefined) {
					for (i in items) {
						if (items[i].period == resultats.period) {
							if (items[i].cluster == resultats.cluster) {
								items[i].object=items[i].FeatureName;
								items[i].frequency=Math.round(parseFloat(items[i].FeatureWeight))*10;
								data_cluster.desc.push(items[i]);
							}
						}
					}
				}
				//logger.debug(data_cluster);
				res.send(data_cluster);
			});
		}
	});
})
.get('/clusterstat', function(req,res) {
	database.find("clusterDesc", currentDb).sort({ "period" : 1, "cluster" : 1}).toArray(function(err, items) {
		resultats.items=items;
		page="clusterstat";
		res.render('generic_ejs.ejs', {objectResult: resultats, page : page});
	});
})
.get('/sankey', function(req,res) {
	if (req.query.nbLabel !== undefined) {
		resultats.nbLabel=req.session.nbLabel=parseInt(req.query.nbLabel);
	}
	page="sankey";
	database.find("diachrony", currentDb).toArray(function(err, items) {
		logger.debug("Items returned from database for Sankey");
		if (items !== undefined) {
			var data=Object();
			var cpt=0;
			var energy=Object();
			energy.nodes=[];
			energy.links=[];
			var src=undefined;
			var tgt=undefined;
			where=Object();
			for (it in items) {
				var parsedJSON=items[it].json;
				var srcPeriod=items[it].srcPeriod;
				var tgtPeriod=items[it].targetPeriod;
				if (!(srcPeriod in data)) {
					data[srcPeriod]={};
				}
				if (!(tgtPeriod in data)) {
					data[tgtPeriod]={};
				}
				for (i in parsedJSON) {
					node=parsedJSON[i];
					var clsSrc=Object();
						clsSrc.sourceLinks=[];
						clsSrc.readOnly=false;
						clsSrc.targetLinks=[];
						clsSrc.period=srcPeriod;
						clsSrc.features=[];
					if (("Cluster source" in node) || ("Cluster Source" in node)) {
						if ("Cluster source" in node) {
							clsSrc.name=node["Cluster source"];
							clsSrc.label=node["name"];
						}
						else {
							clsSrc.name=node["Cluster Source"];
							clsSrc.label=node["Source Name"];
						}
					}
					var clsTgt=Object();
						clsTgt.sourceLinks=[];
						clsTgt.readOnly=false;
						clsTgt.targetLinks=[];
						clsTgt.features=[];
					//Alors il y a un kernel
					if ("Cluster Target" in node) {
						if (!(clsSrc.name in data[srcPeriod])) {
							data[srcPeriod][clsSrc.name]=cpt;
							where.cluster=clsSrc.name.slice(-1);
							energy.nodes.push(clsSrc);
							src=cpt;
							cpt++;
						}
						else {
							src=data[srcPeriod][clsSrc.name];
						}
						clsTgt.name=node["Cluster Target"];
						clsTgt.label=node["Target Name"];
						clsTgt.period=tgtPeriod;
						if (!(clsTgt.name in data[tgtPeriod])) {
							data[tgtPeriod][clsTgt.name]=cpt;
							energy.nodes.push(clsTgt);
							tgt=cpt;
							cpt++;
						}
						else {
							tgt=data[tgtPeriod][clsTgt.name];
						}

						var link = Object();
						link.source=src;
						link.target=tgt;
						link.value=(node["Probability of activating s knowing t"]+node["Probability of activating s knowing t"])/2;
						link.matchingType=node["matchingType"];
						link.kernel=[];
						for (feature in node["Kernel Labels"]) {
							link.kernel.push(node["Kernel Labels"][feature].label);
						}
						energy.links.push(link);
					}
				}
			}

			var add_features=function(i) {
				if (i > (energy.nodes.length - 1)) {
					resultats.energy=energy;
					sankey.chart(resultats,energy,1000,800,60,res);
				}
				where=Object();
				if (energy.nodes[i].name.indexOf("Classe") == -1 ) {
					where.cluster=energy.nodes[i].name.split(" ")[0].substring(1);
				}
				else {
					where.cluster=energy.nodes[i].name.slice(-1);
				}
				where.period=energy.nodes[i].period;
				database.findWhere("clusterFeatures", where, currentDb ).sort({"FeatureWeight" : -1}).toArray(function(err, items) {
					if (items !== undefined) {
						for (it in items) {
							energy.nodes[i].features.push(items[it].FeatureName);
							if (it >= (items.length - 1)) {
								add_features(i+1);
							}
						}
					}
				});

			};
			add_features(0);

		}
	});


})

.get('/graph', function(req,res) {
	page="graph";
	res.render('generic_ejs.ejs', {objectResult: resultats, page : page});
})

.get('/get_graph', function(req,res) {
	graph=Object();
	graph.nodes=[];
	graph.links=[];
	nodes={};
	nodes.features={};
	cpt=0;
	if (req.query.nbLabel !== undefined) {
		resultats.nbLabel=req.session.nbLabel=parseInt(req.query.nbLabel);
	}

	database.find("clusterFeatures", currentDb ).toArray(function(err, items) {
		if (items !== undefined) {
			for (it in items) {
				feature=items[it];
				if (!(feature.period in nodes)) {
					nodes[feature.period]={};
				}
				if (!(feature.cluster in nodes[feature.period])) {
					node=Object();
					node.cluster= feature.cluster;
					node.period=feature.period;
					graph.nodes.push(node);

					nodes[feature.period][feature.cluster]=cpt;
					cpt++;
				}
				if (!(feature.FeatureName in nodes.features)) {
					node=Object();
					node.feature= feature.FeatureName;
					node.link=1;

					graph.nodes.push(node);
					nodes["features"][feature.FeatureName]=cpt;
					cpt++;
				}
				else {
					graph.nodes[nodes["features"][feature.FeatureName]].link++;
				}

				graph.links.push({"source" : nodes[feature.period][feature.cluster], "target" : nodes["features"][feature.FeatureName], "w" : parseFloat(feature.FeatureWeight)});
			}
			res.send(graph);
		}
	});
})


//---------------------/todo---------------------------------------------------
//---------------------/todo---------------------------------------------------
//---------------------/todo---------------------------------------------------
.get('/', function(req,res) {
	page="accueil";
	res.render('generic_ejs.ejs', {objectResult: resultats, page : page});
	/*database.find("todolist").toArray(function(err, items) {
			resultats.mongodb=items;
			res.render('todo.ejs', {objectResult: resultats, "todo" : req.body.newtodo,  layout: 'layout' });
		});	*/
})
.post('/periodNumber', function(req, res) {
	if (req.body.periodNumber != '') {
		where = Object();
		where.database=currentDb;
		database.remove("experiment", where);
		database.insert("experiment", {'periodNumber' : req.body.periodNumber}, currentDb);
	}
	res.redirect('/upload');
})

.post('/uploadArff', function(req, res) {
	name=req.files.arff.name;

	page="upload";
  	var i = 0;
	if (name.indexOf(".arff") > -1) {
		logger.debug(req.files.arff.name);
		logger.debug(req.files.arff.path);
		logger.debug(req.files.arff.type);
		logger.debug(req.files.arff.size);

    var offset;
    var numbers=0;
    var names =0 ;
    path = require("path");

    //On efface les fichiers existants eventuels
    try {
      fs.unlinkSync('./map/numbers.txt');
      fs.unlinkSync('./map/names.txt');
    } catch (err) {
    	logger.debug("Error:", err)
    }

    //On cree de nouveaux fichiers intermediaires
    var fd_numbers = fs.openSync(path.join(process.cwd(), '/map/numbers.txt'), 'a')
    var fd_names = fs.openSync(path.join(process.cwd(), '/map/names.txt'), 'a')

    new lazy(fs.createReadStream(req.files.arff.path)).lines.forEach(
		function(line){
			line=line.toString();
			tab=line.split(" ");
			if (tab[0].localeCompare("@attribute")==0)
			{
			  names =1;
			}
			else {
			  names = 0;
			}
			if(numbers)
			{
			   fs.writeSync(fd_numbers, tab[0]+"\n")
			}
			else if(names){
			   fs.writeSync(fd_names, tab[1]+"\n");
			}
			if(! tab[0].localeCompare("@data")){
			  numbers=1;
			}
		}
    ).on('pipe', function() { //Une fois les fichiers créés, on les enregistre
        fs.closeSync(fd_names);
        fs.closeSync(fd_numbers);

        //Solution adaptee pour gros volumes, gestion par evenements emitter
        //--
        lnm = new LineByLineReader('./map/names.txt');
        lnb = new LineByLineReader('./map/numbers.txt');
        var table;
        var max_freq=0;
        var name;

        lnm.on('line', function (linem) {
        	// pause emitting of lines...
          name = linem.toString();

        	lnm.pause();
          lnb.resume(); //semaphore
        });

        lnb.on('line', function (lineb) {

          table = lineb.split(",");
          for (var freq in table) {
            if (parseInt(table[freq]) > max_freq)
              max_freq = parseInt(table[freq]) ;
          }
          database.insert("indexation", {'word' : name, 'frequency' : lineb, 'maximum_frequency' : max_freq}, currentDb);
          lnb.pause();
          max_freq = 0;
          lnm.resume(); //semaphore
          })

          //Solution fonctionnelle mais inadaptée pour grands volumes
        /*var lineReader = require('line-reader');

        lineReader.open('./map/numbers.txt', function(err, rnumbers) {
          lineReader.open('./map/names.txt', function(err, rnames) {
            while(rnames.hasNextLine())
            {
              if(rnumbers.hasNextLine())
              {
                rnames.nextLine(function(err, lnames) {
                  rnumbers.nextLine(function(err, lnumbers) {
                    database.insert("indexation", {'word' : lnames, 'frequency' : lnumbers});
                    });
                  });
              }
            }
            rnames.close();
            rnumbers.close();
          });*/





      });


		resultats.upload="Upload de "+req.files.arff.name+" réussi.";
		res.render('generic_ejs.ejs', {objectResult: resultats, page : page});
	}
	else {
		resultats.upload="Upload de "+req.files.arff.name+" : échec. Le fichier n'a pas l'extension arff !";
		res.render('generic_ejs.ejs', {objectResult: resultats, page : page});
	}
})

.post('/uploadSclu', function(req, res) {
	name=req.files.sclu.name;
	//page="upload#sclu";
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
		    	database.insert("clusterDesc", {'cluster' : cl, 'period' : req.body.periodNumber, 'FeaturesNumber' : featuresNb, 'DocumentNumber' : docNb}, currentDb);
		    }
		}
		);
		resultats.upload="Upload de "+req.files.sclu.name+" réussi.";
		res.redirect("upload#sclu");
	}
	else {
		resultats.upload="Upload de "+req.files.sclu.name+" : échec. Le fichier n'a pas l'extension sclu !";
		res.redirect("upload#sclu");
	}
})

.post('/uploadPelm', function(req, res) {
	name=req.files.pelm.name;
	//page="upload#sclu";
	if (name.indexOf(".pelm") > -1) {
		logger.debug(req.files.pelm.name);
		logger.debug(req.files.pelm.path);
		logger.debug(req.files.pelm.type);
		logger.debug(req.files.pelm.size);
		new lazy(fs.createReadStream(req.files.pelm.path))
		.lines
		.forEach(function(line){
			line=line.toString();
		    if (line.indexOf("labels") == -1) {
		    	tab=line.split("\t");
		    	cl=tab[1];
		    	idIstex=tab[0];
		    	title=tab[3]
		    	year=tab[2]
		    	database.insert("clusterDocs", {'cluster' : cl, 'period' : req.body.periodNumber, 'idIstex' : idIstex, 'year' : year, 'title' : title}, currentDb);
		    }
		}
		);
		resultats.upload="Upload de "+req.files.pelm.name+" réussi.";
		res.redirect("upload#pelm");
	}
	else {
		resultats.upload="Upload de "+req.files.pelm.name+" : échec. Le fichier n'a pas l'extension sclu !";
		res.redirect("upload#pelm");
	}
})

.post('/uploadDcsl', function(req, res) {
	name=req.files.dcsl.name;
	if (name.indexOf(".dcsl") > -1) {
		logger.debug(req.files.dcsl.name);
		logger.debug(req.files.dcsl.path);
		clusterId=0;
		new lazy(fs.createReadStream(req.files.dcsl.path))
		.lines
		.forEach(function(line){
			if (line !== undefined) {
				line=line.toString();
			    if (line.indexOf("Cl") != -1) {
			    	tab=line.split(" ");
			    	clusterId=tab[1];
			    }
			    else {
			    	if (line.indexOf("C") != -1) {
			    		tab=line.split(" ");
			    		clusterId=tab[0].substring(1);
			    		logger.debug(clusterId);
			    	}
			    	else {
				    	tab=line.split(" ");
				    	if (tab.length == 2) {
					    	featureWeight=tab[0];
					    	featureName=tab[1];
					    	database.insert("clusterFeatures", {'cluster' : clusterId, 'period' : req.body.periodNumber, 'FeatureWeight' : featureWeight, 'FeatureName' : featureName}, currentDb);
				    	}
			    	}
				}
			}
		});
		resultats.upload="Upload de "+req.files.dcsl.name+" réussi.";
		res.redirect("upload#dcsl");
	}
	else {
		resultats.upload="Upload de "+req.files.dcsl.name+" : échec. Le fichier n'a pas l'extension sclu !";
		res.redirect("upload#dcsl");
	}
})



.get('/istexDoc', function(req, res) {
	page="istex";
	where=Object();
	if (req.query.period !== undefined) {
		where.period=resultats.period=req.query.period;
	}
	if (req.query.cluster !== undefined) {
		where.cluster=resultats.cluster=req.query.cluster;
	}
	database.findWhere("clusterDocs",where, currentDb).sort({period : 1, cluster : 1}).toArray(function(err, items) {
		resultats.doc=items;
		res.render('generic_ejs.ejs', {objectResult: resultats, page : page});
	});
})

//---------------------/clusterbarchart---------------------------------------------------
//---------------------/clusterbarchart---------------------------------------------------
//---------------------/clusterbarchart---------------------------------------------------
.get('/clusterbarchart', function(req,res){
	resultats.page='clusterbarchart';
	where=Object();
	if (req.query.period === undefined) {
		where.period=resultats.period="1";
	}
	else {
		where.period=resultats.period=req.query.period;
	}
	if (req.query.cluster !== undefined) {
		where.cluster=resultats.cluster=req.query.cluster;
	}
	else {
		where.cluster=resultats.cluster="0";
	}
	resultats.clusters={};
	var data_cluster=[];
	database.find("clusterFeatures", currentDb).toArray(function(err, items) {
		logger.debug("Items returned from database for chart");
		if (items !== undefined) {
			for (i in items) {
				if (items[i].period == resultats.period) {
					if (!(items[i].cluster in resultats.clusters)) {
						resultats.clusters[items[i].cluster]=true;
					}
					if (!("cluster" in resultats)) {
						resultats.cluster=items[i].cluster;
					}
					if (items[i].cluster == resultats.cluster) {
						items[i].object=items[i].FeatureName;
						items[i].frequency=parseFloat(items[i].FeatureWeight).toFixed(1);
						data_cluster.push(items[i]);
					}
				}
			}
		}
		barchart.chart(resultats,data_cluster,700,200,50,30,res);
	});

})


//---------------------/marimekko---------------------------------------------------
//---------------------/marimekko---------------------------------------------------
//---------------------/marimekko---------------------------------------------------
.get('/marimekko', function(req,res){
	database.find("clusterFeatures", currentDb).sort({"FeatureWeight" : 1}).toArray(function(err, items) {
		logger.debug("Items returned from database for marimekko");
		if (items === undefined) {
		}
		else {
			var period;
			var data_marimekko=[];
			if (req.query.period === undefined) {
				period=items[0].period;
			}
			else {
				period=req.query.period;
			}
			for (i in items) {
				if (items[i].period == period)
					data_marimekko.push(items[i]);
			}
			marimekko.chart(resultats, data_marimekko, 800,800,30,res);
		}
	});

})

//---------------------/circles---------------------------------------------------
//---------------------/circles---------------------------------------------------
//---------------------/circles---------------------------------------------------
.get('/circles', function(req,res){
	database.find("diachrony", currentDb).toArray(function(err, items) {
		logger.debug("Items returned from database for diachrony");
		if (req.query.psrc === undefined || req.query.ptgt === undefined) {
			resultats.psrc="1";
			resultats.ptgt="2";
		}
		else {
			resultats.psrc=req.query.psrc;
			resultats.ptgt=req.query.ptgt;
		}
		if (items === undefined) {
		}
		else {
			for (it in items) {

				if (resultats.psrc == items[it].srcPeriod &&  resultats.ptgt == items[it].targetPeriod) {
					var parsedJSON=items[it].json;
					kernel={};
					source={};
					target={};
					resultats.matching=[];
					for (i in parsedJSON) {
						cluster=parsedJSON[i];
						if (!("state" in cluster)) {
							src=cluster["Cluster Source"];
							tgt=cluster["Cluster Target"];
							obj = Object();
							obj.src=src;
							obj.tgt=tgt;
							resultats.matching.push(obj);
							if ((req.query.src === undefined) || (req.query.tgt === undefined) || (req.query.src == src && req.query.tgt == tgt)) {
								resultats.src=src;
								resultats.tgt=tgt;
								kernels=cluster["Kernel Labels"];
								kernel.label="kernel";
								kernel.children=kernels;
								sources=cluster["Common Labels prevalent in Source"];
								source.label="Prevalent in Source";
								source.children=sources;
								targets=cluster["Common Labels prevalent in Target"];
								target.label="Prevalent in Target";
								target.children=targets;
							}
						}
					}
					embeddedCircle.chart(resultats,[kernel,source,target], 300,res);
				}
			}

		}
	});

})

//---------------------/timeline---------------------------------------------------
//---------------------/timeline---------------------------------------------------
//---------------------/timeline---------------------------------------------------
.get('/timeline', function(req,res){
	//Not supported with TingoDB, but it would be with MongoDB
	/*database.aggregate("clusterFeatures", { '_id' : 'FeatureName', 'SumWeight' : {"$sum" : 'FeatureWeight'} }).sort("{SumWeight : 1}").toArray(function(err, items) {
		if (items !== undefined) {
			for (it in items) {
				logger.debug(items[it]);
			}
		}
	});*/
	var createTimeline= function(err, items) {
		data_timeline=[];
		var periods={};
		var list_period=[];
		if (items !== undefined) {
			var name="";
			var max=-1;
			feature=undefined;
			for (it in items) {
				line=items[it];
				if (line.FeatureName != name) {
					if (feature !== undefined) {
						data_timeline.push(feature);
					}
					feature=Object();
					feature.frequency=[];
					feature.name=line.FeatureName;
					name=line.FeatureName;
					feature.total=0;
				}
				weight=parseFloat(line.FeatureWeight);
				if (weight > max) {
					max=weight;
				}
				feature.total=feature.total+weight;
				feature.frequency.push(["P"+line.period+"", weight]);	
				if (!(line.period in periods)) {
					periods[line.period]=true;
					list_period.push(line.period);
				}
			}
		}
		resultats.data_timeline=data_timeline;
		timeline.chart(resultats, list_period, 800, data_timeline.length*100+100, max, 30,res);
	};
	delete resultats.cperiod;
	delete resultats.wordsTimeLine;
	if (req.query.sort === undefined)
		database.find("clusterFeatures", currentDb).sort({"FeatureName" : 1, "period" : 1}).toArray(createTimeline);
	else {
		database.find("mapreduce", currentDb).toArray(function(err, items) {
			//if (items.length <= 0) {
				m = function() {
					valeur = Object();
					valeur.FeatureName=this.FeatureName;
					valeur.FeatureWeight=parseFloat(this.FeatureWeight);
					valeur.Period = "P"+this.period;
					if (this.database == database) {
						valeur.database=database;
		        		emit(this.FeatureName, valeur);
		        	}
				}
				r = function(k, v) {
					objet = Object();
					objet.v=[];
					var sum=0;
					for (i in v) {
						sum+=parseFloat(v[i].FeatureWeight);
						var period =[v[i].Period, v[i].FeatureWeight]
						objet.v.push(period);
						objet.database=v[i].database;
					}
					objet.FeatureWeight=sum;
			        return objet;
			    }
				database.mapReduce("clusterFeatures", m, r, {database : currentDb});
			//}

		});
		var data_timeline=[];
		var periods={};
		var list_period=[];
		var max=-1;
		database.find("mapreduce", currentDb).sort({"value.FeatureWeight" : -1}).each(function (err, item) {
			if (item == null) {
				resultats.data_timeline=data_timeline;
				timeline.chart(resultats, list_period, 800, data_timeline.length*100+100, max, 30,res);
			}
			if (item !== undefined) {
				feature=Object();
				value=item["value"];
				feature.name=item["_id"];
				if (value !== undefined) {
					if ("v" in value) {
						feature.frequency=value["v"];
					}
					else {
						if (!(value.Period in periods)) {
							periods[value.Period]=true;
							list_period.push(value.Period);
						}
						if (value.FeatureWeight > max)
							max=value.FeatureWeight;
						feature.frequency=[[value.Period, parseFloat(value.FeatureWeight)]];
					}
					data_timeline.push(feature);
				}
				

			}

		});
	
	}

	//data_timeline=[{"frequency" : [["P1",250],["P2",300],["P3",400]], "total": 950, "name": "Caregiver"},{"frequency" : [["P1",125],["P2",100],["P3",25]], "total": 250, "name": "Nurse"},{"frequency" : [["P1",175],["P2",135],["P3",125]], "total": 435, "name": "Brain"},{"frequency" : [["P1",125],["P2",175],["P3",25]], "total": 250, "name": "Liver"},{"frequency" : [["P1",125],["P2",175],["P3",225]], "total": 250, "name": "Blood"},{"frequency" : [["P1",125],["P2",175],["P3",325]], "total": 250, "name": "Cancer"}];
	//timeline.chart(data_timeline, 1000, 600, 2005, 2013, 30,res);
})

.get('/wordstime', function(req,res){
	//Not supported with TingoDB, but it would be with MongoDB
	/*database.aggregate("clusterFeatures", { '_id' : 'FeatureName', 'SumWeight' : {"$sum" : 'FeatureWeight'} }).sort("{SumWeight : 1}").toArray(function(err, items) {
		if (items !== undefined) {
			for (it in items) {
				logger.debug(items[it]);
			}
		}
	});*/
	var createTimeline2= function(err, items) {
		data_timeline=[];
		var periods={};
		var list_period=[];
		if (items !== undefined) {
			var name="";
			var max=-1;
			feature=undefined;
			for (it in items) {
				line=items[it];
				if (line.FeatureName != name) {
					if (feature !== undefined) {
						data_timeline.push(feature);
					}
					feature=Object();
					feature.frequency=[];
					feature.name=line.FeatureName;
					name=line.FeatureName;
					feature.total=0;
				}
				weight=parseFloat(line.FeatureWeight);
				if (weight > max) {
					max=weight;
				}
				feature.total=feature.total+weight;
				feature.frequency.push(["P"+line.period+"", weight]);	
				if (!(line.period in periods)) {
					periods[line.period]=true;
					list_period.push(line.period);
				}
			}
		}
		resultats.data_timeline=data_timeline;
		resultats.wordsTimeLine=true;
		resultats.cperiod=list_period[0];
		timeline.chart(resultats, list_period, 800, data_timeline.length*100+100, max, 30,res);
	};
	where=Object();
	if (req.query.period == undefined)
		where.period="1";
	else
		where.period=req.query.period;
	database.findWhere("clusterFeatures", where, currentDb).sort({"FeatureWeight" : -1}).toArray(createTimeline2);
	

	//data_timeline=[{"frequency" : [["P1",250],["P2",300],["P3",400]], "total": 950, "name": "Caregiver"},{"frequency" : [["P1",125],["P2",100],["P3",25]], "total": 250, "name": "Nurse"},{"frequency" : [["P1",175],["P2",135],["P3",125]], "total": 435, "name": "Brain"},{"frequency" : [["P1",125],["P2",175],["P3",25]], "total": 250, "name": "Liver"},{"frequency" : [["P1",125],["P2",175],["P3",225]], "total": 250, "name": "Blood"},{"frequency" : [["P1",125],["P2",175],["P3",325]], "total": 250, "name": "Cancer"}];
	//timeline.chart(data_timeline, 1000, 600, 2005, 2013, 30,res);
})

//---------------------/barchart---------------------------------------------------
//---------------------/barchart---------------------------------------------------
//---------------------/barchart---------------------------------------------------
.get('/barchart', function(req,res){
	var dataset=[{"object" : "caregiver", "frequency" :10},{"object" : "brain", "frequency" :50},{"object" : "liver", "frequency" :72},{"object" : "mice", "frequency" :12},{"object" : "nurse", "frequency" :35},{"object" : "blood", "frequency" :65},{"object" : "heart", "frequency" :28},{"object" : "disease", "frequency" :47}];
	barchart.chart(resultats, dataset,1200,200,50,20,res);
})

//---------------------/barchart_arff---------------------------------------------------
//---------------------/barchart_arff---------------------------------------------------
//---------------------/barchart_arff---------------------------------------------------
.get('/barchart_arff', function(req,res){

  var cursor = database.find("indexation", currentDb);
  var top_ten = [0,0,0,0,0,0,0,0,0,0];
  var top_names = ["","","","","","","","","",""]
  var temp_names;
  var temp_ten;
  var i = 0;
  var j=0;
  var progress=0;

  //async rend l'execution des fonctions asynchrones lineaire.
  cursor.each(function(err,item) {
          j++;
          // If the item is null then the cursor is exhausted/empty and closed
          if (item != null) {
            //console.log(item.maximum_frequency)
            temp_ten = top_ten.slice();
            temp_names = top_names.slice();
            i = 0;

            while(i < 10 & item.maximum_frequency < top_ten[i] )
            {
              i++;
            }
            if (i < 10)
            {
              top_ten[i] = item.maximum_frequency;
              top_names[i] = item.word;
              while( i < 9)
              {
                top_ten[i+1] = temp_ten[i];
                top_names[i+1] = temp_names[i];
                i++;

              }
            }
          }

        });

        //Tant que le travail n'est pas fini, on attend avec un pas de 500ms
        attente();
        function attente(){
          progress = j;
          setTimeout(function() {
          if (j!=progress)
            {
              attente(); // on recommence
          }else{
            var dataset = []
            for (el in top_ten)
            {
              dataset.push({"object" : top_names[el].toString(), "frequency" : top_ten[el]});
            }

          	//var dataset=[{"object" : "caregiver", "frequency" :10},{"object" : "brain", "frequency" :50},{"object" : "liver", "frequency" :72},{"object" : "mice", "frequency" :12},{"object" : "nurse", "frequency" :35},{"object" : "blood", "frequency" :65},{"object" : "heart", "frequency" :28},{"object" : "disease", "frequency" :47}];

            barchart.chart(resultats, dataset,800,800,50,20,res);
            }
        }, 500);
      }
      //Ici on sait que les async functions ont fini. On charge la page client



})
//---------------------/diachro---------------------------------------------------
//---------------------/diachro---------------------------------------------------
//---------------------/diachro---------------------------------------------------
.post('/uploadJson', function(req, res) {
	name=req.files.jsond.name;
	if (name.indexOf(".json") > -1) {
		logger.debug(req.files.jsond.name);
		logger.debug(req.files.jsond.path);
		fs.readFile(req.files.jsond.path, function (err,data) {
			if (err) {
				logger.debug(err);
				resultats.upload="Upload de "+req.files.jsond.name+" failed : "+err;
				res.render('generic_ejs.ejs', {objectResult: resultats, page : page});
			}
			database.insert("diachrony", {'srcPeriod' : req.body.periodNumberSrc, 'targetPeriod' : req.body.periodNumberTarget, 'json' : JSON.parse(data.toString())}, currentDb);
		});
		resultats.upload="Upload de "+req.files.jsond.name+" réussi.";
		res.redirect("upload#json");
	}
	else {
		resultats.upload="Upload de "+req.files.jsond.name+" : échec. Le fichier n'a pas l'extension sclu !";
		res.redirect("upload#json");
	}
})

.get('/diachronie', function(req,res){
	database.find("diachrony", currentDb).toArray(function(err, items) {
		logger.debug("Items returned from database for diachrony");
		resultats.labels=1;
		if (req.query.labels !== undefined) {
			resultats.labels=req.query.labels;
		}
		if (items !== undefined) {
			for (i in items) {
				if (req.query.src === undefined || req.query.tgt === undefined || (req.query.src == items[i].srcPeriod &&  req.query.tgt == items[i].targetPeriod)) {
					resultats.psrc=items[i].srcPeriod;
					resultats.ptgt=items[i].targetPeriod;
					var parsedJSON=items[i].json;
					clustersSrc={};
					clustersTarget={};
					clustersVanished=[];
					clustersAppeared=[];
					for (i in parsedJSON) {
						cluster=parsedJSON[i];
						if ("state" in cluster) {
							if (cluster.state =="appeared") {
								target=cluster["Cluster target"] + " - " + cluster["name"].replace(" ", "/");
								appeared=new model.Cluster(target);
								appeared.addStateAppeared();
								clustersAppeared.push(appeared);
							}
							else {
								src=cluster["Cluster source"]+ " - " + cluster["name"].replace(" ", "/");
								vanished=new model.Cluster(src);
								vanished.addStateVanished();
								clustersVanished.push(vanished);
							}
						}
						else {
							src=cluster["Cluster Source"] + " - " + cluster["Source Name"].replace(" ", "/");
							target=cluster["Cluster Target"]+ " - " + cluster["Target Name"].replace(" ", "/");
							kernels=cluster["Kernel Labels"];
							if (typeof(clustersSrc[src]) == "undefined") {
								clustersSrc[src] = new model.Cluster(src);
							}
							if (typeof(clustersTarget[target]) == "undefined") {
								clustersTarget[target] = new model.Cluster(target);
							}
							clustersSrc[src].addTarget(clustersTarget[target]);
							clustersSrc[src].addActivity((cluster["Probability of activating s knowing t"]+cluster["Probability of activating t knowing s"])/2);
							clustersSrc[src].addMatchingType(cluster["matchingType"]);
							list=[];
							for (f in kernels) {
								list.push(kernels[f]);
							}
							clustersSrc[src].addKernel(list, clustersTarget[target]);
						}
					}
					database.find("clusterDesc", currentDb).toArray(function(err, items) {
						if (items !== undefined) {
							for (i in items) {
								if (items[i].period == resultats.psrc) {
									for (c in clustersSrc) {
										if (clustersSrc[c].name.indexOf(items[i].cluster) > -1) {
											clustersSrc[c].addSize(items[i].DocumentNumber);
										}
									}
									for (c in clustersVanished) {
										if (clustersVanished[c].name.indexOf(items[i].cluster) > -1) {
											clustersVanished[c].addSize(items[i].DocumentNumber);
										}
									}
								}
								if (items[i].period == resultats.ptgt) {
									for (c in clustersTarget) {
										if (clustersTarget[c].name.indexOf(items[i].cluster) > -1) {
											clustersTarget[c].addSize(items[i].DocumentNumber);
										}
									}
									for (c in clustersAppeared) {
										if (clustersAppeared[c].name.indexOf(items[i].cluster) > -1) {
											clustersAppeared[c].addSize(items[i].DocumentNumber);
										}
									}
								}
							}
						}
						bipartite.chart(resultats, clustersSrc,clustersTarget,clustersAppeared,clustersVanished, 1200, 400,40,16, res);
					});
					break;
				}
			}
		}
	});
})

//---------------------DEFAULT---------------------------------------------------
//---------------------DEFAULT---------------------------------------------------
//---------------------DEFAULT---------------------------------------------------
.use(function(req,res) {
	res.redirect('/');
})


.listen(3000);
