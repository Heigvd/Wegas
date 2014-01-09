/*
 * Wegas
 * http://wegas.albasim.ch
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

            for (i = 0; i < customSheets.length; i += 1) {                      // Load sheet reference provided through game model properties

                this.loadSheet("custom" + i, Wegas.app.get('base') + Y.Lang.trim(customSheets[i]) + '?id=' + Wegas.Helper.genId());
            }

            return;
            Y.Wegas.Facade.GameModel.sendRequest({//                            // Load style sheets (currently done w/ jsf)
                request: "/" + Y.Wegas.app.get("currentGameModel") + "/Library/CSS?view=Export?id=" + Wegas.Helper.genId(),
                cfg: {
                    updateCache: false
                },
                on: Y.Wegas.superbind({
                    success: function(e) {
                        var i;
                        for (i in e.response.entities) {                        // Load every db stored sheet (game model specific)
                            this.sheets[i] = new Y.StyleSheet(i, e.response.entities[i]);
                        }
                    },
                    failure: function(id, o) {
                        Y.log("initCSS(): Page CSS loading async call failed!", "error", "Wegas.CSSLoader");
                    }
                }, this)
            }, this);
        },
        loadSheet: function(id, url) {
            Y.io(url, {// Load the page css
                context: this,
                on: {
                    success: Y.bind(function(sheetId, tId, e) {
                        this.sheets[sheetId] = new Y.StyleSheet(e.responseText);
                    }, this, id),
                    failure: function(id, o) {
                        Y.error("initCSS(): Page CSS loading async call failed!", new Error("Loading failed"), "Wegas.CSSLoader");
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
