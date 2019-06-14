//import * as cscheid from "/js/cscheid/cscheid.js";

if (d3 !== undefined) {
    // http://stackoverflow.com/questions/14167863/how-can-i-bring-a-circle-to-the-front-with-d3
    d3.selection.prototype.moveToFront = function() {
        return this.each(function(){
            this.parentNode.appendChild(this);
        });
    };

    // http://bl.ocks.org/eesur/4e0a69d57d3bfc8a82c2
    d3.selection.prototype.moveToBack = function() {
        return this.each(function() {
            var firstChild = this.parentNode.firstChild;
            if (firstChild) {
                this.parentNode.insertBefore(this, firstChild);
            }
        });
    };

    d3.selection.prototype.callReturn = function(callable)
    {
        return callable(this);
    };

    d3.selection.prototype.enterMany = function(data)
    {
        return this.selectAll(".c :not(.c)")
            .data(data)
            .enter();
    };
}

//consts
var rangeMin = 20;
var rangeMax = 800;
var lLDomainMin = -6;
var lLDomainMax = 6;
var lLScaleMin = -3;
var lLScaleMax = 3;
var toolTipHeight = 20;
var toolTipWidth = 40;
var toolTipOffsety = 10;
var preTestAxisy = 100;
var lRAxisy = 200;
var postTestAxisy = 300;
var endOfScaleLabelsx = 810;

var svg = d3.select("#main")
    .append("svg")
    .attr("width", 920)
    .attr("height", 400);

var preTestScaleLogOdds = d3.scaleLinear()
    .domain([3, -3])
    .range([rangeMin, rangeMax]);

var postTestScaleLogOdds = d3.scaleLinear()
    .domain([-3, 3])
    .range([rangeMin, rangeMax]);

var logLikelihoodRatioScale = d3.scaleLinear()
    .domain([lLDomainMin, lLDomainMax])
    .range([rangeMin, rangeMax]);

var labels = ['pre-test probability',
    'likelihood ratio',
    'post-test probability'];

var yScale = d3.scaleLinear().domain([0,2]).range([preTestAxisy, 300]);

svg.append("g")
    .selectAll("text")
    .data(labels)
    .enter()
    .append("text")
    .attr("x", endOfScaleLabelsx)
    .attr("y", function(d, i) { return yScale(i); })
    .attr("dy", 3)
    .text(function(d) { return d; })
    .attr("class", "label");

var preTestLineG = svg.append("g");
var preTestLine = preTestLineG
    .append("line")
    .attr("x1", preTestScaleLogOdds(-3))
    .attr("x2", preTestScaleLogOdds(3))
    .attr("y1", preTestAxisy)
    .attr("y2", preTestAxisy)
    .attr("class", "test-line");

var lrLineG = svg.append("g");
var lrLine = lrLineG
    .append("line")
    .attr("x1", logLikelihoodRatioScale(lLScaleMin))
    .attr("x2", logLikelihoodRatioScale(lLScaleMax))
    .attr("y1", lRAxisy)
    .attr("y2", lRAxisy)
    .attr("class", "test-line");

var postTestLineG = svg.append("g");
var postTestLine = postTestLineG
    .append("line")
    .attr("x1", postTestScaleLogOdds(-3))
    .attr("x2", postTestScaleLogOdds(3))
    .attr("y1", 300)
    .attr("y2", 300)
    .attr("class", "test-line");

//////////////////////////////////////////////////////////////////////////////
// this could be solved automatically..

var fmt = d3.format(".3f");

function expFmt(v) {
    var l = Math.pow(10, v);
    var r = fmt(l / (1 + l));
    return r.replace(/0+$/, "");
}

function lrFmt(v) {
    var l = Math.pow(10, v);
    if (l == ~~l)
        return String(l);
    else
        return String(l).replace(/0+$/, "");
}

//variables
var preTestValue = expFmt(preTestScaleLogOdds.invert(preTestScaleLogOdds(-1)));
//lrFmt(logLikelihoodRatioScale.invert(d3.event.x))
var lRValue = lrFmt(logLikelihoodRatioScale.invert(0.5 * (postTestScaleLogOdds(0) + preTestScaleLogOdds(-1))));
var postTestValue = expFmt(postTestScaleLogOdds.invert(postTestScaleLogOdds(0)));

