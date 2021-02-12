/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2017 School of Management and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author jarle.hulaas@heig-vd.ch
 */
YUI.add('wegas-editormode', function(Y) {
    "use strict";

    /**
     *  @class Set editor mode (toggle between standard and advanced, maybe later also a developer mode)
     *  @name Y.Plugin.EditorMode
     *  @extends Y.Plugin.Base
     *  @constructor
     */
    var EditorMode = Y.Base.create("wegas-editormode", Y.Plugin.Base, [Y.Wegas.Plugin, Y.Wegas.Editable], {
        /** @lends Y.Plugin.EditorMode */

        /**
         * @function
         * @private
         */
        initializer: function() {
            var btn = this.get("host");

            btn.on('click', function(e) {
                var childNodes = btn.get("contentBox").get("childNodes");
                if (childNodes){
                    // Make the button spin around for a while as a visual feedback.
                    // The icon is a child element of the button:
                    var icon = childNodes.get("items")[0];
                    if (icon){
                        icon.addClass("fa-spin");
                        Y.later(1000, this, function(){ icon.removeClass("fa-spin"); });
                    }
                }
                var body = Y.one("body");
                body.toggleClass("wegas-stdmode") // Toggle stdmode class on body (hides any wegas-advancedfeature)
                    .toggleClass("wegas-advancedmode");
                Y.config.win.Y = Y; // Allow access to Y instance (this is never turned off)
            });
        }
    }, {
        ATTRS: { /* empty */ },
        NS: "EditorMode"
    });
    Y.Plugin.EditorMode = EditorMode;
});
