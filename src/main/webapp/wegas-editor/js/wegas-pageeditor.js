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

YUI.add('wegas-pageeditor', function (Y) {
    "use strict";

    /**
     *  @class WidgetMenu
     *  @module Wegas
     *  @constructor
     */
    var  BOUNDINGBOX = "boundingBox",
    CONTENTBOX= "contentBox",

    Alignable = Y.Base.create("wegas-pageeditor-overlay", Y.Widget, [ Y.WidgetPosition, Y.WidgetPositionAlign, Y.WidgetStack ], {
        CONTENT_TEMPLATE: '<div><span class="wegas-icon wegas-icon-edit"></span><div>'
    }, {
        CSS_PREFIX: "wegas-pageeditor-overlay"
    } ),

    PageEditor = function () {
        PageEditor.superclass.constructor.apply( this, arguments );
    };


    Y.extend( PageEditor, Y.Plugin.Base, {

        // *** Lifecycle methods *** //
        initializer: function () {
            this.afterHostEvent("render", this.render );
            this.handlers = [];
        },

        render: function() {
            var el, host = this.get('host');

            if ( host.toolbar ) {
                el = host.toolbar.get('header');
                this.designButton = new Y.ToggleButton({
                    label: "<span class=\"wegas-icon wegas-icon-designmode\"></span>Edit page",
                    on: {
                        click: Y.bind(function ( e ) {
                            this.get("host").get( BOUNDINGBOX )
                            .toggleClass("wegas-pageeditor-designmode", e.target.get("pressed"));
                            if ( e.target.get("pressed")) {
                                this.bind();
                            } else {
                                this.detach();
                            }
                        }, this )
                    }
                }).render( el );
            }

            this.highlightOverlay = new Alignable({                            // Init the highlighting overlay
                zIndex: 1,
                render: true,
                visible: false
            });

            this.highlightOverlay.plug( Y.Plugin.WidgetMenu, {
                children: [{
                    type: "Button",
                    label: "Edit",
                    on: {
                        click: Y.bind( function () {                            // Display the edit form
                            Y.Plugin.EditEntityAction.showEditForm( this.targetWidget, Y.bind( function ( val ) {
                                Y.Plugin.EditEntityAction.hideEditFormOverlay();
                                this.targetWidget.setAttrs( val );
                                this.targetWidget.syncUI();
                            }, this ));
                        }, this )
                    }
                }, {
                    type: "Button",
                    label: "Delete",
                    on: {
                        click: Y.bind( function () {
                            this.targetWidget.destroy();
                        }, this )
                    }
                }],
                selector: ".wegas-icon"
            });

            this.highlightOverlay.menu.on("menuOpen", function () {
                this.targetWidget = this.overlayWidget;
            }, this );
        },

        bind: function() {
            var cb = this.get('host').get( CONTENTBOX );

            this.handlers.push( cb.delegate("mouseenter", function ( e ) {
                var widget = Y.Widget.getByNode( e.currentTarget );
                if ( widget ) {
                    this.showOverlay( widget );
                }
                e.halt();
            }, '.yui3-widget', this ));

            this.handlers.push( cb.delegate("mouseleave", function(e){
                //console.log("out", e.currentTarget.get('id'));
                this.hideOverlay();
                e.halt();

                var parentWidget = Y.Widget.getByNode( e.currentTarget.get('parentNode'));
                if (parentWidget && parentWidget.get('root') != parentWidget) {
                    this.showOverlay( parentWidget );
                }
            }, '.yui3-widget', this));
        },

        detach: function () {
            for ( var i = 0; i < this.handlers.length; i = i + 1 ) {
                this.handlers[ i ].detach();
            }
        },

        showOverlay: function( widget ) {
            var targetNode = widget.get( BOUNDINGBOX );

            if ( !widget.toObject ) {
                return;
            }

            this.overlayWidget = widget;

            targetNode.prepend( this.highlightOverlay.get( BOUNDINGBOX ));
            this.highlightOverlay.get( CONTENTBOX ).setStyle("height", targetNode.getHeight());
            this.highlightOverlay.get( CONTENTBOX ).setStyle("width", targetNode.getWidth());
            this.highlightOverlay.align(targetNode, ["tl", "tl"]);
            this.highlightOverlay.show();
        },

        hideOverlay: function() {
            this.highlightOverlay.hide();
        }

    }, {
        NS: "pageeditor",
        NAME: "pageeditor",
        ATTRS: {}
    });
    Y.namespace('Plugin').PageEditor = PageEditor;

    Y.Node.prototype.getWidth = function () {
        return parseInt( this.getComputedStyle('width'))
        + parseInt( this.getComputedStyle('margin-left')) + parseInt( this.getComputedStyle('margin-right'))
        + parseInt( this.getComputedStyle('padding-left')) + parseInt( this.getComputedStyle('padding-right'));
    }
    Y.Node.prototype.getHeight = function () {
        return parseInt( this.getComputedStyle('height'))
        + parseInt( this.getComputedStyle('margin-top')) + parseInt( this.getComputedStyle('margin-bottom'))
        + parseInt( this.getComputedStyle('padding-top')) + parseInt( this.getComputedStyle('padding-bottom'));
    }
});


