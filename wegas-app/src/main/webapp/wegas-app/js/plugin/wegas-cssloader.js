/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-cssloader', function(Y) {
    "use strict";

    /**
     *  @class Uses Y.StyleSheet to load the list of stylesheets contained in the
     *  Y.Wegas.app cssStylesheets attribute
     *  @name Y.Plugin.CSSLoader
     *  @extends Y.Plugin.Base
     *  @constructor
     */
    var Wegas = Y.Wegas,
    CSSLoader = Y.Base.create("wegas-cssloader", Y.Plugin.Base, [Wegas.Plugin, Wegas.Editable], {
        /** @lends Y.Plugin.CSSLoader */

        /**
         * @function
         * @private
         */
        initializer: function() {
            var i, css = Wegas.app.get('cssStylesheets'),
            cfg = {
                context: this,
                on : {
                    success : function (tId, e) {
                        CSSLoader.customCSSText = e.responseText;
                        CSSLoader.customCSSStyleSheet = new Y.StyleSheet(e.responseText);
                    },
                    failure : function (id, o) {
                        Y.error("initCSS(): Page CSS loading async call failed!", new Error("Loading failed"), "Y.Wegas.App");
                    }
                }
            };

            for (i = 0; i < css.length; i += 1) {
                Y.io(Wegas.app.get('base') + css[i] + '?id=' + Wegas.Helper.genId(), cfg);  // Load the page css
            }
        }
    }, {
        NS: "CSSLoader",
        NAME: "CSSLoader"
    });
    Y.namespace("Plugin").CSSLoader = CSSLoader;

});
