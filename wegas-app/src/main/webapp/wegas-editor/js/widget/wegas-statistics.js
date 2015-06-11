/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Cyril Junod <cyril.junod at gmail.com>
 * @author Gérald Eberle
 */
YUI.add("wegas-statistics", function(Y) {
    "use strict";
    var Data,
        Promise = Y.Promise,// remove me to use native promise
        Stats = Y.Base.create("wegas-statistics", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
            CONTENT_TEMPLATE: "<div><div class='stats-question' style='display: inline-block'>" +
                              "<select><option value='null' disabled>-Question-</option></select>" +
                              "<div>Answer count: <span class='question-answer-count'></span></div>" +
                              "<div class='chart' style='width:600px;height:400px'></div></div>" +
                              "<div class='stats-number' style='display: inline-block;vertical-align: top'>" +
                              "<select><option value='null' disabled>-Number-</option></select>" +
                              "<div class='chart' style='width:600px;height:400px'></div></div></div>",
            initializer: function() {
                this.gmPromise = Data.getCurrentGameModel();
            },
            renderUI: function() {
                var selectQNode = this.get("contentBox").one(".stats-question select"),
                    selectNNode = this.get("contentBox").one(".stats-number select"),
                    questions = Y.Wegas.Facade.Variable.cache.findAll("@class", "QuestionDescriptor"),
                    numbers = Y.Wegas.Facade.Variable.cache.findAll("@class", "NumberDescriptor");
                Y.Array.each(questions, function(i) {
                    selectQNode.appendChild("<option value='" + i.get("name") + "'>" + i.get("title") + "</option>");
                });
                Y.Array.each(numbers, function(i) {
                    selectNNode.appendChild("<option value='" + i.get("name") + "'>" + i.get("label") + "</option>");
                });
                this.chart = new Y.Chart({
                    type: "column",
                    dataProvider: [],
                    axes: {
                        values: {
                            maximum: 100,
                            minimum: 0
                        },
                        category: {
                            styles: {
                                label: {
                                    rotation: -60
                                }
                            }
                        }
                    }
                });
                this.chartNumber = new Y.Chart({
                    type: "combo",
                    dataProvider: [],
                    axes: {
                        category: {
                            styles: {
                                label: {
                                    rotation: -60
                                }
                            }
                        }
                    }
                });
            },
            bindUI: function() {
                var chartQNode = this.get("contentBox").one(".stats-question .chart"),
                    chartNNode = this.get("contentBox").one(".stats-number .chart"),
                    countNode = this.get("contentBox").one(".question-answer-count"),
                    gmPromise = this.gmPromise,
                    chart = this.chart,
                    chartNumber = this.chartNumber,
                    getLogID;
                getLogID = function(gm) {
                    if (gm.get("properties.logID")) {
                        return gm.get("properties.logID");
                    } else {
                        throw new Error("No logID defined");
                    }
                };
                this.get("contentBox").one(".stats-question select").on("valueChange", function(e) {
                    gmPromise.then(function(gm) {
                        return Data.getQuestion(getLogID(gm), e.newVal);
                    }).then(function(v) {
                        var question = Y.Wegas.Facade.Variable.cache.find("name", e.newVal),
                            choices = {}, res = [], count = 0;
                        Y.Array.each(question.get("items"), function(i) {
                            choices[(i.get("name"))] = 0;
                        });
                        Y.Array.each(v, function(i) {
                            choices[i.choice] += 1;
                            count += 1;
                        });
                        Y.Object.each(choices, function(v, k) {
                            res.push({
                                category: Y.Wegas.Facade.Variable.cache.find("name", k).get("label"),
                                values: v / (count ? count : 1) * 100
                            });
                        });
                        chart.set("dataProvider", res);
                        chart.render(chartQNode);
                        countNode.set("text", count);
                        return 1;
                    }).catch(function(e) {
                        Y.log(e, "error", "Y.Wegas.Statistics");
                    });
                });
                this.get("contentBox").one(".stats-number select").on("valueChange", function(e) {
                    gmPromise.then(function(gm) {
                        return Data.getNumber(getLogID(gm), e.newVal);
                    }).then(function(v) {
                        var res = [];
                        Y.Array.each(v, function(i) {
                            res.push({
                                category: (new Date(i.starttime)).toLocaleString(),
                                values: i.number
                            });
                        });
                        chartNumber.set("dataProvider", res);
                        chartNumber.render(chartNNode);
                        return 1;
                    }).catch(function(e) {
                        Y.log(e, "error", "Y.Wegas.Statistics");
                    });
                });
            },
            destructor: function() {
                this.gmPromise = null;
                this.chart.destroy();
                this.chartNumber.destroy();
            }
        });
    Y.Wegas.Statistics = Stats;
    Data = (function() {
        var baseURI = Y.Wegas.app.get("base"),
            getQuestion, getNumber, getStats, getCurrentGameModel;
        getStats = function(type, logID, name) {
            if (Y.Array.indexOf(["Question", "Number"], type) < 0) {
                return Promise.reject(new Error("Type " + type + " not available"));
            }
            return new Promise(function(ok, fail) {
                Y.io(baseURI + "rest/Statistics/LogId/" + logID + "/" + type + "/" + name, {
                    header: {
                        "Content-type": "application/json;charset=utf-8"
                    },
                    data: {
                        gid: Y.Wegas.Facade.Game.cache.getCurrentGame().get("id")
                    },
                    on: {
                        success: function(id, res) {
                            try {
                                ok(Y.JSON.parse(res.response));
                            } catch (er) {
                                fail(er);
                            }
                        },
                        failure: fail
                    }
                });
            });
        };
        getQuestion = function(logID, qName) {
            return getStats("Question", logID, qName);
        };
        getNumber = function(logID, qName) {
            return getStats("Number", logID, qName);
        };
        getCurrentGameModel = function() {
            var gmCache = Y.Wegas.Facade.GameModel.cache, gameModel = gmCache.getCurrentGameModel();
            return new Promise(function(resolve, reject) {
                gmCache.getWithView(gameModel, "Extended", {
                    on: {
                        success: function(v) {
                            resolve(v.response.entity);
                        },
                        failure: reject
                    }
                });
            });
        };
        return {
            getCurrentGameModel: getCurrentGameModel,
            getQuestion: getQuestion,
            getNumber: getNumber
        };
    }());
})
;
