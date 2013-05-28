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
            var props = this.get("variable.evaluated").getInstance().get("properties"),
                    table = this.get("contentBox").one("table"),
                    tmp, o, i;
            table.empty();
            table.append("<tr><th>order</th><th>question id</th><th>left</th><th>center</th><th>right</th><th>response</th><th>delay</th><th>valid</th></tr>");
            for (i in props) {
                o = Y.JSON.parse(props[i]);
                tmp = ["<tr class='row-", (i % 2 === 0 ? 'even' : 'odd'), "'>",
                    "<td>", i, "</td>",
                    "<td>", o.id, "</td>",
                    "<td>", o.left, "</td>",
                    "<td>", o.center, "</td>",
                    "<td>", o.right, "</td>",
                    "<td>", o.response, "</td>",
                    "<td>", o.delay, "</td>",
                    "<td>", o.valid , "</td>",
                    "</tr>"];
                table.append(tmp.join(""));
            }
        }
    }, {
        ATTRS: {
            variable: {
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                _inputex: {
                    _type: "variableselect",
                    label: "Object variable"
                }
            }
        }
    });
});