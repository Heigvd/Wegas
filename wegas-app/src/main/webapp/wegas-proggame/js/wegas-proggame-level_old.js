/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-proggame-level', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox',
    GRIDSIZE = 31,
    ProgGameLevel;

    /**
     *  The level display class, with script input, ia, debugger and
     *  terrain display.
     *
     */
    ProgGameLevel = Y.Base.create( "wegas-proggame-level", Y.Widget, [ Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable ], {

        // *** Fields *** //
        CONTENT_TEMPLATE: '<div class="yui3-g">'

        + '<div class="yui3-u left">'
        + '<div class="inventory"><h1>Inventory</h1><i><center style="padding-top:40px;">empty</center></i></div>'
        + '<div class="api"><h1>Api</h1></div>'
        + '</div>'

        + '<div class="yui3-u right">'
        + '<div class="yui3-g topright">'
        + '<div class="yui3-u topcenter"><h1></h1><div class="terrain"></div></div>'
        + '<div class="yui3-u toptopright">'
        + '<div class="buttons"></div>'
        + '<div class="ai"><h1>Enemy A.I.</h1></div>'
        + '<div class="debugger"><h1>Log</h1></div>'
        + '</div>'
        + '</div>'

        + '<div class="code"><h1>Your code</h1></div>'
        + '</div>'
        + '<div style="clear:both"></div>',

        // *** Lifecycle Methods *** //
        renderUI: function () {
            var cb = this.get( CONTENTBOX );

            cb.one( ".ai" ).append( Y.Wegas.Helper.nl2br(this.get( "ai" )) );
            cb.one( ".topcenter h1" ).setHTML(this.get( "label" ));

            cb.one(".api").append(this.get("api")+"*");

            this.aceField = new Y.inputEx.AceField({
                parentEl: cb.one( ".code" ),
                name: 'text',
                type: 'ace',
                height: "300px",
                language: "javascript",
                value: "move();fire();"
            });

            this.display = new ProgGameDisplay(this.toObject());
            this.display.render( cb.one( ".terrain" ));

            this.runButton = new Y.Wegas.Button( {
                label: "RUN SCRIPT"
            } );
            this.runButton.render( cb.one( ".buttons" ));

        },
        bindUI: function () {
            Y.Wegas.Facade.VariableDescriptor.after( "response",             // If data changes, refresh
                this.syncUI, this);

            Y.Wegas.app.after( 'currentPlayerChange', this.syncUI, this);       // If current user changes, refresh (editor only)

            this.runButton.on( "click" , function () {

                this.display.set( "objects", this.get( "objects" ));            // Reset the display to default
                this.display.syncUI();
                this.get( CONTENTBOX ).one( ".debugger" ).setHTML( "<h1>Debugger</h1>" );
                this.runButton.set( "label", "RUNNING..." );
                this.runButton.set( "disabled", true );

                Y.Wegas.Facade.VariableDescriptor.sendRequest({
                    request: "/ProgGame/Run/" + Y.Wegas.app.get('currentPlayer'),
                    cfg: {
                        method: "POST",
                        data: "var ret = [], objects = " + Y.JSON.stringify(this.get( "objects" ))
                        + ",cObject,"
                        + "winingCondition=function(){return "+this.get( "winningCondition" ) +";};"
                        + "for (var i =0;i<2;i++) {"
                        + "cObject = 'player';"
                        + "sendCommand({type:'log', 'text': 'Player turn.'});"
                        + this.aceField.getValue()
                        + "cObject='enemy';"
                        + "sendCommand({type:'log', 'text': 'Enemy turn.'});"
                        + this.get( "ai" )
                        + "}"
                        + "sendCommand({type:'log', 'text': 'Max turn reached, match is a draw.'});"
                        + "JSON.stringify(ret)"
                    },
                    on: {
                        success: Y.bind(this.onServerReply, this ),
                        failure: Y.bind( function () {
                            this.runButton.set( "label", "RUN SCRIPT" );
                            this.runButton.set( "disabled", false );
                            alert( "Your script contains an error." );
                        }, this )
                    }

                });
            }, this );

        },
        syncUI: function () {
            this.display.syncUI();
        },

        onServerReply: function ( e ) {
            this.commandsStack = Y.JSON.parse( e.response.entity );
            this.consumeServerCommand();
        },

        doNextLevel: function () {
            Y.Wegas.Facade.VariableDescriptor.sendRequest({
                request: "/ProgGame/Run/" + Y.Wegas.app.get('currentPlayer'),
                cfg: {
                    method: "POST",
                    data: this.get( "onWin" )
                }
            });
        },

        consumeServerCommand: function () {
            if (this.commandsStack.length > 0 ) {
                var command = this.commandsStack.shift();

                this.display.execute( command );

                switch ( command.type ) {

                    case "gameWon":
                        this.runButton.set( "label", "NEXT LEVEL" );
                        this.runButton.set( "disabled", false );
                        this.runButton.detachAll( "click" );
                        this.runButton.on( "click", this.doNextLevel, this );
                        break;

                    case "log":
                        this.get( "contentBox" ).one( ".debugger" ).append( command.text + "<br />" );

                    default:
                        Y.later( 500, this, this.consumeServerCommand );
                        break;

                }

            } else {
                this.runButton.set( "label", "RUN SCRIPT");
                this.runButton.set( "disabled", false );
            }
        }

    }, {
        ATTRS : {
            label: {
                type: "string"
            },
            objects: {
                _inputex: {
                    _type: "object"
                }
            },
            api: {
                value: []
            },
            ai: {
                type: "string",
                format: "text"
//                _inputex: {
//                    _type: "ace"
//                }
            },
            winningCondition: {
                type: "string",
                format: "text"
//                _inputex: {
//                    _type: "ace"
//                }
            },
            onWin: {
                type: "string",
                _inputex: {
                    _type: "ace"
                }
            }
        }
    });

    Y.namespace('Wegas').ProgGameLevel = ProgGameLevel;


    /**
     * Level display, should handle canvas, for now renders the level as a
     * table element.
     *
     */
    var ProgGameDisplay = Y.Base.create( "wegas-proggame-display", Y.Widget, [], {
        CONTENT_TEMPLATE: '<div><div class="object-layer"></div></div>',

        execute: function ( command ) {
            var cb = this.get( CONTENTBOX );
            switch ( command.type ) {
                case "move":
                    this.set( "objects", command.objects );
                    this.syncUI();
                    break;

                case "fire":
                    var object = this.findObjectByType( command.object ),
                    p = Y.Node.create( '<div class="missile"></div>' ),     // Create a missile
                    source = cb.one( "." + object.id ),                     // Retrieve the source node (the object which fired)
                    to = source.getXY();

                    switch ( object.direction ) {
                        case 1:
                            to[1] -= GRIDSIZE * 3;
                            break;
                        case 2:
                            to[0] += GRIDSIZE * 3;
                            break;
                        case 3:
                            to[1] += GRIDSIZE * 3;
                            break;
                        case 4:
                            to[0] -= GRIDSIZE * 3;
                            break;
                    }

                    var anim = new Y.Anim({
                        node: p,
                        from: {
                            xy: source.getXY()
                        },
                        to: {
                            xy: to
                        },
                        duration: 0.5
                    });
                    cb.one( ".object-layer" ).append( p );
                    anim.run();
                    break;

                case "die":
                    var source2 = cb.one( "." + command.object ),
                    anim2 = new Y.Anim({
                        node: source2,
                        from: {
                            opacity: 1
                        },
                        to: {
                            opacity: 0
                        },
                        duration: 1,
                        iterations: 2
                    });
                    anim2.run();

                    break;

            }
        },

        findObjectByType: function ( type ) {
            var i, objs = this.get( "objects" );
            for ( i = 0; i < objs.length; i = i + 1 ) {
                if ( objs[i].id === type ) {
                    return objs[i];
                }
            }
            return null;
        },

        renderUI: function () {
            var i, j,
            cb = this.get( "contentBox" ),
            acc = [ "<table>" ];

            for ( i = this.get( "gridH" ) - 1 ; i >= 0 ; i -= 1 ) {          // Render table elements
                acc.push( "<tr>" );
                for ( j = 0; j < this.get( "gridW" ); j += 1 ) {
                    acc.push( "<td></td>" );
                }
                acc.push( "</tr>" );
            }
            acc.push( "</table>" );
            cb.append( acc.join( "" ));
        },

        syncUI: function () {
            var i,
            playerLayer = this.get( "contentBox" ).one( ".object-layer" ),
            objs = this.get( "objects" );
            playerLayer.setHTML( "" );

            for ( i = 0; i < objs.length; i = i + 1) {
                var node = Y.Node.create( '<div class="' + objs[i].id + ' dir-' + objs[i].direction + '"></div>');
                node.setXY( [ objs[i].x * GRIDSIZE , (this.get( "gridH" ) - objs[i].y - 1 ) * GRIDSIZE ]);
                playerLayer.append( node );
            }

        }

    }, {
        ATTRS: {
            gridW: {
                value: 8
            },
            gridH: {
                value: 8
            },
            objects: {

        }
        }
    });
    Y.namespace('Wegas').ProgGameDisplay = ProgGameDisplay;

});