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
var rangeMax = 490; //800;
var lLDomainMin = -6;
var lLDomainMax = 6;
var lLScaleMin = -3;
var lLScaleMax = 3;
var toolTipHeight = 20;
var toolTipWidth = 40;
var toolTipOffset = 10;
var handlePaddingY = 4;
var handlePaddingX = 10;
var preTestAxis = 100;
var lRAxis = 200;
var postTestAxis = 300;
var endOfScaleLabels = 510; //810;

var svg = d3.select("#main")
    .append("svg")
    .attr("width", 500)
    .attr("height", 600); //.attr("height", 920);

// Returns path data for a rectangle with rounded right corners.
// Note: it’s probably easier to use a <rect> element with rx and ry attributes!
// The top-left corner is ⟨x,y⟩.
function leftRoundedRect(x, y, width, height, radius) {
    return "M" + x + "," + y
        + "L" + (x + height/2) + "," + (y - height/2)
        + "h" + (width - radius)
        + "a" + radius + "," + radius + " 0 0 1 " + radius + "," + radius
        + "v" + (height - 2 * radius)
        + "a" + radius + "," + radius + " 0 0 1 " + -radius + "," + radius
        + "h" + (radius - width)
        /*+ "l" + x + "," + y*/
        + "z";
}

var preTestScaleLogOdds = d3.scaleLinear()
    .domain([3, -3])
    .range([rangeMin, rangeMax]);

var postTestScaleLogOdds = d3.scaleLinear()
    .domain([-3, 3])
    .range([rangeMin, rangeMax]);

var logLikelihoodRatioScale = d3.scaleLinear()
    .domain([lLDomainMin, lLDomainMax])
    .range([rangeMin, rangeMax]);

var preTestHandleY = preTestScaleLogOdds(-1);

var labels = ['pre-test probability',
    'likelihood ratio',
    'post-test probability'];

var yScale = d3.scaleLinear().domain([0,2]).range([preTestAxis, postTestAxis]);

svg.append("g")
    .selectAll("text")
    .data(labels)
    .enter()
    .append("text")
    .attr("y", endOfScaleLabels)
    .attr("x", function(d, i) { return yScale(i); })
    .attr("dx", 3)
    .text(function(d) { return d; })
    .attr("class", "label");

var preTestLineG = svg.append("g");

var preTestLine = preTestLineG
    .append("line")
    .attr("y1", preTestScaleLogOdds(-3))
    .attr("y2", preTestScaleLogOdds(3))
    .attr("x1", preTestAxis)
    .attr("x2", preTestAxis)
    .attr("class", "test-line");

var lrLineG = svg.append("g");

var lrLine = lrLineG
    .append("line")
    .attr("y1", logLikelihoodRatioScale(lLScaleMin))
    .attr("y2", logLikelihoodRatioScale(lLScaleMax))
    .attr("x1", lRAxis)
    .attr("x2", lRAxis)
    .attr("class", "test-line");

var postTestLineG = svg.append("g");

var postTestLine = postTestLineG
    .append("line")
    .attr("y1", postTestScaleLogOdds(-3))
    .attr("y2", postTestScaleLogOdds(3))
    .attr("x1", postTestAxis)
    .attr("x2", postTestAxis)
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
            .attr("y1", function(d) { return ticks.scale(d); })
            .attr("y2", function(d) { return ticks.scale(d); })
            .attr("x1", -5).attr("x2", 5)
            .attr("class", "test-line");
        gs.append("text")
            .attr("y", function(d) { return ticks.scale(d); })
            .attr("x", 8)
            .attr("text-anchor", "left")
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
    .attr("transform", translate(preTestAxis, 0))
    .callReturn(addTicks(preProbTicks));

lrLineG
    .append("g")
    .attr("transform", translate(lRAxis, 0))
    .callReturn(addTicks(lrTicks));

postTestLineG
    .append("g")
    .attr("transform", translate(postTestAxis, 0))
    .callReturn(addTicks(postProbTicks));

