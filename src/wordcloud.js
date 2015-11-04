function drawwordcloud() {
    var color = d3.scale.linear()
        .domain([4, 5, 6, 7, 8, 9])
        .range(["#ddd", "#ccc", "#bbb", "#aaa", "#999", "#888", "#777", "#666", "#555", "#444", "#333", "#222"]);

    var fontScale = d3.scale.linear()
                .domain([1, 10])
                .range([5, 20]);

    d3.layout.cloud()
        .size([window.innerWidth, window.innerHeight])
        .words(frequency_list)
        .rotate(0)
        .fontSize(function(d) {
            //return d.size;
            return fontScale(d.size);
        })
        .on("end", drawwc)
        .start();

    function drawwc(words) {
        d3.select("body").append("svg")
            .attr("width", window.innerWidth)
            .attr("height", window.innerHeight)
            .attr("class", "wordcloud")
            .append("g")
            // without the transform, words words would get cutoff to the left and top, they would
            // appear outside of the SVG area
            .attr("transform", "translate(320,200)")
            .selectAll("text")
            .data(words)
            .enter().append("text")
            .style("font-size", function(d) {
                //return d.size + "px";
                return fontScale(d.size);
            })
            .style("fill", function(d, i) {
                return color(i);
            })
            .attr("transform", function(d) {
                return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
            })
            .text(function(d) {
                return d.text;
            });
    }
}