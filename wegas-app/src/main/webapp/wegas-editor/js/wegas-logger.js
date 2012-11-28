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

YUI.add('wegas-logger', function (Y) {
    "use strict";

    var Logger = Y.Base.create("wegas-logger", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {

        console: null,

        renderUI: function () {
            Y.log('renderUI()', 'log', "Wegas.Logger");

            var node = Y.Node.create('<div style="height:50px"></div>');

            this.get('contentBox').appendChild(node);

            this.console = new Y.Console({
                logSource: Y.Global,
                plugins: [ Y.Plugin.ConsoleFilters ],
                width: '100%',
                style: 'block'                                                  // 'inline'
            //height: '300px',
            //height: '98%',
            //newestOnTop: false,
            //logLevel :'log'
            }).render(node);
        }
    });

    Y.namespace('Wegas').Logger = Logger;
});