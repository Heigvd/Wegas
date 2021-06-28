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
YUI.add("wegas-image", function(Y) {
    "use strict";

    /**
     * @name Y.Wegas.Image
     * @extends Y.Widget
     * @borrows Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable
     * @class class to display simple image
     * @constructor
     * @description  Display a string (given as ATTRS) in content box
     */
    var Image = Y.Base.create("wegas-image", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        /** @lends Y.Wegas.Image# */
        image: null,
        CONTENT_TEMPLATE: "<img style='width:inherit;height:inherit'></img>",
        /**
         * Lifecycle method
         * @function
         * @private
         */
        initializer: function() {
            this.publish("error",
                {
                    fireOnce: true,
                    async: true
                });
            this.publish("load",
                {
                    fireOnce: true,
                    async: true
                });
            this.image = this.get("contentBox");
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
            this.image = this.get("boundingBox").one("img"); // !! IE 8 : this.image._node ===
                                                             // this.get(CONTENTBOX)._node => false ...
            this.get("url");
        },
        /**
         * Lifecycle method
         * @function
         * @private
         */
        bindUI: function() {
            this.image.on("load", function(e) {
                if (!this.CSSSize) { // adapt only without plugin
                    this.get("boundingBox").setStyles({
                        width: this.image.width,
                        height: this.image.height
                    });
                }
                this.fire("load");
                this.getEvent("load").fired = true;
            }, this);
            this.image.on("error", function(e) {
                if (this.image.getAttribute("src")) {
                    this.image.setAttribute("src", "");
                    this.image.setAttribute("alt", "Image error");
                    this.fire("error");
                    this.getEvent("error").fired = true;
                }
            }, this);
        }

    }, {
        /** @lends Y.Wegas.Image */
        EDITORNAME: "Image",
        FILEENTRY: function() {
            return Y.Wegas.Facade.File.get("source") + "read";
        },
        ATTRS: {
            url: {
                value: "",
                type: "string",
                setter: function(val) {
                    this.getEvent("load").fired = false;
                    this.getEvent("error").fired = false;
                    this.image.setAttribute("src", (val.indexOf("/") === 0) ?
                    Image.FILEENTRY() + val : //Wegas Filesystem
                        val);
                    return val;
                },
                view: {
                    label: "URL",
                    type: "wegasimageurl"
                }
            },
            complete: {
                readOnly: true,
                "transient": true,
                getter: function() {
                    return this.image && this.image.getDOMNode() ? this.image.getDOMNode().complete : true;
                }
            }
        }
    });
    Y.Wegas.Image = Image;
});
