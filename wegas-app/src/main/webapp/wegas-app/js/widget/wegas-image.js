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
YUI.add("wegas-image", function(Y) {
    "use strict";
    var CONTENTBOX = "contentBox", WImage;
    /**
     * @name Y.Wegas.WWImage
     * @extends Y.Widget
     * @borrows Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable
     * @class class to display simple image
     * @constructor
     * @description  Display a string (given as ATTRS) in content box
     */
    WImage = Y.Base.create("wegas-image", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        /** @lends Y.Wegas.WImage# */
        image: null,
        CONTENT_TEMPLATE: "<img></img>",
        /**
         * Lifecycle method
         * @function
         * @private
         */
        initializer: function() {
            this.publish("error", {fireOnce: true});
            this.publish("load", {fireOnce: true});
            this.handlers = [];
        },
        /**
         * Lifecycle method
         * @function
         * @private
         */
        renderUI: function() {
            this.image = this.get(CONTENTBOX).getDOMNode();
            this.set("url", this.get("url"));
        },
        /**
         * Lifecycle method
         * @function
         * @private
         */
        bindUI: function() {
            this.handlers.push(this.get(CONTENTBOX).on("load", function(e) {
                this.getEvent("load").fired = true;
                this.getEvent("render").fired = true;
                this.fire("load");
                this.fire("render");
            }, this));
            this.handlers.push(this.get(CONTENTBOX).on("error", function(e) {
                this.getEvent("error").fired = true;
                this.fire("error");
            }, this));
        },
        /**
         * Lifecycle method
         * @function
         * @private
         */
        destructor: function() {
            var i;
            for (i in this.handlers) {
                this.handlers[i].detach();
            }
        }

    }, {
        /** @lends Y.Wegas.WImage */
        EDITORNAME: "Image",
        FILEENTRY: Y.Wegas.FileFacade.get("source") + "read",
        ATTRS: {
            url: {
                type: "string",
                setter: function(val) {
                    this.getEvent("load").fired = false;
                    this.getEvent("error").fired = false;
                    this.getEvent("render").fired = false;
                    this.get(CONTENTBOX).setAttribute("src", (val.indexOf("/") === 0) ?
                            this.constructor.FILEENTRY + val : //Wegas Filesystem
                            val);
                    return val;
                }
            },
            complete: {
                readOnly: true,
                "transient": true,
                getter: function() {
                    return this.image.complete;
                }
            }
        }
    });
    Y.namespace("Wegas").Image = WImage;
});