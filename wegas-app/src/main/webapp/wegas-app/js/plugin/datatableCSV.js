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
YUI.add('datatable-csv', function(Y) {
    "use strict";
    /**
     * Convert array of arrays to CSV
     * @param {Array} arrays array containing arrays [[]]
     * @returns {String} CSV string
     */
    var arraysToCSV = function(arrays) {
        var flat = Y.Array.map(arrays, function(i) {
            return i.join(",");
        }), csv = flat.join("\r\n");
        console.log(csv);
        return csv;
    };
    Y.namespace("Wegas").DatatableCSV = Y.Base.create("datatable-csv", Y.Plugin.Base, [], {
        initializer: function() {
            this.get("host").get("boundingBox").append("<span class='datatable-csv-export'>CSV</span>");
            this.get("host").get("boundingBox").one(".datatable-csv-export").on("click", this._exportCSV, this);
        },
        _exportCSV: function() {
            var headers = Y.Array.map(this.get("host").get("columns"), function(i) {
                return "\"" + (i.label || i.key) + "\"";
            }), keys = Y.Array.map(this.get("host").get("columns"), function(i) {
                return i.key;
            }),
                    data = this.get("host").get("data").toArray(), records = [headers], i, j, a, win,
                    range, selection;
            for (i in data) {
                if (data.hasOwnProperty(i)) {
                    a = [];
                    for (j in keys) {
                        if (keys.hasOwnProperty(j)) {
                            a.push("\"" + (data[i].get(keys[j]) || "") + "\"");
                        }
                    }
                    records.push(a);
                }
            }
            win = window.open();
            win.document.write("<pre>");
            win.document.write(arraysToCSV(records));
            win.document.write("</pre>");
            //Select csv
            if (document.createRange && window.getSelection) {
                range = win.document.createRange();
                selection = win.getSelection();
                range.selectNodeContents(win.document.body.firstChild);
                selection.addRange(range);
            }
        },
        destructor: function() {
            this.get("host").get("boundingBox").one(".datatable-csv-export").destroy(true);
        }
    }, {
        NS: "datatablecsv"
    });
});