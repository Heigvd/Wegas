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
            Y.Plugin.CSSLoader.customCSSStyleSheet = this.sheets = {};

            var i, cGameModel = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel(),
            customSheets = (cGameModel.get("properties.cssUri")) ? cGameModel.get("properties.cssUri").split(",") : [];

            for (i in cGameModel.get("cssLibrary")) {                           // Load every db stored sheet (game model specific)
                this.sheets[i] = new Y.StyleSheet(cGameModel.get("cssLibrary")[i].get("val.content"));
            }

            for (i = 0; i < customSheets.length; i += 1) {                      // Load sheet reference provided through game model properties
                this.loadSheet("custom" + i, Wegas.app.get('base') + customSheets[i] + '?id=' + Wegas.Helper.genId());
            }
        },

        loadSheet: function (id, url) {
            Y.io(url, {                                                         // Load the page css
                context: this,
                on : {
                    success : function (tId, e) {
                        //CSSLoader.customCSSStyleSheet =
                        new Y.StyleSheet(e.responseText);
                    },
                    failure : function (id, o) {
                        Y.error("initCSS(): Page CSS loading async call failed!", new Error("Loading failed"), "Y.Wegas.App");
                    }
                }
            });
        }

    }, {
        customCSSStyleSheet: {},
        NS: "CSSLoader",
        NAME: "CSSLoader"
    });
    Y.namespace("Plugin").CSSLoader = CSSLoader;

});
