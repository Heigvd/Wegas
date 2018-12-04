/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

/**
 *
 * @fileoverview
 * @author Maxence 
 */
/*global YUI*/
YUI.add("wegas-showoverlayonclick", function(Y) {
    "use strict";

    var ShowOverlayOnClick, ShowInboxListOnClick;

    ShowOverlayOnClick = Y.Base.create("wegas-showoverlayonclick", Y.Plugin.Base, [Y.Wegas.Plugin, Y.Wegas.Editable], {
        initializer: function() {
            this.handlers = [];
            this.detailsOverlay = new Y.Overlay({
                zIndex: 100,
                constrain: true,
                visible: false
            }).render();

            this.detailsOverlay.plug(Y.Plugin.Injector);
            var maxWidth = this.get("maxwidth");
            if (maxWidth) {
                this.detailsOverlay.get("boundingBox").setStyle("max-width", maxWidth);
            }

            //this.detailsOverlay.set("headerContent", "<div><span>" + this.get("title") + "</span><span class=\"close fa fa-times\"></div>");
            this.detailsOverlay.setStdModContent('body', "<div></div>");

            this.displayed = false;
            this.detailsOverlay.get("boundingBox").addClass("wegas-onclick-overlay");
            this.get("host").get("boundingBox").addClass("wegas-click");
            this.bind();
        },
        bind: function() {
            this.onHostEvent("click", this.onClick, this);
            this.handlers.push(this.get("host").get("boundingBox").on("clickoutside", this.hide, this));
            //this.handlers.push(Y.one("body").on("click", this.hide, this));
            this.onceAfterHostEvent("render", this._sync);
            this.afterHostMethod("syncUI", this._sync);
            this._customBind();
        },
        _customBind: function() {
        },
        _sync: function() {
        },
        hide: function(e) {
            this.detailsOverlay.hide();
            this.widget && this.widget.destroy();
            this.widget = null;
            this.displayed = false;

            var bb = this.get("host").get("boundingBox");
            bb.toggleClass("wegas-onclick-overlay--displayed", false);
        },
        onClick: function(e) {
            Y.log("ONCLICK SHOWOVERLAY");
            if (this.displayed) {
                this.hide(null);
            } else {
                this.display();
            }
        },
        display: function() {
            var bb, br;
            if (!this.widget) {
                this.genWidget();
            }

            bb = this.get("host").get("boundingBox");
            bb.toggleClass("wegas-onclick-overlay--displayed", true);

            br = bb.getDOMNode().getBoundingClientRect();
            this.detailsOverlay.move(br.left, br.bottom);
            // prevent going off-screen
            this.detailsOverlay.get("boundingBox").setStyle("max-height", window.innerHeight - br.bottom - 50);


            this.detailsOverlay.show();
            this.displayed = true;
        },
        genWidget: function() {
            var theVar = this.get("variable");
            if (theVar) {
                var ctx = this,
                    cfg = this.get("theWidget");
                Y.Wegas.Editable.use(cfg, function(Y) {
                    if (ctx.widget) {
                        ctx.widget.set(ctx.get("widgetAttr"), theVar);
                    } else {
                        cfg[ctx.get("widgetAttr")] = theVar;
                        Y.Wegas.use(cfg, Y.bind(function() {
                            this.widget = Y.Wegas.Widget.create(cfg);
                            if (this.widget) {
                                this.widget.render(this.detailsOverlay.get("contentBox").one(".yui3-widget-bd > div"));
                                this.widget.on(["*:message", "*:showOverlay", "*:hideOverlay"], this.fire, this); // Event on the loaded

                                Y.later(100, this, function() {
                                    if (this.widget) {

                                        var bb = this.widget.get("boundingBox"),
                                            br = bb.getDOMNode().getBoundingClientRect();
                                        Y.log(br);
                                        if (br.right > window.innerWidth) {
                                            this.detailsOverlay.get("boundingBox").setStyle("left", window.innerWidth - br.width);
                                            //this.detailsOverlay.move(window.innerWidth - br.width, this.currentPos[1]);
                                        }
                                    }
                                });
                            }
                        }, ctx));
                    }
                });
            }
        },
        /**
         * Destructor methods.
         * @function
         * @private
         */
        destructor: function() {
            var i;
            this.detailsOverlay.destroy();
            this.widget && this.widget.destroy();
            for (i = 0; i < this.handlers.length; i += 1) {
                this.handlers[i].detach();
            }
        }
    }, {
        ATTRS: {
            maxwidth: {
                type: "string",
                value: "",
                optional: true,
                view: {
                    label: "Max Width"
                }
            },
            variable: {
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                view: {
                    type: "variableselect",
                    label: "Variable"
                }
            },
            theWidget: {
                type: "object",
                value: {
                    "type": "InboxList"
                },
                properties: {
                    type: {
                        type: "string"
                    }
                },
                getter: function(v) {
                    return Y.JSON.parse(Y.JSON.stringify(v));
                }
            },
            widgetAttr: {
                value: "variable",
                type: "string"
            }
        },
        NS: "showoverlayonclick"
    });
    Y.Plugin.ShowOverlayOnClick = ShowOverlayOnClick;

    ShowInboxListOnClick = Y.Base.create("wegas-showinboxlistonclick", Y.Plugin.ShowOverlayOnClick, [], {
    }, {
        ATTRS: {
            variable: {
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                view: {
                    type: "variableselect",
                    label: "Overlay Inbox"
                }
            },
            theWidget: {
                "transient": "true",
                value: {
                    type: "InboxList",
                    template: "clean",
                    chronological: false
                },
                view: {
                    type: "hidden"
                }
            },
            widgetAttr: {
                "transient": "true",
                value: "variable",
                view: {
                    type: "hidden"
                }
            }

        },
        NS: "showinboxlistonclick"
    });
    Y.Plugin.ShowInboxListOnClick = ShowInboxListOnClick;
});
