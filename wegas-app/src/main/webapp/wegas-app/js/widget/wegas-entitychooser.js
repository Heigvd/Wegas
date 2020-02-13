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
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
/*global YUI, I18n*/
YUI.add("wegas-entitychooser", function(Y) {
    "use strict";
    var CONTENTBOX = "contentBox", EntityChooser, EntityChooser2,
        CLASSES = {
            CHOOSEN: "chooser-choosen"
        };

    EntityChooser = Y.Base.create("wegas-entitychooser", Y.Widget,
        [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        CONTENT_TEMPLATE: "<div><ul class='chooser-entities'></ul><div class='chooser-widget'></div></div>",
        initializer: function() {
            this._handlers = [];
            /**
             * hold a ref to the currently selected name
             */
            this.currentTarget = null;
        },
        hideAllOverlay: function() {
            Y.Wegas.Widget.prototype.hideAllOverlay.call(this);
            this._currentWidget && this._currentWidget.hideAllOverlay();
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
                            (I18n.t(items[i].get("label"))) + "</li>");
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

    }, {
        ATTRS: {
            variable: {
                type: 'object',
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                view: {
                    type: "variableselect",
                    label: "Folder",
                    classFilter: ["ListDescriptor"]
                }
            },
            widget: {
                type: "object",
                value: {
                    type: "HistoryDialog"
                },
                properties: {
                    type: {
                        type: "string",
                        view: {label: "Type"}
                    }
                },
                getter: function(v) {
                    return Y.JSON.parse(Y.JSON.stringify(v));
                }
            },
            widgetAttr: {
                value: "dialogueVariable",
                type: "string",
                view: {label: "Widget Attribute"}
            },
            flatten: {
                type: "boolean",
                value: "true",
                view: {label: "Flatten"}
            },
            classFilter: {
                type: "array",
                value: [],
                required: true,
                view: {label: "ClassFilter"},
                items: {
                    type: "string",
                    view: {
                        type: "select",
                        choices: Y.Wegas.persistence.AVAILABLE_TYPES
                    }
                }
            }
        }
    });
    Y.Wegas.EntityChooser = EntityChooser;

    EntityChooser2 = Y.Base.create("wegas-entitychooser2", Y.Widget,
        [Y.WidgetParent, Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        CONTENT_TEMPLATE: "<div><ul class='chooser-entities'></ul><div class='chooser-widget'></div></div>",
        initializer: function() {
            this._handlers = [];
            /**
             * hold a ref to the currently selected name
             */
            this.currentTarget = null;
        },
        hideAllOverlay: function() {
            Y.Wegas.Widget.prototype.hideAllOverlay.call(this);
            this._currentWidget && this._currentWidget.hideAllOverlay();
        },
        getItems: function() {
            var theVar = this.get("variable.evaluated");
            if (theVar) {
                if (!Y.Lang.isArray(theVar)) {
                    return this.get("flatten") ? theVar.flatten() : theVar.get("items");
                } else {
                    return theVar;
                }
            } else {
                return [];
            }
        },
        syncUI: function() {
            var items = this.getItems(),
                i, tmp, li,
                entityBox = this.get(CONTENTBOX).one(".chooser-entities"),
                length = items.length, label, getLabel,
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
                        getLabel = this.get("widgets")[items[i].get("@class")].getLabel;
                        label = I18n.t(items[i].get("label"));

                        li = entityBox.appendChild("<li class='chooser-entity' data-type='" +
                            items[i].get("@class") + "'data-name='" +
                            items[i].get("name") + "'>" + label + "</li>");

                        if (getLabel) {
                            label = getLabel(items[i], items[i].get("name"), function(name, the_label) {
                                entityBox.one("[data-name='" + name + "']").setContent(I18n.t(the_label));
                            });
                        }

                        if (this.get("markUnread")) {
                            li.plug(Y.Plugin.MarkAsUnread, {
                                userCounters: this.get("userCounters"),
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
            } else {
                if (this.get("autoSelectFirstUnread")) {
                    Y.later(500, this, this.selectNextUnread);
                }
            }
        },
        selectNextUnread: function() {
            var newTarget;
            if (this.currentTarget) {
                newTarget = this.get("contentBox").one("[data-name='" + this.currentTarget + "'] + .unread");
            } else {
                newTarget = this.get("contentBox").one(".unread");
            }
            if (newTarget) {
                this.select(newTarget);
            }
        },
        select: function(target) {
            var targetName = target.getData("name"),
                targetType = target.getData("type");
            if (this.currentTarget === targetName) { // I'm the choosen one
                return;
            }
            this.genWidget(targetType, targetName);
            this.get(CONTENTBOX).all("." + CLASSES.CHOOSEN).removeClass(CLASSES.CHOOSEN);
            target.addClass(CLASSES.CHOOSEN);
            this.currentTarget = targetName;
        },
        bindUI: function() {
            this.get(CONTENTBOX).delegate("click", function(e) {
                this.selectNextUnread();
            }, ".select-next", this);

            this.get(CONTENTBOX).delegate("click", function(e) {
                this.select(e.target);
            }, ".chooser-entities .chooser-entity", this);
            this._handlers.push(Y.Wegas.Facade.Variable.after("update", this.syncUI, this));
        },
        genWidget: function(type, name) {
            var widgetConfig = JSON.parse(JSON.stringify(this.get("widgets")[type])),
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
                        this._currentWidget.__hackParent = this;
                    }, ctx));
                }
            });
        },
        interceptor: function(e) {
            debugger;
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
                    type: 'object',
                    getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                    view: {
                        type: "variableselect",
                        label: "Folder",
                        classFilter: ["ListDescriptor"]
                    }
                },
                widgets: {
                    required: true,
                    view: {type: "hidden"}
                },
                markUnread: {
                    type: "boolean",
                    value: false,
                    view: {label: "Mark as unread"}
                },
                autoSelectFirstUnread: {
                    type: "boolean",
                    value: true,
                    view: {label: "Autoselect first unread"}
                },
                userCounters: {
                    type: "object",
                    value: {},
                    view: {
                        type: "hidden"
                    }
                },
                flatten: {
                    type: "boolean",
                    value: true,
                    view: {label: "flatter"}
                }
            }
        });
    Y.Wegas.EntityChooser2 = EntityChooser2;

    var ObjectPropertyEditor = Y.Base.create("wegas-objectproperties-editor",
        Y.Widget,
        [Y.WidgetChild,
            Y.Wegas.Widget,
            Y.Wegas.Editable],
        {
            CONTENT_TEMPLATE:
                "<div>"
                + "  <div class='header'>"
                + "    <span class='title'></span>"
                + "    <span class='buttons'>"
                + "      <i class='check-all fa fa-bug' title='Highlight all invalid properties'></i>"
                + "    </span>"
                + "  </div>"
                + "  <div class='editor'>"
                + "    <ul class='chooser-properties'></ul><div class='chooser-form'></div>"
                + "  </div>"
                + "  <div style='display:none' class='ghost-editor'></div>"
                + "</div>",
            initializer: function() {
                this._handlers = [];
                /**
                 * hold a ref to the currently selected name
                 */
                this.currentTarget = null;
            },
            hideAllOverlay: function() {
                Y.Wegas.Widget.prototype.hideAllOverlay.call(this);
                this._currentWidget && this._currentWidget.hideAllOverlay();
            },
            readProperty: function(propertyName) {
                var theObject = this.get("variable.evaluated");
                var properties = theObject.get("properties");

                if (properties.hasOwnProperty(propertyName)) {
                    var prop = properties[propertyName];
                    if (typeof prop === "string") {
                        try {
                            if (this.get("encoding") === "encoded json") {
                                prop = unescape(prop);
                            }
                            return JSON.parse(prop);
                        } catch (e) {
                            return null;
                        }
                    }
                }
                return undefined;
            },
            writeProperty: function(propertyName, o) {
                var theObject = this.get("variable.evaluated");
                var properties = theObject.get("properties");

                var value = JSON.stringify(o);
                if (this.get("encoding") === "encoded json") {
                    value = escape(value);
                }
                properties[propertyName] = value;
                Y.Wegas.Facade.Variable.cache.put(theObject.toObject(), {
                    on: {
                        success: Y.bind(function() {
                            this.form.deactivateSaveBtn();
                        }, this)
                    }
                });
            },
            getPropertyKeys: function() {
                return Object.keys(this.get("variable.evaluated").get("properties"))
                    .filter(Y.bind(function(p) {
                        var prop = this.readProperty(p);
                        return prop && typeof prop === "object";
                    }, this));
            },
            renderUI: function() {
                this.get("contentBox").one(".header .title").setContent(this.get("variable.evaluated")
                    .getLabel() + " Editor");
            },
            syncUI: function() {
                var keys = this.getPropertyKeys();

                var list = this.get(CONTENTBOX).one(".chooser-properties");

                var errored = this.get(CONTENTBOX).all(".chooser-properties .errored").getData("name");

                list.empty();

                var length = keys.length;

                if (length > 0) {
                    for (var i = 0; i < length; i++) {
                        list.append("<li class='chooser-property"
                            + (errored.indexOf(keys[i]) >= 0 ? " errored" : "")
                            + "' data-name='" + keys[i] + "'>" + keys[i] + "</li>");
                    }
                } else {
                    list.append("<li class='no-property'><i>no valid property</i></li>");
                }

                if (this.currentTarget) {
                    var tmp = list.all("[data-name='" + this.currentTarget + "']");
                    tmp.addClass(CLASSES.CHOOSEN);

                    if (!tmp.size()) { //current target exists but is not rendered anymore
                        Y.later(200, this, function() {
                            this.form.destroy();
                            this.form = null;
                        });
                        this.currentTarget = null;
                    }
                }
            },

            highlightAllValidationFailure: function() {

                var onChange;
                var ctx = this;

                var cfg = this.getFormConfig();
                var keys = this.getPropertyKeys();

                var key;
                this.showOverlay();

                function renderOne() {
                    if (keys.length) {
                        key = keys.shift();
                        ctx.get("contentBox").one(".check-all").setContent("Process " + key);
                        var value = ctx.readProperty(key);

                        form.renderForm(value, cfg); // this one will trigger formChange once loader
                    } else {
                        ctx.get("contentBox").one(".check-all").setContent("");
                        onChange.detach();
                        form.destroy();
                        ctx.hideOverlay();
                    }
                }


                var cb = this.get("contentBox");

                var form = new Y.Wegas.RForm({});
                form.render(cb.one(".ghost-editor"));


                onChange = form.after("formChange", Y.bind(function() {
                    if (form.get("form")) {
                        Y.log("KEY: " + key);
                        var entry = this.get("contentBox").one("li.chooser-property[data-name='" + key + "']");

                        var errors = form.validate();

                        entry.toggleClass("errored", errors && errors.length > 0);

                        renderOne();
                    }
                }, this));

                renderOne();
            },
            bindUI: function() {
                this.get(CONTENTBOX).delegate("click", this.highlightAllValidationFailure, ".check-all", this);
                this.get(CONTENTBOX).delegate("click", function(e) {
                    var targetName = e.target.getData("name");
                    if (this.currentTarget === targetName) { // I'm the choosen one
                        return;
                    }
                    this.genForm(targetName);
                    this.get(CONTENTBOX).all("." + CLASSES.CHOOSEN).removeClass(CLASSES.CHOOSEN);
                    e.target.addClass(CLASSES.CHOOSEN);
                    this.currentTarget = targetName;
                }, ".chooser-properties .chooser-property", this);

                this._handlers.push(Y.Wegas.Facade.Variable.after("updatedDescriptor", function(e) {
                    var obj = this.get("variable.evaluated");
                    if (obj && obj.get("id") === e.entity.get("id")) {
                        this.syncUI();
                    }
                }, this));
            },
            getFormConfig: function() {
                if (this.get("evalFormConfig")) {
                    return eval(this.get("evalFormConfig"));
                } else {
                    return this.get("formConfig");
                }
            },
            genForm: function(name) {
                var cfg = this.getFormConfig();
                var parsed = this.readProperty(name);

                if (this.form) {
                    this.form.detach("submit");
                    this.form.destroy();
                }
                this.initialValue = parsed;

                this.form = new Y.Wegas.RForm({
                    values: parsed,
                    cfg: cfg
                });
                this.form.render(this.get("contentBox").one(".chooser-form"));

                this.form.on("updated", Y.bind(function() {
                    this.form.activateSaveBtn();
                }, this));

                this.form.on("submit", Y.bind(function(e) {
                    this.showOverlay();
                    Y.log("E: " + e.value);
                    this.writeProperty(name, e.value);
                    this.get("contentBox")
                        .one("li.chooser-property[data-name='" + name + "']")
                        .removeClass("errored");
                    this.hideOverlay();
                }, this));
            },
            destructor: function() {
                this.form && this.form.destroy();
                Y.Array.each(this._handlers, function(handle) {
                    handle.detach();
                });
            }
        },
        {
            ATTRS: {
                variable: {
                    type: 'object',
                    getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                    view: {
                        type: "variableselect",
                        label: "Object",
                        classFilter: ["ObjectDescriptor"]
                    }
                },
                evalFormConfig: {
                    type: "string",
                    value: "",
                    view: {
                        className: 'wegas-advanced-feature',
                    }
                },
                formConfig: {
                    type: "object",
                    view: {
                        type: "hidden"
                    },
                    value: {}
                },
                encoding: {
                    type: "string",
                    value: "json",
                    view: {
                        label: "Encoding",
                        type: "select",
                        choices: ["json", "encoded json"]
                    }
                }
            }
        });
    Y.Wegas.ObjectPropertyEditor = ObjectPropertyEditor;
});
