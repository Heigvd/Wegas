/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-cssloader', function(Y) {
    "use strict";

    var CSSLoader = Y.Base.create("wegas-cssloader", Y.Plugin.Base, [Y.Wegas.Plugin, Y.Wegas.Editable], {
        initializer: function() {
            var i, css = Y.Wegas.app.get('cssStylesheets'),
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
                Y.io(Y.Wegas.app.get('base') + css[i] + '?id=' + Y.Wegas.App.genId(), cfg);  // Load the page css
            }
        }
    }, {
        NS: "CSSLoader",
        NAME: "CSSLoader"
    });
    Y.namespace("Plugin").CSSLoader = CSSLoader;

});
