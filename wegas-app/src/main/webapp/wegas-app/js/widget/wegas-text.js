/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add("wegas-text", function(Y) {
    "use strict";

    var CONTENTBOX = "contentBox", Text;

    /**
     * @name Y.Wegas.Text
     * @extends Y.Widget
     * @borrows Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable
     * @class class to display simple String
     * @constructor
     * @description  Display a string (given as ATTRS) in content box
     */
    Text = Y.Base.create("wegas-text", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        /** @lends Y.Wegas.Text# */

        /**
         * @function
         * @private
         * @description set the "content" ATTRS (which set the contentbox)
         */
        syncUI: function() {
            //this.set("content", this.get("content"));
            this.get(CONTENTBOX).setContent(Y.Template.Micro.compile(this.get("content"))());
        },
        getEditorLabel: function() {
            return this.get(CONTENTBOX).get("text");
        }

    }, {
        /** @lends Y.Wegas.Text */
        EDITORNAME: "Text",
        /**
         * @field
         * @static
         * @description
         * <p><strong>Attributes</strong></p>
         * <ul>
         *    <li>content: the string to display, the content of this widget's
         *     contentbox. Format html.</li>
         * </ul>
         */
        ATTRS: {
            /**
             * The string to display, the content of this widget's contentbox
             * Format html.
             */
            content: {
                type: "string",
                format: "html"//,
                    //setter: function(val) {
                    //this.get(CONTENTBOX).setContent(val);
                    //    return val;
                    //}
            }
        }
    });
    Y.Wegas.Text = Text;

});
