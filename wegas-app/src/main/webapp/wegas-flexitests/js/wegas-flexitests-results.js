/*
 * Wegas
 * http://www.albasim.ch/wegas/
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
    Y.namespace("Wegas").FlexitestsResults = Y.Base.create("wegas-flexitests-results", Y.Widget, [Y.Wegas.Widget, Y.Wegas.Editable], {
        initializer: function() {

        },
        renderUI: function() {
            this.get("contentBox").append("<table></table>");
        },
        bindUI: function() {
        },
        syncUI: function() {
            var script = "getInstances([";
            try {
                script += "'" + this.get("demographics.evaluated").get("name") + "',";
                script += "'" + this.get("variable.evaluated").get("name") + "'";
            } catch (e) {
            } finally {
                script += "]);";
            }
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
                        this.renderTable(Y.JSON.parse(e.data.response).entities);
                    }, this),
                    failure: Y.bind(function(e) {
                        Y.log("error", "Failed to store data", "Y.Wegas.FlexitestsMCQ");
                    }, this)
                }
            });
        },
        renderTable: function(results) {
            var demos = results[0],
                    tests = results[1],
                    props,
                    table = this.get("contentBox").one("table"),
                    tmp, o, i, j, k;
            delete demos["@class"];
            delete tests["@class"];
            table.empty();
            table.append("<tr><th>order</th><th>question id</th><th>left</th><th>center</th><th>right</th><th>response</th><th>delay</th><th>valid</th></tr>");
            for (i in demos) {
                o = demos[i].properties;
                for (j in o) {
                    table.get("firstChild").append("<th>" + j + "</th>");
                }
                break;
            }
            for (i in tests) {

                var cfg = tests[i].properties["config"];
                delete tests[i].properties["config"];
                for (j in tests[i].properties) {
                    o = Y.JSON.parse(tests[i].properties[j]);

                    tmp = ["<tr class='row-", (j % 2 === 0 ? 'even' : 'odd'), "'>",
                        "<td>", j, "</td>",
                        "<td>", o.id, "</td>",
                        "<td>", o.left, "</td>",
                        "<td>", o.center, "</td>",
                        "<td>", o.right, "</td>",
                        "<td>", o.response, "</td>",
                        "<td>", o.delay, "</td>",
                        "<td>", o.valid, "</td>"];

                    for (k in demos[i].properties) {
                        tmp.push("<td>" + demos[i].properties[k] + "</td>");
                    }
                    tmp.push("</tr>");
                    table.append(tmp.join(""));
                }
            }
        }
    }, {
        ATTRS: {
            variable: {
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                _inputex: {
                    _type: "variableselect",
                    label: "Test variable (Object)"
                }
            }, demographics: {
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                _inputex: {
                    _type: "variableselect",
                    label: "Form variable"
                }
            }

        }
    });
});