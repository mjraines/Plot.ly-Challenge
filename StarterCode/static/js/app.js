// grab url using the current location
var url = window.location.href + "./samples.json";

// save values as null to check later 
var samples = null;
var metadata = null;

// otu Id to degrees 
var otuIdToDegrees = 0;


// Use the D3 library to read in `samples.json`
d3.json(url).then(function (samplesData) {
	// data
	samples = samplesData.samples;
	metadata = samplesData.metadata;
	// max otu id by iterating and updating max
	var maxId = 1;
	samples.forEach(sample => {
		var newMaxId = Math.max(sample.otu_ids);
		if (newMaxId > maxId)
			maxId = newMaxId;
	});
    
	otuIdToDegrees = 0.9 / maxId;
	// add the selection options 
	addSelectionOptions(samplesData.names);
});


 //adds the names to the list of options in the html

 function addSelectionOptions(names) {
	// select the body where we will append the options
	var body = d3.select("#selDataset");
	
	body.selectAll("option")
		// add the names data
		.data(names)
		// submit the data
		.enter()
		// append new options per data
		.append("option")
		// add attribute called value with the names element as value
		.attr("value", data => data)
		// add element's value as text
		.text(data => data);

	// options changed so the first selected is the one loaded 
	optionChanged();
}

// updates all the charts 
 function optionChanged() {
	
	var value = d3.select("#selDataset").property("value");
	// find the matching sample value if not null
	if (samples != null) {
		var length = samples.length;
		var i;
		for (i = 0; i < length; i++)
			if (value == samples[i].id) {
				updateBarChart(samples[i]);
				updateBubbleChart(samples[i]);
				break;
			}
	}
//try to find the matching metadata value if not null
if (metadata != null) {
    var length = metadata.length;
    var i;
    for (i = 0; i < length; i++)
        if (value == metadata[i].id) {
            updateGauge(metadata[i]);
            updateSelectionTable(metadata[i]);
            break;
        }
}
}

//update the selection table 
 function updateSelectionTable(metadata) {
	// grab the body
	var body = d3.select("#sample-metadata");
	// clear the prev data from view
	body.text("");
	// if metadata object is null, exit
	if (metadata == null) return;

	var text = [
		`id: ${metadata.id}`,
		`ethnicity: ${metadata.ethnicity}`,
		`gender: ${metadata.gender}`,
		`age: ${metadata.age}`,
		`location: ${metadata.location}`,
		`bbtype: ${metadata.bbtype}`,
		`wfreq: ${metadata.wfreq}`
	];
	body.append("body").html(text.join("<br>"));
}

/**
 * update the bar chart
 * @param {the sample selected by the optionChanged function} sample 
 */
 function updateBarChart(sample) {
	// clear and exit if null sample
	if (sample == null) {
		d3.select("bar").text("");
		return;
	}
	// filter the top 10 otu's
	var top10OTUsFound = sortTop10OTUsFound(sample);

	// map filtered data
	var data = [{
		x: top10OTUsFound.map(object => object.sample_values),
		y: top10OTUsFound.map(object => `OTU ${object.otu_ids} `),
		text: top10OTUsFound.map(object => object.otu_labels.split(";").join("<br>")),
		marker: {
			color: top10OTUsFound.map(object => otuIdToRgb(object.otu_ids))
		},
		type: "bar",
		orientation: "h"
	}];
	// set layout
	var layout = {
		title: "Top 10 OTUs Found",
	};
	// plot data
	Plotly.newPlot("bar", data, layout);
}

/**
 * sorts and returns the top 10 otu sample values
 * @param {otu_ids:{number},otu_labels:{string}, sample_values:{number}} sample 
 * @returns {otu_ids:{number},otu_labels:{string}, sample_values:{number}}
 */
 function sortTop10OTUsFound(sample) {
	// create the data 'bucket'
	var sorted = [];
	// create the data for each otu sample
	var length = sample.sample_values.length;
	var i;
	for (i = 0; i < length; i++)
		sorted.push({
			otu_ids: sample.otu_ids[i],
			otu_labels: sample.otu_labels[i],
			sample_values: sample.sample_values[i]
		});
	// sort sample_values data 
	sorted = sorted.sort((a, b) => b.sample_values - a.sample_values);
	// if there are more than 10 data points, remove the rest
	if (length > 10)
		sorted = sorted.slice(0, 10);
	// large to small data reverse
	sorted = sorted.reverse();
	return sorted;
}

/**
 * update the bubble chart
 * @param {the sample selected by the optionChanged function} sample 
 */
 function updateBubbleChart(sample) {
	// if the sample is null, clear and exit
	if (sample == null) {
		d3.select("bubble").text("");
		return;
	}
	// map sample data
	var data = [{
		x: sample.otu_ids,
		y: sample.sample_values,
		text: sample.otu_labels.map(object => object.split(";").join("<br>")),
		mode: 'markers',
		marker: {
			color: sample.otu_ids.map(object => otuIdToRgb(object)),
			size: sample.sample_values
		}
	}];
	// set layout
	var layout = {
		title: `All Samples for Test Subject ID No. ${sample.id}`
	};
	// plot data
	Plotly.newPlot("bubble", data, layout);
}

/**
 * converts the otu id into an rgb string value
 * @param {number} id the indec for the otu id
 * @returns {string} rgb(0-255,0-255,0-255)
 */
 function otuIdToRgb(id) {
	// convert the color from hue, saturation, and value into red, green, and blue
	var color = HSVtoRGB(id * otuIdToDegrees, 1.0, 1.0);
	// format and send off
	return `rgb(${color.r},${color.g},${color.b})`;
}

// https://stackoverflow.com/a/17243070
/**
 * converts the hsv to rgb
 * @param {number} h color hue number from 0-1 as a decimal in place of degrees
 * @param {number} s color saturation from 0-1 as a decimal
 * @param {number} v color value (lightness to darkness) number from 0-1 as a decimal 
 * @returns 
 */
function HSVtoRGB(h, s, v) {
	var r, g, b, i, f, p, q, t;
	if (arguments.length === 1) {
		s = h.s, v = h.v, h = h.h;
	}
	i = Math.floor(h * 6);
	f = h * 6 - i;
	p = v * (1 - s);
	q = v * (1 - f * s);
	t = v * (1 - (1 - f) * s);
	switch (i % 6) {
		case 0: r = v, g = t, b = p; break;
		case 1: r = q, g = v, b = p; break;
		case 2: r = p, g = v, b = t; break;
		case 3: r = p, g = q, b = v; break;
		case 4: r = t, g = p, b = v; break;
		case 5: r = v, g = p, b = q; break;
	}
	return {
		r: Math.round(r * 255),
		g: Math.round(g * 255),
		b: Math.round(b * 255)
	};
}