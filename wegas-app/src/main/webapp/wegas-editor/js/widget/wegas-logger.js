/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-logger', function(Y) {
    "use strict";

    /**
     * @name Y.Wegas.Logger
     * @class Displays a Y.console in a widget
     * @constructor
     * @extends Y.Widget
     * @augments Y.WidgetChild
     * @augments Y.Wegas.Widget
     */
    var Logger = Y.Base.create("wegas-logger", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {
        /** @lends Y.Wegas.Logger# */

        /**
         * @field Y.Console The displayed console instance
         * @private
         */
        console: null,
        /**
         * @function
         * @private
         */
        renderUI: function() {
            Y.log('renderUI()', 'log', "Wegas.Logger");

            var node = Y.Node.create('<div style="height:50px"></div>');
            this.get('contentBox').appendChild(node);

            this.console = new Y.Console({
                logSource: Y.Global,
                plugins: [Y.Plugin.ConsoleFilters],
                width: '100%',
                style: 'block'                                                  // 'inline'
                    //height: '300px',
                    //height: '98%',
                    //newestOnTop: false,
                    //logLevel :'log'
            }).render(node);
        }
    });
    Y.Wegas.Logger = Logger;

});