/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-proggame-level', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox', ProgGameLevel;

    /**
     *  The schedule display class.
     */
    ProgGameLevel = Y.Base.create( "wegas-proggame-level", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {

        // *** Fields *** //

        // *** Lifecycle Methods *** //
        renderUI: function () {
            var cb = this.get(CONTENTBOX);
            cb.append('<div class="yui3-g">'

                +'<div class="yui3-u left">'
                +'<div class="inventory"><h1>Inventory</h1></div>'
                +'<div class="api"><h1>Api</h1></div>'
                +'</div>'

                +'<div class="yui3-u right">'
                +'<div class="yui3-g topright">'
                +'<div class="yui3-u topcenter"><div class="terrain"><h1>Battleground</h1></div></div>'
                +'<div class="yui3-u toptopright">'
                +'<div class="ai"><h1>A.I.</h1>'
                + this.get( "ia" ) + '</div>'
                +'<div class="debugger"><h1>Debugger</h1></div>'
                +'</div>'
                +'</div>'

                +'<div class="code"><h1>Your code</h1></div>'
                + '<div style="clear:both"></div>'
                +'</div>'
                + '<div style="clear:both"></div>');

            this.aceField = new Y.inputEx.AceField({
                parentEl: cb.one(".code"),
                name: 'text',
                type: 'ace',
                height: "300px",
                language: "javascript",
                value: "fire();"
            });
        },
        bindUI: function () {
        //            Y.Wegas.app.dataSources.VariableDescriptor.after("response",    // If data changes, refresh
        //                this.syncUI, this);
        //
        //            Y.Wegas.app.after('currentPlayerChange', this.syncUI, this);    // If current user changes, refresh (editor only)

        },
        syncUI: function () {
            console.log("sync");
        }
    }, {
        ATTRS : {
            children: {},
            ia: {}
        }
    });

    Y.namespace('Wegas').ProgGameLevel = ProgGameLevel;
});