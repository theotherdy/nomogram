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
var rangeMax =  500; //800;
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
    .attr("height", 620); //.attr("height", 920);

// Returns path data for a rectangle with rounded right corners and a pointed left side
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
// Returns path data for a rectangle with rounded left corners and a pointed right side
function rightRoundedRect(x, y, width, height, radius) {
    return "M" + x + "," + y
        + "L" + (x - height/2) + "," + (y - height/2)
        + "h" + (radius - width)
        + "a" + radius + "," + radius + " 0 0 0 " + -radius + "," + radius
        + "v" + (height - 2 * radius)
        + "a" + radius + "," + radius + " 0 0 0 " + radius + "," + radius
        + "h" + (width - radius )
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
var lRHandleYNeg = 0.5 * (postTestScaleLogOdds(0) + preTestScaleLogOdds(-1));
var lRHandleYPos = 0.5 * (postTestScaleLogOdds(0) + preTestScaleLogOdds(-1));
var postTestHandleYNeg = postTestScaleLogOdds(0);
var postTestHandleYPos = postTestScaleLogOdds(0);

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
    .attr("class", "axis-line");

var lrLineG = svg.append("g");

var lrLine = lrLineG
    .append("line")
    .attr("y1", logLikelihoodRatioScale(lLScaleMin))
    .attr("y2", logLikelihoodRatioScale(lLScaleMax))
    .attr("x1", lRAxis)
    .attr("x2", lRAxis)
    .attr("class", "axis-line");

var postTestLineG = svg.append("g");

var postTestLine = postTestLineG
    .append("line")
    .attr("y1", postTestScaleLogOdds(-3))
    .attr("y2", postTestScaleLogOdds(3))
    .attr("x1", postTestAxis)
    .attr("x2", postTestAxis)
    .attr("class", "axis-line");

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
var lRValueNeg = lrFmt(logLikelihoodRatioScale.invert(0.5 * (postTestScaleLogOdds(0) + preTestScaleLogOdds(-1))));
var lRValuePos = lrFmt(logLikelihoodRatioScale.invert(0.5 * (postTestScaleLogOdds(0) + preTestScaleLogOdds(-1))));
var postTestValueNeg = expFmt(postTestScaleLogOdds.invert(postTestScaleLogOdds(0)));
var postTestValuePos = expFmt(postTestScaleLogOdds.invert(postTestScaleLogOdds(0)));

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
            .attr("class", "axis-line");
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

var nomogramLineNeg = svg.append("line")
    .attr("y1", preTestScaleLogOdds(-1))
    .attr("x1", preTestAxis)
    .attr("y2", postTestScaleLogOdds(0))
    .attr("x2", postTestAxis)
    .attr("class", "test-line neg");

var nomogramLinePos = svg.append("line")
    .attr("y1", preTestScaleLogOdds(-1))
    .attr("x1", preTestAxis)
    .attr("y2", postTestScaleLogOdds(0))
    .attr("x2", postTestAxis)
    .attr("class", "test-line pos");

function updateLineNeg() {
    nomogramLineNeg.attr("y1", preTestHandleY);
    nomogramLineNeg.attr("y2", postTestHandleYNeg);
}

function updateLinePos() {
    nomogramLinePos.attr("y1", preTestHandleY);
    nomogramLinePos.attr("y2", postTestHandleYPos);
}

function dragAttrs(sel) {
    return sel.attr("r", 5)
        .attr("fill", "white")
        .attr("stroke", "black")
        .attr("cursor", "pointer");
}

//draggable group for preTest handle
var preTestHandle = svg.append("g")
    .attr("transform", "translate("+ preTestAxis +"," + preTestHandleY +")")
    .callReturn(dragAttrs)
    .call(d3.drag().on("drag", function() {
            //dragging this updates both pre and postTest handle - check that both still on scale
            var lrXNeg = Number(lRHandleYNeg);
            var lrXPos = Number(lRHandleYPos);
            var dyNeg = lrXNeg - (preTestHandleY + d3.event.dy);
            var dyPos = lrXPos - (preTestHandleY + d3.event.dy);
            var newPostTestYNeg = lrXNeg + dyNeg;
            var newPostTestYPos = lrXPos + dyPos;
            if(newPostTestYNeg >= rangeMin
                && newPostTestYNeg <= rangeMax
                && newPostTestYPos >= rangeMin
                && newPostTestYPos <= rangeMax
                && (preTestHandleY + d3.event.dy) >= rangeMin
                && (preTestHandleY + d3.event.dy) <= rangeMax
                ) {
                preTestHandleY += d3.event.dy;
                postTestHandleYNeg = newPostTestYNeg;
                postTestHandleYPos = newPostTestYPos;
                d3.select(this).attr("transform", "translate("+ preTestAxis +"," + preTestHandleY +")");

                preTestValue = expFmt(preTestScaleLogOdds.invert(preTestHandleY));
                preTestHandleTextNeg.text(preTestValue);
                preTestHandleTextPos.text(preTestValue);

                //postTestHandle.attr("y", newPostTesty);
                postTestHandleNeg.attr("transform", "translate("+ postTestAxis +"," + postTestHandleYNeg +")");
                postTestValueNeg = expFmt(postTestScaleLogOdds.invert(postTestHandleYNeg));
                postTestHandleNeg.select('text').text(postTestValueNeg);
                postTestHandlePos.attr("transform", "translate("+ postTestAxis +"," + postTestHandleYPos +")");
                postTestValuePos = expFmt(postTestScaleLogOdds.invert(postTestHandleYPos));
                postTestHandlePos.select('text').text(postTestValuePos);
                updateLineNeg();
                updateLinePos();
            }
        })
    );

preTestHandle.append("path")
    .attr("class", "pointedRect neg")
    .attr("d", leftRoundedRect(0, 0, toolTipWidth, toolTipHeight, 5));

preTestHandle.append("path")
    .attr("class", "pointedRect pos")
    .attr("d", rightRoundedRect(0, 0, toolTipWidth, toolTipHeight, 5));

var preTestHandleTextNeg = preTestHandle.append("text")
    .attr("x", handlePaddingX)
    .attr("y", handlePaddingY)
    .attr("stroke", "none")
    .style("fill", "white")
    .text(preTestValue);

var preTestHandleTextPos = preTestHandle.append("text")
    .attr("x", -toolTipWidth-5)
    .attr("y", handlePaddingY)
    .attr("stroke", "none")
    .style("fill", "white")
    .text(preTestValue);

var lRlt1ToolTipFmt = d3.format(".3f");
var lRlt1to10ToolTipFmt = d3.format(".2f");
var lRgt10ToolTipFmt = d3.format(".0f");
var lRHandleNeg = svg.append("g")
    .attr("transform", "translate("+ lRAxis +"," + lRHandleYNeg +")")
    .callReturn(dragAttrs)
    .call(d3.drag().on("drag", function() {
        //dragging this updates both lr and postTest handles
        //check that both still on scale
        var ptY = Number(preTestHandleY);
        var dy = (lRHandleYNeg + d3.event.dy) - ptY;
        var newPostTestY = (lRHandleYNeg + d3.event.dy) + dy;
        if(newPostTestY >= rangeMin
            && newPostTestY <= rangeMax
            && (lRHandleYNeg + d3.event.dy) >= logLikelihoodRatioScale(lLScaleMin)
            && (lRHandleYNeg + d3.event.dy) <= logLikelihoodRatioScale(lLScaleMax)
            ) {
                lRHandleYNeg += d3.event.dy;
                postTestHandleYNeg = newPostTestY;
                d3.select(this).attr("transform", "translate("+ lRAxis +"," + lRHandleYNeg +")");

                var rawlRValue = lrFmt(logLikelihoodRatioScale.invert(lRHandleYNeg));
                var lRValueNeg;
                if(rawlRValue < 1) {
                    lRValueNeg = lRlt1ToolTipFmt(rawlRValue);
                }
                else if(rawlRValue < 10) {
                    lRValueNeg = lRlt1to10ToolTipFmt(rawlRValue, 2);
                }
                else {
                    lRValueNeg = lRgt10ToolTipFmt(rawlRValue);
                }

                lRHandleNeg.select('text').text(lRValueNeg);
                postTestHandleNeg.attr("transform", "translate("+ postTestAxis +"," + postTestHandleYNeg +")");
                postTestValueNeg = expFmt(postTestScaleLogOdds.invert(postTestHandleYNeg));
                postTestHandleNeg.select('text').text(postTestValueNeg);

                updateLineNeg();
            }
        })
    );

lRHandleNeg.append("path")
    .attr("class", "pointedRect neg")
    .attr("d", leftRoundedRect(0, 0, toolTipWidth, toolTipHeight, 5));

lRHandleNeg.append("text")
    .attr("x", handlePaddingX)
    .attr("y", handlePaddingY)
    .attr("stroke", "none")
    .style("fill", "white")
    .text(lRValueNeg);

var lRHandlePos = svg.append("g")
    .attr("transform", "translate("+ lRAxis +"," + lRHandleYPos +")")
    .callReturn(dragAttrs)
    .call(d3.drag().on("drag", function() {
            //dragging this updates both lr and postTest handles
            //check that both still on scale
            var ptY = Number(preTestHandleY);
            var dy = (lRHandleYPos + d3.event.dy) - ptY;
            var newPostTestY = (lRHandleYPos + d3.event.dy) + dy;
            if(newPostTestY >= rangeMin
                && newPostTestY <= rangeMax
                && (lRHandleYPos + d3.event.dy) >= logLikelihoodRatioScale(lLScaleMin)
                && (lRHandleYPos + d3.event.dy) <= logLikelihoodRatioScale(lLScaleMax)
            ) {
                lRHandleYPos += d3.event.dy;
                postTestHandleYPos = newPostTestY;
                d3.select(this).attr("transform", "translate("+ lRAxis +"," + lRHandleYPos +")");

                var rawlRValue = lrFmt(logLikelihoodRatioScale.invert(lRHandleYPos));
                var lRValuePos;
                if(rawlRValue < 1) {
                    lRValuePos = lRlt1ToolTipFmt(rawlRValue);
                }
                else if(rawlRValue < 10) {
                    lRValuePos = lRlt1to10ToolTipFmt(rawlRValue, 2);
                }
                else {
                    lRValuePos = lRgt10ToolTipFmt(rawlRValue);
                }

                lRHandlePos.select('text').text(lRValuePos);
                postTestHandlePos.attr("transform", "translate("+ postTestAxis +"," + postTestHandleYPos +")");
                postTestValuePos = expFmt(postTestScaleLogOdds.invert(postTestHandleYPos));
                postTestHandlePos.select('text').text(postTestValuePos);

                updateLinePos();
            }
        })
    );

lRHandlePos.append("path")
    .attr("class", "pointedRect pos")
    .attr("d", rightRoundedRect(0, 0, toolTipWidth, toolTipHeight, 5));

lRHandlePos.append("text")
    .attr("x", -toolTipWidth-5)
    .attr("y", handlePaddingY)
    .attr("stroke", "none")
    .style("fill", "white")
    .text(lRValuePos);

var postTestHandleNeg = svg.append("g")
    .attr("transform", "translate("+ postTestAxis +"," + postTestHandleYNeg +")")
    .callReturn(dragAttrs)
    .call(d3.drag().on("drag", function() {
        //dragging this updates both postTest and lr handles - check that both still on scale
        var newLRy = 0.5 * ((postTestHandleYNeg + d3.event.dy) + Number(preTestHandleY));
        if((postTestHandleYNeg + d3.event.dy) >= rangeMin
            && (postTestHandleYNeg + d3.event.dy) <= rangeMax
            && newLRy >= logLikelihoodRatioScale(lLScaleMin)
            && newLRy <= logLikelihoodRatioScale(lLScaleMax)
            ) {
            //console.log(newLRy);
            //console.log(logLikelihoodRatioScale(lLScaleMax));
            postTestHandleYNeg += d3.event.dy;
            lRHandleYNeg = newLRy;
            d3.select(this).attr("transform", "translate("+ postTestAxis +"," + postTestHandleYNeg +")");

            postTestValueNeg = expFmt(postTestScaleLogOdds.invert(postTestHandleYNeg));
            postTestHandleNeg.select('text').text(postTestValueNeg);
            lRHandleNeg.attr("transform", "translate("+ lRAxis +"," + lRHandleYNeg +")");
            var rawlRValue = lrFmt(logLikelihoodRatioScale.invert(newLRy));
            if(rawlRValue < 1) {
                lRValueNeg = lRlt1ToolTipFmt(rawlRValue);
            }
            else if(rawlRValue < 10) {
                lRValueNeg = lRlt1to10ToolTipFmt(rawlRValue, 2);
            }
            else {
                lRValueNeg = lRgt10ToolTipFmt(rawlRValue);
            }
            lRHandleNeg.select('text').text(lRValueNeg);

            updateLineNeg();
        }
    })
    );

postTestHandleNeg.append("path")
    .attr("class", "pointedRect neg")
    .attr("d", leftRoundedRect(0, 0, toolTipWidth, toolTipHeight, 5));

postTestHandleNeg.append("text")
    .attr("x", handlePaddingX)
    .attr("y", handlePaddingY)
    .attr("stroke", "none")
    .style("fill", "white")
    .text(postTestValueNeg);

var postTestHandlePos = svg.append("g")
    .attr("transform", "translate("+ postTestAxis +"," + postTestHandleYPos +")")
    .callReturn(dragAttrs)
    .call(d3.drag().on("drag", function() {
            //dragging this updates both postTest and lr handles - check that both still on scale
            var newLRy = 0.5 * ((postTestHandleYPos + d3.event.dy) + Number(preTestHandleY));
            if((postTestHandleYPos + d3.event.dy) >= rangeMin
                && (postTestHandleYPos + d3.event.dy) <= rangeMax
                && newLRy >= logLikelihoodRatioScale(lLScaleMin)
                && newLRy <= logLikelihoodRatioScale(lLScaleMax)
            ) {
                //console.log(newLRy);
                //console.log(logLikelihoodRatioScale(lLScaleMax));
                postTestHandleYPos += d3.event.dy;
                lRHandleYPos = newLRy;
                d3.select(this).attr("transform", "translate("+ postTestAxis +"," + postTestHandleYPos +")");

                postTestValuePos = expFmt(postTestScaleLogOdds.invert(postTestHandleYPos));
                postTestHandlePos.select('text').text(postTestValuePos);
                lRHandlePos.attr("transform", "translate("+ lRAxis +"," + lRHandleYPos +")");
                var rawlRValue = lrFmt(logLikelihoodRatioScale.invert(newLRy));
                if(rawlRValue < 1) {
                    lRValuePos = lRlt1ToolTipFmt(rawlRValue);
                }
                else if(rawlRValue < 10) {
                    lRValuePos = lRlt1to10ToolTipFmt(rawlRValue, 2);
                }
                else {
                    lRValuePos = lRgt10ToolTipFmt(rawlRValue);
                }
                lRHandlePos.select('text').text(lRValuePos);

                updateLinePos();
            }
        })
    );

postTestHandlePos.append("path")
    .attr("class", "pointedRect pos")
    .attr("d", rightRoundedRect(0, 0, toolTipWidth, toolTipHeight, 5));

postTestHandlePos.append("text")
    .attr("x", -toolTipWidth-5)
    .attr("y", handlePaddingY)
    .attr("stroke", "none")
    .style("fill", "white")
    .text(postTestValuePos);

