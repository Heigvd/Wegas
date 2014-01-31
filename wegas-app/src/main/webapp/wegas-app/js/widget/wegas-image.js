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
        CONTENT_TEMPLATE: "<img style='width:inherit;height:inherit'></img>",
        /**
         * Lifecycle method
         * @function
         * @private
         */
        initializer: function() {
            this.publish("error", {fireOnce: true, async: true});
            this.publish("load", {fireOnce: true, async: true});
            this.handlers = [];
        },
        getEditorLabel: function() {
            return this.get("url");
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
                if (!this.CSSSize) { // adapt only without plugin
                    this.get("boundingBox").setStyles({width: this.image.width, height: this.image.height});
                }
                this.fire("load");
                this.fire("render");
                this.getEvent("load").fired = true;
                this.getEvent("render").fired = true;
            }, this));
            this.handlers.push(this.get(CONTENTBOX).on("error", function(e) {
                this.fire("error");
                this.fire("render");
                this.getEvent("error").fired = true;
                this.getEvent("render").fired = true;
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
        FILEENTRY: Y.Wegas.Facade.File.get("source") + "read",
        ATTRS: {
            url: {
                value: "",
                type: "string",
                setter: function(val) {
                    this.getEvent("load").fired = false;
                    this.getEvent("error").fired = false;
                    this.getEvent("render").fired = false;
                    this.get(CONTENTBOX).setAttribute("src", (val.indexOf("/") === 0) ?
                            this.constructor.FILEENTRY + val : //Wegas Filesystem
                            val);
                    return val;
                },
                _inputex: {
                    _type: "wegasimageurl"
                }
            },
            complete: {
                readOnly: true,
                "transient": true,
                getter: function() {
                    return this.image ? this.image.complete : true;
                }
            }
        }
    });
    Y.namespace("Wegas").Image = WImage;
});