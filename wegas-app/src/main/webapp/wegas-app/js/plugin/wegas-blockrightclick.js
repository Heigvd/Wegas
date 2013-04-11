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
YUI.add('wegas-blockrightclick', function(Y) {
    "use strict";

    /**
     *  @class Block right click
     *  @name Y.Plugin.BlockRightclick
     *  @extends Y.Plugin.Base
     *  @constructor
     */
    var Wegas = Y.Wegas,
        BlockRightclick = Y.Base.create("wegas-blockrightclick", Y.Plugin.Base, [Wegas.Plugin, Wegas.Editable], {
        /** @lends Y.Plugin.BlockRightclick */

        /**
         * @function
         * @private
         */
        initializer: function() {
            this.get("host").get(this.get("targetNode")).on('contextmenu', function(e) {
                e.preventDefault();
            });
        }
    }, {
        ATTRS: {
            targetNode: {
                value: "boundingBox",
                type: "string",
                "transient": true
            }
        },
        NS: "BlockRightclick",
        NAME: "BlockRightclick"
    });
    Y.namespace("Plugin").BlockRightclick = BlockRightclick;

});