var preProbTicks = {
    list: [-3, -2, -0.954245, 0, 0.954245, 2, 3],
    scale: preTestScaleLogOdds,
    fmt: expFmt
};

var postProbTicks = {
    list: [-3, -2, -0.954245, 0, 0.954245, 2, 3],
    scale: postTestScaleLogOdds,
    fmt: expFmt
};

var lrTicks   = {
    list: [-3, -2, -1, 0, 1, 2, 3],
    scale: logLikelihoodRatioScale,
    fmt: lrFmt
};

function addTicks(ticks)
{
    return function(sel) {
        var gs = sel
            .enterMany(ticks.list)
            .append("g");
        gs.append("line")
            .attr("x1", function(d) { return ticks.scale(d); })
            .attr("x2", function(d) { return ticks.scale(d); })
            .attr("y1", -5).attr("y2", 5)
            .attr("class", "test-line");
        gs.append("text")
            .attr("x", function(d) { return ticks.scale(d); })
            .attr("y", -15)
            .attr("text-anchor", "middle")
            .attr("class", "label")
            .text(function(d) { return ticks.fmt(d); });
    };
}

function translate(x, y) {
    if (y === undefined) {
        return "translate(" + x.x + ", " + x.y + ") ";
    } else {
        return "translate(" + x + ", " + y + ") ";
    }
}

preTestLineG
    .append("g")
    .attr("transform", translate(0, 100))
    .callReturn(addTicks(preProbTicks));

lrLineG
    .append("g")
    .attr("transform", translate(0, Number(lRAxisy)))
    .callReturn(addTicks(lrTicks));

postTestLineG
    .append("g")
    .attr("transform", translate(0, 300))
    .callReturn(addTicks(postProbTicks));

var nomogramLine = svg.append("line")
    .attr("x1", preTestScaleLogOdds(-1))
    .attr("y1", preTestAxisy)
    .attr("x2", postTestScaleLogOdds(0))
    .attr("y2", 300)
    .attr("class", "test-line");

function updateLine() {
    nomogramLine.attr("x1", preTestHandle.attr("cx"));
    nomogramLine.attr("x2", postTestHandle.attr("cx"));
}

function dragAttrs(sel) {
    return sel.attr("r", 5)
        .attr("fill", "white")
        .attr("stroke", "black")
        .attr("cursor", "pointer");
}

/*
 * ToolTips to show value while dragging
 */

var preTestToolTip = svg.append("g");
preTestToolTip.attr("class", "hidden")

preTestToolTip.attr("transform", "translate("+preTestScaleLogOdds(-1)+"," + 0 +")");

preTestToolTip.append("rect")
    .attr("x", 0)
    .attr("rx", 5)
    .attr("y", preTestAxisy-toolTipOffsety-toolTipHeight)
    .attr("width", toolTipWidth)
    .attr("height", toolTipHeight)
    .attr("class", "pre-test-value")
    .attr("stroke", "rgba(255,0,0,0.7)")
    .style("fill", "rgba(255,0,0,0.7)");

preTestToolTip.append("text")
    .attr("x", 6)
    .attr("y", preTestAxisy-toolTipOffsety - 6)
    .style("fill", "white")
    .text(preTestValue);

var lRToolTip = svg.append("g");
lRToolTip.attr("class", "hidden")

lRToolTip.attr("transform", "translate("+ 0.5 * (postTestScaleLogOdds(0) + preTestScaleLogOdds(-1)) + "," + 0 +")");

lRToolTip.append("rect")
    .attr("x", 0)
    .attr("rx", 5)
    .attr("y", lRAxisy-toolTipOffsety-toolTipHeight)
    .attr("width", toolTipWidth)
    .attr("height", toolTipHeight)
    .attr("class", "pre-test-value")
    .attr("stroke", "rgba(255,0,0,0.7)")
    .style("fill", "rgba(255,0,0,0.7)");

lRToolTip.append("text")
    .attr("x", 6)
    .attr("y", lRAxisy-toolTipOffsety - 6)
    .style("fill", "white")
    .text(lRValue);

var postTestToolTip = svg.append("g");
postTestToolTip.attr("class", "hidden")

