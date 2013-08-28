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
    var arraysToCSV, DatatableCSV;
    /**
     * Convert array of arrays to CSV
     * @private
     * @param {Array} arrays array containing arrays [[], []]
     * @returns {String} CSV string
     */
    arraysToCSV = function(arrays) {
        return Y.Array.map(arrays, function(i) {
            return i.join(DatatableCSV.FIELD_DELIMITER);
        }).join(DatatableCSV.RECORD_DELIMITER);
    };
    /**
     * Plugin to export datatable as CSV.
     * @constructor
     * @extends Y.Plugin.Base
     * @name Y.Wegas.DatatableCSV
     */
    DatatableCSV = Y.Base.create("datatable-csv", Y.Plugin.Base, [], {
        /* @lends Y.Wegas.DatatableCSV# */
        /**
         * lifecycle method
         * @function
         * @private
         * @returns {undefined}
         */
        initializer: function() {
            this.get("host").get("boundingBox").append("<span class='datatable-csv-export'>CSV</span>");
            this.get("host").get("boundingBox").append("<span class='datatable-csv-file'>CSV-download</span>");
            this.get("host").get("boundingBox").one(".datatable-csv-export").on("click", function() {
                DatatableCSV.dataToWindow(this._toCSV());
            }, this);
            this.get("host").get("boundingBox").one(".datatable-csv-file").on("click", function() {
                var csv = this._toCSV();
                console.log("soon", csv);
            }, this);
        },
        /**
         * Transformation method, datatable to CSV
         * @function
         * @private
         * @returns {undefined}
         */
        _toCSV: function() {
            var headers = Y.Array.map(this.get("host").get("columns"), function(i) {
                return "\"" + (i.label || i.key) + "\"";
            }), keys = Y.Array.map(this.get("host").get("columns"), function(i) {
                return i.key;
            }),
                    data = this.get("host").get("data").toArray(), records = [headers], i, j, fields;
            //Build lignes following key order.
            for (i = 0; i < data.length; i += 1) {
                fields = [];
                for (j = 0; j < keys.length; j += 1) {
                    fields.push("\"" + (data[i].get(keys[j]) || "") + "\"");
                }
                records.push(fields);

            }
            return arraysToCSV(records);

        },
        /**
         * lifecycle method
         * @function
         * @private
         * @returns {undefined}
         */
        destructor: function() {
            this.get("host").get("boundingBox").one(".datatable-csv-export").destroy(true);
        }
    }, {
        /* @lends Y.Wegas.DatatableCSV */
        NS: "datatablecsv",
        /**
         * Field delimiter. As of RFC 4180 : "," by default
         * @field
         * @static
         */
        FIELD_DELIMITER: ",",
        /**
         * Record (lines) delimiter. As of RFC 4180 : "\r\n" (CRLF) by default
         * @static
         * @field
         */
        RECORD_DELIMITER: "\r\n",
        /**
         * Writes given data to window
         * @static
         * @function
         * @param {type} data to write to window
         * @param {type} winHandle (optional) window handle to write to. A new window is create if this parameter is missing.
         * @returns {undefined}
         */
        dataToWindow: function(data, winHandle) {
            var win = winHandle || window.open(), range, selection;
            win.document.write("<pre>");
            win.document.write(data);
            win.document.write("</pre>");
            //Select data
            if (document.createRange && window.getSelection) {
                range = win.document.createRange();
                selection = win.getSelection();
                selection.removeAllRanges();
                range.selectNodeContents(win.document.body.firstChild);
                selection.addRange(range);
            }
        }
    });

    Y.namespace("Wegas").DatatableCSV = DatatableCSV;
});