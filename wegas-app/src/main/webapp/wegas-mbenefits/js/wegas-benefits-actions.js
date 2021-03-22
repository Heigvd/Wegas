/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * Maxence
 */
/*global YUI, I18n*/
YUI.add("wegas-mbenefits-actions", function(Y) {
    "use strict";

    var CONTENTBOX = "contentBox",
        Action;

    Action = Y.Base.create("wegas-benefits-action", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        initializer: function() {
            this.handlers = {};
            this.publish("expand", {
                emitFacade: true
            });
            this.publish("collapse", {
                emitFacade: true
            });
        },
        renderUI: function() {
            var root = this.get("variable.evaluated");
            this.rootVdName = root.get("name");

            // highlight if at least 1 unread question
            this.plug(Y.Plugin.MBenefitsUnread, {
                //variable: this._getChildScriptAttr(root, "actions")
                variable: this.get("variable")
            });

            // toggle if highlithed
            this.plug(Y.Plugin.MBenefitsMainQuest, {
                //variable: this._getChildScriptAttr(root, "actions")
                variable: this.get("variable")
            });

            var bb = this.get("boundingBox");
            bb.setAttribute("data-vdname", this.rootVdName);

            this.mainLayout = new Y.Wegas.FlexList({
                direction: "horizontal",
                cssClass: "benefits-action__main-layout"
            }).render(this.get(CONTENTBOX));

            this.layout = new Y.Wegas.FlexList({
                direction: "vertical",
                cssClass: "benefits-action__layout"
            });

            this.mainLayout.add(this.layout);

            this.sidePanel = new Y.Wegas.FlexList({
                direction: "vertical",
                cssClass: "benefits-action__sidepanel"
            });

            this.sidePanelHeader = new Y.Wegas.FlexList({
                direction: "horizontal",
                cssClass: "benefits-action__sidepanel__header"
            });

            this.sidePanelTitle = new Y.Wegas.Text({
                content: "",
                cssClass: "benefits-action__sidepanel__title"
            });

            this.sidePanelClose = new Y.Wegas.Text({
                content: "<i class='fa fa-times fa-2x'></i>",
                cssClass: "benefits-action__sidepanel__close"
            });
            this.sidePanelHeader.add(this.sidePanelTitle);
            this.sidePanelHeader.add(this.sidePanelClose);

            this.sidePanel.add(this.sidePanelHeader);

            this.sidePanelContent = new Y.Wegas.FlexList({
                direction: "vertical",
                cssClass: "benefits-action__sidepanel__panel"
            });

            this.sidePanel.add(this.sidePanelContent);


            this.mainLayout.add(this.sidePanel);

            this.topPart = new Y.Wegas.FlexList({
                direction: "horizontal",
                cssClass: "benefits-action__top-part"
            });

            this.picture = new Y.Wegas.TextTemplate({
                variable: this._getChildScriptAttr(root, "picture"),
                cssClass: "benefits-action__picture"
            });
            this.topPart.add(this.picture);

            this.layout.add(this.topPart);

            var nameToDisplay = "<div class='benefits-action__name'>"
                + I18n.t(root.get("label"))
                + "</div>";

            if (this._getChildValue(root, "title")) {
                nameToDisplay += "<div class='benefits-action__title'>"
                    + this._getChildValue(root, "title")
                    + "</div>";
            }

            var sympathyAttr = this._getChildScriptAttr(root, "sympathy");
            if (sympathyAttr) {
                nameToDisplay += "<div class='benefits-action__sympathy'>"
                    + this._getChildValue(root, "sympathy").toFixed(0) + "%"
                    + "</div>";
            }


            this.name = new Y.Wegas.Text({
                content: nameToDisplay,
                cssClass: "benefits-action__header"
            });

            this.layout.add(this.name);



            this.actions = new Y.Wegas.FlexList({
                direction: "horizontal",
                cssClass: "benefits-action__actions"
            });

            this._actions = {};

            this.layout.add(this.actions);

            if (this._getChildScriptAttr(root, "description")) {
                this.description = new Y.Wegas.TextTemplate({
                    variable: this._getChildScriptAttr(root, "description"),
                    cssClass: 'benefits-action__description'
                });
                this.layout.add(this.description);
            }
        },
        bindUI: function() {
            var cb = this.get("contentBox");

            //cb.delegate("click", this.expand, ".wegas-benefits-action", this);
            this.handlers.expandOnClick = this.on("click", this.expand, this);

            cb.delegate("click", this.onAction, ".benefits-action__action.active", this);


            this.handlers.update = Y.Wegas.Facade.Variable.after("update", this.syncUI, this);
        },
        onAction: function(e) {
            e.stopImmediatePropagation();
            var vdName = e.currentTarget.getData("name");

            this.fire("expand", {
                vdName: this.rootVdName,
                actionName: vdName
            });
        },
        showAction: function(actionVdName) {
            if (!this.currentAction || actionVdName !== this.currentActionName) {
                this.closeAction();
                if (!actionVdName) {
                    // Select first
                    var defaultAction = this.actions.get("boundingBox").one(".benefits-action__action.active");
                    if (defaultAction) {
                        actionVdName = defaultAction.getData().name;
                    }
                }

                if (actionVdName) {
                    this.currentActionName = actionVdName;

                    this.actions.get("boundingBox").one(".benefits-action__action[data-name='" + actionVdName + "']").addClass("selected");

                    var root = this.get("variable.evaluated");

                    var title = "<span class='action__name'>"
                        + I18n.t(root.get("label"))
                        + "</span>";

                    if (this._getChildValue(root, "title")) {
                        title += ", <span class='action__subtitle'>"
                            + this._getChildValue(root, "title")
                            + "</span>";
                    }

                    title += ": <span class='title'>"
                        + I18n.t(Y.Wegas.Facade.Variable.cache.find("name", this.currentActionName).get("label"))
                        + "</span>";

                    this.sidePanelTitle.setContent(title);

                    if (this.currentAction) {
                        this.currentAction.set("variable", {
                            "@class": "Script",
                            content: "Variable.find(gameModel, \"" + actionVdName + "\");"
                        });
                    } else {
                        var actionDesc = Y.Wegas.Facade.Variable.cache.find("name", actionVdName);
                        var varAttr = this._getScriptAttr(actionVdName);

                        if (actionDesc instanceof Y.Wegas.persistence.QuestionDescriptor) {
                            this.currentAction = new Y.Wegas.MCQView({
                                variable: varAttr,
                                cssClass: 'benefits-action__mcqview',
                                "displayResult": "dialogue",
                                "availableChoicesInvite": this.get("availableChoicesInvite"),
                                "submitVar": this.get("submitVar")
                            });
                        } else if (actionDesc instanceof Y.Wegas.persistence.WhQuestionDescriptor) {
                            this.currentAction = new Y.Wegas.WhView({
                                variable: varAttr,
                                cssClass: 'benefits-action__whview'
                            });
                        } else if (actionDesc instanceof Y.Wegas.persistence.DialogueDescriptor) {
                            if (this.get("dialogueType") === "history") {
                                this.currentAction = new Y.Wegas.HistoryDialog({
                                    dialogueVariable: varAttr,
                                    cssClass: 'benefits-action__dialogue'
                                });
                            } else {
                                this.currentAction = new Y.Wegas.SimpleDialogue({
                                    dialogueVariable: varAttr,
                                    cssClass: 'benefits-action__dialogue'
                                });
                            }
                        } else if (actionDesc instanceof Y.Wegas.persistence.ListDescriptor) {
                            this.currentAction = new Y.Wegas.MCQTabView({
                                variable: varAttr,
                                cssClass: 'benefits-action__mcqtabview',
                                "responsiveThreshold": 500,
                                "autoOpenFirst": false,
                                "mode": "auto"
                            });
                        } else if (actionDesc instanceof Y.Wegas.persistence.TextDescriptor) {
                            this.currentAction = new Y.Wegas.TextTemplate({
                                variable: varAttr,
                                cssClass: 'benefits-action__text'
                            });
                        } else if (actionDesc instanceof Y.Wegas.persistence.StringDescriptor) {
                            this.currentAction = null;
                            var theFile = actionDesc.getInstance().get("value");
                            var btn = new Y.Wegas.Button({});

                            btn.plug(Y.Plugin.OpenFileAction, {
                                file: theFile
                            });

                            btn.fire("click");
                            btn.destroy();
                        } else if (actionDesc instanceof Y.Wegas.persistence.NumberDescriptor) {
                            this.currentAction = null;
                            /*var btn = new Y.Wegas.Button({});
                             btn.plug(Y.Plugin.OpenPanelPageloader, {
                             "page": actionDesc.getInstance().get("value"),
                             "width": "90%",
                             "height": "90%",
                             "style": "modern",
                             "title": actionDesc.get("label"),
                             "cssClass": "benefits-action__pageloader"
                             });
                             btn.fire("click");
                             btn.destroy();
                             */
                            var pageLoader = Y.Widget.getByNode(this.get("boundingBox").ancestor(".wegas-pageloader"));
                            pageLoader.set("pageId", actionDesc.getInstance().get("value"));
                        } else {
                            this.currentAction = Y.Wegas.Text({
                                content: "Unknown Action Type"
                            });
                        }

                        if (this.currentAction) {
                            this.sidePanelContent.add(this.currentAction);
                        } else {
                            this.fire("collapse");
                        }
                    }
                } else {
                    this.sidePanelTitle.setContent("No actions available for the moment");
                }
            }
        },
        closeAction: function() {
            if (this.currentAction) {
                this.actions.get("boundingBox").all(".benefits-action__action").removeClass("selected");
                this.currentAction.destroy();
                this.currentAction = null;
                this.currentActionName = null;
            }
        },
        expand: function(e) {
            if (this.get("boundingBox").ancestor(".benefits-actions__thumbnails")) {
                e.stopImmediatePropagation();
                this.fire("expand", {
                    vdName: this.rootVdName,
                    actionName: null
                });
            }
        },
        _getScriptAttr: function(vdName) {
            return {
                "@class": "Script",
                "content": "Variable.find(gameModel, \"" + vdName + "\");"
            };
        },
        _getChildScriptAttr: function(parent, tagName) {
            var child = parent.getChildByTag(tagName);
            if (child) {
                return this._getScriptAttr(child.get("name"));
            }
            return null;
        },
        _getChildValue: function(parent, tagName) {
            var child = parent.getChildByTag(tagName);
            if (child) {
                return child.getValue();
            }
            return null;
        },
        syncUI: function() {
            var root = this.get("variable.evaluated");
            var bb = this.get("boundingBox");

            var highlightChild = root.getChildByTag("highlight");

            if (highlightChild) {
                if (highlightChild instanceof Y.Wegas.persistence.BooleanDescriptor) {
                    bb.toggleClass("mb-highlighted", highlightChild.getValue());
                    bb.toggleClass("mb-darkened", !highlightChild.getValue());
                } else if (highlightChild instanceof Y.Wegas.persistence.NumberDescriptor) {
                    bb.toggleClass("mb-highlighted", highlightChild.getValue() > 0);
                    bb.toggleClass("mb-darkened", highlightChild.getValue() < 0);
                }
            }

            this.active = this._getChildValue(root, "active");
            bb.toggleClass("inactive", !this.active);
            var actionsToProcess = Y.mix({}, this._actions);

            var sympathyAttr = this._getChildScriptAttr(root, "sympathy");
            if (sympathyAttr) {
                var sValue = this._getChildValue(root, "sympathy");
                bb.setAttribute("data-sympathy", Y.Wegas.MBenefitsHelper.getSympathyLevel(sValue));
                if (this.sympathy) {
                    var sympBB = this.sympathy.get("boundingBox"),
                        visible = this._getChildValue(root, "sympathyVisible");
                    if (sympBB.hasClass("inactive") && visible && this.sympathy.animateFromMin) {
                        this.sympathy.animateFromMin();
                    }
                    sympBB.toggleClass("inactive", !visible);
                } else {
                    this.name.get("contentBox").one(".benefits-action__sympathy").setContent(+this._getChildValue(root, "sympathy").toFixed(0) + "%");
                }

                this.get("contentBox").toggleClass("sympathyVisible", this._getChildValue(root, "sympathyVisible"));
            }

            var actionsChild = root.getChildByTag("actions");

            if (actionsChild) {
                Y.Array.each(actionsChild.get("items"), function(item, index, array) {
                    if (this.isActionTypeValid(item)) {

                        var tag = item.get("editorTag"),
                            name = item.get("name");
                        if (!this._actions[name]) {
                            this._actions[name] = new Y.Wegas.Text({
                                content: ""
                            });
                            this._actions[name].plug(Y.Plugin.MBenefitsSecQuest, {
                                variable: this._getScriptAttr(name)
                            });
                            this.actions.add(this._actions[name]);
                        }

                        var cb = this._actions[name].get(CONTENTBOX);
                        cb.toggleClass(this._actions[name].get("cssClass"), false);
                        this._actions[name].set("cssClass", "benefits-action__action " + tag + (this.hasActiveContent(item) ? " active" : " inactive"));
                        cb.setAttribute("data-name", name);
                        cb.toggleClass(this._actions[name].get("cssClass"), true);
                        this._actions[name].syncUI();

                        delete actionsToProcess[name];
                    }
                }, this);
            }

            for (var actionToRemove in actionsToProcess) {
                //todo
            }
        },
        isActionTypeValid: function(item) {
            return item instanceof Y.Wegas.persistence.ListDescriptor ||
                item instanceof Y.Wegas.persistence.QuestionDescriptor ||
                item instanceof Y.Wegas.persistence.TextDescriptor ||
                item instanceof Y.Wegas.persistence.StringDescriptor ||
                item instanceof Y.Wegas.persistence.NumberDescriptor ||
                item instanceof Y.Wegas.persistence.WhQuestionDescriptor ||
                item instanceof Y.Wegas.persistence.DialogueDescriptor;
        },
        hasActiveContent: function(item) {
            var queue;
            if (item instanceof Y.Wegas.persistence.ListDescriptor) {
                queue = item.flatten();
            } else {
                queue = [item];
            }
            var child;
            while ((child = queue.pop()) != null) {
                if ((child instanceof Y.Wegas.persistence.QuestionDescriptor ||
                    child instanceof Y.Wegas.persistence.WhQuestionDescriptor)
                    && child.getInstance().get("active")) {
                    return true;
                }
                if (child instanceof Y.Wegas.persistence.DialogueDescriptor
                    && child.getInstance().get("enabled")) {
                    return true;
                }

                if (child instanceof Y.Wegas.persistence.TextDescriptor
                    || child instanceof Y.Wegas.persistence.NumberDescriptor
                    || child instanceof Y.Wegas.persistence.StringDescriptor) {

                    return true;
                }
            }
        },
        destructor: function() {
            Y.log("Destroy actor");
            for (var k in this.handlers) {
                this.handlers[k].detach();
            }

            for (var k in this._actions) {
                this._actions[k].destroy();
            }

            this.mainLayout.destroy();
        }
    }, {
        ATTRS: {
            variable: {
                type: 'object',
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                view: {
                    type: 'variableselect',
                    label: 'Actor/Location',
                    classFilter: ['ListDescriptor']
                }
            },
            positionInvite: {
                type: 'object',
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                view: {
                    type: 'variableselect',
                    label: 'Position Invite',
                    classFilter: ['StringDescriptor', 'TextDescriptor']
                }
            },
            dialogueType: {
                type: "string",
                value: "simple",
                view: {
                    type: "select",
                    className: 'wegas-advanced-feature',
                    choices: [
                        {
                            value: 'simple',
                            label: 'Simple'
                        },
                        {
                            value: 'history',
                            label: 'History'
                        }
                    ],
                    label: 'Dialogue Display Style'
                }
            },
            submitVar: {
                type: "object",
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                view: {
                    type: 'variableselect',
                    label: "MCQ Submit text",
                    classFilter: [
                        "TextDescriptor", "StringDescriptor", // use the value
                        "ListDescriptor" // use the label
                    ]
                }
            },
            availableChoicesInvite: {
                type: "object",
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                view: {
                    type: 'variableselect',
                    label: 'Available choices text',
                    classFilter: [
                        "TextDescriptor", "StringDescriptor", // use the value
                        "ListDescriptor" // use the label
                    ]
                }
            }
        }
    });
    Y.Wegas.BenefitsAction = Action;


    var Actions = Y.Base.create("wegas-benefits-actions", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        initializer: function() {
            this.handlers = {};
            this.actions = {};
        },
        /**
         * 
         * @param {type} attrName
         * @param {type} defaultValue
         * @returns {String}  listDescriptor label or String/Text value or default
         */
        getValueOrDefault: function(attrName, defaultValue) {
            if (this.get(attrName)) {
                var vd = this.get(attrName + ".evaluated");
                if (vd instanceof Y.Wegas.persistence.ListDescriptor) {
                    return vd.getLabel();
                } else {
                    return vd.getValue();
                }
            } else {
                return defaultValue;
            }
        },
        renderUI: function() {
            var CB = this.get(CONTENTBOX);

            this.layout = new Y.Wegas.FlexList({
                direction: "vertical",
                cssClass: "benefits-actions__layout"
            }).render(CB);

            this.title = new Y.Wegas.Text({
                content: this.getValueOrDefault("title", "Actions"),
                cssClass: "benefits-actions__title"
            });

            this.subLine = new Y.Wegas.FlexList({
                direction: "horizontal",
                cssClass: "benefits-actions__subtitle_line"
            });

            this.subtitle = new Y.Wegas.Text({
                content: this.getValueOrDefault("subtitle", "Select an item to see possible actions"),
                cssClass: "benefits-actions__subtitle"
            });

            this.toggler = new Y.Wegas.Text({
                content: "<span class='show'>" + this.getValueOrDefault("inviteShow", "show") + "</span>"
                    + "<span class='hide'>" + this.getValueOrDefault("inviteHide", "hide") + "</span>",
                cssClass: "benefits-actions__toggler"
            });

            this.placeholder = new Y.Wegas.Text({
                content: this.getValueOrDefault("noActionsVar", "There are no actions available yet"),
                cssClass: "benefits-actions__placeholder"
            });

            this.mainLayout = new Y.Wegas.FlexList({
                direction: "vertical",
                cssClass: "benefits-actions__main-layout"
            });

            this.thumbnails = new Y.Wegas.FlexList({
                direction: "horizontal",
                cssClass: "benefits-actions__thumbnails"
            });

            this.panel = new Y.Wegas.Text({
                content: "Nothing selected",
                cssClass: "benefits-actions__expanded benefits-nothing-selected"
            });
            this.mainLayout.add(this.thumbnails);
            this.mainLayout.add(this.panel);
            this.layout.add(this.title);
            this.subLine.add(this.subtitle);
            this.subLine.add(this.toggler);

            this.layout.add(this.subLine);

            this.layout.add(this.placeholder);
            this.layout.add(this.mainLayout);

            this.toggler.plug(Y.Plugin.ShowOnClick, {
                "targetEvent": "click",
                "nodeSelector": "#" + this.thumbnails.get("boundingBox").get("id"),
                "hideByDefault": false,
                "hideMode": "hostclick",
                "harmonizeHeights": false
            });
        },
        bindUI: function() {
            this.handlers.onExpand = this.mainLayout.on("*:expand", this.expand, this);
            this.handlers.onCollapse = this.mainLayout.on("*:collapse", this.collapse, this);

            this.mainLayout.get("contentBox").delegate("click", this.collapse, ".benefits-action__sidepanel__close", this);

            this.handlers.update = Y.Wegas.Facade.Variable.after("update", this.syncUI, this);
        },
        syncUI: function() {
            var root = this.get("variable.evaluated");
            var toProcess = Y.mix({}, this.actions);

            this.get("contentBox").toggleClass("wegas-benefits-actions__vertical", this.get("thumbnails") === 'vertical');
            this.get("contentBox").toggleClass("wegas-benefits-actions__show-toggler", this.get("showToggler"));

            var items = root.get("items");
            Y.Array.each(items, function(item) {
                var itemName = item.get("name");
                if (item instanceof Y.Wegas.persistence.ListDescriptor) {

                    if (this.actions[itemName]) {
                        delete toProcess[itemName];
                    } else {
                        this.actions[itemName] = new Y.Wegas.BenefitsAction({
                            variable: {
                                "@class": "Script",
                                "content": "Variable.find(gameModel, \"" + itemName + "\");"
                            },
                            dialogueType: this.get("dialogueType"),
                            availableChoicesInvite: this.get("availableChoicesInvite"),
                            "submitVar": this.get("submitVar")
                        });
                        this.thumbnails.add(this.actions[itemName]);
                    }
                }
            }, this);

            // not processed
            for (var itemName in toProcess) {
                this.actions[itemName].destroy();
            }

            // wait for sub action to sync
            Y.later(0, this, function() {
                var cb = this.get("contentBox");
                cb.toggleClass("has-active-actions", cb.all(".wegas-benefits-action:not(.inactive)").size() > 0);
            });

        },
        severalActiveActors: function() {
            var hasOne = false;
            for (var itemName in this.actions) {
                if (this.actions[itemName].active) {
                    if (hasOne) {
                        return true;
                    } else {
                        hasOne = true;
                    }
                }
            }
            return false;
        },
        expand: function(e) {
            if (this.actions[e.vdName]) {
                var selectedThumbnail = this.actions[e.vdName];

                this.collapse();


                this.get("contentBox").toggleClass("expanded", true);
                selectedThumbnail.get("boundingBox").toggleClass("selected", true);

                this.panel && this.panel.destroy();
                this.panel = new Y.Wegas.BenefitsAction({
                    variable: {
                        "@class": "Script",
                        "content": "Variable.find(gameModel, \"" + e.vdName + "\");"
                    },
                    dialogueType: this.get("dialogueType"),
                    availableChoicesInvite: this.get("availableChoicesInvite"),
                    submitVar: this.get("submitVar")
                });

                this.mainLayout.add(this.panel);

                this.panel.get("boundingBox").addClass("benefits-actions__expanded");
                this.panel.showAction(e.actionName);

                // mark as read as soon as the actor/action is expanded:
                var unreadVar = this.panel.get("variable.evaluated").getChildByTag("unread");
                if (unreadVar && unreadVar.getValue()) {
                    var unreadName = unreadVar.get("name");
                    Y.Wegas.Facade.Variable.script.remoteEval("Variable.find(gameModel, \"" + unreadName + "\").setValue(self, false);", {});
                }
            }
        },
        collapse: function(e) {
            this.panel && this.panel.destroy();

            var cb = this.get("contentBox");
            cb.removeClass("expanded");
            cb.all(".wegas-benefits-action.selected").removeClass("selected");

            var prevWidget = Y.Widget.getByNode(this.get("boundingBox").one(".expanded"));
            if (prevWidget) {
                prevWidget.closeAction();
            }

            cb.all(".expanded").removeClass("expanded");
            this.get("boundingBox").all(".benefits-action__action.selected").removeClass("selected");
            e && e.stopImmediatePropagation();
        },
        destructor: function() {
            Y.log("Destroy actors list");
            for (var k in this.handlers) {
                this.handlers[k].detach();
            }
            for (var itemName in this.actions) {
                this.actions[itemName].destroy();
            }

            this.layout && this.layout.destroy();
        }
    }, {
        ATTRS: {
            variable: {
                type: 'object',
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                view: {
                    type: 'variableselect',
                    label: 'Actors/Locations Folder',
                    classFilter: ['ListDescriptor']
                }
            },
            title: {
                type: 'object',
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                view: {
                    type: 'variableselect',
                    label: 'Title',
                    classFilter: [
                        "TextDescriptor", "StringDescriptor", // use the value
                        "ListDescriptor" // use the label
                    ]
                }
            },
            subtitle: {
                type: 'object',
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                view: {
                    type: 'variableselect',
                    label: 'Subitle',
                    classFilter: [
                        "TextDescriptor", "StringDescriptor", // use the value
                        "ListDescriptor" // use the label
                    ]
                }
            },
            noActionsVar: {
                type: 'object',
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                view: {
                    type: 'variableselect',
                    label: 'No actions text',
                    classFilter: [
                        "TextDescriptor", "StringDescriptor", // use the value
                        "ListDescriptor" // use the label
                    ]
                }
            },
            thumbnails: {
                value: 'horizontal',
                type: "string",
                view: {
                    type: 'select',
                    label: "Thumbnails orientation",
                    choices: ['vertical', 'horizontal']
                }
            },
            dialogueType: {
                type: "string",
                value: "simple",
                view: {
                    type: "select",
                    className: 'wegas-advanced-feature',
                    choices: [
                        {
                            value: 'simple',
                            label: 'Simple'
                        },
                        {
                            value: 'history',
                            label: 'History'
                        }
                    ],
                    label: 'Dialogue Display Style'
                }
            },
            showToggler: {
                type: "boolean",
                value: false,
                view: {
                    label: "Show toggler"
                }
            },
            inviteShow: {
                type: 'object',
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                visible: function(val, formVal) {
                    return formVal.showToggler;
                },
                view: {
                    type: 'variableselect',
                    label: 'Invite show',
                    classFilter: [
                        "TextDescriptor", "StringDescriptor", // use the value
                        "ListDescriptor" // use the label
                    ]
                }
            },
            inviteHide: {
                type: 'object',
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                visible: function(val, formVal) {
                    return formVal.showToggler;
                },
                view: {
                    type: 'variableselect',
                    label: 'Invite hide',
                    classFilter: [
                        "TextDescriptor", "StringDescriptor", // use the value
                        "ListDescriptor" // use the label
                    ]
                }
            },
            availableChoicesInvite: {
                type: "object",
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                view: {
                    type: 'variableselect',
                    label: 'Available choices text',
                    classFilter: [
                        "TextDescriptor", "StringDescriptor", // use the value
                        "ListDescriptor" // use the label
                    ]
                }
            },
            submitVar: {
                type: "object",
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                view: {
                    type: 'variableselect',
                    label: "MCQ Submit text",
                    classFilter: [
                        "TextDescriptor", "StringDescriptor", // use the value
                        "ListDescriptor" // use the label
                    ]
                }
            }
        }
    });
    Y.Wegas.BenefitsActions = Actions;


    /**
     *
     * Count:
     *  - highlighted actors/documents
     *  - unread messages
     */
    var MBenefitsMainQuest = Y.Base.create('wegas-benefits-main-quest-highlither', Y.Plugin.UnreadCount,
        [],
        {
            initializer: function() {
                var k;
                this._counters = {
                    InboxDescriptor: function(descriptor, instance, resolve) {
                        resolve(instance.get('unreadCount'));
                    },
                    NumberDescriptor: function(descriptor, instance, resolve) {
                        if (descriptor.get("editorTag") === 'highlight') {
                            resolve(instance.get("value") > 0 ? 1 : 0);
                        } else {
                            resolve(0);
                        }
                    },
                    BooleanDescriptor: function(descriptor, instance, resolve) {
                        if (descriptor.get("editorTag") === 'highlight') {
                            resolve(instance.get("value") ? 1 : 0);
                        } else {
                            resolve(0);
                        }
                    }
                };
                for (k in this.get('userCounters')) {
                    var theFunction = this.get('userCounters')[k];
                    if (theFunction instanceof Function === false) {
                        theFunction = eval('(' + theFunction + ')');
                    }
                    this._counters[k] = theFunction;
                }
                // since already synced by super initializer, forse to reSync
                this.syncUI();
            }
        },
        {
            NS: 'MbMainQuest',
            NAME: "MbMainQuest",
            ATTRS: {
                displayValue: {
                    type: 'boolean',
                    optional: true,
                    value: false,
                    view: {
                        label: "Display value"
                    }
                }
            }
        }
    );
    Y.Plugin.MBenefitsMainQuest = MBenefitsMainQuest;

    /**
     * Counts:
     *  - dialogues, question and open-questions: count one if anything is still possible (std counter counts 1 only when nothing has been done)
     */
    var MBenefitsSeqQuest = Y.Base.create('wegas-benefits-sec-quest-highlither', Y.Plugin.UnreadCount,
        [],
        {
            initializer: function() {
                var k;
                this._counters = {
                    DialogueDescriptor: function(descriptor, instance, resolve) {
                        var state = descriptor.getCurrentState();
                        if (!instance.get('enabled')) {
                            return false;
                        }
                        state.getAvailableActions(function(availableActions) {
                            resolve(availableActions.length > 0 ? 1 : 0);
                        });
                    },
                    QuestionDescriptor: function(descriptor, instance, resolve) {
                        if (descriptor.isAnyChoiceAnswerable()) {
                            resolve(1);
                        } else {
                            resolve(0);
                        }
                    },
                    WhQuestionDescriptor: function(descriptor, instance, resolve) {
                        resolve((instance.get('active') && !instance.get("validated") ? 1 : 0));
                    }
                };
                for (k in this.get('userCounters')) {
                    var theFunction = this.get('userCounters')[k];
                    if (theFunction instanceof Function === false) {
                        theFunction = eval('(' + theFunction + ')');
                    }
                    this._counters[k] = theFunction;
                }
                // since already synced by super initializer, forse to reSync
                this.syncUI();
            }
        },
        {
            NS: 'MbSecQuest',
            NAME: "MbSecQuest",
            ATTRS: {
                displayValue: {
                    type: 'boolean',
                    optional: true,
                    value: false,
                    view: {
                        label: "Display value"
                    }
                }
            }
        }
    );
    Y.Plugin.MBenefitsSecQuest = MBenefitsSeqQuest;



    var MBenefitsUnread = Y.Base.create('wegas-benefits-unread', Y.Plugin.UnreadCount,
        [],
        {
            initializer: function() {
                var k;
                this._counters = {
                    QuestionDescriptor: function(descriptor, instance, resolve) {
                        resolve(instance.isUnread() ? 1 : 0);
                    },
                    "WhQuestionDescriptor": function(descriptor, instance, resolve) {
                        resolve(instance.get('active') && instance.get('unread') ? 1 : 0);
                    },
                    BooleanDescriptor: function(descriptor, instance, resolve) {
                        if (descriptor.get("editorTag") === 'unread') {
                            resolve(instance.get("value") ? 1 : 0);
                        } else {
                            resolve(0);
                        }
                    }
                };
                for (k in this.get('userCounters')) {
                    var theFunction = this.get('userCounters')[k];
                    if (theFunction instanceof Function === false) {
                        theFunction = eval('(' + theFunction + ')');
                    }
                    this._counters[k] = theFunction;
                }
                // since already synced by super initializer, forse to reSync
                this.syncUI();
            }
        },
        {
            NS: 'MbUnread',
            NAME: 'MbUnread',
            ATTRS: {
                displayValue: {
                    type: 'boolean',
                    optional: true,
                    value: false,
                    view: {
                        label: "Display value"
                    }
                }
            }
        }
    );
    Y.Plugin.MBenefitsUnread = MBenefitsUnread;
});