postTestToolTip.attr("transform", "translate("+postTestScaleLogOdds(0)+"," + 0 +")");

postTestToolTip.append("rect")
    .attr("x", 0)
    .attr("rx", 5)
    .attr("y", postTestAxisy-toolTipOffsety-toolTipHeight)
    .attr("width", toolTipWidth)
    .attr("height", toolTipHeight)
    .attr("class", "pre-test-value")
    .attr("stroke", "rgba(255,0,0,0.7)")
    .style("fill", "rgba(255,0,0,0.7)");

postTestToolTip.append("text")
    .attr("x", 6)
    .attr("y", postTestAxisy-toolTipOffsety - 6)
    .style("fill", "white")
    .text(postTestValue);

/*
 * Boxes to show values
 */
var preTestBox = svg.append("g");

preTestBox.attr("transform", "translate("+ endOfScaleLabelsx +"," + preTestAxisy +")");

preTestBox.append("rect")
    .attr("x", 0)
    .attr("rx", 8)
    .attr("y", toolTipOffsety)
    .attr("width", toolTipWidth)
    .attr("height", toolTipHeight)
    .attr("class", "pre-test-value")
    .attr("stroke", "rgba(255,0,0,0.7)")
    .style("fill", "rgba(255,0,0,0.7)");

preTestBox.append("text")
    .attr("x", 6)
    .attr("y", toolTipOffsety + 14)
    .style("fill", "white")
    .text(preTestValue);

var postTestBox = svg.append("g");

postTestBox.attr("transform", "translate("+ endOfScaleLabelsx +"," + postTestAxisy +")");

postTestBox.append("rect")
    .attr("x", 0)
    .attr("rx", 8)
    .attr("y", toolTipOffsety)
    .attr("width", toolTipWidth)
    .attr("height", toolTipHeight)
    .attr("class", "pre-test-value")
    .attr("stroke", "rgba(255,0,0,0.7)")
    .style("fill", "rgba(255,0,0,0.7)");

postTestBox.append("text")
    .attr("x", 6)
    .attr("y", toolTipOffsety + 14)
    .style("fill", "white")
    .text(postTestValue);

var lRBox = svg.append("g");

lRBox.attr("transform", "translate("+ endOfScaleLabelsx +"," + lRAxisy +")");

lRBox.append("rect")
    .attr("x", 0)
    .attr("rx", 8)
    .attr("y", toolTipOffsety)
    .attr("width", toolTipWidth)
    .attr("height", toolTipHeight)
    .attr("class", "pre-test-value")
    .attr("stroke", "rgba(255,0,0,0.7)")
    .style("fill", "rgba(255,0,0,0.7)");

lRBox.append("text")
    .attr("x", 6)
    .attr("y", toolTipOffsety + 14)
    .style("fill", "white")
    .text(lRValue);

var preTestHandle = svg.append("circle")
    .attr("cx", preTestScaleLogOdds(-1))
    .attr("cy", preTestAxisy)
    //.style("fill", "transparent")
    .attr("stroke", "rgba(255,0,0,0.7)")
    .style("fill", "rgba(255,0,0,0.7)")
    .callReturn(dragAttrs)
    .call(d3.drag().on("drag", function() {
            //dragging this updates both pre and postTest handles
            //check that both still on scale
            var lrX = Number(lrHandle.attr("cx"));
            var dx = lrX - d3.event.x;
            var newPostTestx = lrX + dx;
            //console.log(logLikelihoodRatioScale(lLScaleMin));
            //console.log(logLikelihoodRatioScale(lLScaleMax));
            if(newPostTestx >= rangeMin
                && newPostTestx <= rangeMax
                && d3.event.x >= rangeMin
                && d3.event.x <= rangeMax
            ) {
                d3.select(this).attr("cx", d3.event.x);


                preTestToolTip.classed('hidden', false);
                preTestToolTip.attr("transform", "translate("+d3.event.x+"," + 0 +")");
                preTestValue = expFmt(preTestScaleLogOdds.invert(d3.event.x));
                preTestToolTip.select('text').text(preTestValue);
                preTestBox.select('text').text(preTestValue);

                postTestHandle.attr("cx", newPostTestx);
                postTestValue = expFmt(postTestScaleLogOdds.invert(newPostTestx));
                postTestBox.select('text').text(postTestValue);

                //console.log(expFmt(preTestScaleLogOdds.invert()));
                console.log(expFmt(preTestScaleLogOdds.invert(d3.event.x)));
                updateLine();
            }
        }
        ).on("end", function() {
            preTestToolTip.classed('hidden', true);
        })
    );

