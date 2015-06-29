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
/*global Chart*/
YUI.add("wegas-statistics", function(Y) {
    "use strict";
    var Data,
        COLORS = ["#582A72",
            "#AD9DB6",
            "#7E5A92",
            "#380A51",
            "#200131"],
        Promise = Y.Promise,// remove me to use native promise
        getPath = function(entity) {
            var title = entity.getEditorLabel(), parent = entity.parentDescriptor;
            while (parent) {
                title = parent.getEditorLabel() + " \u21E8 " + title;
                parent = parent.parentDescriptor;
            }
            return title;
        }, getLogID = function(gm) {
            if (gm.get("properties.logID")) {
                return gm.get("properties.logID");
            } else {
                throw new Error("No logID defined");
            }
        },
        Stats = Y.Base.create("wegas-statistics", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
            CONTENT_TEMPLATE: "<div><div class='stats-question' style='display: inline-block'>" +
                              "<select><option value='null' disabled>-Question-</option></select><button class='gen-button'>Generate all</button>" +
                              "<i class='loading fa fa-spinner fa-pulse fa-lg' style='display: none'></i>" +
                              "<div>Answer count: <span class='question-answer-count'></span></div>" +
                              "<canvas class='chart' width='600' height='400'></canvas></div>" +
                              "<div class='stats-number' style='display: none;vertical-align: top'>" +
                              "<select><option value='null' disabled>-Number-</option></select>" +
                              "<canvas class='chart' style='width:600px;height:400px'></canvas></div></div>",
            initializer: function() {
                this.handlers = [];
                this._gmPromise = Data.getCurrentGameModel();
                this._gmPromise.then(Y.bind(function(gm) {
                    if (!gm.get("properties.logID")) {
                        this.get("contentBox").hide();
                        this.get("boundingBox").append("Statistics are not enable for this game");
                    }
                }, this));
            },
            renderUI: function() {
                var selectQNode = this.get("contentBox").one(".stats-question select"),
                    selectNNode = this.get("contentBox").one(".stats-number select"),
                    questions = Y.Wegas.Facade.Variable.cache.findAll("@class", "QuestionDescriptor"),
                    numbers = Y.Wegas.Facade.Variable.cache.findAll("@class", "NumberDescriptor");
                this._questionButton = new Y.Button({
                    srcNode: this.get("contentBox").one(".gen-button"),
                    on: {
                        click: Y.bind(this.genAllQuestion, this)
                    }
                }).render();
                this.ctx = {
                    question: this.get("contentBox").one(".stats-question canvas.chart").getDOMNode().getContext("2d"),
                    number: this.get("contentBox").one(".stats-number canvas.chart").getDOMNode().getContext("2d")
                };
                Y.Array.each(questions, function(i) {
                    selectQNode.appendChild("<option value='" + i.get("name") + "'>" + getPath(i) + "</option>");
                });
                //                Y.Array.each(numbers, function(i) {
                //                    selectNNode.appendChild("<option value='" + i.get("name") + "'>" + i.get("label")
                // + "</option>"); });
            },
            bindUI: function() {
                var chartNNode = this.get("contentBox").one(".stats-number .chart"),
                    loading = this.get("contentBox").one(".loading");
                this.handlers.push(this.get("contentBox").one(".stats-question select")
                    .on("valueChange", Y.bind(function(e) {
                        this.drawQuestion(e.newVal);
                    }, this)));
                /*      this.get("contentBox").one(".stats-number select").on("valueChange", function(e) {
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
                 });*/
            },
            genAllQuestion: function() {
                var questions = Y.Wegas.Facade.Variable.cache.findAll("@class", "QuestionDescriptor"),
                    promiseChain, i, drawQ = Y.bind(this.drawQuestion, this),
                    wHand = window.open(), wHandInfo, addToWindow, panel, setInitialState;
                panel = new Y.Wegas.Panel({
                    content: "<span class='fa fa-spinner fa-pulse fa-lg'> </span> Processing",
                    modal: true,
                    width: 400,
                    height: 50,
                    buttons: {
                        footer: []
                    }
                }).render();
                wHandInfo = Y.one(wHand.document.body).appendChild("<div>Processing ...</div>").setStyles({
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100%",
                    textAlign: "center",
                    color: "white",
                    backgroundColor: "rgba(0,0,0,0.4)"
                });
                setInitialState = Y.bind(function() {
                    wHandInfo.remove();
                    if (this.chart) {
                        this.chart.destroy();
                        this.chart = null;
                    }
                    this.get("contentBox").one(".stats-question select").getDOMNode().value = "null";
                    panel.exit();
                }, this);
                addToWindow = function(question) {
                    if (wHand.closed) {
                        throw new Error("Window has been closed, halting");
                    }
                    return drawQ(question.get("name"))
                        .then(function(result) {
                            Y.one(wHand.document.body)
                                .append("<div style='display:inline-block;width:600px;margin:1px;border:1px solid #888888'><div>" +
                                        getPath(question) + " (Count: " + result[1] +
                                        ")</div><img src='" +
                                        result[0].toBase64Image() +
                                        "'/></div>");
                        });
                };

                promiseChain = Promise.resolve();
                for (i = 0; i < questions.length; i += 1) {
                    promiseChain = promiseChain.then(Y.bind(addToWindow, null, questions[i]));
                }
                promiseChain
                    .then(setInitialState)
                    .catch(function(e) {
                        Y.Wegas.Panel.alert(e.message);
                        setInitialState();
                    });
            },
            drawQuestion: function(questionName) {
                var loading = this.get("contentBox").one(".loading");
                return this._gmPromise.then(function(gm) {
                    loading.show();
                    return Data.getQuestion(getLogID(gm), questionName);
                }).then(Y.bind(function(v) {
                    var question = Y.Wegas.Facade.Variable.cache.find("name", questionName),
                        choices = {}, data = {
                            labels: [],
                            datasets: [{
                                fillColor: COLORS[0],
                                data: []
                            }]
                        }, res = data.datasets[0].data, labels = data.labels, count = 0;
                    Y.Array.each(question.get("items"), function(i) {
                        choices[(i.get("name"))] = 0;
                    });
                    Y.Array.each(v, function(i) {
                        choices[i.choice] += 1;
                        count += 1;
                    });
                    Y.Object.each(choices, function(v, k) {
                        //                            res.push({
                        //                                category: Y.Wegas.Facade.Variable.cache.find("name",
                        // k).get("label"), values: v / (count ? count : 1) * 100 });
                        labels.push(Y.Wegas.Facade.Variable.cache.find("name", k).get("label"));
                        res.push(v / (count ? count : 1) * 100);
                    });
                    if (this.chart) {
                        this.chart.destroy();
                        this.chart = null;
                    }
                    this.chart = new Chart(this.ctx.question).Bar(data, {
                        //                         responsive: true,
                        animation: false,
                        scaleOverride: true,
                        scaleLabel: "<%=value%>%",
                        scaleSteps: 10,
                        scaleStepWidth: 10,
                        scaleStartValue: 0
                    });
                    this.get("contentBox").one(".question-answer-count").set("text", count);
                    return [this.chart, count];
                }, this)).catch(function(e) {
                    Y.log(e, "error", "Y.Wegas.Statistics");
                    loading.hide();
                    throw e;
                }).then(function(val) {
                    loading.hide();
                    return val;
                });
            },
            destructor: function() {
                this._gmPromise = null;
                this._questionButton.destroy();
                this.chart.destroy();
                Y.Array.each(this.handlers, function(element) {
                    element.detach();
                });
                //                this.chartNumber.destroy();
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
                            if (res.status === 200) {
                                try {
                                    ok(Y.JSON.parse(res.response));
                                } catch (er) {
                                    fail(er);
                                }
                            } else {
                                fail(new Error("No data available"));
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
