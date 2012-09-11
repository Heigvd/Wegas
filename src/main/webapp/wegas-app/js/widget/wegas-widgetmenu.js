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

YUI.add('wegas-widgetmenu', function (Y) {
    "use strict";

    /**
     *  @class WidgetMenu
     *  @module Wegas
     *  @constructor
     */
    var  WidgetMenu = function () {
        WidgetMenu.superclass.constructor.apply(this, arguments);
    };

    WidgetMenu.NS = "menu";
    WidgetMenu.NAME = "widgetmenu";

    Y.extend(WidgetMenu, Y.Plugin.Base, {

        // *** Lifecycle methods *** //
        initializer: function () {
            this.afterHostEvent( "render", function () {
                this.get( "host" ).get( "contentBox" ).delegate( "click", function ( e ) {
                    var menu = this.getMenu();                                  // Get a menu instance

                    menu.attachTo( e.target, this );                            // Attach it to the target node
                    menu.removeAll();                                           // Empty the node current content
                    try {
                        menu.add( this.get( "children" ) );                     // And place the widget found in the config
                    } catch( err ) {
                        Y.error( "Error while adding subpage to tab (probably du to absence of Y.WidgetChild in config).", err, WidgetMenu);
                    };
                    
                    e.halt();
                    this.fire( "menuOpen" );
                }, this.get( "selector" ), this );
            });
        },

        // *** Private methods *** //

        getMenu: function () {
            if ( !WidgetMenu.menu ) {
                WidgetMenu.menu = new Y.Wegas.Menu();
            //this.menu.addTarget( this );
            }
            return WidgetMenu.menu;
        }
    }, {
        ATTRS: {
            children: {
                value: []
            },
            selector: {
                value: "*"
            }
        },
        menu: null
    });

    Y.namespace( 'Plugin' ).WidgetMenu = WidgetMenu;

    Y.namespace( 'Wegas' ).Menu = Y.Base.create( "menu" , Y.Widget,
        [ Y.WidgetPosition,  Y.WidgetPositionAlign, Y.WidgetStack, Y.WidgetParent, Y.WidgetPositionConstrain ], {

            // *** private fields *** //

            timer: null,

            // *** Lifecycle methods *** //
            initializer: function () {
                this.publish( "click", {
                    emitFacade: true,
                    bubbles: true
                });
            },

            renderUI: function () {
                var bb = this.get( "boundingBox" );

                // cb.on("clickoutside", this.hideMenu, this);
                bb.on( "click", this.hide, this);
                bb.on( "mouseenter", this.cancelMenuTimer, this);
                bb.on( "mouseleave", this.startMenuHideTimer, this);
            },

            bindUI: function () {
                this.on( "*:click", function ( e ) {                            // @hack in order for event to be bubbled up
                    //Y.log("fix");
                    }, this);
            },

            // *** Public methods *** //
            /**
            *
            *  Displays the menu next to the provided node and add mouseenter and
            *  mouseleave callbacks to the node
            *
            * @method attachTo
            */
            currentTarget: null,

            attachTo: function ( node , eventTarget) {
                this.cancelMenuTimer();
                this.show();

                // node.on("mouseenter", this.cancelMenuTimer, this);
                // node.on("mouseleave", this.startMenuHideTimer, this);
                this.set( "align", {
                    node: node,
                    points: [ "tl", "bl" ]
                });

                if ( this.currentTarget ) {
                    this.removeTarget( this.currentTarget );
                }
                if ( eventTarget ){
                    this.addTarget( eventTarget );
                }
                this.currentTarget = eventTarget;
            },

            // *** Private methods *** //
            startMenuHideTimer: function () {
                this.cancelMenuTimer();
                this.timer = Y.later( 500, this, this.hide );
            },
            cancelMenuTimer: function () {
                if (this.timer) {
                    this.timer.cancel();
                }
            }
        }, {
            ATTRS: {
                constrain: {
                    value: true
                },
                zIndex:{
                    value: 25
                },
                width: {
                    value: "12em"
                },
                render: {
                    value: true
                },
                visible: {
                    value: false
                },
                defaultChildType: {
                    value: "Button"
                }
            }
        });
});


