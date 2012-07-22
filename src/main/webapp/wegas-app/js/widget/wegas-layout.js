/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-layout', function (Y) {
    "use strict";

    var Layout;

    Layout = Y.Base.create("wegas-layout", Y.Widget, [Y.Wegas.Widget, Y.WidgetChild, Y.WidgetStdMod], {

        // ** Lifecycle Methods ** //

        renderUI: function () {
            this.after("render", this.onRender);
        },

        bindUI: function () {
            //this.get("boundingBox").on("resize", this._syncUIStdMod, this);
            Y.on("windowresize", Y.bind(this._syncUIStdMod, this));
        },

        syncUI: function () {
            this.syncCenterNode();
        },


        // ** Private Methods ** //

        onRender: function () {
            this.renderPosition('top');
            this.renderPosition('left');
            this.renderPosition('center');
            this.renderPosition('right');
      //      this.renderPosition('bottom');
        },

        renderPosition: function (position) {
            if (!this.get(position)) return;

            var target = null,
            cWidget = Y.Wegas.Widget.create(this.get(position).children[0]);

            if (position === "top") {
                target = this.getStdModNode("header");

            } else if (position === "bottom") {
                target = this.getStdModNode("footer");

            } else if (position == "left") {
                target = this.getStdModNode("body").one(".wegas-layout-left");
                this.leftResize = new Y.Resize({
                    node: target,
                    handles: 'r'
                });
                this.leftResize.on("resize", this.syncCenterNode, this);

            } else if (position == "center") {
                target = this.getStdModNode("body").one(".wegas-layout-center");

            } else if (position == "right") {
                target = this.getStdModNode("body").one(".wegas-layout-right");
                this.rightResize = new Y.Resize({
                    node: target,
                    handles: 'l'
                });
                this.rightResize.on("resize", this.syncCenterNode, this);
                //this.rightResize.plug(Y.Plugin.ResizeConstrained, {
                //minWidth: 200
                // maxWidth: 300,
                //});
            }
            cWidget.render(target);
        },

        /**
         *
         */
        syncCenterNode: function () {
            var bodyNode = this.getStdModNode("body"),
                centerNode = bodyNode.one(".wegas-layout-center");

            centerNode.setStyle("left", bodyNode.one(".wegas-layout-left").getStyle("width"));
            centerNode.setStyle("right", bodyNode.one(".wegas-layout-right").getStyle("width"));
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
            header : '<div class="yui-widget-hd"></div>',
            body : '<div class="yui-widget-bd"><div class="wegas-layout-left"></div><div class="wegas-layout-center"></div><div class="wegas-layout-right"></div></div>',
            footer : '<div class="yui-widget-ft"></div>'
        }
    });

    Y.namespace('Wegas').Layout = Layout;
});