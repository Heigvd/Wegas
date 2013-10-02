/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */

YUI.add('wegas-chart', function(Y) {
    var CONTENTBOX = 'contentBox',
            Chart = Y.Base.create("wegas-chart", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        bindUI: function() {
            this.dsUpdateHandler = Y.Wegas.Facade.VariableDescriptor.after("update", this.syncUI, this);
        },
        syncUI: function() {
            var vd, i, variables = this.get("variables");
            this.vdList = [];
            this.requestCounter = 0;

            for (i = 0; i < variables.length; i++) {
                vd = Y.Wegas.Facade.VariableDescriptor.cache.find("name", variables[i].name);
                if (!vd) {
                    this.showMessage("error", "Variable " + variables[i].name + " not found");
                    return;
                }
                vd.position = i;
                vd.label = variables[i].label || variables[i].name;

                this.vdList[i] = null;
                this.historyRequest(vd);
            }
        },
        destructor: function() {
            if (this.chart) {
                this.chart.destroy();
            }
            this.dsUpdateHandler.detach();
            Y.Wegas.DataSource.abort(this.historyRequestId);
        },
        historyRequest: function(vd) {
            this.historyRequestId = Y.Wegas.Facade.VariableDescriptor.cache.getWithView(vd.getInstance(), "Extended", {
                on: {
                    success: Y.bind(function(e) {
                        var entity = e.response.entity;
                        entity.label = vd.label;

                        this.vdList[vd.position] = entity;

                        this.requestCounter += 1;
                        if (this.requestCounter === this.get("variables").length) {
                            this.createChart();
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
            });
        },
        /**
         * Creat a YUI3 Charts combospline' with values of a resource's moral and confidence historic values.
         * If any resource is given, the chart will be not created.
         * @ Param NumberDescriptor numberDescriptor, the source of chart's values
         */
        createChart: function() {
            var i, cb = this.get(CONTENTBOX),
                    seriesCollection = [],
                    rawSeries = [];

            if (this.chart) {
                this.chart.destroy();
            }
            if (this.vdList.length < 1)
                return;

            for (i = 0; i < this.vdList.length; i++) {
                seriesCollection.push({
                    yDisplayName: this.vdList[i].label
                });
                rawSeries.push(this.vdList[i].get("history"));
            }

            this.chart = new Y.Chart({
                type: this.get("chartType"),
                seriesCollection: seriesCollection,
                // categoryType:"time",                                         // Start sur l'axe mais l'axe devient time
                axes: {
                    values: {
                        minimum: this.get("minValue"),
                        maximum: this.get("maxValue")
                    }
                },
                legend: {
                    styles: {
                        gap: 0
                    },
                    position: this.get("legendPosition")
                },
                tooltip: {
                    markerLabelFunction: function(categoryItem, valueItem, itemIndex, series, seriesIndex) {
                        return new Y.Node.create('<div><div><p>' + valueItem.displayName + ': ' + valueItem.axis.get("labelFunction").apply(this, [valueItem.value]) + '</p></div></div>');
                    }
                },
                dataProvider: this.getChartValues(this.findNumberOfValue(rawSeries), rawSeries),
                horizontalGridlines: this.get("horizontalGridlines"),
                verticalGridlines: this.get("verticalGridlines")
            });
            this.chart.render(cb);
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
            var i, j, fitSeries = [], serieRawData = [], serieFitData = [];

            for (i = 0; i < numberOfValues; i++) {
                serieFitData.push(i + 1);
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
                for (i = 1; i < 10; i++) {
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
                    useButtons: true,
                    elementType: {
                        type: "variableselect",
                        label: "variable"
                    }
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
            width: {
                type: "string",
                value: "250px",
                "transient": false
            },
            height: {
                type: "string",
                value: "200px",
                "transient": false
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

    Y.namespace('Wegas').Chart = Chart;
});
