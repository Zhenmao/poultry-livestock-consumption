d3.csv("data/poultry-and-livestock-consumption.csv", d3.autoType).then(
  (csv) => {
    const accessors = {
      year: (d) => d["Year"],
      type: (d) => d["Actual/Forecast"],
      beef: (d) => d["Beef"],
      pork: (d) => d["Pork"],
      chicken: (d) => d["Total Chicken"],
    };

    const seriesKeys = ["pork", "beef", "chicken"];
    const series = seriesKeys.map((key) => ({
      key,
      values: csv.map(accessors[key]),
    }));

    const dates = csv.map((d) => d3.utcParse("%Y")(accessors.year(d)));

    const data = {
      series,
      dates,
    };

    console.log(data);

    new LineChart({
      el: document.getElementById("chart"),
      data,
      xValueFormat: d3.utcFormat("%Y"),
      xTickFormat: d3.utcFormat("%Y"),
      yValueFormat: d3.format(".1f"),
      yTickFormat: d3.format(".1~f"),
      yTitle: "Per-capita consumption in lbs",
    });
  }
);
