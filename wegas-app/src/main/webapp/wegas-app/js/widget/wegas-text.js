/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add("wegas-text", function (Y) {
    "use strict";

    var CONTENTBOX = "contentBox", Text;

    Text = Y.Base.create("wegas-text", Y.Widget, [ Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable ], {
        syncUI: function () {
            this.set("content", this.get("content"));
        }
    }, {
        ATTRS : {
            content: {
                type: "string",
                format: "html",
                setter: function (val) {
                    this.get(CONTENTBOX).setContent(val);
                    return val;
                }
            }
        }
    });

    Y.namespace("Wegas").Text = Text;
});