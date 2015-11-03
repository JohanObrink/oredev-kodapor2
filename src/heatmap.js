function drawmap() {
    circle = new ProgressBar.Circle('#pbar', {
        color: '#b20000',
        duration: 40000,
        easing: 'easeInOut',
        text: {
            value: '0%'
        },
        step: function(state, bar) {
            bar.setText((bar.value() * 100).toFixed(0) + "%");
        }
    });

    circle.animate(1);

    var resData = [],
        rowLabel = [],
        colLabel = [];

    var dynamicSort = function(property) {
        var sortOrder = 1;
        if (property[0] === "-") {
            sortOrder = -1;
            property = property.substr(1);
        }
        return function(a, b) {
            var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
            return result * sortOrder;
        }
    };

    var dynamicSortMultiple = function() {
        var props = arguments;
        return function(obj1, obj2) {
            var i = 0,
                result = 0,
                numberOfProperties = props.length;
            while (result === 0 && i < numberOfProperties) {
                result = dynamicSort(props[i])(obj1, obj2);
                i++;
            }
            return result;
        }
    };

    //find rowLabels and column labels 
    rawData['texts'].map(function(element, key) {
        rowLabel.push(element.id);
        element.tonality.map(function(element, key) {
            if (colLabel.indexOf(element.tone) === -1) {
                colLabel.push(element.tone);
            }
        });
    });

    rawData['texts'].map(function(element, key) {
        element.tonality.map(function(e, k) {
            var d = {};

            d.row = key + 1;
            d.row_name = rowLabel[key];
            d.col = colLabel.indexOf(e.tone) + 1;
            d.col_name = colLabel[colLabel.indexOf(e.tone)];
            d.value = e.normalizedScore;

            resData.push(d);
        });
    });

    resData.sort(dynamicSortMultiple("row", "col"));

    data = resData,
        max = d3.max(data, function(d) {
            return d.value;
        }),
        margin = {
            top: 20,
            right: 25,
            bottom: 10,
            left: 100
        },
        width = window.innerWidth - margin.left - margin.right,
        height = window.innerHeight - margin.bottom - margin.top,
        col_number = colLabel.length,
        cellSize_w = Math.floor(width / col_number),
        row_number = rowLabel.length,
        cellSize_h = Math.floor(height / row_number),
        legendElementWidth = width / 11 - 1,
        legendElementHeight = cellSize_h / 2,
        colors = ["#fff5f0","#fee0d2","#fcbba1","#fc9272","#fb6a4a","#ef3b2c","#cb181d","#a50f15","#67000d"],
        tooltiptransition = 300,
        colSortOrder = false;

    circle.destroy();
    d3.select("#pbar").remove();

    var colorScale = d3.scale.quantile()
        .domain([0, max])
        .range(colors);

    var svg = d3.select("#heatmap").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var rowLabels = svg.append("g")
        .selectAll(".rowLabelg")
        .data(rowLabel)
        .enter()
        .append("text")
        .text(function(d) {
            return d;
        })
        .attr("x", 0)
        .attr("y", function(d, i) {
            return i * cellSize_h;
        })
        .style("text-anchor", "end")
        .attr("transform", "translate(-6," + cellSize_h / 1.5 + ")")
        .attr("class", function(d, i) {
            return "rowLabel mono r" + i;
        })
        .on("mouseover", function(d) {
            d3.select(this).attr("cursor", "pointer");
            d3.select(this).classed("text-hover", true);
        })
        .on("mouseout", function(d) {
            d3.select(this).classed("text-hover", false);
        })
        .on("click", function(d, i) {
            window.open(d);
        });

    var colLabels = svg.append("g")
        .attr("class", "ha")
        .selectAll(".colLabelg")
        .data(colLabel)
        .enter()
        .append("text")
        .text(function(d) {
            return d;
        })
        .attr("y", 0)
        .attr("x", function(d, i) {
            return i * cellSize_w;
        })
        .attr("cursor", "s-resize")
        .style("text-anchor", "middle")
        .attr("transform", "translate(" + cellSize_w / 2 + ",-6)")
        .attr("class", function(d, i) {
            return "colLabel mono c";
        })
        .on("mouseover", function(d) {
            d3.select(this).classed("text-hover", true);
        })
        .on("mouseout", function(d) {
            d3.select(this).classed("text-hover", false);
        })
        .on("click", function(d, i) {
            colSortOrder = !colSortOrder;
            sortbylabel("c", i, colSortOrder);
        });


    var heatMap = svg.append("g").attr("class", "g3")
        .selectAll(".cellg")
        .data(data, function(d) {
            return d.row + ":" + d.col;
        })
        .enter()
        .append("rect")
        .attr("x", function(d) {
            return (d["col"] - 1) * cellSize_w;
        })
        .attr("y", function(d) {
            return (d["row"] - 1) * cellSize_h;
        })
        .attr("class", function(d) {
            return "cell cell-border cr" + (d.row - 1) + " cc" + (d.col - 1);
        })
        .attr("width", cellSize_w)
        .attr("height", cellSize_h)
        .style("fill", function(d) {
            if (d.value === 0) {
                return "#FFFFFF";
            }
            return colorScale(d.value);
        })
        .on("mouseover", function(d) {
            d3.select(this).classed("cell-hover", true);
            d3.selectAll(".rowLabel").classed("text-highlight", function(r, ri) {
                return ri == (d.row - 1);
            });
            d3.selectAll(".colLabel").classed("text-highlight", function(c, ci) {
                return ci == (d.col - 1);
            });

            d3.select("#tooltip")
                .transition()
                .duration(tooltiptransition)
                .style("left", (d3.event.pageX - 10) + "px")
                .style("top", (d3.event.pageY + 10) + "px")
                .select("#value")
                .text("Score: " + d.value.toFixed(3) + " (Doc" + d.row_name.substr(d.row_name.lastIndexOf("/") + 1, d.row_name.length) + " , Category: " + d.col_name + ")");
            d3.select("#tooltip").classed("hidden", false);
        })
        .on("mouseout", function() {
            d3.select(this).classed("cell-hover", false);
            d3.selectAll(".rowLabel").classed("text-highlight", false);
            d3.selectAll(".colLabel").classed("text-highlight", false);
            d3.select("#tooltip").classed("hidden", true);
        })
        .on("click", function(d, i) {
            window.open(d.row_name);
        });

    // var legend = svg.selectAll(".legend")
    //     .data(colorScale.range())
    //     .enter().append("g")
    //     .attr("class", "legend");

    // legend.append("rect")
    //     .attr("x", function(d, i) {
    //         return legendElementWidth * i;
    //     })
    //     .attr("y", height + 10)
    //     .attr("width", legendElementWidth)
    //     .attr("height", legendElementHeight)
    //     .style("fill", function(d, i) {
    //         return colors[i];
    //     })
    //     .style("stroke", "#494949");

    // legend.append("text")
    //     .attr("class", "mono")
    //     .text(function(d) {
    //         var r = colorScale.invertExtent(d);
    //         return "≥ " + r[r.length - 1].toFixed(1);
    //     })
    //     .attr("width", legendElementWidth)
    //     .attr("x", function(d, i) {
    //         return legendElementWidth * i + legendElementWidth / 2;
    //     })
    //     .attr("y", height + 30)
    //     .style("fill", "#000000")
    //     .attr("text-anchor", "middle");


    // legend.append("text")
    //     .attr("class", "mono")
    //     .text("Legend")
    //     .attr("width", legendElementWidth)
    //     .attr("x", 0)
    //     .attr("y", height + 18)
    //     .attr("transform", "translate(-50)");


    d3.select("#charttitle").on("mouseover", function() {
        d3.select("tooltip").classed("hidden", true);
    });

    var sortbylabel = function(rORc, i, sortOrder) {
        var t = svg.transition().duration(1000);
        var log2r = [];
        var sorted; // sorted is zero-based index
        d3.selectAll(".c" + rORc + i)
            .filter(function(ce) {
                log2r.push(ce.value);
            });
        sorted = d3.range(row_number).sort(function(a, b) {
            if (sortOrder) {
                return log2r[b] - log2r[a];
            } else {
                return log2r[a] - log2r[b];
            }
        });
        t.selectAll(".cell")
            .attr("y", function(d) {
                return sorted.indexOf(d.row - 1) * cellSize_h;
            });
        t.selectAll(".rowLabel")
            .attr("y", function(d, i) {
                return sorted.indexOf(i) * cellSize_h;
            });
    };
}