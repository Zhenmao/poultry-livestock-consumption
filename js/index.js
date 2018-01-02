/* jshint esversion: 6 */

(function(){
	///////////////////////////////////////////////////////////////////
	//// Inital Set Up ////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////
	// Global variables
	const width = 665;
	const height = 400;
	const margin = {top: 10, right: 10, bottom: 20, left: 45};

	const ids = ["chicken", "beef", "pork"];

	let flag = true; // true: consumption, false: percentage change

	let data, years, consumptionExtent, percentChangeExtent, pathLines, yAxisG;

	const line = d3.line();

	///////////////////////////////////////////////////////////////////
	// Scales
	const x = d3.scaleLinear()
			.range([0, width]);

	const y = d3.scaleLinear()
			.range([height, 0]);

	const color = d3.scaleOrdinal()
			.domain(ids)
			.range(["#B5CF6B", "#E7BA52", "#D6616B"]);

	///////////////////////////////////////////////////////////////////
	// SVG containers
	const g = d3.select("#chart")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
		.append("g")
			.attr("transform", `translate(${margin.left}, ${margin.top})`);

	const lineChart = g.append("g")
			.attr("class", "line-chart");

	///////////////////////////////////////////////////////////////////
	//// Tooltip //////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////
	const overlay = g.append("g")
			.attr("class", "overlay");

	// Rect to capture mouse movement for tooltip
	overlay.append("rect")
			.attr("width", width)
			.attr("height", height)
			.style("fill", "none")
			.style("pointer-events", "all")
			.on("mouseenter", showTooltip)
			.on("mousemove", moveTooltip)
			.on("mouseleave", hideTooltip);

	const tooltip = overlay.append("g")
			.style("opacity", 0);

	tooltip.selectAll(".circle")
			.data(ids)
			.enter()
				.append("circle")
					.attr("class", "circle")
					.attr("r", 5)
					.style("stroke", d => color(d))
					.style("stroke-width", 2)
					.style("fill", "none")
					.style("pointer-events", "none");

	///////////////////////////////////////////////////////////////////
	//// Data Processing //////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////
	d3.csv("data/poultry_livestock_consumption.csv", (row) => ({
		year: +row.Year,
		chicken: +row.Chicken,
		beef: +row.Beef,
		pork: +row.Pork,
		chickenPercentChange: +row.Chicken_Percent_Change,
		beefPercentChange: +row.Beef_Percent_Change,
		porkPercentChange: +row.Pork_Percent_Change
	}), (error, rawData) => {
		if (error) throw error;

		years = rawData.map(d => d.year);

		data = ids
			.map(id => ({
				id: id,
				values: rawData.map(d => ({
					year: d.year,
					consumption: d[id],
					percentChange: d[id + "PercentChange"]
				}))
			}));

		consumptionExtent = [
			d3.min(data, id => d3.min(id.values, d => d.consumption)),
			d3.max(data, id => d3.max(id.values, d => d.consumption))
		];

		percentChangeExtent = [
			d3.min(data, id => d3.min(id.values, d => d.percentChange)),
			d3.max(data, id => d3.max(id.values, d => d.percentChange)),
		];

		/////////////////////////////////////////////////////////////////
		//// Chart (Fixed Part) /////////////////////////////////////////
		/////////////////////////////////////////////////////////////////

		x.domain(d3.extent(rawData, d => d.year));

		line.x(d => x(d.year));

		lineChart.append("g")
				.attr("class", "axis x-axis")
				.attr("transform", `translate(0, ${height})`)
				.call(d3.axisBottom(x)
				.tickFormat(d3.format("d")));

		yAxisG = lineChart.append("g")
				.attr("class", "axis y-axis");

		pathLines = lineChart.selectAll(".line")
			.data(data)
			.enter().append("path")
				.attr("class", "line")
				.style("stroke", d => color(d.id))
				.style("stroke-width", 3)
				.style("fill", "none");

		update(flag);
	});

	///////////////////////////////////////////////////////////////////
	//// Chart (Update Part) //////////////////////////////////////////
	///////////////////////////////////////////////////////////////////

	function update(flag) {
		y.domain(flag ? consumptionExtent : percentChangeExtent);

		const yAxis = d3.axisLeft(y);
		if (!flag) { // percentage change
			yAxis.tickFormat(d3.format(".0%"));
		}

		yAxisG.transition()
				.duration(500)
				.call(yAxis);

		line.y(d => y(flag ? d.consumption : d.percentChange));

		pathLines
			.transition()
			.duration(500)
				.attr("d", d => line(d.values));
	}

	///////////////////////////////////////////////////////////////////
	//// Event Listeners //////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////
	// Switch chart type
	d3.select("#switch").on("click", () => {
		flag = !flag;
		update(flag);
		d3.select("#percent-consumption")
			.style("opacity", flag ? 0 : 1);
		d3.select("#switch")
			.text(flag ? "Show Percent Change" : "Show Consumption Values");
	});

	///////////////////////////////////////////////////////////////////
	// Toopltip
	function showTooltip() {
		tooltip.transition().style("opacity", 1);
	}

	function moveTooltip() {
		const xYear = x.invert(d3.mouse(this)[0]);
		const i = d3.bisectLeft(years, xYear);
		const yearLeft = years[i - 1];
		const yearRight = years[i];
		const iFinal = xYear - yearLeft < yearRight - xYear ? i - 1 : i;

		const filteredData = data.map(id => ({
			id: id,
			values: id.values[iFinal]
		}));

		tooltip.selectAll(".circle")
			.data(filteredData)
				.attr("transform", d => `
					translate(${x(years[iFinal])},
					${flag ? y(d.values.consumption) : y(d.values.percentChange)})
				`);

		d3.select("#year")
				.text(years[iFinal]);

		d3.selectAll(".value")
			.data(filteredData)
				.text(d => flag ? d.values.consumption : d3.format("+.1%")(d.values.percentChange));

		d3.selectAll(".lbs")
			.style("opacity", flag ? 1 : 0);
	}

	function hideTooltip() {
		tooltip.transition().style("opacity", 0);

		d3.select("#year")
				.text("");

		d3.selectAll(".value")
				.text("");

		d3.selectAll(".lbs")
			.style("opacity", 0);
	}
}());