var nomogramLine = svg.append("line")
    .attr("y1", preTestScaleLogOdds(-1))
    .attr("x1", preTestAxis)
    .attr("y2", postTestScaleLogOdds(0))
    .attr("x2", 300)
    .attr("class", "test-line");

function updateLine() {
    nomogramLine.attr("y1", preTestHandleY);
    nomogramLine.attr("y2", postTestHandle.attr("y"));
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

preTestToolTip.attr("transform", "translate("+ 0 +"," + preTestScaleLogOdds(-1) +")");

preTestToolTip.append("rect")
    .attr("y", 0)
    .attr("rx", 5)
    .attr("x", preTestAxis-toolTipOffset-toolTipHeight)
    .attr("width", toolTipWidth)
    .attr("height", toolTipHeight)
    .attr("class", "pre-test-value")
    .attr("stroke", "rgba(255,0,0,0.7)")
    .style("fill", "rgba(255,0,0,0.7)");

preTestToolTip.append("text")
    .attr("y", 6)
    .attr("x", preTestAxis-toolTipOffset - 6)
    .style("fill", "white")
    .text(preTestValue);

var lRToolTip = svg.append("g");
lRToolTip.attr("class", "hidden")

lRToolTip.attr("transform", "translate("+ 0 + "," + 0.5 * (postTestScaleLogOdds(0) + preTestScaleLogOdds(-1)) +")");

lRToolTip.append("rect")
    .attr("y", 0)
    .attr("rx", 5)
    .attr("x", lRAxis-toolTipOffset-toolTipHeight)
    .attr("width", toolTipWidth)
    .attr("height", toolTipHeight)
    .attr("class", "pre-test-value")
    .attr("stroke", "rgba(255,0,0,0.7)")
    .style("fill", "rgba(255,0,0,0.7)");

lRToolTip.append("text")
    .attr("y", 6)
    .attr("x", lRAxis-toolTipOffset - 6)
    .style("fill", "white")
    .text(lRValue);

var postTestToolTip = svg.append("g");
postTestToolTip.attr("class", "hidden")

postTestToolTip.attr("transform", "translate("+ 0 +"," + postTestScaleLogOdds(0) +")");

postTestToolTip.append("rect")
    .attr("y", 0)
    .attr("rx", 5)
    .attr("x", postTestAxis-toolTipOffset-toolTipHeight)
    .attr("width", toolTipWidth)
    .attr("height", toolTipHeight)
    .attr("class", "pre-test-value")
    .attr("stroke", "rgba(255,0,0,0.7)")
    .style("fill", "rgba(255,0,0,0.7)");

postTestToolTip.append("text")
    .attr("y", 6)
    .attr("x", postTestAxis-toolTipOffset - 6)
    .style("fill", "white")
    .text(postTestValue);

/*
 * Boxes to show values
 */
var preTestBox = svg.append("g");

preTestBox.attr("transform", "translate("+ preTestAxis +"," + endOfScaleLabels +")");

preTestBox.append("rect")
    .attr("y", 0)
    .attr("rx", 8)
    .attr("x", toolTipOffset)
    .attr("width", toolTipWidth)
    .attr("height", toolTipHeight)
    .attr("class", "pre-test-value")
    .attr("stroke", "rgba(255,0,0,0.7)")
    .style("fill", "rgba(255,0,0,0.7)");

preTestBox.append("text")
    .attr("y", 6)
    .attr("x", toolTipOffset + 14)
    .style("fill", "white")
    .text(preTestValue);

var postTestBox = svg.append("g");

postTestBox.attr("transform", "translate("+ postTestAxis +"," + endOfScaleLabels +")");

postTestBox.append("rect")
    .attr("y", 0)
    .attr("rx", 8)
    .attr("x", toolTipOffset)
    .attr("width", toolTipWidth)
    .attr("height", toolTipHeight)
    .attr("class", "pre-test-value")
    .attr("stroke", "rgba(255,0,0,0.7)")
    .style("fill", "rgba(255,0,0,0.7)");

postTestBox.append("text")
    .attr("y", 6)
    .attr("x", toolTipOffset + 14)
    .style("fill", "white")
    .text(postTestValue);

var lRBox = svg.append("g");

lRBox.attr("transform", "translate("+ lRAxis +"," + endOfScaleLabels +")");

lRBox.append("rect")
    .attr("y", 0)
    .attr("rx", 8)
    .attr("x", toolTipOffset)
    .attr("width", toolTipWidth)
    .attr("height", toolTipHeight)
    .attr("class", "pre-test-value")
    .attr("stroke", "rgba(255,0,0,0.7)")
    .style("fill", "rgba(255,0,0,0.7)");

lRBox.append("text")
    .attr("y", 6)
    .attr("x", toolTipOffset + 14)
    .style("fill", "white")
    .text(lRValue);

/*var preTestHandle = svg.append("rect")
    .attr("y", preTestScaleLogOdds(-1))
    .attr("x", preTestAxis - 20)
    .attr("width", 20)
    .attr("height", 5)
    //.style("fill", "transparent")
    .attr("stroke", "rgba(255,0,0,0.7)")
    .style("fill", "rgba(255,0,0,0.7)")
    .callReturn(dragAttrs)
    .call(d3.drag().on("drag", function() {
            //dragging this updates both pre and postTest handles
            //check that both still on scale
            var lrX = Number(lrHandle.attr("y"));
            var dy = lrX - d3.event.y;
            var newPostTesty = lrX + dy;
            //console.log(logLikelihoodRatioScale(lLScaleMin));
            //console.log(logLikelihoodRatioScale(lLScaleMax));
            if(newPostTesty >= rangeMin
                && newPostTesty <= rangeMax
                && d3.event.y >= rangeMin
                && d3.event.y <= rangeMax
            ) {
                d3.select(this)
                    .attr("y", d3.event.y);

                preTestToolTip.classed('hidden', false);
                preTestToolTip.attr("transform", "translate("+ 0 +"," + d3.event.y +")");
                preTestValue = expFmt(preTestScaleLogOdds.invert(d3.event.y));
                preTestToolTip.select('text').text(preTestValue);
                preTestBox.select('text').text(preTestValue);

                postTestHandle.attr("y", newPostTesty);
                postTestValue = expFmt(postTestScaleLogOdds.invert(newPostTesty));
                postTestBox.select('text').text(postTestValue);

                //console.log(expFmt(preTestScaleLogOdds.invert()));
                console.log(expFmt(preTestScaleLogOdds.invert(d3.event.y)));
                updateLine();
            }
        }
        ).on("end", function() {
            preTestToolTip.classed('hidden', true);
        })
    );*/


var preTestHandle = svg.append("path")
    .attr("class", "pointedRect")
    .attr("shape-rendering","crispEdges")
    //.attr("stroke", "none")
    .attr("d", leftRoundedRect(preTestAxis, preTestHandleY, toolTipWidth, 20, 5))
    .attr("id", "preTestHandle")
    //.style("fill", "rgba(255,0,0,0.7)")
    .callReturn(dragAttrs)
    .call(d3.drag().on("drag", function() {
            //dragging this updates both pre and postTest handles
            //check that both still on scale
            var lrX = Number(lrHandle.attr("y"));
            var dy = lrX - (preTestHandleY + d3.event.dy);
            var newPostTesty = lrX + dy;
            if(newPostTesty >= rangeMin
                && newPostTesty <= rangeMax
                && (preTestHandleY + d3.event.dy) >= rangeMin
                && (preTestHandleY + d3.event.dy) <= rangeMax
            ) {
                //d3.select(this).attr("y", d3.event.y);
                this.y = this.y || 0;
                this.y += d3.event.dy;
                preTestHandleY += d3.event.dy
                d3.select(this).attr("transform", "translate("+ 0 +"," + this.y +")");

                preTestValue = expFmt(preTestScaleLogOdds.invert(preTestHandleY));
                preTestHandleText.text(preTestValue);
                preTestHandleText.attr("y", preTestHandleY + handlePaddingY);
                d3.select(this).select('text').text(preTestValue);
                preTestBox.select('text').text(preTestValue);

                postTestHandle.attr("y", newPostTesty);
                postTestValue = expFmt(postTestScaleLogOdds.invert(newPostTesty));
                postTestBox.select('text').text(postTestValue);

                updateLine();
            }
        })
    );

var preTestHandleText = svg.append("text")
    .attr("x", preTestAxis + handlePaddingX)
    .attr("y", preTestHandleY + handlePaddingY)
    .style("fill", "white")
    .text(preTestValue);

var lRlt1ToolTipFmt = d3.format(".3f");
var lRlt1to10ToolTipFmt = d3.format(".2f");
var lRgt10ToolTipFmt = d3.format(".0f");
var lrHandle = svg.append("rect")
    .attr("y", 0.5 * (postTestScaleLogOdds(0) + preTestScaleLogOdds(-1)))
    .attr("x", 200 - 20)
    .attr("width", 20)
    .attr("height", 5)
    .attr("stroke", "rgba(255,0,0,0.7)")
    .style("fill", "rgba(255,0,0,0.7)")
    .callReturn(dragAttrs)
    .call(d3.drag().on("drag", function() {
        //dragging this updates both lr and postTest handles
        //check that both still on scale
        var ptY = Number(preTestHandle.attr("y"));
        var dy = d3.event.y - ptY;
        var newPostTesty = d3.event.y + dy;
        if(newPostTesty >= rangeMin
            && newPostTesty <= rangeMax
            && d3.event.y >= logLikelihoodRatioScale(lLScaleMin)
            && d3.event.y <= logLikelihoodRatioScale(lLScaleMax)
            ) {
                d3.select(this).attr("y", d3.event.y);

                lRToolTip.classed('hidden', false);
                lRToolTip.attr("transform", "translate("+ 0 +"," + d3.event.y +")");
                var rawlRValue = lrFmt(logLikelihoodRatioScale.invert(d3.event.y));
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

                postTestHandle.attr("y", d3.event.y + dy);
                postTestValue = expFmt(postTestScaleLogOdds.invert(d3.event.y + dy));
                postTestBox.select('text').text(postTestValue);

                updateLine();
            }
        }).on("end", function() {
        lRToolTip.classed('hidden', true);
    }));

var postTestHandle = svg.append("rect")
    .attr("y", postTestScaleLogOdds(0))
    .attr("x", 300 -  20)
    .attr("width", 20)
    .attr("height", 5)
    .attr("stroke", "rgba(255,0,0,0.7)")
    .style("fill", "rgba(255,0,0,0.7)")
    .callReturn(dragAttrs)
    .call(d3.drag().on("drag", function() {
        //dragging this updates both postTest and lr handles
        //check that both still on scale
        var newLRy = 0.5 * (d3.event.y + Number(preTestHandle.attr("y")));
        if(d3.event.y >= rangeMin
            && d3.event.y <= rangeMax
            && newLRy >= logLikelihoodRatioScale(lLScaleMin)
            && newLRy <= logLikelihoodRatioScale(lLScaleMax)
        ) {
            d3.select(this).attr("y", d3.event.y);

            postTestToolTip.classed('hidden', false);
            postTestToolTip.attr("transform", "translate("+ 0 +"," + d3.event.y +")");
            postTestValue = expFmt(postTestScaleLogOdds.invert(d3.event.y));
            postTestToolTip.select('text').text(postTestValue);
            postTestBox.select('text').text(postTestValue);

            lrHandle.attr("y", newLRy);
            var rawlRValue = lrFmt(logLikelihoodRatioScale.invert(newLRy));
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


