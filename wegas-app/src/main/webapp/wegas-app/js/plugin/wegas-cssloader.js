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
            //var cGameModel = Wegas.Facade.GameModel.cache.getCurrentGameModel();
            //
            //if (cGameModel.get("properties.cssUri")) {
            //    Y.Array.each(cGameModel.get("properties.cssUri").split(","), function(name) {// Load sheet reference provided through game model properties
            //        this.loadSheet("custom" + name, Wegas.app.get('base') + Y.Lang.trim(name) + '?id=' + Wegas.Helper.genId());
            //    }, this);
            //}
            //
            //Wegas.Facade.GameModel.sendRequest({//                            // Load style sheets (currently done w/ jsf)
            //    request: "/" + Wegas.app.get("currentGameModel") + "/Library/CSS?view=Export?id=" + Wegas.Helper.genId(),
            //    cfg: {
            //        updateCache: false
            //    },
            //    on: Wegas.superbind({
            //        success: function(e) {
            //            var i;
            //            for (i in e.response.entities) {                        // Load every db stored sheet (game model specific)
            //                CSSLoader.updateStyleSheet(i, e.response.entities[i]);
            //            }
            //        },
            //        failure: function(id, o) {
            //            Y.log("initCSS(): Page CSS loading async call failed!", "error", "Wegas.CSSLoader");
            //        }
            //    }, this)
            //}, this);
        },
        loadSheet: function(id, url) {
            Y.io(url, {// Load the page css
                context: this,
                on: {
                    success: Y.bind(function(sheetId, tId, e) {
                        CSSLoader.updateStyleSheet(sheetId, e.responseText);
                    }, this, id),
                    failure: function(id, o) {
                        Y.error("initCSS(): Page CSS loading async call failed!", new Error("Loading failed"), "Wegas.CSSLoader");
                    }
                }
            });
        }
    }, {
        NS: "CSSLoader",
        NAME: "CSSLoader",
        sheets: {},
        updateStyleSheet: function(id, content) {
            if (CSSLoader.sheets[id]) {
                CSSLoader.sheets[id].disable();
            }
            //CSSLoader.sheets[id] = new Y.StyleSheet(content);
            CSSLoader.sheets[id] = new Y.StyleSheet(content.replace(/\.\.\//g, ""));
        }
    });
    Y.namespace("Plugin").CSSLoader = CSSLoader;

});
