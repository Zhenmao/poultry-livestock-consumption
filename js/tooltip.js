class Tooltip {
  constructor() {
    this.tooltip = d3.select("body").append("div").attr("class", "tooltip");
  }

  show(content) {
    this.tooltip.html(content).classed("is-visible", true);
    this.tooltipDimension = this.tooltip.node().getBoundingClientRect();
  }

  hide() {
    this.tooltip.classed("is-visible", false);
  }

  move(event) {
    let x = event.pageX + 16;
    if (x + this.tooltipDimension.width > document.body.clientWidth) {
      x = Math.max(0, event.pageX - 16 - this.tooltipDimension.width);
    }
    const y = event.pageY - this.tooltipDimension.height / 2;
    this.tooltip.style("transform", `translate(${x}px,${y}px)`);
  }
}
