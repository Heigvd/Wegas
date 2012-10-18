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

YUI.add('wegas-layout', function (Y) {
    "use strict";

    var Layout;

    Layout = Y.Base.create("wegas-layout", Y.Widget, [ Y.Wegas.Widget, Y.WidgetChild, Y.WidgetStdMod ], {

        // ** Lifecycle Methods ** //

        renderUI: function () {
            this.renderPosition('top');
            this.renderPosition('left');
            this.renderPosition('center');
            this.renderPosition('right');
            //this.renderPosition('bottom');

            this._syncUIStdMod();
        },

        bindUI: function () {
            Y.on( "windowresize", Y.bind( this.syncUI, this ) );                // Sync the layout whenever the windows is resized
            //this.get("boundingBox").on("resize", this._syncUIStdMod, this);
            Y.on( 'domready', this.syncUI, this);
        },

        syncUI: function () {
            this.syncCenterNode();
            this._syncUIStdMod();
        },

        // ** Private Methods ** //

        renderPosition: function (position) {

            var i, cWidget, target = null, positionCfg = this.get(position);


            if (position === "top") {
                target = this.getStdModNode("header");

            } else if (position === "bottom") {
                target = this.getStdModNode("footer");

            } else if (position == "left") {
                target = this.getStdModNode("body").one(".wegas-layout-left");

                if ( positionCfg ) {
                    this.leftResize = new Y.Resize({
                        node: target,
                        handles: 'r'
                    });
                    this.leftResize.on("resize", this.syncCenterNode, this);
                }
            } else if (position == "center") {
                target = this.getStdModNode("body").one(".wegas-layout-center");

            } else if (position == "right") {
                target = this.getStdModNode("body").one(".wegas-layout-right");

                if ( positionCfg ) {
                    this.rightResize = new Y.Resize({
                        node: target,
                        handles: 'l'
                    });
                    this.rightResize.on("resize", this.syncCenterNode, this);
                }
            //this.rightResize.plug(Y.Plugin.ResizeConstrained, {
            //minWidth: 200
            // maxWidth: 300,
            //});
            }


            if ( positionCfg ) {                                               // If there is a provided configuration
                for ( i = 0; i < positionCfg.children.length; i = i + 1) {      // render the children
                    cWidget = Y.Wegas.Widget.create( positionCfg.children[ i ] );
                    // cWidget.after( "render", this.syncUI, this );
                    cWidget.render( target );
                }
            } else {
                target.setStyle( "width", "0" );
            }
        },

        /**
         *
         */
        syncCenterNode: function () {
            var bodyNode = this.getStdModNode("body"),
            leftNode = bodyNode.one( ".wegas-layout-left" ),
            rightNode = bodyNode.one( ".wegas-layout-right" );

            leftNode.setStyles( {
                right: "auto",
                left: "0px"
            });
            bodyNode.one(".wegas-layout-center").setStyles({
                "left": leftNode.getStyle("width"),
                "right": rightNode.getStyle("width")
            });
            rightNode.setStyles( {
                right: "0px",
                left: "auto"
            });
            Y.Wegas.app.fire("layout:resize");
        },

        /**
         * Override yui implementation to prevent section's content sync.
         */
        _syncUIStdMod : function() {
            this._uiSetFillHeight(this.get("fillHeight"));
        },

        /**
         * Override yui implementation to use custom templates.
         */
        _getStdModTemplate : function(section) {
            return Y.Node.create(Layout.TEMPLATES[section], this._stdModNode.get("ownerDocument"));
        }

    }, {
        ATTRS: {
            left: {},
            right: {},
            top: {},
            bottom: {},
            center: {},
            /* Reset default value to force display by default */
            headerContent: {
                value:""
            },
            /* Reset default value to force display by default */
            footerContent: {
                value:""
            },
            /* Reset default value to force display by default */
            bodyContent: {
                value:''
            },
            height: {
                value: "100%"
            }
        },
        TEMPLATES: {
            header : '<div class="yui-widget-hd wegas-layout-top"></div>',
            body : '<div class="yui-widget-bd"><div class="wegas-layout-left"></div><div class="wegas-layout-center"></div><div class="wegas-layout-right"></div></div>',
            footer : '<div class="yui-widget-ft wegas-layout-bottom"></div>'
        }
    });

    Y.namespace('Wegas').Layout = Layout;
});