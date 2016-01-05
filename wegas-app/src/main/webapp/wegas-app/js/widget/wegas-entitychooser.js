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
YUI.add("wegas-entitychooser", function(Y) {
    "use strict";
    var CONTENTBOX = "contentBox", EntityChooser, EntityChooser2,
        CLASSES = {
            CHOOSEN: "chooser-choosen"
        };

    EntityChooser = Y.Base.create("wegas-entitychooser",
        Y.Widget,
        [Y.WidgetChild,
            Y.Wegas.Widget,
            Y.Wegas.Editable],
        {
            CONTENT_TEMPLATE: "<div><ul class='chooser-entities'></ul><div class='chooser-widget'></div></div>",
            initializer: function() {
                this._handlers = [];
                /**
                 * hold a ref to the currently selected name
                 */
                this.currentTarget = null;
            },
            syncUI: function() {
                var items = (this.get("variable.evaluated") ?
                    (this.get("flatten") ?
                        this.get("variable.evaluated").flatten() :
                        this.get("variable.evaluated").get("items")) :
                    []),
                    i, tmp,
                    entityBox = this.get(CONTENTBOX).one(".chooser-entities"),
                    length = items.length,
                    filter = [];

                entityBox.empty();
                if (this.get("classFilter")) {
                    if (!Y.Lang.isArray(this.get("classFilter"))) {
                        filter.push(this.get("classFilter"));
                    } else {
                        filter = filter.concat(this.get("classFilter"));
                    }
                }

                for (i = 0; i < length; i += 1) {
                    if (filter.length === 0 || Y.Array.find(filter, function(item) {
                        return item === items[i].get("@class");
                    })) {
                        if ((!items[i].getInstance().getAttrs().hasOwnProperty("active") ||
                            items[i].getInstance().get("active")) &&
                            (!items[i].getInstance().getAttrs().hasOwnProperty("enabled") ||
                                items[i].getInstance().get("enabled"))) {
                            entityBox.append("<li class='chooser-entity' data-name='" + items[i].get("name") + "'>" +
                                (items[i].get("title") || items[i].get("label")) + "</li>");
                        }
                    }
                }
                if (this.currentTarget) {
                    tmp = entityBox.all("[data-name='" + this.currentTarget + "']");
                    tmp.addClass(CLASSES.CHOOSEN);
                    if (!tmp.size()) { //current target exists but is not rendered anymore
                        Y.later(200, this, function() {
                            this.widget.destroy();
                            this.widget = null;
                        });
                        this.currentTarget = null;
                    }
                }
            },
            bindUI: function() {
                this.get(CONTENTBOX).delegate("click", function(e) {
                    var targetName = e.target.getData("name");
                    if (this.currentTarget === targetName) { // I'm the choosen one
                        return;
                    }
                    this.genWidget(targetName);
                    this.get(CONTENTBOX).all("." + CLASSES.CHOOSEN).removeClass(CLASSES.CHOOSEN);
                    e.target.addClass(CLASSES.CHOOSEN);
                    this.currentTarget = targetName;
                }, ".chooser-entities .chooser-entity", this);
                this._handlers.push(Y.Wegas.Facade.Variable.after("update", this.syncUI, this));
            },
            genWidget: function(name) {
                var cfg = this.get("widget"),
                    ctx = this;
                Y.Wegas.Editable.use(cfg, function(Y) {
                    if (ctx.widget) {
                        ctx.widget.set(ctx.get("widgetAttr"), {
                            name: name
                        });
                    } else {
                        cfg[ctx.get("widgetAttr")] = {
                            name: name
                        };
                        Y.Wegas.use(cfg, Y.bind(function() {
                            this.widget = Y.Wegas.Widget.create(cfg);
                            this.widget.render(this.get(CONTENTBOX).one(".chooser-widget"));
                            this.widget.on(["*:message", "*:showOverlay", "*:hideOverlay"], this.fire, this); // Event on the loaded
                        }, ctx));
                    }
                });
            },
            destructor: function() {
                this.widget && this.widget.destroy();
                Y.Array.each(this._handlers, function(handle) {
                    handle.detach();
                });
            }

        },
        {
            ATTRS: {
                variable: {
                    getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                    _inputex: {
                        _type: "variableselect",
                        label: "Folder",
                        classFilter: ["ListDescriptor"]
                    }
                },
                widget: {
                    value: {
                        type: "HistoryDialog"
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
                    value: "dialogueVariable",
                    type: "string"
                },
                flatten: {
                    type: "boolean",
                    value: "true"
                },
                classFilter: {
                    type: "array",
                    _inputex: {
                        elementType: {
                            required: true,
                            type: "select",
                            choices: Y.Wegas.persistence.AVAILABLE_TYPES
                        }
                    }
                }
            }
        });
    Y.Wegas.EntityChooser = EntityChooser;

    EntityChooser2 = Y.Base.create("wegas-entitychooser2",
        Y.Widget,
        [Y.WidgetChild,
            Y.Wegas.Widget,
            Y.Wegas.Editable],
        {
            CONTENT_TEMPLATE: "<div><ul class='chooser-entities'></ul><div class='chooser-widget'></div></div>",
            initializer: function() {
                this._handlers = [];
                /**
                 * hold a ref to the currently selected name
                 */
                this.currentTarget = null;
            },
            syncUI: function() {
                var items = (this.get("variable.evaluated") ? (this.get("flatten") ? this.get("variable.evaluated").flatten() : this.get("variable.evaluated").get("items")) : []),
                    i, tmp, li,
                    entityBox = this.get(CONTENTBOX).one(".chooser-entities"),
                    length = items.length,
                    filter = Y.Object.keys(this.get("widgets"));
                entityBox.empty();
                for (i = 0; i < length; i += 1) {
                    if (Y.Array.find(filter, function(item) {
                        return item === items[i].get("@class");
                    })) {
                        if ((!items[i].getInstance().getAttrs().hasOwnProperty("active") ||
                            items[i].getInstance().get("active")) &&
                            (!items[i].getInstance().getAttrs().hasOwnProperty("enabled") ||
                                items[i].getInstance().get("enabled"))) {
                            li = entityBox.appendChild("<li class='chooser-entity' data-type='" + items[i].get("@class") + "'data-name='" + items[i].get("name") + "'>" +
                                (items[i].get("title") || items[i].get("label")) + "</li>");
                            if (this.get("markUnread")) {
                                li.plug(Y.Plugin.MarkAsUnread, {
                                    userCounters: {"ObjectDescriptor": "function(descriptor, instance, resolve) {resolve ((descriptor.get(\"label\") === \"points\" && instance.get(\"properties.maxPoints\") && !instance.get(\"properties.submitted\") ? 1 : 0)); }"},
                                    variable: {
                                        name: items[i].get("name")
                                    }
                                });
                                li.MarkAsUnread.updateCounter();
                            }
                        }
                    }
                }
                if (this.currentTarget) {
                    tmp = entityBox.all("[data-name='" + this.currentTarget + "']");
                    tmp.addClass(CLASSES.CHOOSEN);
                    if (!tmp.size()) { //current target exists but is not rendered anymore
                        Y.later(200, this, function() {
                            this._currentWidget.destroy();
                            this._currentWidget = null;
                            this._currentWidgetType = null;
                        });
                        this.currentTarget = null;
                    }
                }
            },
            bindUI: function() {
                this.get(CONTENTBOX).delegate("click", function(e) {
                    var targetName = e.target.getData("name");
                    if (this.currentTarget === targetName) { // I'm the choosen one
                        return;
                    }
                    this.genWidget(e.target.getData("type"), targetName);
                    this.get(CONTENTBOX).all("." + CLASSES.CHOOSEN).removeClass(CLASSES.CHOOSEN);
                    e.target.addClass(CLASSES.CHOOSEN);
                    this.currentTarget = targetName;
                }, ".chooser-entities .chooser-entity", this);
                this._handlers.push(Y.Wegas.Facade.Variable.after("update", this.syncUI, this));
            },
            genWidget: function(type, name) {
                var widgetConfig = this.get("widgets")[type],
                    ctx = this, cfg;
                cfg = widgetConfig.widget;

                Y.Wegas.Editable.use(cfg, function(Y) {
                    if (ctx._currentWidgetType === type) {
                        ctx._currentWidget.set(widgetConfig.widgetAttr, {
                            name: name
                        });
                    } else {
                        cfg[widgetConfig.widgetAttr] = {
                            name: name
                        };
                        Y.Wegas.use(cfg, Y.bind(function() {
                            this._currentWidget && this._currentWidget.destroy();

                            this._currentWidgetType = type;
                            this._currentWidget = Y.Wegas.Widget.create(cfg);
                            this._currentWidget.render(this.get(CONTENTBOX).one(".chooser-widget"));
                            // propagates selected event to the "parent"
                            this._currentWidget.on(["*:message", "*:showOverlay", "*:hideOverlay"], this.fire, this);
                        }, ctx));
                    }
                });
            },
            destructor: function() {
                this._currentWidget && this._currentWidget.destroy();
                Y.Array.each(this._handlers, function(handle) {
                    handle.detach();
                });
            }
        },
        {
            ATTRS: {
                variable: {
                    getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                    _inputex: {
                        _type: "variableselect",
                        legend: "Folder",
                        classFilter: ["ListDescriptor"]
                    }
                },
                widgets: {
                    optional: false,
                    _inputex: {
                        _type: "hashlist",
                        keyField: "dataType",
                        valueField: "config",
                        elementType: {
                            type: "combine",
                            fields: [{
                                    name: "dataType",
                                    type: "select",
                                    value: "DialogueDescriptor",
                                    choices: Y.Wegas.persistence.AVAILABLE_TYPES
                                }, {
                                    name: "config",
                                    type: "group",
                                    fields: [{
                                            name: "widget",
                                            type: "group",
                                            value: {
                                                type: "HistoryDialogue"
                                            },
                                            fields: [{
                                                    type: "string",
                                                    name: "type",
                                                    label: "Type"
                                                }]
                                        }, {
                                            name: "widgetAttr",
                                            value: "dialogueVariable",
                                            type: "string"
                                        }]
                                }
                            ]
                        }
                    }
                },
                markUnread: {
                    type: "boolean",
                    value: false
                },
                userCounters: {
                    type: "object",
                    value: {},
                    optional: true,
                    _inputex: {
                        type: "hidden"
                    }
                },
                flatten: {
                    type: "boolean",
                    value: "true"
                }
            }
        });
    Y.Wegas.EntityChooser2 = EntityChooser2;

});
