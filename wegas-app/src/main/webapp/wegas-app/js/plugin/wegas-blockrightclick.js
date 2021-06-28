/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
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
    var BlockRightclick = Y.Base.create("wegas-blockrightclick", Y.Plugin.Base, [Y.Wegas.Plugin, Y.Wegas.Editable], {
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
                type: "string"
            }
        },
        NS: "BlockRightclick"
    });
    Y.Plugin.BlockRightclick = BlockRightclick;
});
