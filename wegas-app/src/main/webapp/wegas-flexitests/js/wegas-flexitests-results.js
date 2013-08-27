/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

/**
 * @fileOverview
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
YUI.add("wegas-flexitests-results", function(Y) {
    "use strict";
    var dateFormatter = function(o) {
        return (new Date(+o.value)).toLocaleString();
    }, UNWANTED_PROPS = function(item) {
        return item !== "date" && item !== "";
    }, getChildById = function(widget, id) {
        var returnItem = null;
        widget.some(function(item) {
            if (item.get("id") === id) {
                returnItem = item;
                return true;
            }
        });
        return returnItem;
    };
    Y.namespace("Wegas").FlexitestsResults = Y.Base.create("wegas-flexitests-results", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        CONTENT_TEMPLATE: "<div><div class='config'></div>"
                + "<div class='results'>Collecting results</div>",
        syncUI: function() {
            var script = "getInstances([";
            try {
                script += "'" + this.get("demographics.evaluated").get("name") + "',";
                script += "'" + this.get("variable.evaluated").get("name") + "'";
            } catch (e) {
            } finally {
                script += "]);";
            }

            if (!this.get("simpleMode")) {
                this.get("contentBox").one(".config").setContent("Extracting test page " + this.get("testPage") + " configuration");
                Y.Wegas.Facade.VariableDescriptor.sendRequest({
                    request: "/Script/Run/" + Y.Wegas.app.get('currentPlayer'),
                    cfg: {
                        method: "POST",
                        data: Y.JSON.stringify({
                            "@class": "Script",
                            "language": "JavaScript",
                            "content": script
                        })
                    },
                    on: {
                        success: Y.bind(function(e) {
                            Y.Wegas.Facade.Page.cache.getPage(this.get("testPage"), Y.bind(function(page) {
                                Y.Wegas.Widget.use(page, Y.bind(function() {
                                    this.renderTable(Y.JSON.parse(e.data.response).entities, Y.Wegas.Widget.create(page));
                                    this._createConfig(Y.Wegas.Widget.create(page));
                                }, this));
                            }, this));

                        }, this),
                        failure: Y.bind(function(e) {
                            Y.log("error", "Failed to retrieve data", "Y.Wegas.FlexitestsMCQ");
                        }, this)
                    }
                });
//                Y.Wegas.Facade.Page.cache.getPage(this.get("testPage"), Y.bind(function(page) {
//                    Y.Wegas.Widget.use(page, Y.bind(function() {
//                        this._createConfig(Y.Wegas.Widget.create(page));
//                    }, this));
//                }, this));
            } else {
                this.renderResult(this.get("variable.evaluated"));
            }
        },
        renderResult: function(results) {
            if (!results) {
                this.get("contentBox").one(".config").setHTML("Unable to find target variable.");
                return;
            }

            var props = results.getInstance().get("properties"), i, sum = 0, correct = 0;
            for (i in props) {
                if (props.hasOwnProperty(i)) {
                    sum += 1;
                    if (Y.JSON.parse(props[i]).valid) {
                        correct += 1;
                    }
                }
            }
            this.get("contentBox").one(".config").empty();
            try {
                this.get("contentBox").one(".results").setContent("Final result : " + correct + " on " + sum + " correct response" + (correct > 1 ? "s" : "") + " (" + (correct * 100 / (sum || 1)).toFixed(1) + "%)");
            } catch (e) {
            }
        },
        renderTable: function(results, page) {
            var demographics = results[0],
                    tests = results[1],
                    table = this.get("contentBox").one(".results"),
                    o, i, j, elements = {
                left: getChildById(page, "leftElement"),
                right: getChildById(page, "rightElement"),
                center: getChildById(page, "centerElement")
            }, extractValue = function(element, qId) {
                var el = elements[element],
                        selectElement = el.item(qId % el.size());
                return selectElement.get("content")
                        || selectElement.get("url");
            };
            delete demographics["@class"];
            delete tests["@class"];
            table.empty();
            for (i in demographics) {
                if (demographics.hasOwnProperty(i)) {
                    o = demographics[i].properties;
                    j = Y.Array.filter(Y.Object.keys(o), UNWANTED_PROPS);

                    if (this.resultTable) {
                        this.resultTable.destroy();
                    }
                    this.resultTable = new Y.DataTable({columns: [
                            {label: "order", key: "order"},
                            {label: "Start time", key: "date", sortable: true,
                                formatter: dateFormatter
                            },
                            {label: "question id", key: "id", sortable: true},
                            "left",
                            "center",
                            "right",
                            "response",
                            {label: "Response time (ms)", key: "delay", sortable: true},
                            "valid",
                            {label: "total time (ms)", key: "totalTime"}
                        ].concat(j)});
                    if (j.length !== 0) {
                        break;
                    }
                }
            }
            for (i in tests) {
                if (tests.hasOwnProperty(i)) {
                    for (j in tests[i].properties) {
                        if (tests[i].properties.hasOwnProperty(j)) {
                            if (!demographics[i].properties.hasOwnProperty("totalTime")) {
                                demographics[i].properties.totalTime = 0;
                            }
                            demographics[i].properties.totalTime += Y.JSON.parse(tests[i].properties[j]).delay;
                        }
                    }
                }
            }
            for (i in tests) {
                if (tests.hasOwnProperty(i)) {
                    for (j in tests[i].properties) {
                        if (tests[i].properties.hasOwnProperty(j)) {
                            o = Y.JSON.parse(tests[i].properties[j]);
                            o.left = extractValue(o.left, o.id);
                            o.right = extractValue(o.right, o.id);
                            o.center = extractValue("center", o.id);
                            o.order = j;
                            this.resultTable.addRow(Y.merge(demographics[i].properties, o));
                        }
                    }
                }
            }
            this.resultTable.render(table);
        },
        _extractConfig: function(widget) {
            var cfg = {},
                    getPos = function(element, config) {
                var style = element.CSSPosition ? element.CSSPosition.get("styles") : null;
                if (style === null) {
                    return;
                } else {
                    if (Y.Lang.isNumber(parseInt(style.top, 10))) {
                        config.top = parseInt(style.top, 10);
                    }
                    if (Y.Lang.isNumber(parseInt(style.bottom, 10))) {
                        config.bottom = parseInt(style.bottom, 10);
                    }
                    if (Y.Lang.isNumber(parseInt(style.left, 10))) {
                        config.left = parseInt(style.left, 10);
                    }
                    if (Y.Lang.isNumber(parseInt(style.right, 10))) {
                        config.right = parseInt(style.right, 10);
                    }
                }
            },
                    getTimers = function(element, config) {
                if (element.hideafter) {
                    config.hide = element.hideafter.get("time");
                }
                if (element.showafter) {
                    config.show = element.showafter.get("time");
                }
            },
                    left = getChildById(widget, "leftElement"),
                    center = getChildById(widget, "centerElement"),
                    right = getChildById(widget, "rightElement");
            cfg.right = {};
            cfg.left = {};
            cfg.center = {};
            getPos(right, cfg.right);
            getPos(left, cfg.left);
            getPos(center, cfg.center);
            getTimers(right, cfg.right);
            getTimers(left, cfg.left);
            getTimers(center, cfg.center);
            return cfg;
        },
        _createConfig: function(cfg) {
            var cfgTable = this.get("contentBox").one(".config"),
                    i, cfgProps = [];
            cfg = this._extractConfig(cfg);
            cfgTable.empty();
            for (i in cfg) {
                if (cfg.hasOwnProperty(i)) {
                    cfgProps.push(Y.Object.keys(cfg[i]));
                    cfg[i].key = i;
                }
            }
            if (this.configTable) {
                this.configTable.destroy();
            }
            this.configTable = new Y.DataTable({
                columns: [{label: "Element", key: "key"}].concat(Y.Array.dedupe(Y.Array.flatten(cfgProps))),
                data: Y.Object.values(cfg)
            });
            this.configTable.render(cfgTable);
        },
        destructor: function() {
            if (this.resultTable) {
                this.resultTable.destroy();
            }
            if (this.configTable) {
                this.configTable.destroy();
            }
        }
    }, {
        EDITORNAME: "Flexitests results",
        ATTRS: {
            variable: {
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                _inputex: {
                    _type: "variableselect",
                    legend: "Test results storage",
                    description: "Test result storage",
                    classFilter: ["ObjectDescriptor"]
                }
            }, demographics: {
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                _inputex: {
                    _type: "variableselect",
                    legend: "Demographic form storage",
                    description: "Form variable storage",
                    classFilter: ["ObjectDescriptor"]
                }
            },
            simpleMode: {
                value: false,
                type: "boolean",
                _inputex: {
                    label: "Player mode"
                }
            },
            testPage: {
                type: "string",
                value: "3",
                _inputex: {
                    label: "Test Page",
                    _type: "pageselect",
                    required: false,
                    description: "Used to extract configuration"
                }
            }

        }
    });
});