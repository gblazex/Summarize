//
// jsperf SUMMARIZE by @galambalazs
// 2011 (c) All rights reserved
// http://jsbin.com/jsperf-bookmarklet/latest
//
// NOTE: table should be ordered by UserAgent
//
// TODO: 
// - exclude browsers
// - priorities
// 

(function(global){

var document = global.document;
var console = global.console || {dir:function(){}, log:function(){}};
function makeArray(o){ var arr=[]; for (var i = o.length; i--;) arr[i]=o[i]; return arr; }
function byTag(tag, base){ return (base||document).getElementsByTagName(tag||'*'); }
function byId(id, doc) { return (doc||document).getElementById(id); }
function toNumber(str) {  return parseInt(str.replace(/,/g,''), 10); }
function round(num,prec) { return +num.toFixed(prec); }
function createTable(table) {
	var nrows = table.rows.length;
	var ncols = table.rows[0].cells.length;
	var cells = makeArray(byTag("td", table));
	return {
		cell: function(row, col) {
			return cells[ncols*row+col];
		},
		rows:     nrows,
		cols:     ncols,
		element:  table,
		cells:    cells
	};
}

function run() {
	// #bs-results table[0] 
	//var rows = byTag("tr", root);/// table.rows
	//var header = rows[0];
	var root = byTag("table", byId("bs-results"))[0];
	var tests = {};
	var table = createTable(root);

	// for each test
	for (var c = 1; c < table.cols - 1; c++) {
		// test name will be the identifier
		var name = table.cell(0,c).textContent;
		var test = tests[name] = {};
		var sum = 0, num = 0;
		var lastBrowser = null;
		// we iterate through the results for this test
		for (var r = 1; r < table.rows; r++) {
			// group by browser families
			var browser = table.cell(r,0).textContent.split(" ")[0];
			// new group started
			if (lastBrowser && browser !== lastBrowser) {
				// reset counters             
				sum = num = 0; 
			}
			// save the current result
			var result = toNumber(table.cell(r,c).textContent);

			if (!isNaN(result)) {
				sum += result;
				num += 1;
				test[browser] = Math.round(sum / num); 
			}
			// set last browser
			lastBrowser = browser;
		}
	}

	var totals = {};
	var browsers = [];

	// initialize total values
	for (var name in tests) { 
		totals[name] = 0; 
	}
	// get the browsers list 
	// (using last test from the loop above)
	for (var browser in tests[name]) {
		browsers.push(browser);
	}


	// now for each browser we normalize
	// results between the tests
	for (var i = 0; i < browsers.length; i++) {
		var browser = browsers[i];
		var lowest = Infinity;
		// find the lowest (op/sec)
		for (var name in tests) {
			if (tests[name][browser] < lowest) {
				lowest = tests[name][browser];
			}
		}
		// it will be the reference to the others
		for (var name in tests) {
			var test = tests[name];
			test[browser] = round(test[browser] / lowest, 3);
			totals[name] += test[browser];
		}
	}

	// calculate totals
	var lowest = Infinity;
	var highest = 0;
	// find lowest (factor)
	for (var name in totals) {
		// it will be the reference to the others
		if (totals[name] < lowest) {
			lowest = totals[name];
		}
		if (totals[name] > highest) {
			highest = totals[name];
		}	
	}

	var results = [];

	// adjust totals by factor
	for (var name in totals) {
		totals[name] = round(totals[name] / lowest, 2);
		results.push(totals[name]);
	}
	highest = round(highest / lowest, 2);

	console.dir(tests);
	console.dir(totals);

	// sort columns by results
	results = results.sort(byValue).reverse();
	sortColumns(table.element, results);


	function byValue(a,b) {return a-b;}

	function resultToName(result) {
		for (var name in totals)
			if (result === totals[name])
				return name;
	}

	function nameToIndex(name) {
		for (var i = table.cols-1; i-- > 1;)
			if (name === table.cell(0,i).textContent)
				return i;
	}	

	// sort columns by final result
	function sortColumns(table, results) {

		table.style.display = "none";

		// new index order to rearrange elements
		// add first cell (UA)
		var indexes = [0];

		// result -> name
		// name   -> index
		// index  -> elem
		for (var i = 0; i < results.length; i++) {
			var name = resultToName(results[i]);
			var index = nameToIndex(name);
			// index is +1 because 0. is UA
			indexes.push(index);
		}
		// add last cell (#tests)
		indexes.push(results.length+1);

		// insert elems to each row
		// according to the order
		var len = table.rows.length;
		for (var r = 0; r < len; r++) {
			// work on a cloned copy not to 
			// mess up with changing indexes
			var row = table.rows[r];
			var refcells = makeArray(row.cells);
			for (var i = 0; i < refcells.length; i++) {
				row.appendChild(refcells[ indexes[i] ]);
			}
		}
		// finally update dom
		table.style.display = "";
	}

	// create reference ribbon 
	var ref = document.createElement("span");///div
	ref.style.cssText = "position: relative; background-color: #444; color: white; text-align:center;" +
	                    "padding: 4px; border-radius: 20px; right: .4em; bottom: 1px; font-size: 11px;" +
	                    "min-width:24px; text-align:center; margin:5px auto 0;"; 
	           
	// add ribbons to testnames
	for (var c = 1; c < table.cols - 1; c++) {
		var cell = table.cell(0, c);
		var name = cell.textContent;
		var ribbon = ref.cloneNode(true);
		ribbon.innerHTML = totals[name];
		///cell.insertBefore(ribbon, cell.firstChild);
		cell.appendChild(ribbon);
		// highlight fastest test
		if (highest == totals[name]) {
			cell.style.backgroundColor = "#1B961D";
			cell.style.backgroundImage = "none";
			cell.style.backgroundImage = gardient("webkit", 0.8, "rgb(63,166,11)", 0, "rgb(26,128,0)");
			cell.style.backgroundImage = gardient("moz", 0.8, "rgb(63,166,11)", 0, "rgb(26,128,0)");
			cell.style.color = "white";
			//cell.style.padding = ".7em .4em";
		}
	}

}

function gardient(type, from, fcolor, to, tcolor) {
  if (type == "webkit") 
	return  "-webkit-gradient(linear,left bottom,left top, "+
			"color-stop("+from+", "+fcolor+"),color-stop("+to+", "+tcolor+")) ";
  else 
	return  "-moz-linear-gradient(center bottom, " + tcolor + ", " + fcolor + ")";  
			// fcolor + " " + (from*100) + "%, " + tcolor + " " + (to*100) + "%)";  
}

// add Summarize button to the page
var button = document.createElement("button");
button.style.cssText = "float:right";
button.innerHTML = "Summarize";
button.onclick = run;
byId("results").appendChild(button);


})(this);


/*
        0        1        2        3      ...     n
 0     UA      name1    name2    name3          #Tests
 1   browser - result - result - result - ...     x
 .
 .
 .
*/