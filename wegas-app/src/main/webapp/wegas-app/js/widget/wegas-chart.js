/*
 * Wegas
 * http://www.albasim.ch/wegas/
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
        renderUI: function() {
            this.vdList = [];
            var cb = this.get(CONTENTBOX);
            cb.setContent(
                    '<div style="width: 250px; height: 200px;" class="chart"></div>' //@fixme width and height
                    );
        },
        bindUI: function() {
        },
        syncUI: function() {
            var cb = this.get(CONTENTBOX),
                i;
//            var variableDescriptor = this.get("variable.evaluated");
            var variable = this.get("variables");
            for (i=0; i<variable.length; i++){
                var vd = Y.Wegas.Facade.VariableDescriptor.cache.find("name", variable[i].name);
                this.historyRequest(vd, variable[i].name);
            }
        },
        destructor: function() {
        },
        historyRequest: function(vd, label){
            Y.io(Y.Wegas.app.get("base") + "rest/Export/GameModel/"+ Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().get("id") + "/VariableDescriptor/" + vd.get("id") +"/VariableInstance/" + vd.getInstance().get("id"), {
                method: "GET",
                on: {
                    success: Y.bind(function(a, event) {
                        var a = Y.JSON.parse(event.responseText);
                        a.label = label;
                        this.vdList.push(a);
                        if (this.vdList.length === this.get("variables").length){
                            this.createChart();
                        }
                    }, this),
                    failure: Y.bind(function(a, event) {
                        console.log(event);
                    }, this)
                }
            });
        },
        /**
         * Creat a YUI3 Charts combospline' with values of a resource's moral and confidence historic values.
         * If any resource is given, the chart will be not created.
         * @ Param NumberDescriptor numberDescriptor, the source of chart's values
         */
        createChart: function() {
            if (this.chart)
                this.chart.destroy();
            if (this.vdList.length < 1)
                return;
            var i, seriesCollection = [
                {
                    yDisplayName: 'moral'
                },
                {
                    yDisplayName: 'confiance'
                }
            ],
                    rawSeries = [];
            for (i=0; i<this.vdList.length; i++){
                console.log(this.vdList[i].label);
                console.log(this.vdList[i].history);
                rawSeries.push(this.vdList[i].history);
            }
            this.chart = new Y.Chart({
                type: 'combospline',
                seriesCollection: seriesCollection,
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
                    chart: this.chart,
                    position: "bottom",
                    width: this.get("width"),
                    height: this.get("height")
                },
                tooltip: this.chartTooltip,
                dataProvider: this.getChartValues(this.get("numberOfValue"), rawSeries),
                horizontalGridlines: true,
                verticalGridlines: true
            });
            this.chart.render(".chart");
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
            var i, j, fitSeries = new Array(), serieRawData = new Array(), serieFitData = new Array();
            for (i = 0; i < numberOfValues; i++) {
                serieFitData.push(i);
            }
            fitSeries.push(serieFitData.slice());
            for (i = 0; i < rawSeries.length; i++) {
                serieRawData = rawSeries[i];
                serieFitData.length = 0;
                for (j = numberOfValues - 1; j >= 0; j--) {
                    if (serieRawData.length - 1 < j) {
                        serieFitData.push(serieRawData[0]);
                    } else {
                        serieFitData.push(serieRawData[serieRawData.length - (j + 1)]);
                    }
                }
                fitSeries.push(serieFitData.slice());
            }
            return fitSeries;
        },
        clear: function(cb) {
            this.chart = null;
            cb.one('.chart').setHTML();
        }
    }, {
        ATTRS: {
            /**
             * The target variable, returned either based on the variableName attribute,
             * and if absent by evaluating the expr attribute.
             */
            variables: [{
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                _inputex: {
                    _type: "variableselect",
                    label: "variable"
                }
            }],
            minValue: {
                value: 0
            },
            maxValue: {
                value: 100
            },
            width: {
                value: 250
            },
            height: {
                value: 50
            },
            numberOfValue: {
                value: 5
            }
        }
    });

    Y.namespace('Wegas').Chart = Chart;
});
