/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 * global: YUI
 */
YUI.add('wegas-editor-variabletreeview', function(Y) {
    "use strict";
    var ID = "id",
        CLASS = "@class",
        NAME = "name",
        CONTENTBOX = "contentBox",
        DATASOURCE = "dataSource",
        Wegas = Y.Wegas,
        Plugin = Y.Plugin,
        VariableTreeView,
        scriptCheckLabel = "<span class='fa fa-bug'></span> <span title='Search for errors (May take some time)'>Find errors</span>",
        searchFn = function(val) {
            var e = this.get("data.entity");
            return !val.length || ((e.getEditorLabel) && (new RegExp(val, "i")).test(e.getEditorLabel()));
        };
    /**
     * @name Y.Wegas.VariableTreeView
     * @extends Y.Wegas.EditorTreeView
     * @constructor
     * @class
     */
    VariableTreeView = Y.Base.create("wegas-editor-treeview", Wegas.EditorTreeView, [], {
        /** @lends Y.Wegas.VariableTreeView# */
        // *** Private fields ** //
        CONTENT_TEMPLATE: "<div class=\"wegas-editor-variabletreeview\"></div>",
        // ** Lifecycle methods ** //
        renderUI: function() {
            //var searchVal, searchRE, savedState, req, 
            var checkReq;
            this._timer = new Y.Wegas.Timer({
                duration: 300
            });
            VariableTreeView.superclass.renderUI.apply(this); // Render treeview
            this.plug(Plugin.EditorTVDefaultMenuClick); // Open edit tab on left click
            this.treeView.plug(Plugin.TreeViewFilter, {
                testFn: searchFn
                    /*  return val === "" || (e instanceof Wegas.persistence.VariableDescriptor) && (new RegExp(val, "i")).test([
                     e.get("name"),
                     e.get("label"),
                     e.get("comments")
                     ].join("|"));*/
                    //&& (new RegExp(searchVal, "i")).test(Y.Object.values(e.toJSON()).join('|'));

            });
            this.handlers.push(
                this.toolbar.get("header")
                .prepend("<div class='wegas-filter-input'><input type='search' placeholder='Search...'/></div>")
                .one('.wegas-filter-input input')
                .on('valueChange', this.checkSearchField, this));
            /*
             this._toggleSearchBtn = new Y.ToggleButton({
             render: this.toolbar.get("header"),
             label: "<span class='wegas-icon wegas-icon-zoom'></span>",
             on: {
             pressedChange: Y.bind(function(e) {
             var search = this.get("boundingBox").one(".wegas-filter-input");
             if (e.newVal) {
             this.treeView.get("boundingBox").setStyle("top", "25px");
             search.show();
             search.one("input").focus();
             } else {
             this.treeView.get("boundingBox").setStyle("top", "");
             search.hide();
             search.one("input").set("value", "");
             searchRE = "";
             searchVal = "";
             this._timer.reset();
             }
             
             }, this)
             }
             });
             */

            this._searchBttn = new Y.Button({
                render: this.get("boundingBox").one(".wegas-filter-input"),
                label: "<span title='Search in all fields'>In-depth</span>",
                on: {
                    click: Y.bind(this.serverSearch, this)
                }
            });
            this._timer.on("timeOut", function() {
                if (!this.searchRE.length) {
                    this.treeView.applyState(this.savedState);
                }
                this.treeView.filter.set("searchVal", this.searchRE);
                this.treeView.filter.set("testFn", searchFn);
                Y.Wegas.app.fire("newSearchVal");
            }, this);
            // Use Wegas.ToggleButton to enable the cssClass attribute:
            this._validateBttn = new Y.Wegas.ToggleButton({
                render: this.toolbar.get("header"),
                cssClass: "wegas-findbugs-button",
                label: scriptCheckLabel,
                on: {
                    pressedChange: Y.bind(function(e) {
                        if (e.newVal) {
                            this._validateBttn.get("boundingBox").addClass("loading");
                            checkReq = Y.Wegas.Facade.Variable.script.checkGameModel(Y.bind(function(results) {
                                this.syncUI();
                                this.treeView.filter.setAttrs({
                                    testFn: function() {
                                        return Y.Object.hasKey(results, this.get("data.entity").get("id"));
                                    },
                                    searchVal: "dummy" //Empty won't search.
                                });
                                this._validateBttn.get("boundingBox").removeClass("loading");
                            }, this));
                        } else {
                            Y.Wegas.DataSource.abort(checkReq);
                            this.treeView.filter.setAttrs({
                                searchVal: ""
                            });
                            this._validateBttn.get("boundingBox").removeClass("loading");
                        }

                    }, this)
                }
            });
            // this._validateBttn.get(CONTENTBOX).setStyle("float", "right").setStyle("marginRight", "3px");
            this.treeView.plug(Plugin.TreeViewSortable, {
                nodeGroups: [{
                        nodeClass: "wegas-editor-questionitem",
                        parentNode: "wegas-editor-question"
                    }, {
                        nodeClass: "wegas-editor-listitem",
                        parentNode: ["wegas-editor-list", "yui3-treeview"]
                    }, {
                        nodeClass: "wegas-editor-resultitem",
                        parentNode: "wegas-editor-questionitem"
                    }, {
                        nodeClass: "wegas-editor-surveysection",
                        parentNode: "wegas-editor-survey"
                    }, {
                        nodeClass: "wegas-editor-surveyinput",
                        parentNode: "wegas-editor-surveysection"
                    }, {
                        nodeClass: "wegas-editor-evaluation",
                        parentNode: "wegas-editor-evaluationcontainer"
                    }]
            }); // Add sortable plugin to the treeview
            this.treeView.sortable.on("sort", function(e) { // On sort event,
                var entity = e.dragWidget.get("data.entity"),
                    dropEntity = e.dropWidget.get("data.entity");
                if (Y.Wegas.persistence.ChoiceDescriptor &&
                    dropEntity instanceof Y.Wegas.persistence.ChoiceDescriptor &&
                    entity instanceof Y.Wegas.persistence.Result) {

                    var newChoice = dropEntity;
                    var oldChoice = Y.Wegas.Facade.Variable.cache.find("id", entity.get("parentId"));

                    var oldResults = oldChoice.get("results");
                    var newResults = newChoice.get("results");

                    var oldIndex = Y.Array.indexOf(oldResults, entity);

                    newResults.splice(e.index, 0,
                        oldResults.splice(oldIndex, 1)[0]);

                    Wegas.Facade.Variable.cache.put(newChoice.toObject(), {});

                    if (oldChoice !== newChoice) {
                        Wegas.Facade.Variable.cache.put(oldChoice.toObject(), {});
                    }
                } else if (Y.Wegas.persistence.EvaluationDescriptor &&
                    Y.Wegas.persistence.EvaluationDescriptorContainer &&
                    entity instanceof Y.Wegas.persistence.EvaluationDescriptor &&
                    dropEntity instanceof Y.Wegas.persistence.EvaluationDescriptorContainer) {

                    var oldContainer = entity.getContainer();
                    var oldDescriptor = oldContainer.getParentDescriptor();

                    var newContainer = dropEntity;
                    var newDescriptor = newContainer.getParentDescriptor();


                    var oldIndex = Y.Array.indexOf(oldContainer.get("evaluations"), entity);

                    newContainer.get("evaluations").splice(e.index, 0,
                        oldContainer.get("evaluations").splice(oldIndex, 1)[0]);

                    Wegas.Facade.Variable.cache.put(newDescriptor.toObject(), {});

                    if (newDescriptor !== oldDescriptor) {
                        Wegas.Facade.Variable.cache.put(oldDescriptor.toObject(), {});
                    }
                } else {
                    Wegas.Facade.Variable.cache.move(entity, dropEntity, e.index); // call facade method
                }
            });
        },
        findByEntityId: function(entityId) {
            return entityId && this.treeView.find(function(item) {
                return item.get("data.entity") &&
                    item.get("data.entity").get("id") === entityId;
            });
        },
        bindUI: function() {
            var ds = this.get(DATASOURCE),
                instanceDs = Y.Wegas.Facade.Instance,
                request = this.get("request");
            if (ds) {
                this.handlers.push(ds.after("failure", this.defaultFailureHandler, this)); // GLOBAL error message

                this.handlers.push(ds.after("rootUpdate", this.syncUI, this));
                this.handlers.push(ds.after("updatedDescriptor", this.updateDescriptor, this));
                this.handlers.push(instanceDs.after("*:updatedInstance", this.updateInstance, this));
                //this.handlers.push(instanceDs.after("addedInstance", this.updateInstance, this));
                //this.handlers.push(ds.after("added", this.addEntity, this));
                this.handlers.push(ds.after("delete", this.deleteEntity, this));

                this.handlers.push(Y.after("edit-entity:edit", function(e) {
                    this.treeView.deselectAll();

                    var cur = null;
                    var item = e.entity;

                    while (item && !cur) {
                        cur = this.findByEntityId(item.get("id"));
                        if (!cur && item._getParent) {
                            item = item._getParent();
                        } else {
                            item = null;
                        }
                    }

                    if (cur) {
                        this.currentSelection = e.entity.get("id");
                        cur.expandParents();
                        cur.set("selected", 2);
                    }
                }, this));
                this.handlers.push(Y.after("edit-entity:cancel", function(e) {
                    this.currentSelection = -1;
                    this.treeView.set("selected", 0);
                }, this));

                this.handlers.push(this.treeView.on("nodeClick", function(e) {
                    e.preventDefault();
                }));

                if (request) {
                    ds.sendRequest(request);
                }
            }
        },
        destructor: function() {
            this._timer.destroy();
            this.treeView.destroy();
        },
        getNodes: function() {
            var ds = this.get(DATASOURCE),
                selector = YUI_config.Wegas.dataSelector || this.get("dataSelector"),
                entities = (selector) ? ds.cache.findAll(selector.key, selector.val) : Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().get("items");

            return this.genTreeViewElements(entities);
        },
        findNode: function(entity) {
            return this.treeView.find(function(item) {
                if (item.get("data") && item.get("data").entity.get("id") === entity.get("id")) {
                    return item;
                }
            });
        },
        /**
         *
         * @returns {undefined}
         */
        addEntity: function(e) {
            var entity = e.entity,
                parent = e.parent,
                parentNode;
            if (parent && parent instanceof Y.Wegas.persistence.VariableDescriptor) {
                parentNode = this.findNode(parent);
                parentNode.add(this.genTreeViewElement(entity));
                parentNode.expand();
            } else {
                // parent is the gameModel -> add at root level !
                this.treeView.add(this.genTreeViewElement(entity));
            }
            this.currentSelection = e.entity.get("id");
            Y.later(20, this, function() {
                var target = this.findNode(e.entity);
                target && Wegas.Helper.scrollIntoViewIfNot(target.get(CONTENTBOX), false);
            });
        },
        updateDescriptor: function(e) {
            if (!this.get("bypassSyncEvents")) {
                var oldElement, entity, parent, index, newElement;
                entity = e.entity;
                oldElement = this.findNode(entity);
                if (oldElement) {
                    parent = oldElement.get("parent");
                    index = parent.indexOf(oldElement);
                    newElement = this.genTreeViewElement(entity);
                    oldElement.remove();
                    parent.add(newElement, index);
                }
                //oldElement.set("label", e.entity.getEditorLabel());
            }
        },
        updateInstance: function(e) {
            var descriptor = Y.Wegas.Facade.Variable.cache.find("id", e.entity.get("parentId"));
            if (descriptor) {
                this.updateDescriptor({
                    entity: descriptor
                });
            }
        },
        deleteEntity: function(e) {
            var node = this.findNode(e.entity);
            // due to pusher asynchronousness, entity may have been deleted by parent update
            node && node.remove();
            //parent = node.get("parent");
            //parent.remove(parent.indexOf(node));
        },
        //
        // *** Private Methods *** //
        /**
         * @function
         * @private
         */
        genTreeViewElement: function(entity) {
            if (!entity) {
                // This happens when many variables are created in a batch by a script.
                return;
            }
            var children,
                elClass = entity.get(CLASS),
                collapsed = !this.isNodeExpanded(entity),
                selected = (this.currentSelection === entity.get(ID)) ? 1 : 0,
                text = entity.getEditorLabel() + "<i class='scriptalias wegas-internal-feature'> (" + entity.get("name") + ")</i>",
                node,
                /* + "  <span class='treeview-sub'>" + el.getType().replace("Descriptor", "") + "</span>"
                 tooltip = entity.getType().replace("Descriptor", "") + ": " + entity.getEditorLabel(),*/
                advancedClass = text.indexOf("_") === 0 ? "wegas-advanced-feature" : "";
            if (entity.get("items")) {
                collapsed = collapsed && !Y.Array.find(entity.get("items"), function(e) {
                    return e && this.currentSelection === e.get(ID);
                }, this);
            }

            switch (elClass) {
                case 'TaskDescriptor':
                case 'StringDescriptor':
                case 'TextDescriptor':
                case 'StaticTextDescriptor':
                case 'NumberDescriptor':
                case 'BooleanDescriptor':
                case 'InboxDescriptor':
                case 'TriggerDescriptor':
                case 'FSMDescriptor':
                case 'ObjectDescriptor':
                case 'ResourceDescriptor':
                case 'BurndownDescriptor':
                case 'DialogueDescriptor':
                    return {
                        type: 'TreeNode',
                        label: text,
                        /*tooltip: tooltip,*/
                        children: (!collapsed) ? this.genScopeTreeViewElements(entity) : [],
                        //children: (els.length >= 1) ? els : null, //no children now, loaded on expands
                        //children: null, //no children now, loaded on expands
                        data: {
                            entity: entity
                        },
                        collapsed: collapsed,
                        selected: selected,
                        //rightWidget: Y.Node.create(EDITBUTTONTPL),
                        //iconCSS: "wegas-icon-variabledescriptor wegas-icon-" + elClass.toLowerCase(),
                        iconCSS: entity.getIconCss(),
                        cssClass: "wegas-editor-listitem wegas-treeview-advanced-children" + advancedClass
                    };
                case 'ListDescriptor':
                    node = {
                        type: 'TreeNode',
                        label: text,
                        /*tooltip: tooltip,*/
                        childrenShortcut: true, //entity.get("addShortcut"),
                        collapsed: collapsed,
                        selected: selected,
                        children: this.genTreeViewElements(entity.get("items")),
                        data: {
                            entity: entity
                        },
                        cssClass: "wegas-editor-listitem wegas-editor-list " + advancedClass
                    };
                    return node;
                case "WhQuestionDescriptor":
                    node = {
                        type: 'TreeNode',
                        label: text,
                        /*tooltip: tooltip,*/
                        childrenShortcut: true, //entity.get("addShortcut"),
                        collapsed: collapsed,
                        selected: selected,
                        children: this.genTreeViewElements(entity.get("items")),
                        data: {
                            entity: entity
                        },
                        iconCSS: entity.getIconCss(),
                        cssClass: "wegas-editor-listitem wegas-editor-list " + advancedClass
                    };
                    return node;
                case 'QuestionDescriptor':
                    return {
                        type: 'TreeNode',
                        label: text,
                        /*tooltip: tooltip,*/
                        collapsed: collapsed,
                        selected: selected,
                        childrenShortcut: true,
                        children: this.genTreeViewElements(entity.get("items")),
                        //                        children: (!collapsed) ?
                        // this.genTreeViewElements(entity.get("items")) : [],
                        data: {
                            entity: entity
                        },
                        iconCSS: entity.getIconCss(),
                        cssClass: "wegas-editor-listitem wegas-editor-question " + advancedClass
                    };
                case 'ChoiceDescriptor':
                    children = Y.Array.map(entity.get("results"), function(result) {
                        return {
                            label: result.getEditorLabel(),

                            selected: (result.get(ID) === this.currentSelection) ? 2 : 0,
                            data: {
                                entity: result,
                                parentEntity: entity
                            },
                            iconCSS: result.getIconCss(),
                            cssClass: "wegas-editor-resultitem"
                        };
                    }, this);
                    return {
                        type: 'TreeNode',
                        label: text,
                        /*tooltip: tooltip,*/
                        children: children,
                        childrenShortcut: true,
                        data: {
                            entity: entity
                        },
                        collapsed: collapsed,
                        selected: selected,
                        //rightWidget: Y.Node.create(EDITBUTTONTPL),
                        iconCSS: entity.getIconCss(),
                        cssClass: "wegas-editor-questionitem " + advancedClass
                    };
                case 'SingleResultChoiceDescriptor':
                    return {
                        type: 'TreeLeaf',
                        label: text,
                        /*tooltip: tooltip,*/
                        selected: selected,
                        data: {
                            entity: entity
                        },
                        iconCSS: entity.getIconCss(),
                        cssClass: "wegas-editor-questionitem " + advancedClass
                    };
                case 'PeerReviewDescriptor':
                    children = Y.Array.map(["feedback", "fbComments"], function(category) {
                        var container = entity.get(category),
                            children = Y.Array.map(container.get("evaluations"), function(ev) {
                                return {
                                    label: ev.getEditorLabel(),
                                    selected: (ev.get(ID) === this.currentSelection) ? 2 : 0,
                                    data: {
                                        entity: ev,
                                        parentEntity: container
                                    },
                                    iconCSS: ev.getIconCss(),
                                    cssClass: "wegas-editor-evaluation"
                                };
                            }, this);
                        return {
                            type: 'TreeNode',
                            label: (category === "fbComments" ? "Feedback Comment" : "Feedback"),
                            children: children,
                            selected: (container.get(ID) === this.currentSelection) ? 2 : 0,
                            collapsed: false, // Always opened
                            data: {
                                entity: container,
                                parentEntity: entity
                            },
                            cssClass: "wegas-editor-evaluationcontainer",
                            iconCSS: "fa fa-eye fa-1"
                        };
                    }, this);
                    return {
                        type: 'TreeNode',
                        label: text,
                        /*tooltip: tooltip,*/
                        children: children,
                        data: {
                            entity: entity
                        },
                        collapsed: collapsed,
                        selected: selected,
                        //rightWidget: Y.Node.create(EDITBUTTONTPL),
                        iconCSS: "fa fa-users fa-1",
                        cssClass: "wegas-editor-listitem wegas-editor-review " + advancedClass
                    };
                case 'SurveyTextDescriptor':
                case 'SurveyNumberDescriptor':
                case 'SurveyChoicesDescriptor':
                    return {
                        type: 'TreeNode',
                        label: text,
                        children: (!collapsed) ? this.genScopeTreeViewElements(entity) : [],
                        data: {
                            entity: entity
                        },
                        collapsed: collapsed,
                        selected: selected,
                        iconCSS: entity.getIconCss(),
                        cssClass: "wegas-editor-surveyinput wegas-treeview-advanced-children " + advancedClass
                    };
                case 'SurveyDescriptor':
                    return {
                        type: 'TreeNode',
                        label: text,
                        /*tooltip: tooltip,*/
                        children: this.genTreeViewElements(entity.get("items")),
                        childrenShortcut: true,
                        data: {
                            entity: entity
                        },
                        collapsed: collapsed,
                        selected: selected,
                        iconCSS: "fa fa-bar-chart fa-1",
                        cssClass: "wegas-editor-listitem wegas-editor-survey " + advancedClass
                    };
                case 'SurveySectionDescriptor':
                    return {
                        type: 'TreeNode',
                        label: text,
                        /*tooltip: tooltip,*/
                        children: this.genTreeViewElements(entity.get("items")),
                        childrenShortcut: true,
                        data: {
                            entity: entity
                        },
                        collapsed: collapsed,
                        selected: selected,
                        iconCSS: "fa fa-map fa-1",
                        cssClass: "wegas-editor-surveysection " + advancedClass
                    };
                default:
                    return {
                        label: text,
                        /*tooltip: tooltip,*/
                        data: {
                            entity: entity
                        }
                    };
            }

        },
        /**
         * @function
         * @private
         */
        genScopeTreeViewElements: function(el) {
            var children = [],
                i, label, team, player, instance, iconFa,
                instances;
            instances = Y.Wegas.Facade.Instance.cache.find("descriptorId", el.get("id")).variableInstances;

            for (i in instances) {
                if (instances.hasOwnProperty(i)) {
                    instance = instances[i];
                    label = '';
                    switch (el.get("scopeType")) {
                        case 'PlayerScope':
                            player = Wegas.Facade.Game.cache.getPlayerById(i);
                            if (!player) {
                                continue;
                            }
                            label = (player) ? player.get(NAME) : "undefined";
                            iconFa = "fa-user";
                            break;
                        case 'TeamScope':
                            team = Wegas.Facade.Game.cache.getTeamById(i);
                            if (!team) {
                                continue;
                            }
                            if (Y.Wegas.Facade.Game.cache.getCurrentGame().get("properties.freeForAll") && team.get("players").length > 0) {
                                label = team.get("players")[0].get(NAME);
                            } else {
                                label = team.get(NAME);
                            }
                            iconFa = "fa-group";
                            break;
                        case 'GameModelScope':
                            label = 'Global';
                            iconFa = "fa-globe";
                            break;
                    }
                    children.push(this.genVariableInstanceElements(label, instance, iconFa));
                }
            }
            return children;
        },
        /**
         * @function
         * @private
         */
        genVariableInstanceElements: function(label, el, iconFa) {
            var iconCss, selected = (+this.currentSelection === +el.get(ID)) ? 2 : 0,
                k, node;

            iconFa = iconFa || "fa-file-o";

            iconCss = "fa fa-1x " + iconFa;

            node = {
                label: label,
                selected: selected,
                iconCSS: iconCss,
                cssClass: 'wegas-advanced-feature',
                data: {
                    entity: el
                }
            };

            switch (el.get(CLASS)) {
                case 'TextInstance':
                    node.label += ': ' + el.get("value").slice(0.10);
                    break;
                case 'StringInstance':
                case 'NumberInstance':
                case 'ListInstance':
                    node.label += ': ' + el.get("value");
                    break;
                case 'QuestionInstance':
                    node.label += ((el.get("replies").length > 0) ? ': ' + el.get("replies").get(NAME) : ': unanswered');
                    break;
                case 'InboxInstance':
                    node.type = 'TreeNode';
                    node.children = [];
                    node.collapsed = !this.isNodeExpanded(el);
                    node.label += "(" + el.get("messages").length + ")";
                    for (k = 0; k < el.get("messages").length; k += 1) {
                        node.children.push({
                            label: I18n.t(el.get("messages")[k].get("subject"))
                        });
                    }
                    break;
                default:
            }
            return node;
        },
        serverSearch: function() {
            var btnBox = this._searchBttn.get("boundingBox");
            Y.Wegas.DataSource.abort(this.req);
            if (!this.searchVal) {
                var inputValue = Y.one(".wegas-filter-input input").get("value");
                if (inputValue === "") {
                    return;
                } else {
                    this.searchVal = inputValue;
                    this.checkSearchField({
                        newVal: inputValue,
                        prevVal: ""
                    }, true);
                }
            }
            btnBox.addClass("loading");
            this.req = Y.Wegas.Facade.Variable.cache.remoteSearch(this.searchVal, Y.bind(function(results) {
                btnBox.removeClass("loading");
                this.setAttrs({
                    testFn: function(val) {
                        return val.indexOf(this.get("data.entity").get("id")) > -1;
                    },
                    searchVal: "--" + results.join("--")
                });
            }, this.treeView.filter), false /*Exact match*/);
        },
        checkSearchField: function(e, noTimer) {
            //var arrSearch;
            if (e.prevVal === "") {
                this.savedState = this.treeView.saveState();
            }
            this.searchVal = Y.Lang.trim(e.newVal);
            /*
             * Search AND element splited by ", "
             */
            /*arrSearch = Y.Array.filter(searchVal.split(/[, ]+/), Boolean); // remove emtpy elements array
             arrSearch = Y.Array.map(arrSearch, function(item) { //Quote elements
             return Y.Wegas.Helper.RegExpQuote(item);
             });
             searchRE = ".*(?=.*" + arrSearch.join(")(?=.*") + ").*";*/
            this.searchRE = Y.Wegas.Helper.RegExpQuote(this.searchVal);
            //                if (searchVal.length) {
            if (!noTimer) {
                this._timer.reset();
            }
            //                } else {
            //                    this._timer.timeOut();
            //                }
        }
    }, {
        ATTRS: {
            bypassSyncEvents: {
                type: "boolean",
                value: false
            }
        }
    });
    Wegas.VariableTreeView = VariableTreeView;
    /**
     * @class When a descriptor node is toggled, expand it
     * @constructor
     */
    Plugin.EditorTVNodeLoader = Y.Base.create("admin-action", Plugin.Base, [], {
        expandedIds: {},
        lastOpenedNode: null,
        initializer: function() {
            this.onHostEvent("*:nodeExpanded", this.fillsLeaf); //if treeleaf is empty, load elements from sever

            //this.afterHostMethod("syncUI", function () {
            //    var i, doExpand = function (e) {
            //        for (i = 0; i < e.size(); i += 1) {
            //            if (!e.item(i).get("collapsed")) {
            //                this.fillsLeaf(e.item(i));
            //                doExpand.call(this, e.item(i));
            //            }
            //        }
            //    };
            //
            //    doExpand.call(this, this.get(HOST).treeView);         // Recursively walk treeview to reload expanded
            // nodes });
        },
        fillsLeaf: function(e) {
            var node = e.node,
                entity = node.get("data.entity"),
                id = entity.get(ID);
            if (node.size() > 0) {
                return;
            }
            if (typeof entity.isAugmentedBy === 'function'
                && entity.isAugmentedBy(Wegas.persistence.VariableContainer)) {
                node.add(this.get('host').genTreeViewElements(entity.get('items')));
            } else if (entity instanceof Wegas.persistence.VariableDescriptor
                && !(Wegas.persistence.ChoiceDescriptor && entity instanceof Wegas.persistence.ChoiceDescriptor)) {
                node.destroyAll();
                node.set("loading", true);
                Wegas.Facade.Instance.sendRequest({
                    request: "/" + id + "/VariableInstance"
                });
            }
        }
    }, {
        NS: "EditorTVNodeLoader",
        NAME: "EditorTVNodeLoader"
    });
});
