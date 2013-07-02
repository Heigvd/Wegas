/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
YUI.add('wegas-pdf', function(Y) {
    "use strict";

    /**
     *  @class Add size CSS styles
     *  @name Y.Plugin.CSSSize
     *  @extends Y.Plugin.CSSStyles
     *  @constructor
     */
    var Wegas = Y.Wegas,
            CONTENTBOX = 'contentBox',
            PDF = Y.Base.create("wegas-pdf", Y.Plugin.Base, [Wegas.Plugin, Wegas.Editable], {
        /** @lends Y.Plugin.PDF */

        /**
         * Lifecycle methods
         * @function
         * @private
         */
        initializer: function() {
            console.log("pdf-widget");
            var cb = this.get("host").get(CONTENTBOX);
            this.pdf = new Y.Wegas.Button({
                label: "PDF",
                cssClass: "wegas-pdf",
                render: cb
            });
            cb.append(this.pdf);

            this.pdf.on("click", function() {
                this.jsonData();
            }, this);
        },
        jsonData: function() {
            Y.Wegas.Facade.VariableDescriptor.sendRequest({
                request: "/164",
                cfg: {
                    method: "GET",
                },
                on: {
                    success: Y.bind(function(e) {
                        var items = e.response.entity.get("items"),
                            htmlContent = new Y.Node.create("<div></div>"),
                            i;
                            //console.log(items.length);
                            //console.log(items[0]);
                        for (i = 0; i<items.length; i++){
//                            var child = "<p>" + items[i].toJSON().name + "</p>";
//                            htmlContent.appendChild(child);
//                            console.log(items[i].toJSON());
                        }
                        console.log(htmlContent);
                        var doc = new jsPDF();
//                        doc.fromHTML(htmlContent, 15, 15, {
//                                'width': 170, 
//                                'elementHandlers': specialElementHandlers
//                        });
                        doc.text(20, 20, 'Hello world!');
                        doc.output('dataurlnewwindow');
                        console.log(doc);
                    }, this)
                }
            });
        }
    }, {
        ATTRS: {
        },
        NS: "PDF",
        NAME: "PDF"
    });
    Y.namespace("Plugin").PDF = PDF;

});
