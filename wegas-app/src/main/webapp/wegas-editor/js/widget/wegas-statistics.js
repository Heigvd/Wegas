/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Cyril Junod <cyril.junod at gmail.com>
 * @author Gérald Eberle
 */
/*global Chartist, I18n*/
YUI.add("wegas-statistics", function(Y) {
    "use strict";
    var Data,
        CHART_BAR_OPT = {
            width: 600,
            height: 400,
            axisY: {
                labelInterpolationFnc: function(v) {
                    return v + "%";
                },
                scaleMinSpace: 20,
                onlyInteger: true
            },
            axisX: {
                offset: 50
            },
            low: 0,
            high: 100
        },
        Promise = Y.Promise, // remove me to use native promise
        getPath = function(entity) {
            var title = entity.getEditorLabel(), parent = entity.getParent();
            while (parent instanceof Y.Wegas.persistence.VariableDescriptor) {
                title = parent.getEditorLabel() + " \u21E8 " + title;
                parent = parent.getParent();
            }
            return title;
        },
        getLogID = function(gm) {
            var logId = gm.get("properties").get("val").logID;
            if (logId) {
                return logId;
            } else {
                throw new Error("No logID defined");
            }
        },
        inlineSvgStyle = function(node) {
            var tw = document.createTreeWalker(node, 1), n, img = new Image();
            while ((n = tw.nextNode())) {
                n.setAttribute("style", getComputedStyle(n).cssText);
            }
        },
        svgToPng = function(node) {
            return new Promise(function(resolve, reject) {
                var img = new Image();
                img.src = "data:image/svg+xml;base64," +
                    btoa(window.unescape(encodeURIComponent((new XMLSerializer()).serializeToString(node))));
                img.onload = function() {
                    var can = document.createElement("canvas"), ctx = can.getContext("2d"), target = new Image();
                    can.width = img.width;
                    can.height = img.height;
                    ctx.drawImage(img, 0, 0, img.width, img.height);
                    target.src = can.toDataURL();
                    resolve(target);
                };
                img.onerror = reject;
            });

        },
        Stats = Y.Base.create("wegas-statistics", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
            CONTENT_TEMPLATE: "<div>"
                + "<div class='stats-question' style='display: inline-block'>" +
                "<select><option value='null' disabled>-Question-</option></select><button class='gen-button'>Generate all</button>" +
                "<i class='loading fa fa-spinner fa-pulse fa-lg' style='display: none'></i>" +
                "<div>Answer count: <span class='question-answer-count'></span></div>" +
                "<div class='chart'></div><div class='tmpNode'></div></div>" +
                "<div class='stats-number' style='display: none;vertical-align: top'>" +
                "<select><option value='null' disabled>-Number-</option></select>" +
                "<canvas class='chart' style='width:600px;height:400px'></canvas></div>"
                + "<div class='footer'></div>"
                + "</div>",
            initializer: function() {
                this.handlers = [];
                this._gmPromise = Data.getCurrentGameModel();
                this._gmPromise.then(Y.bind(function(gm) {
                    if (!gm.get("properties").get("val").logID) {
                        this.get("contentBox").hide();
                        this.get("boundingBox").append("Statistics are not enabled for this game");
                    }
                }, this));
            },
            addRawDownloadButton: function() {
                var game = Y.Wegas.Facade.Game.cache.getCurrentGame();
                var gameModel = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel();

                var activityPattern;

                var config = Y.namespace("Wegas.Config").Statistics;
                var queryString = "";

                if (config) {
                    activityPattern = config.activityFilter;
                    queryString = "?activityPattern=" + activityPattern;
                }

                this._rawButton = new Y.Wegas.Text({
                    srcNode: this.get("contentBox").one(".footer"),
                    content: '<a class="wegas-statistics-download-button" title="Download Excel file" href="rest/Statistics/ExportXLSX/'
                        + getLogID(gameModel) + '/Games/' + +game.get('id') + queryString + '" '
                        + 'target="_blank"><span class="fa fa-2x fa-file-excel-o icon"></span>Download raw data (Excel)</a>',
                }).render();
            },
            getQuestionList: function() {
                return Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().flatten("QuestionDescriptor");
            },
            renderUI: function() {
                var selectQNode = this.get("contentBox").one(".stats-question select"),
                    //selectNNode = this.get("contentBox").one(".stats-number select"),
                    questions = this.getQuestionList();
                //numbers = Y.Wegas.Facade.Variable.cache.findAll("@class", "NumberDescriptor");
                this._questionButton = new Y.Button({
                    srcNode: this.get("contentBox").one(".gen-button"),
                    on: {
                        click: Y.bind(this.genAllQuestion, this)
                    }
                }).render();
                this.chart = new Chartist.Bar(this.get("contentBox").one(".stats-question div.chart").getDOMNode(),
                    {
                        labels: [],
                        series: []
                    },
                    CHART_BAR_OPT);

                Y.Array.each(questions, function(i) {
                    selectQNode.appendChild("<option value='" + i.get("name") + "'>" + getPath(i) + "</option>");
                });
                //                Y.Array.each(numbers, function(i) {
                //                    selectNNode.appendChild("<option value='" + i.get("name") + "'>" + i.get("label")
                // + "</option>"); });

                if (!questions.length) {
                    this.get("contentBox").addClass("no-questions");
                }
                this.addRawDownloadButton();
            },
            bindUI: function() {
                this.handlers.push(this.get("contentBox").one(".stats-question select")
                    .on("valueChange", Y.bind(function(e) {
                        this.drawQuestion(e.newVal);
                    }, this)));
            },
            genAllQuestion: function() {
                var questions = this.getQuestionList(),
                    promiseChain, i, drawQ = Y.bind(this.drawQuestion, this),
                    wHand = window.open(), wHandInfo, addToWindow, panel, setInitialState, tmpChart;
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
                tmpChart = new Chartist.Bar(this.get("contentBox").one(".tmpNode").getDOMNode(), {
                    labels: [],
                    series: []
                }, CHART_BAR_OPT);
                setInitialState = Y.bind(function() {
                    Y.one(tmpChart.container).empty();
                    tmpChart.detach();
                    wHandInfo.remove();
                    panel.exit();
                }, this);

                addToWindow = function(question) {
                    var qName = question.get("name"), total;
                    if (wHand.closed) {
                        throw new Error("Window has been closed, halting");
                    }
                    return this._gmPromise.then(function(gm) {
                        return Data.getQuestion(getLogID(gm), qName);
                    })
                        .then(Y.bind(Data.genQuestionData, null, qName))
                        .then(function(result) {
                            tmpChart.update(result[0]);
                            inlineSvgStyle(tmpChart.container.firstChild);
                            total = result[1];
                            return svgToPng(tmpChart.container.firstChild);
                        }).catch(function() {
                        //Image creation failed, return svg instead
                        return tmpChart.container.firstChild;
                    }).then(function(newNode) {
                        var n = Y.Node.create("<div style ='display:inline-block;width:610px;padding:10px;margin:1px;border:1px solid #888888'> <div>" +
                            getPath(question) + " (Count: " + total + ")</div></div>");
                        n.append(Y.one(newNode.cloneNode(true)).setStyle("overflow", "visible"));
                        Y.one(wHand.document.body).append(n);
                    });
                };

                promiseChain = Promise.resolve();
                for (i = 0; i < questions.length; i += 1) {
                    promiseChain = promiseChain.then(Y.bind(addToWindow, this, questions[i]));
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
                }).then(Y.bind(Data.genQuestionData, null, questionName)).catch(function(e) {
                    Y.log(e, "error", "Y.Wegas.Statistics");
                    loading.hide();
                    throw e;
                }).then(Y.bind(function(val) {
                    this.chart.update(val[0]);
                    this.get("contentBox").one(".question-answer-count").set("text", val[1]);
                    loading.hide();
                    return val;
                }, this));
            },
            destructor: function() {
                this._gmPromise = null;
                this._questionButton && this._questionButton.destroy();
                this._rawButton && this._rawButton.destroy();
                if (this.chart && this.chart.destroy) {
                    this.chart.destroy();
                }
                Y.Array.each(this.handlers, function(element) {
                    element.detach();
                });
                //                this.chartNumber.destroy();
            }
        });
    Y.Wegas.Statistics = Stats;
    Data = (function() {
        var baseURI = Y.Wegas.app.get("base"),
            getQuestion, getNumber, getStats, getCurrentGameModel, genQuestionData;
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
        genQuestionData = function(questionName, questionData) {
            var question = Y.Wegas.Facade.Variable.cache.find("name", questionName),
                choices = {}, data = {
                labels: [],
                series: [{
                        data: []
                    }]
            }, res = data.series[0].data, labels = data.labels, count = 0;
            Y.Array.each(question.get("items"), function(i) {
                choices[(i.get("name"))] = {};
                Y.Array.each(i.get("results"), function(r) {
                    choices[(i.get("name"))][r.get("name")] = 0;
                });

            });
            Y.Array.each(questionData, function(i) {
                choices[i.choice][i.result] = choices[i.choice][i.result] || 0;
                choices[i.choice][i.result] += 1;
                count += 1;
            });
            Y.Object.each(choices, function(v, k) {
                Y.Object.each(v, function(val, key) {
                    labels.push(I18n.t(Y.Wegas.Facade.Variable.cache.find("name", k).get("label")) +
                        (key ? " (" + key + ")" : ""));
                    res.push(val / (count ? count : 1) * 100);
                });
            });

            return [data, count];
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
            getNumber: getNumber,
            genQuestionData: genQuestionData
        };
    }());
});
