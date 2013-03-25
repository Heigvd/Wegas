/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
YUI.add('wegas-cssstyles', function(Y) {
    "use strict";

    /**
     *  @class Add styles CSS styles
     *  @name Y.Plugin.CSSStyles
     *  @extends Y.Plugin.Base
     *  @constructor
     */
    var Wegas = Y.Wegas,
    CSSStyles = Y.Base.create("wegas-cssstyles", Y.Plugin.Base, [Wegas.Plugin, Wegas.Editable], {
        /** @lends Y.Plugin.CSSStyles */

        /**
         * @function
         * @private
         */
        initializer: function() {
            if (this.get("host") instanceof Y.Widget) {
                this.get("host").get(this.get("targetNode")).setStyles(this.get("styles"));
            } else if (this.get("host") instanceof Y.Node){
                this.get("host").setStyles(this.get("styles"));
            } else {
                Y.log("Host's type mistmach", "warn", "Y.Plugin.CSSStyles");
            }
        }
    }, {
        ATTRS: {
            styles: {
                value: {},
                _inputex: {
                    _type: "object"
                }
            },
            targetNode: {
                value: "boundingBox",
                type: "string",
                "transient": true
            }
        },
        NS: "CSSStyles",
        NAME: "CSSStyles"
    });
    Y.namespace("Plugin").CSSStyles = CSSStyles;

});
