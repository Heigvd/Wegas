/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2018 School of Management and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @author Jarle.Hulaas@heig-vd.ch
 */

YUI.add('wegas-mbenefits-bargauge', function(Y) {
    "use strict";

    var CONTENTBOX = 'contentBox',
        DEFAULT_COLORS = { "0%": "#00CC00", "50%": "#FFFF00", "100%": "#FF0000"},
        BarGauge;

    BarGauge = Y.Base.create("wegas-media-bargauge", Y.Widget, [Y.Wegas.Widget, Y.WidgetChild, Y.Wegas.Editable], {
        CONTENT_TEMPLATE: null,

        // *** Lifecycle Methods *** //
        initializer: function() {
            this.handlers = [];
            var variable = (this.get("variable.evaluated") && this.get("variable.evaluated").getInstance()) || null;
            this.valueID = variable ? variable.get("id") : 0;
            this.minValue = this.get("minValue") || 0;
            this.maxValue = this.get("maxValue") || 100;
            if (this.minValue >= this.maxValue) {
                alert("minValue cannot be greater or equal to maxValue");
                this.minValue = 0;
                this.maxValue = 100;
            }
            this.decimals = this.get("decimals") || 0;
            this.currValue = Math.max(this.minValue, Math.min(this.maxValue, variable ? variable.get("value") : 0));
            this.height = this.get("widgetHeight") || 100;
            this.showScale = this.get("showScale");
            this.showValue = this.get("showValue");
            this.suffix = this.get("suffix");
            this.colors = this.cleanUpColors(this.get("colors"));
            this.showTooltip = this.get("showTooltip");
            this.tooltip = this.showTooltip ? (variable ? this.get("variable.evaluated").getLabel() : '') : null;
            this.animate = this.get("animate");
            this.prevValue = this.currValue;
        },

        animateFromMin: function() {
            this.prevValue = this.minValue;
            this.syncUI();
        },

        cleanUpColors: function(colors) {
            if (!colors || (Object.keys(colors).length === 0 && colors.constructor === Object)) {
                colors = DEFAULT_COLORS;
            }
            var res = [];
            for (var key in colors) {
                if (colors.hasOwnProperty(key)) {
                    if (key) {
                        var k = parseInt(key),
                            newObj,
                            color;
                        if (isNaN(k)) {
                            alert("Invalid color percentage: " + key);
                            continue;
                        }
                        color = colors[key];
                        newObj = { offset: k + "%", color: color};
                        res.push(newObj);
                        if (k === 100) {
                            this.bottomColor = color;
                        }
                    }
                }
            }
            return res;
        },

        renderUI: function() { // Create all DOM elements

            var width = 90,
                height = this.height,
                tubeWidth = 10,
                fontSizePx = 10,
                tubeBorderWidth = 2,
                maxValue = this.maxValue,
                minValue = this.minValue,
                currentValue = this.currValue,
                showScale = this.showScale,
                showCurrentTemp = this.showValue,
                animate = this.animate && this.prevValue !== currentValue,
                rounded = true,
                tubeBorderColor = "#CCCCCC",
                arrowColor = "#333333",
                currTempLevelColor = "#CCCCCC",
                animationDuration = 4000,
                suffix = this.suffix;

            // Try to minimize widget width when possible (it's symmetric around the center of the gauge):
            if (!showScale && !showCurrentTemp) {
                width = tubeWidth + 2*tubeBorderWidth;
            }

            var roundedTipRadius = tubeWidth/2,
                topPadding = rounded ? (roundedTipRadius + 2*tubeBorderWidth) : (showCurrentTemp||showScale ? fontSizePx/2 : 0),
                rectTopXLeft = (width - tubeWidth)/2,
                rectTopXRight = (width + tubeWidth)/2,
                rectHeight = height - 2*topPadding,
                rectTopY = topPadding,
                rectBottomY = rectTopY + rectHeight;

            var cb = this.get(CONTENTBOX),
                id = cb.get("id");
            // Suppress previous rendering:
            cb.setHTML("");

            if(this.showTooltip) {
                var extra = suffix === '' ?
                            currentValue.toFixed(this.decimals) + '/' + maxValue :
                            currentValue.toFixed(this.decimals) + suffix;
                cb.set("title", this.tooltip + ' (' + extra + ') ');
            }

            // Library D3 is mainly useful for SVG transitions and for drawing the vertical scale:
            var svg = d3.select("#" + id)
                .append("svg")
                .attr("width", width)
                .attr("height", height);


            var defs = svg.append("defs");

            // Rect element for tube
            svg.append("rect")
                .attr("x", rectTopXLeft)
                .attr("y", rectTopY)
                .attr("height", rectHeight)
                .attr("width", tubeWidth)
                .style("shape-rendering", "crispEdges")
                .style("fill", "#FFFFFF")
                .style("stroke", tubeBorderColor)
                .style("stroke-width", tubeBorderWidth + "px");

            if (rounded) {
                // White fill for rounded tube top circle element
                // to hide the border at the top of the tube rect element
                svg.append("circle")
                    .attr("r", (tubeWidth/2)+0.5)
                    .attr("cx", width/2)
                    .attr("cy", rectTopY)
                    .style("fill", "#FFFFFF")
                    .style("stroke", tubeBorderColor)
                    .style("stroke-width", "1px");

                // Idem for the rounded bottom element:
                svg.append("circle")
                    .attr("r", (tubeWidth/2)+0.5)
                    .attr("cx", width/2)
                    .attr("cy", rectBottomY)
                    .style("fill", this.bottomColor)
                    .style("stroke", tubeBorderColor)
                    .style("stroke-width", "1px");
            }


            // Scale step size
            var step = Math.floor((maxValue - minValue) / 5); // = 20 (typically)
            if (step === 0) {
                step = 1;
            }

            // Determine the range of the temperature scale
            var domain = [
                step * Math.floor(minValue / step),
                step * Math.ceil(maxValue / step)
            ];

            // D3 scale object
            var scale = d3.scaleLinear()
                .range([rectBottomY, rectTopY])
                .domain(domain);


            var currScaleY = scale(currentValue),
                tubeFillWidth = tubeWidth,
                tubeFillTopX = rectTopXLeft,
                tubeFillTopY = rectTopY,
                tubeFillHeight = rectHeight,
                barGradient = defs.append('linearGradient')
                .attr("id", "barGradient_" + id)
                .attr('x1', '0')
                .attr('x2', '0')
                .attr('y1', '0')
                .attr('y2', '1');

            for (var i=0; i<this.colors.length; i++) {
                barGradient.append("stop")
                    .attr("offset", this.colors[i].offset)
                    .style("stop-color", this.colors[i].color);
            }

            // Rect element for the coloured mercury column
            svg.append("rect")
                .attr("x", tubeFillTopX)
                .attr("y", tubeFillTopY)
                .attr("width", tubeFillWidth)
                .attr("height", tubeFillHeight)
                .style("shape-rendering", "crispEdges")
                .style("fill", "url(#barGradient_" + id + ")");

            // Rect element for proportionally hiding the mercury column
            var overlayHeight = currScaleY - tubeFillTopY,
                prevHeight = scale(this.prevValue) - tubeFillTopY;

            svg.append("rect")
                .attr("id", "gradientOverlay_" + id)
                .attr("x", tubeFillTopX)
                .attr("y", tubeFillTopY)
                .attr("width", tubeFillWidth)
                .attr("height", animate ? prevHeight : overlayHeight)
                .style("shape-rendering", "crispEdges")
                .style("fill", "#FFFFFF")
                .style("stroke", "none");

            svg.append("line")
                .attr("id", "CurrentTempLine_" + id)
                .attr("x1", rectTopXLeft)
                .attr("x2", rectTopXRight)
                .attr("y1", currScaleY)
                .attr("y2", currScaleY)
                .style("stroke", animate ? "transparent" : currTempLevelColor)
                .style("stroke-width", "1px")
                .style("shape-rendering", "crispEdges");


            if (showCurrentTemp) {
                var textColor = (currentValue < maxValue / 2 ? "rgb(230, 0, 0)" : "rgb(0, 0, 230)"),
                    textOffset = -5,
                    label = currentValue.toFixed(this.decimals) + suffix;

                svg.append("text")
                    .attr("id", "currentValue_" + id)
                    .attr("x", rectTopXRight + fontSizePx)
                    .attr("y", currScaleY + textOffset)
                    .attr("dy", "0.75em")
                    .text(label)
                    .style("fill", animate ? "transparent" : textColor)
                    .style("font-size", fontSizePx + "px")

                var x0 = rectTopXRight + tubeBorderWidth,
                    // Draw a triangle as pointer:
                    h2 = fontSizePx / 2,
                    lineData =
                        [
                            {"x": x0, "y": currScaleY},
                            {"x": x0 + h2, "y": currScaleY - h2},
                            {"x": x0 + h2, "y": currScaleY + h2}
                        ];

                var lineFunction = d3.line()
                    .x(function (d) {
                        return d.x;
                    })
                    .y(function (d) {
                        return d.y;
                    });

                svg.append("path")
                    .attr("d", lineFunction(lineData))
                    .attr("id", "triangle_" + id)
                    .attr("fill", animate ? "transparent" : arrowColor)
                    .attr("stroke-width", "0");
            }

            if (showScale) {
                // Dedicated scale for adjusting the ticks:
                var scale2 = d3.scaleLinear()
                    .range([rectBottomY, rectTopY-1])
                    .domain(domain);

                // Values to use along the scale ticks up the thermometer
                var tickValues = d3.range((domain[1] - domain[0])/step + 1).map(function(v) { return domain[0] + v * step; });

                // D3 axis object for the temperature scale
                var axis = d3.axisLeft(scale2)
                    //.innerTickSize(7)
                    //.outerTickSize(0)
                    .tickValues(tickValues);

                // Add the axis to the image
                var svgAxis = svg.append("g")
                    .attr("id", "tempScale")
                    .attr("transform", "translate(" + (rectTopXLeft) + ",0)")
                    .call(axis);

                // Format text labels
                svgAxis.selectAll(".tick text")
                    .style("fill", "#777777")
                    .style("font-size", fontSizePx + "px");

                // Set main axis line to no stroke or fill
                svgAxis.select("path")
                    .style("stroke", "none")
                    .style("fill", "none");

                // Set the style of the ticks
                svgAxis.selectAll(".tick line")
                    .style("stroke", tubeBorderColor)
                    .style("shape-rendering", "crispEdges")
                    .style("stroke-width", "1px");

            }


            if (animate) {
                d3.select("#gradientOverlay_" + id).transition()
                    .duration(animationDuration)
                    .attrTween("height", function () {
                        return d3.interpolateNumber(prevHeight, overlayHeight)
                    })
                    .on("end", function(){
                        d3.select("#CurrentTempLine_" + id)
                            .style("stroke", currTempLevelColor);
                        if (showCurrentTemp) {
                            d3.select("#triangle_" + id)
                                .attr("fill", arrowColor);
                            d3.select("#currentValue_" + id)
                                .style("fill", textColor);
                        }
                    });
            }
            this.prevValue = currentValue;

            // Definitively fix widget height:
            cb.setStyle("height", height + "px");

        },

        bindUI: function() {
            var varID = this.valueID || '*';
            this.handlers.push(
                Y.Wegas.Facade.Instance.on(varID + ":updatedInstance", this.syncUI, this)
            );
        },

        // Depending on the displayed variable, catches either instance updates with a specific ID
        // or all instance updates (when a client-side pseudo-variable with an arithmetic expression is provided).
        syncUI: function() {
            this.currValue = this.get("variable.evaluated").getInstance().get("value");
            if (this.currValue === this.prevValue) return;
            if (this.currValue > this.maxValue) this.currValue = this.maxValue;
            if (this.currValue < this.minValue) this.currValue = this.minValue;
            this.renderUI();
        },

        /**
         *
         */
        destructor: function() {
            Y.Array.each(this.handlers, function(i) {
                i.detach();
            });
            return;
        }
    }, {
        ATTRS: {
            variable: {
                type: 'object',
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                view: {
                    type: "variableselect",
                    label: "Variable being displayed",
                    classFilter: ["NumberDescriptor"]
                }
            },
            minValue: {
                type: "number",
                index: 1,
                value: 0,
                view: {
                    label: "Min value"
                }
            },
            maxValue: {
                type: "number",
                index: 2,
                value: 100,
                view: {
                    label: "Max value"
                }
            },
            widgetHeight: {
                type: "number",
                index: 3,
                optional: true,
                view: {
                    label: "Height (px)"
                }
            },
            showScale: {
                type: "boolean",
                index: 4,
                value: true,
                view: {
                    label: "Show scale"
                }
            },
            showValue: {
                type: "boolean",
                index: 5,
                value: true,
                view: {
                    label: "Show value"
                }
            },
            showTooltip: {
                type: "boolean",
                index: 6,
                value: false,
                view: {
                    label: "Show tooltip"
                }
            },
            decimals: {
                type: "number",
                index: 7,
                value: 0,
                visible: function(val, formVal) {
                    return formVal.showValue || formVal.showTooltip;
                },
                view: {
                    label: "Number of displayed decimals"
                }
            },
            suffix: {
                type: "string",
                index: 8,
                value: "",
                visible: function(val, formVal) {
                    return formVal.showValue || formVal.showTooltip;
                },
                view: {
                    label: "Suffix for current value"
                }
            },
            animate: {
                type: "boolean",
                index: 9,
                value: true,
                view: {
                    label: "Animate transitions"
                }
            },
            colors: {
                type: 'object',
                index: 10,
                additionalProperties: {
                    type: "string",
                    required: true,
                    view: {
                        label: "CSS color"
                    }
                },
                view: {
                    label: "Optional: color gradient as { percentage, color } pairs",
                    description: "Default values from top to bottom: {0, #00CC00}, {50, #FFFF00}, {100, #FF0000}",
                    type: "hashlist",
                    keyLabel: "Percentage"
                }
            },

        }
    });
    Y.Wegas.BarGauge = BarGauge;
},'V1.0', {
    requires: ['node', 'event']
});
