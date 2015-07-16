/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
YUI.add('wegas-chart', function(Y) {
    var CONTENTBOX = 'contentBox', Chart,
        styleColor = ["#ed6a3c", "#1deaed", "#343843", "#7b818f"];

    Chart = Y.Base.create("wegas-chart", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        initializer: function() {
            this.requestHistory = [];
        },
        bindUI: function() {
            this.dsUpdateHandler = Y.Wegas.Facade.Variable.after("update", this.syncUI, this);
        },
        renderUI: function() {
            this.get(CONTENTBOX).append("Loading...");
            this.chart = new Y.Chart({
                type: this.get("chartType"),
//                seriesCollection: seriesCollection,
                // categoryType:"time",                                         // Start sur l'axe mais l'axe devient time
                axes: {
                    values: {
                        minimum: this.get("minValue"),
                        maximum: this.get("maxValue"),
                        calculateEdgeOffset: false
                    },
                    category: {
                        type: "numeric",
                        minimum: +this.get("hStart")
                        // calculateEdgeOffset: true
                    }
                },
//                legend: {
//                    styles: {
//                        gap: 0
//                    },
//                    position: this.get("legendPosition")
//                },
                tooltip: {
                    markerLabelFunction: function(categoryItem, valueItem, itemIndex, series, seriesIndex) {
                        return new Y.Node.create('<div><div><p>' + valueItem.displayName + ': ' + valueItem.axis.get("labelFunction").apply(this, [valueItem.value]) + '</p></div></div>');
                    }
                },
                dataProvider: [],
                horizontalGridlines: this.get("horizontalGridlines"),
                verticalGridlines: this.get("verticalGridlines")
            });
        },
        syncUI: function() {
            var vd, i, variables = this.get("variables");
            this.vdList = [];
            this.requestCounter = 0;

            for (i = 0; i < variables.length; i++) {
                vd = Y.Wegas.Facade.Variable.cache.find("name", variables[i].name);
                if (!vd) {
                    this.showMessage("error", "Variable " + variables[i].name + " not found");
                    return;
                }
                vd.position = i;
                vd.label = variables[i].label || vd.get("label");

                this.vdList[i] = null;
                this.historyRequest(vd);
            }
        },
        destructor: function() {
            if (this.chart) {
                this.chart.destroy();
            }
            this.dsUpdateHandler.detach();
            Y.Array.each(this.requestHistory, function(item) {
                Y.Wegas.DataSource.abort(item);
            });
        },
        historyRequest: function(vd) {
            this.requestHistory.push(Y.Wegas.Facade.Variable.cache.getWithView(vd.getInstance(), "Extended", {
                on: {
                    success: Y.bind(function(e) {
                        var entity = e.response.entity;
                        entity.label = vd.label;

                        this.vdList[vd.position] = entity;

                        this.requestCounter += 1;
                        if (this.requestCounter === this.get("variables").length) {
                            this.updateChart();
                        }
                    }, this),
                    failure: function(r) {
                        if (r.serverResponse.status === 0) {
                            Y.log("Abort history query", "info", "Y.Wegas.Chart");
                        } else {
                            Y.error("Error by loading history data");
                        }
                    }
                }
            }));
        },
        /**
         * Creat a YUI3 Charts combospline' from given 'variables'
         */
        updateChart: function() {
            var i, cb = this.get(CONTENTBOX),
                seriesCollection = [],
                rawSeries = [], data, axis,
                hStep = this.get("hStep"),
                vStep = this.get("vStepValue"),
                max = -Infinity, min = Infinity,
                range, j, n,
                styles = {
                    series:{},
                    graph:{
                        background:{
                            fill:{
                                alpha:0
                            },
                            border:{
                                alpha:0
                            }
                        }
                    }
                };

            if (this.vdList.length < 1) {
                return;
            }

            /* Create a serie for each given variable */
            
            for (i = 0; i < this.vdList.length; i++) {
                // name of serie
                seriesCollection.push({
                    yDisplayName: this.vdList[i].label
                });
                
                /* Serie values are history + currentValue */
                rawSeries.push(this.vdList[i].get("history"));
                rawSeries[rawSeries.length - 1].push(this.vdList[i].get("value"));

                // For auto Y-axis ticks adjustment, fetch min and max values
                for (j = 0; j < rawSeries[rawSeries.length - 1].length; j++) {
                    max = Math.max(max, rawSeries[rawSeries.length - 1][j]);
                    min = Math.min(min, rawSeries[rawSeries.length - 1][j]);
                }
            }
            
            // Y-Axis scale
            axis = this.chart.getAxisByKey("values");  // i.e. Y-axis
            
            if (!vStep) {
                // Default vStep is 10% of range value -> 11 ticks
                vStep = Math.floor((max - min) / 10) || 1;
            }
            if (max !== 0) {
                max += vStep; // reserve some room
            }
            if (min !== 0) {
                min -= vStep; // reserve some room too but avoid going bellow zero
            }
            axis.set("maximum", max);
            axis.set("minimum", min);
            range = max - min;

            n = range / vStep; // how many ticks fit within 'maximum'

            // Math.log10(x) =~ Math.log(x)/Math.LN10...
            //if (n > 11) {
            //    n = Math.ceil(n / Math.pow(10, Math.ceil(Math.log(n) / Math.LN10) - 1)); // let n an integer \in ]1;10] 
            //    Y.log("N Ticks: " + n);
            //}

            if (n === range / vStep) {
                n++; // need an extra tick
            }

            range = n * vStep; // New range is a whole multiple of vStep

            this.chart.getAxisByKey("values").set("styles", {
                label:{
                    color:"#a3a7b0"
                },
                majorUnit: {
                    count: n
                }
            });

            this.chart.set("dataProvider", this.getChartValues(this.findNumberOfValue(rawSeries), rawSeries));
            axis = this.chart.getAxisByKey("category");
            if (this.get("hMinEnd.evaluated")) {
                data = axis.get("data");
                this.chart.getAxisByKey("category").set("maximum", Math.max(data[data.length - 1], this.get("hMinEnd.evaluated").getValue(), 2/*minimum 2 points (width...)*/));
            }
            hStep = hStep > 0 ? hStep : 1;
            this.chart.getAxisByKey("category").set("styles", {
                label:{
                    color:"#a3a7b0"
                },
                majorUnit: {
                    count: (axis.get("maximum") - axis.get("minimum")) / hStep + 1
                }
            });

            if (!this.chart.get("rendered")) {
                this.chart.set("styles", {
                    graph:{
                        background:{
                            fill:{
                                alpha:0
                            },
                            border:{
                                alpha:0
                            }
                        }
                    }
                });
                
                this.chart.set("legend", {
                    styles: {
                        gap: 12,
                        background:{
                            fill:{
                                color:"#a3a7b0"
                            }
                        }
                    },
                    position: this.get("legendPosition")
                });
                
                this.get(CONTENTBOX).empty();
                this.chart.render(cb);
                this.chart.set("seriesCollection", seriesCollection);
                this.chart.get("seriesCollection").forEach(function(serie, index){
                    serie.set("styles", {
                        line:{
                            color:styleColor[(index%4)]
                        },
                        marker:{
                            fill:{
                                color:styleColor[(index%4)]
                            },
                            border:{
                                color:styleColor[(index%4)]
                            },
                            over:{
                                fill:{
                                    color:styleColor[(index%4)]
                                },
                                border:{
                                    color:styleColor[(index%4)]
                                },
                                width: 12,
                                height: 12
                            }
                        },
                    });
                });
                this.chart.get("legend").get("items").forEach(function(legend, index){
                    legend.shape.set("fill", {
                        color:styleColor[(index%4)]
                    });
                    legend.shape.set("stroke", {
                        color:"#ffffff",
                        weight:1.5
                    });
                });
            } else {
                this.chart.syncUI();
            }
        },
        findNumberOfValue: function(series) {
            var i, number = 0;
            if (!this.get("numberOfValue")) {
                for (i = 0; i < series.length; i++) {
                    if (series[i].length > number) {
                        number = series[i].length;
                    }
                }
                return number;
            } else {
                return this.get("numberOfValue");
            }
        },
        /**
         * Create series for the chart.
         * i = numberOfValues
         * For each series, If number of values is smaller than i, copy the last value to create a serie with i values.
         * If number of values is greater than i, keep only the i last values.
         * @param Integer numberOfValues, the number of value wanted in the series.
         * @param Array rawSeries, an array of array of Integer.
         */
        getChartValues: function(numberOfValues, rawSeries) {
            var i, j, fitSeries = [], serieRawData = [], serieFitData = [],
                dx = +this.get("hStart");

            for (i = 0; i < numberOfValues; i++) {
                serieFitData.push(i + dx);
            }

            fitSeries.push(serieFitData.slice());
            for (i = 0; i < rawSeries.length; i++) {
                serieRawData = rawSeries[i];
                serieFitData.length = 0;
                for (j = numberOfValues - 1; j >= 0; j--) {
                    if (serieRawData.length - 1 >= j) {
                        serieFitData.push(serieRawData[serieRawData.length - (j + 1)]);
                    }
                }
                fitSeries.push(serieFitData.slice());
            }

            if (fitSeries[0].length === 0) {
                for (i = 1; i < 2; i++) {
                    fitSeries[0].push(i);
                }
            }
            return fitSeries;
        }
    }, {
        EDITORNAME: "Chart",
        ATTRS: {
            /**
             * The target variable, returned either based on the variableName attribute,
             * and if absent by evaluating the expr attribute.
             */
            chartType: {
                type: "string",
                value: "combo",
                choices: ['combo', 'line'],
                _inputex: {
                    label: "Chart type"
                }
            },
            variables: {
                _inputex: {
                    _type: "list",
                    elementType: {
                        type: "variableselect",
                        label: "variable",
                        classFilter: ["NumberDescriptor"]
                    }
                }
            },
            hStart: {
                optional: true,
                type: "number",
                value: 0,
                _inputex: {
                    label: "Horizontal start value"
                }
            },
            hStep: {
                optional: true,
                type: "number",
                value: 1,
                _inputex: {
                    label: "Horizontal steps"
                }
            },
            hMinEnd: {
                optional: true,
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                _inputex: {
                    _type: "variableselect",
                    label: "Minimum horizontal end value",
                    classFilter: ["NumberDescriptor"]
                }
            },
            minValue: {
                optional: true,
                _inputex: {
                    _type: "integer",
                    label: "Min. value",
                    negative: true
                }
            },
            maxValue: {
                optional: true,
                _inputex: {
                    _type: "integer",
                    label: "Max. value",
                    negative: true
                }
            },
            vStepValue: {
                optional: true,
                type: "number",
                _inputex: {
                    _type: "integer",
                    label: "vertical steps",
                    negative: false
                }
            },
            width: {
                type: "string",
                value: "250px"
            },
            height: {
                type: "string",
                value: "200px"
            },
            numberOfValue: {
                type: "Number",
                optional: "true",
                _inputex: {
                    _type: "integer",
                    label: "Number of value",
                }
            },
            legendPosition: {
                value: "bottom",
                type: "string",
                choices: ['bottom', 'left', 'right', 'top'],
                _inputex: {
                    value: "bottom"
                }
            },
            horizontalGridlines: {
                value: true,
                type: "boolean",
                _inputex: {
                    label: "Horizontal Gridlines"
                }
            },
            verticalGridlines: {
                value: true,
                type: "boolean",
                _inputex: {
                    label: "Vertical Gridlines"
                }
            }
        }
    });
    Y.Wegas.Chart = Chart;
});
