var d3 = require('d3'), 
jsdom = require('jsdom'),
dataviz='<div id="dataviz-container"></div>';

module.exports=function(dataset, width, height,paddingTop, paddingTopLegend) {
	return {
	    chart: function() {
		    jsdom.env(
				dataviz,
				function(errors, window) {
					var el = window.document.querySelector('#dataviz-container');
					svg = d3.select(el).append("svg")
				        .attr("width", width)
				        .attr("height", height);
				    svg.selectAll("rect")
					   .data(dataset)
					   .enter()
					   .append("rect")
					   .attr("x", function(d, i) {
						    return i * ( width / dataset.length);
						})
					   .attr("y", paddingTop)
					   .attr("width", width / dataset.length - 2)
					   .attr("height", function(d) {
						    return d;
						});

					svg.selectAll("text").data(dataset).enter()
						.append("text")
					    .attr("x", function(d, i) {
						    return i * ( width / dataset.length) + width / dataset.length /2;
						})
					    .attr("y", paddingTopLegend)
					    .style("text-anchor", "middle")
		            	.style("font-size", "12px")
		            	.style("font-family", "sans-serif")
		            	.style("color", "black")
					    .text(function (d) {
					    	return d;
						});
					var svgsrc = window.document.querySelector('#dataviz-container').innerHTML;
					return svgsrc;
				}
			)
    	}
  	};	
}
