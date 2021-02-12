/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileOverview
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
YUI.add('datatable-csv', function(Y) {
    "use strict";
    var DatatableCSV, imgTest = new Image();

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
            var bb = this.get("host").get("boundingBox");
            this.bcsv = new Y.Button({
                label: "CSV",
                on: {
                    click: Y.bind(function() {
                        DatatableCSV.dataToWindow(this._toCSV());
                    }, this)
                }
            }).render(bb);
            this.bdcsv = new Y.Button({
                label: "Download CSV",
                on: {
                    click: Y.bind(function() {
                        var csv = this._toCSV(),
                            //node = this.get("host").get("boundingBox").one(".datatable-csv-file"),
                            gm_name = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().get("name"),
                            game_name = Y.Wegas.Facade.Game.cache.getCurrentGame().get("name"),
                            name = gm_name + "-" + game_name + "-" + Y.Lang.now() + ".csv";

                        DatatableCSV.download("text/csv", name, csv);
                        //Disabled due to IE allowing limited data URI
                        //if (DatatableCSV.DATA_URI_SUPPORT) {
                        //    node.setAttribute("href", "data:text/csv;header=true," + encodeURIComponent(csv));
                        //    node.setAttribute("download", name);
                        //} else {
                        //    //FALLBACK : get a real browser
                        //    download("text/csv", name, csv);
                        //}
                    }, this)
                }
            }).render(bb);
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
                data = this.get("host").data.toArray(), records = [headers], i, j, fields;
            //Build lignes following key order.
            for (i = 0; i < data.length; i += 1) {
                fields = [];
                for (j = 0; j < keys.length; j += 1) {
                    fields.push("\"" + (
                        (data[i].get(keys[j]) === undefined || data[i].get(keys[j]) === null) ?
                        "" : data[i].get(keys[j])
                        ) + "\"");
                }
                records.push(fields);

            }
            return DatatableCSV.arraysToCSV(records);
        },
        /**
         * lifecycle method
         * @function
         * @private
         * @returns {undefined}
         */
        destructor: function() {
            if (this.bcsv) {
                this.bcsv.destroy();
            }
            if (this.bdcsv) {
                this.bdcsv.destroy();
            }
        }
    }, {
        /* @lends Y.Wegas.DatatableCSV */
        NS: "datatablecsv",
        /**
         * Field delimiter. As of RFC 4180 : "," by default. 
         * MS Excel highly prefers ";"
         * @field
         * @static
         */
        FIELD_DELIMITER: ";",
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
         * @param {contentType} data to write to window
         * @param {contentType} winHandle (optional) window handle to write to. A new window is create if this parameter is missing.
         * @returns {undefined}
         */
        dataToWindow: function(data, winHandle) {
            var win = winHandle || window.open(), range, selection;
            win.document.write("<pre>");
            win.document.write("</pre>");
            Y.one(win.document).one("pre").setHTML(data);
            //Select data
            if (document.createRange && window.getSelection) {
                range = win.document.createRange();
                selection = win.getSelection();
                selection.removeAllRanges();
                range.selectNodeContents(win.document.body.firstChild);
                selection.addRange(range);
            }
        },
        /**
         * Convert array of arrays to CSV
         * @private
         * @param {Array} arrays array containing arrays [[], []]
         * @returns {String} CSV string
         */
        arraysToCSV: function(arrays) {
            return Y.Array.map(arrays, function(i) {
                return i.join(DatatableCSV.FIELD_DELIMITER);
            }).join(DatatableCSV.RECORD_DELIMITER);
        },
        /**
         * Send data to server to download it.
         * @function
         * @private
         * @param {String} contentType file's content-type
         * @param {String} name file's name
         * @param {String} data file's content
         * @returns {undefined}
         */
        download: function(contentType, name, data) {
            var url = Y.Wegas.app.get("base") + "rest/Download/" + name,
                form = Y.Node.create('<form enctype="multipart/form-data" accept-charset="UTF-8" method="post" action="' + url + '" ><input type="hidden" name="data"><input type="hidden" name="ctype"></form>');
            form.one("input[name=data]").getDOMNode().value = data;
            form.one("input[name=ctype]").getDOMNode().value = contentType;
            form.submit();
            form.destroy();
        },
        DATA_URI_SUPPORT: undefined
    });
    Y.Wegas.DatatableCSV = DatatableCSV;

    imgTest.onload = imgTest.onerror = function() {
        if (imgTest.width === 1 && imgTest.height === 1) {
            DatatableCSV.DATA_URI_SUPPORT = true;
        } else {
            DatatableCSV.DATA_URI_SUPPORT = false;
        }
        imgTest = null;
    };
    imgTest.src = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";

});
