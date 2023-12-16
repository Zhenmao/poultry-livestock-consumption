class LineChart {
  constructor({
    el,
    data,
    xValueFormat,
    xTickFormat,
    yValueFormat,
    yTickFormat,
    yTitle,
  }) {
    this.el = el;
    this.series = data.series;
    this.dates = data.dates;
    this.xValueFormat = xValueFormat;
    this.xTickFormat = xTickFormat;
    this.yValueFormat = yValueFormat;
    this.yTickFormat = yTickFormat;
    this.yTitle = yTitle;
    this.pointerentered = this.pointerentered.bind(this);
    this.pointermoved = this.pointermoved.bind(this);
    this.pointerleft = this.pointerleft.bind(this);
    this.init();
  }

  init() {
    this.setup();
    this.scaffold();
    this.wrangle();
    this.ro = new ResizeObserver((entries) =>
      entries.forEach((entry) => {
        this.resize(entry.contentRect);
      })
    );
    this.ro.observe(this.el);
  }

  setup() {
    this.marginTop = 40;
    this.marginRight = 96;
    this.marginBottom = 40;
    this.marginLeft = 40;
    this.height = 480;

    this.x = d3.scaleUtc();
    this.y = d3
      .scaleLinear()
      .range([this.height - this.marginBottom, this.marginTop]);
    const styles = getComputedStyle(document.documentElement);
    this.color = d3
      .scaleOrdinal()
      .domain(this.series.map((d) => d.key))
      .range(
        this.series.map((d) => styles.getPropertyValue(`--color-${d.key}`))
      );

    this.area = d3
      .area()
      .x((_, i) => this.x(this.dates[i]))
      .y1((d) => this.y(d))
      .y0(() => this.y.range()[0])
      .curve(d3.curveMonotoneX);
    this.line = d3
      .line()
      .x((_, i) => this.x(this.dates[i]))
      .y((d) => this.y(d))
      .curve(d3.curveMonotoneX);

    this.id = crypto.randomUUID();

    this.iActive = null;
  }

  scaffold() {
    this.container = d3
      .select(this.el)
      .append("div")
      .attr("class", "line-chart");

    this.svg = this.container
      .append("svg")
      .on("pointerenter", this.pointerentered)
      .on("pointermove", this.pointermoved)
      .on("pointerleave", this.pointerleft)
      .on("touchstart", (event) => event.preventDefault());

    this.defs = this.svg.append("defs");
    this.gX = this.svg.append("g").attr("class", "axis");
    this.gY = this.svg.append("g").attr("class", "axis");
    this.gSeries = this.svg.append("g");
    this.gPointers = this.svg
      .append("g")
      .attr("class", "pointers")
      .call((g) =>
        g
          .append("line")
          .attr("class", "pointers-line")
          .attr("y1", this.marginTop)
          .attr("y2", this.height - this.marginBottom)
      )
      .call((g) =>
        g
          .selectAll(".pointer")
          .data(this.series, (d) => d.key)
          .join((enter) =>
            enter
              .append("circle")
              .attr("class", "pointer")
              .attr("fill", "var(--color-background)")
              .attr("stroke", (d) => this.color(d.key))
              .attr("r", 6)
          )
      );

    this.tooltip = new Tooltip();
  }

  wrangle() {
    this.x.domain(d3.extent(this.dates));
    this.y.domain(d3.extent(d3.merge(this.series.map((d) => d.values)))).nice();

    if (this.width) this.render();
  }

  resize({ width }) {
    if (this.width === width) return;
    this.width = width;

    this.x.range([this.marginLeft, this.width - this.marginRight]);

    this.svg
      .attr("width", this.width)
      .attr("height", this.height)
      .attr("viewBox", [0, 0, this.width, this.height]);

    this.render();
  }

  render() {
    this.defs
      .selectAll("linearGradient")
      .data(this.series, (d) => d.key)
      .join((enter) =>
        enter
          .append("linearGradient")
          .attr("id", (d) => `${this.id}-gradient-${d.key}`)
          .attr("gradientTransform", "rotate(90)")
      )
      .selectAll("stop")
      .data((d) =>
        [
          {
            offset: 0,
            stopOpacity: 0.15,
          },
          {
            offset: 20,
            stopOpacity: 0.1,
          },
          {
            offset: 40,
            stopOpacity: 0.05,
          },
          {
            offset: 60,
            stopOpacity: 0.0,
          },
        ].map((e) => ({
          ...e,
          stopColor: this.color(d.key),
        }))
      )
      .join((enter) => enter.append("stop"))
      .attr("offset", (d) => `${d.offset}%`)
      .attr("stop-color", (d) => d.stopColor)
      .attr("stop-opacity", (d) => d.stopOpacity);

    this.gX
      .attr("transform", `translate(0,${this.height - this.marginBottom})`)
      .call(
        d3
          .axisBottom(this.x)
          .tickFormat(this.xTickFormat)
          .ticks((this.width - this.marginLeft - this.marginRight) / 120)
          .tickSize(12)
          .tickPadding(8)
      )
      .call((g) => g.select(".domain").remove());

    this.gY
      .attr("transform", `translate(${this.marginLeft},0)`)
      .call(
        d3
          .axisLeft(this.y)
          .tickFormat(this.yTickFormat)
          .ticks((this.height - this.marginTop - this.marginBottom) / 80)
          .tickSize(-(this.width - this.marginLeft - this.marginRight))
          .tickPadding(8)
      )
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .selectAll(".title")
          .data([this.yTitle])
          .join((enter) =>
            enter
              .append("text")
              .attr("class", "title")
              .attr("fill", "currentColor")
              .attr("text-anchor", "start")
              .attr("dy", "0.71em")
              .attr("x", -this.marginLeft + 8)
              .attr("y", 8)
          )
          .text((d) => d)
      );

    this.gSeries
      .selectAll(".series")
      .data(this.series, (d) => d.key)
      .join((enter) =>
        enter
          .append("g")
          .attr("class", "series")
          .call((g) =>
            g
              .append("path")
              .attr("class", "series-line")
              .attr("fill", "none")
              .attr("stroke", "currentColor")
          )
          .call((g) =>
            g
              .append("path")
              .attr("class", "series-area")
              .attr("fill", (d) => `url(#${this.id}-gradient-${d.key})`)
          )
          .call((g) =>
            g
              .append("text")
              .attr("class", "series-label")
              .attr("fill", "currentColor")
              .attr("dy", "0.35em")
              .text((d) => d.key)
          )
      )
      .style("color", (d) => this.color(d.key))
      .call((g) =>
        g.select(".series-area").attr("d", (d) => this.area(d.values))
      )
      .call((g) =>
        g.select(".series-line").attr("d", (d) => this.line(d.values))
      )
      .call((g) =>
        g
          .select(".series-label")
          .attr("x", this.x.range()[1] + 8)
          .attr("y", (d) => this.y(d.values[d.values.length - 1]))
      );
  }

  pointermoved(event) {
    const [xm] = d3.pointer(event);
    const i = d3.leastIndex(this.dates, (date) => Math.abs(this.x(date) - xm));
    if (this.iActive !== i) {
      this.iActive = i;
      this.tooltip.show(this.tooltipContent());
      this.gPointers
        .attr("transform", `translate(${this.x(this.dates[this.iActive])},0)`)
        .selectAll(".pointer")
        .data(this.series.map((d) => d.values[this.iActive]))
        .attr("cy", (d) => this.y(d));
    }
    this.tooltip.move({
      pageX: event.pageX + this.x(this.dates[this.iActive]) - xm,
      pageY: event.pageY,
    });
  }

  pointerentered(event) {
    this.gPointers.classed("is-visible", true);
    this.pointermoved(event);
  }

  pointerleft() {
    this.gPointers.classed("is-visible", false);
    this.iActive = null;
    this.tooltip.hide();
  }

  tooltipContent() {
    return `
      <div>${this.xValueFormat(this.dates[this.iActive])}</div>
      ${this.series
        .map((d) => ({
          color: this.color(d.key),
          key: d.key,
          value: d.values[this.iActive],
        }))
        .sort((a, b) => d3.descending(a.value, b.value))
        .map(
          (d) => `
      <div class='series'>
        <div style="color: ${d.color}"></div>
        <div>${d.key}</div>
        <div>${this.yValueFormat(d.value)} lbs</div>
      </div>
    `
        )
        .join("")}
    `;
  }
}
