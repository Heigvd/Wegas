/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

/**
 *
 * @fileoverview
 * @author Cyril Junod <cyril.junod at gmail.com>
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
                width: this.get("width"),
                constrain: true,
                visible: false
            }).render();

            this.detailsOverlay.plug(Y.Plugin.Injector);

            //this.detailsOverlay.set("headerContent", "<div><span>" + this.get("title") + "</span><span class=\"close fa fa-times\"></div>");
            this.detailsOverlay.setStdModContent('body', "<div></div>");

            this.displayed = false;
            this.detailsOverlay.get("contentBox").addClass("wegas-onclick-overlay");
            this.bind();
        },
        bind: function() {
            this.handlers.push(this.get("host").on("click", this.onClick, this));
            //this.handlers.push(Y.one("body").on("click", this.hide, this));
            this.onceAfterHostEvent("render", this._sync);
            this.afterHostMethod("syncUI", this._sync);
            this._customBind();
        },
        _customBind: function() {
        },
        _sync: function() {
        },
        hide: function() {
            this.detailsOverlay.hide();
            this.widget.destroy();
            this.widget = null;
            this.displayed = false;
        },
        onClick: function(e) {
            if (e.pageX) {
                this.currentPos = [e.pageX + 10, e.pageY + 20]; // TODO set in a more clever way
            } else if (e.domEvent && e.domEvent.pageX) {
                this.currentPos = [e.domEvent.pageX + 10, e.domEvent.pageY + 20]; // TODO set in a more clever way
            }

            if (this.displayed) {
                this.hide();
            } else {
                this.display();
            }

            //e.halt(true);
        },

        display: function() {
            if (!this.widget) {
                this.genWidget();
            }
            Y.later(0, this, function() {
                this.detailsOverlay.move(this.currentPos[0], this.currentPos[1]);
                this.detailsOverlay.show();
                this.displayed = true;
            });
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
            width: {
                type: "string",
                value: "250px"
            },
            variable: {
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                _inputex: {
                    _type: "variableselect",
                    label: "Variable"
                }
            },
            theWidget: {
                value: {
                    "type": "InboxList"
                },
                getter: function(v) {
                    return Y.JSON.parse(Y.JSON.stringify(v));
                },
                _inputex: {
                    _type: "group",
                    fields: [{
                            type: "string",
                            name: "type",
                            label: "Type"
                        }]
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

    ShowInboxListOnClick = Y.Base.create("wegas-showinboxlistonclick", Y.Plugin.ShowOverlayOnClick, [], {}, {
        ATTRS: {
            variable: {
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                _inputex: {
                    _type: "variableselect",
                    label: "Variable"
                }
            },
            theWidget: {
                "transient": "true",
                value: {
                    type: "InboxList",
                    template: "clean",
                    chronological: false
                },
                _inputex: {
                    type: "hidden"
                }
            },
            widgetAttr: {
                "transient": "true",
                value: "variable",
                type: "hidden"
            }

        },
        NS: "showinboxlistonclick"
    });
    Y.Plugin.ShowInboxListOnClick = ShowInboxListOnClick;
});
