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
YUI.add( "wegas-text", function ( Y ) {
    "use strict";

    var CONTENTBOX = "contentBox", Text;

    Text = Y.Base.create( "wegas-text", Y.Widget, [ Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.persistence.Editable ], {
        syncUI: function () {
            this.set( "content", this.get( "content" ) );
        }
    }, {
        ATTRS : {
            content: {
                type: "string",
                format: "html",
                setter: function ( val ) {
                    this.get( CONTENTBOX ).setContent( val );
                    return val;
                }
            }
        }
    });

    Y.namespace( "Wegas" ).Text = Text;
});