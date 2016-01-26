var logger=require('logger');
var express=require('express');

var app =express();

var database = require('db');
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

app
.use(express.cookieParser())
.use(express.bodyParser())
.use(function(req,res,next) {
	logger.info(req.url);
	next();
})

.use(function(req,res,next) {
	database.find("experiment").toArray(function(err, items) {
		if (items.length > 0)
			resultats.experiment=items[items.length - 1].periodNumber;
		else
			resultats.experiment=2;

	});
	next();
})

.get('/test', function(req,res) {
	database.findWhere("l", "bl");
})

.get('/upload', function(req,res) {
	page="upload";
	res.render('generic_ejs.ejs', {objectResult: resultats, page : page});
})
.get('/emptydb', function(req,res) {
	database.clearAll();
	page="upload";
	res.render('generic_ejs.ejs', {objectResult: resultats, page : page});
})
.get('/getCluster', function(req,res) {
	database.find("clusterDesc").toArray(function(err, items) {
		if (items !== undefined) {
			resultats.cluster=req.query.cluster.slice(-1);
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
			database.find("clusterFeatures").sort({ "FeatureWeight" : -1 }).toArray(function(err, items) {
				logger.debug("Items returned for getCluster");
				data_cluster.desc=[];
				logger.debug("Cluster : " +resultats.cluster);
				logger.debug("Period : " +resultats.period)
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
				logger.debug(data_cluster);
				res.send(data_cluster);
			});
		}
	});
})
.get('/clusterstat', function(req,res) {
	database.find("clusterDesc").sort({ "period" : 1, "cluster" : 1}).toArray(function(err, items) {
		resultats.items=items;
		page="clusterstat";
		res.render('generic_ejs.ejs', {objectResult: resultats, page : page});
	});
})
.get('/sankey', function(req,res) {
	page="sankey";
	database.find("diachrony").toArray(function(err, items) {
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
						if ("Cluster source" in node)
							clsSrc.name=node["Cluster source"];
						else
							clsSrc.name=node["Cluster Source"];
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
				where.cluster=energy.nodes[i].name.slice(-1);
				where.period=energy.nodes[i].period;
				database.findWhere("clusterFeatures", where ).sort({"FeatureWeight" : -1}).toArray(function(err, items) {
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
          database.insert("indexation", {'word' : name, 'frequency' : lineb, 'maximum_frequency' : max_freq});
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

//---------------------/clusterbarchart---------------------------------------------------
//---------------------/clusterbarchart---------------------------------------------------
//---------------------/clusterbarchart---------------------------------------------------
.get('/clusterbarchart', function(req,res){
	resultats.page='clusterbarchart';
	if (req.query.period === undefined) {
		resultats.period="1";
	}
	else {
		resultats.period=req.query.period;
	}
	if (req.query.cluster !== undefined) {
		resultats.cluster=req.query.cluster;
	}
	resultats.clusters={};
	var data_cluster=[];
	database.find("clusterFeatures").toArray(function(err, items) {
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
	database.find("clusterFeatures").sort({"FeatureWeight" : 1}).toArray(function(err, items) {
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
	database.find("diachrony").toArray(function(err, items) {
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
		timeline.chart(data_timeline, list_period, 800, data_timeline.length*100+100, max, 30,res);
	};
	if (req.query.sort === undefined)
		database.find("clusterFeatures").sort({"FeatureName" : 1, "period" : 1}).toArray(createTimeline);
	else {
		database.find("mapreduce").toArray(function(err, items) {
			//if (items.length <= 0) {
				m = function() {
					objet = Object();
					objet.FeatureName=this.FeatureName;
					objet.FeatureWeight=parseFloat(this.FeatureWeight);
					objet.Period = "P"+this.period;
		        	emit(this.FeatureName, objet);
				}
				r = function(k, v) {
					objet = Object();
					objet.v=[];
					var sum=0;
					for (i in v) {
						sum+=parseFloat(v[i].FeatureWeight);
						var period =[v[i].Period, v[i].FeatureWeight]
						objet.v.push(period);
					}
					objet.FeatureWeight=sum;
			        return objet;
			    }
				database.mapReduce("clusterFeatures", m, r);
			//}

		});
		var data_timeline=[];
		var periods={};
		var list_period=[];
		var max=-1;
		database.find("mapreduce").sort({"value.FeatureWeight" : -1}).each(function (err, item) {
			if (item == null) {
				//console.log(data_timeline);
				timeline.chart(data_timeline, list_period, 800, data_timeline.length*100+100, max, 30,res);
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

  var cursor = database.find("indexation");
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

.get('/diachronie', function(req,res){
	database.find("diachrony").toArray(function(err, items) {
		logger.debug("Items returned from database for diachrony");
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
							clustersSrc[src].addActivity((cluster["Probability of activating s knowing t"]+cluster["Probability of activating t knowing s"])/2);
							clustersSrc[src].addMatchingType(cluster["matchingType"]);
							list=[];
							for (f in kernels) {
								list.push(kernels[f]);
							}
							clustersSrc[src].addKernel(list, clustersTarget[target]);
						}
					}
					database.find("clusterDesc").toArray(function(err, items) {
						if (items !== undefined) {
							for (i in items) {
								logger.debug(items[i]);
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
						bipartite.chart(resultats, clustersSrc,clustersTarget,clustersAppeared,clustersVanished, 1200, 400,50,12, res);
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
	res.redirect('/todo');
})


.listen(8080);