var lRlt1ToolTipFmt = d3.format(".3f");
var lRlt1to10ToolTipFmt = d3.format(".2f");
var lRgt10ToolTipFmt = d3.format(".0f");
var lrHandle = svg.append("circle")
    .attr("cx", 0.5 * (postTestScaleLogOdds(0) + preTestScaleLogOdds(-1)))
    .attr("cy", 200)
    .attr("stroke", "rgba(255,0,0,0.7)")
    .style("fill", "rgba(255,0,0,0.7)")
    .callReturn(dragAttrs)
    .call(d3.drag().on("drag", function() {
        //dragging this updates both lr and postTest handles
        //check that both still on scale
        var ptX = Number(preTestHandle.attr("cx"));
        var dx = d3.event.x - ptX;
        var newPostTestx = d3.event.x + dx;
        if(newPostTestx >= rangeMin
            && newPostTestx <= rangeMax
            && d3.event.x >= logLikelihoodRatioScale(lLScaleMin)
            && d3.event.x <= logLikelihoodRatioScale(lLScaleMax)
            ) {
                d3.select(this).attr("cx", d3.event.x);

                lRToolTip.classed('hidden', false);
                lRToolTip.attr("transform", "translate("+d3.event.x+"," + 0 +")");
                var rawlRValue = lrFmt(logLikelihoodRatioScale.invert(d3.event.x));
                var lRValue;
                if(rawlRValue < 1) {
                    lRValue = lRlt1ToolTipFmt(rawlRValue);
                }
                else if(rawlRValue < 10) {
                    lRValue = lRlt1to10ToolTipFmt(rawlRValue, 2);
                }
                else {
                    lRValue = lRgt10ToolTipFmt(rawlRValue);
                }
                lRToolTip.select('text').text(lRValue);
                lRBox.select('text').text(lRValue);

                postTestHandle.attr("cx", d3.event.x + dx);
                postTestValue = expFmt(postTestScaleLogOdds.invert(d3.event.x + dx));
                postTestBox.select('text').text(postTestValue);

                updateLine();
            }
        }).on("end", function() {
        lRToolTip.classed('hidden', true);
    }));

var postTestHandle = svg.append("circle")
    .attr("cx", postTestScaleLogOdds(0))
    .attr("cy", 300)
    .attr("stroke", "rgba(255,0,0,0.7)")
    .style("fill", "rgba(255,0,0,0.7)")
    .callReturn(dragAttrs)
    .call(d3.drag().on("drag", function() {
        //dragging this updates both postTest and lr handles
        //check that both still on scale
        var newLRx = 0.5 * (d3.event.x + Number(preTestHandle.attr("cx")));
        if(d3.event.x >= rangeMin
            && d3.event.x <= rangeMax
            && newLRx >= logLikelihoodRatioScale(lLScaleMin)
            && newLRx <= logLikelihoodRatioScale(lLScaleMax)
        ) {
            d3.select(this).attr("cx", d3.event.x);

            postTestToolTip.classed('hidden', false);
            postTestToolTip.attr("transform", "translate("+d3.event.x+"," + 0 +")");
            postTestValue = expFmt(postTestScaleLogOdds.invert(d3.event.x));
            postTestToolTip.select('text').text(postTestValue);
            postTestBox.select('text').text(postTestValue);

            lrHandle.attr("cx", newLRx);
            var rawlRValue = lrFmt(logLikelihoodRatioScale.invert(newLRx));
            var lRValue;
            if(rawlRValue < 1) {
                lRValue = lRlt1ToolTipFmt(rawlRValue);
            }
            else if(rawlRValue < 10) {
                lRValue = lRlt1to10ToolTipFmt(rawlRValue, 2);
            }
            else {
                lRValue = lRgt10ToolTipFmt(rawlRValue);
            }
            lRBox.select('text').text(lRValue);


            updateLine();
        }
    }).on("end", function() {
            postTestToolTip.classed('hidden', true);
    })
    );


