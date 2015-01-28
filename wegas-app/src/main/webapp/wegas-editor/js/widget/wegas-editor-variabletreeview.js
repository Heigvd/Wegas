/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
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
        scriptCheckLabel = "<span title='Search for errors (May take some time)'>Check</span>",
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
            var searchVal, searchRE, savedState, req, checkReq;
            this._timer = new Y.Wegas.Timer({
                duration: 300
            });
            VariableTreeView.superclass.renderUI.apply(this); // Render treeview
            this.plug(Plugin.EditorTVDefaultMenuClick); // Open edit tab on left click
            this.treeView.plug(Plugin.TreeViewFilter, {
                testFn: searchFn
                    /*  return val === "" || (e instanceof Wegas.persistence.VariableDescriptor) && (new RegExp(val, "i")).test([
                     e.get("name"),
                     e.get("title"),
                     e.get("label"),
                     e.get("comments")
                     ].join("|"));*/
                    //&& (new RegExp(searchVal, "i")).test(Y.Object.values(e.toJSON()).join('|'));

            });
            this.handlers.push(this.toolbar.get('header').append("<div class='wegas-filter-input'><input size='15' placeholder='Search...'/></div>")
                .one(".wegas-filter-input input").on("valueChange", function(e) {
                var arrSearch;
                if (e.prevVal === "") {
                    savedState = this.treeView.saveState();
                }
                searchVal = Y.Lang.trim(e.newVal);
                arrSearch = Y.Array.filter(searchVal.split(/[, ]+/), Boolean); // remove emtpy elements array
                arrSearch = Y.Array.map(arrSearch, function(item) { //Quote elements
                    return Y.Wegas.Helper.RegExpQuote(item);
                });
                searchRE = ".*(?=.*" + arrSearch.join(")(?=.*") + ").*";
                if (searchVal.length > 1) {
                    this._timer.reset();
                } else {
                    this._timer.timeOut();
                }
            }, this));
            this._searchBttn = new Y.Button({
                render: this.toolbar.get("header").one(".wegas-filter-input"),
                label: "<span title='Search in every fields'>Full</span>",
                on: {
                    click: Y.bind(function() {
                        Y.Wegas.DataSource.abort(req);
                        if (!searchVal) {
                            return;
                        }
                        req = Y.Wegas.Facade.Variable.cache.remoteSearch(searchVal, Y.bind(function(results) {
                            this.setAttrs({
                                testFn: function(val) {
                                    return val.indexOf(this.get("data.entity").get("id")) > -1;
                                },
                                searchVal: "--" + results.join("--")
                            });
                        }, this.treeView.filter), true);
                    }, this)
                }
            });
            this._timer.on("timeOut", function() {
                if (!searchVal.length) {
                    this.treeView.applyState(savedState);
                    this.treeView.filter.set("searchVal", "");
                } else {
                    this.treeView.filter.set("searchVal", searchRE);
                }
                this.treeView.filter.set("testFn", searchFn);
            }, this);
            this._validateBttn = new Y.ToggleButton({
                render: this.toolbar.get("header").one(".wegas-filter-input"),
                label: scriptCheckLabel,
                on: {
                    pressedChange: Y.bind(function(e) {
                        this._validateBttn.set("label", "<i class='fa fa-refresh fa-spin'></i>" + scriptCheckLabel);
                        if (e.newVal) {
                            checkReq = Y.Wegas.Facade.Variable.script.checkGameModel(Y.bind(function(results) {
                                this.syncUI();
                                this.treeView.filter.setAttrs({
                                    testFn: function() {
                                        return Y.Object.hasKey(results, this.get("data.entity").get("id"));
                                    },
                                    searchVal: "dummy" //Empty won't search.
                                });
                                this._validateBttn.set("label", scriptCheckLabel);
                            }, this));
                        } else {
                            Y.Wegas.DataSource.abort(checkReq);
                            this.treeView.filter.setAttrs({
                                searchVal: ""
                            });
                            this._validateBttn.set("label", scriptCheckLabel);
                        }

                    }, this)
                }
            });
            this.treeView.plug(Plugin.TreeViewSortable, {
                nodeGroups: [{
                        nodeClass: "wegas-editor-questionitem",
                        parentNode: ".wegas-editor-question"
                    }, {
                        nodeClass: "wegas-editor-listitem",
                        parentNode: ".wegas-editor-list"
                    }]
            }); // Add sortable plugin to the treeview
            this.treeView.sortable.on("sort", function(e) { // On sort event,
                var entity = e.dragWidget.get("data.entity"),
                    dropEntity = e.dropWidget.get("data.entity");
                Wegas.Facade.Variable.cache.move(entity, dropEntity, e.index); // call facade method
            });
        },
        bindUI: function() {
            var ds = this.get(DATASOURCE),
                request = this.get("request");
            if (ds) {
                this.handlers.push(ds.after("failure", this.defaultFailureHandler, this)); // GLOBAL error message

                this.handlers.push(ds.after("updatedEntity", this.updateEntity, this));
                this.handlers.push(ds.after("added", this.addEntity, this));
                this.handlers.push(ds.after("delete", this.deleteEntity, this));

                if (request) {
                    ds.sendRequest(request);
                }
            }
        },
        destructor: function() {
            this._timer.destroy();
            this.treeView.destroy();
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
            if (parent) {
                parentNode = this.findNode(parent);
                parentNode.add(this.genTreeViewElement(entity));
                parentNode.expand();
            } else {
                this.treeView.add(this.genTreeViewElement(entity));
            }
            this.currentSelection = e.entity.get("id");
            Y.later(20, this, function() {
                var target = this.findNode(e.entity);
                target && Wegas.Helper.scrollIntoViewIfNot(target.get(CONTENTBOX), false);
            });
        },
        updateEntity: function(e) {
            var oldElement = this.findNode(e.entity),
            parent = oldElement.get("parent"), index = parent.indexOf(oldElement),
            newElement = this.genTreeViewElement(e.entity);
            oldElement.remove();
            parent.add(newElement, index);
            //oldElement.set("label", e.entity.getEditorLabel());
        },
        deleteEntity: function(e) {
            var node = this.findNode(e.entity);
            node.remove();
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
            var children, elClass = entity.get(CLASS),
                collapsed = !this.isNodeExpanded(entity),
                selected = (this.currentSelection === entity.get(ID)) ? 2 : 0,
                text = entity.getEditorLabel(),
                /* + "  <span class='treeview-sub'>" + el.getType().replace("Descriptor", "") + "</span>"*/
                tooltip = entity.getType().replace("Descriptor", "") + ": " + entity.getEditorLabel(),
                erroredClass = Y.Object.hasKey(Y.Wegas.Facade.Variable.script.errored, entity.get(ID)) ? "variable-error" : "";
            if (entity.get("items")) {
                collapsed = collapsed && !Y.Array.find(entity.get("items"), function(e) {
                    return this.currentSelection === e.get(ID);
                }, this);
            }

            switch (elClass) {
                case 'StringDescriptor':
                case 'TextDescriptor':
                case 'NumberDescriptor':
                case 'BooleanDescriptor':
                case 'InboxDescriptor':
                case 'TriggerDescriptor':
                case 'FSMDescriptor':
                case 'TaskDescriptor':
                case 'ObjectDescriptor':
                case 'ResourceDescriptor':
                case 'DialogueDescriptor':
                    return {
                        type: 'TreeNode',
                        label: text,
                        tooltip: tooltip,
                        children: (!collapsed) ? this.genScopeTreeViewElements(entity) : [],
                        //children: (els.length >= 1) ? els : null, //no children now, loaded on expands
                        //children: null, //no children now, loaded on expands
                        data: {
                            entity: entity
                        },
                        collapsed: collapsed,
                        selected: selected,
                        //rightWidget: Y.Node.create(EDITBUTTONTPL),
                        iconCSS: "wegas-icon-variabledescriptor wegas-icon-" + elClass.toLowerCase(),
                        cssClass: "wegas-editor-listitem " + erroredClass
                    };
                case 'ListDescriptor':
                    return {
                        type: 'TreeNode',
                        label: text,
                        tooltip: tooltip,
                        collapsed: collapsed,
                        selected: selected,
                        children: this.genTreeViewElements(entity.get("items")),
                        data: {
                            entity: entity
                        },
                        cssClass: "wegas-editor-listitem wegas-editor-list " + erroredClass
                    };
                case 'QuestionDescriptor':
                    return {
                        type: 'TreeNode',
                        label: text,
                        tooltip: tooltip,
                        collapsed: collapsed,
                        selected: selected,
                        children: this.genTreeViewElements(entity.get("items")),
//                        children: (!collapsed) ? this.genTreeViewElements(entity.get("items")) : [],
                        data: {
                            entity: entity
                        },
                        iconCSS: "wegas-icon-questiondescriptor",
                        cssClass: "wegas-editor-listitem wegas-editor-question " + erroredClass
                    };
                case 'ChoiceDescriptor':
                    children = Y.Array.map(entity.get("results"), function(result) {
                        return {
                            label: result.get(NAME),
                            selected: (result.get(ID) === this.currentSelection) ? 2 : 0,
                            data: {
                                entity: result,
                                parentEntity: entity
                            },
                            iconCSS: "wegas-icon-result"
                        };
                    }, this);
                    return {
                        type: 'TreeNode',
                        label: text,
                        tooltip: tooltip,
                        children: children,
                        data: {
                            entity: entity
                        },
                        collapsed: collapsed,
                        selected: selected,
                        //rightWidget: Y.Node.create(EDITBUTTONTPL),
                        iconCSS: "wegas-icon-choicedescriptor",
                        cssClass: "wegas-editor-questionitem " + erroredClass
                    };
                case 'SingleResultChoiceDescriptor':
                    return {
                        type: 'TreeLeaf',
                        label: text,
                        tooltip: tooltip,
                        selected: selected,
                        data: {
                            entity: entity
                        },
                        iconCSS: "wegas-icon-choicedescriptor",
                        cssClass: "wegas-editor-questionitem " + erroredClass
                    };
                default:
                    return {
                        label: text,
                        tooltip: tooltip,
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
                i, label, team, player, instance,
                instances = el.get("scope").get("variableInstances");
            for (i in instances) {
                if (instances.hasOwnProperty(i)) {
                    instance = instances[i];
                    label = '';
                    switch (el.get("scope").get(CLASS)) {
                        case 'PlayerScope':
                            player = Wegas.Facade.Game.cache.getPlayerById(i);
                            if (!player) {
                                continue;
                            }
                            label = (player) ? player.get(NAME) : "undefined";
                            break;
                        case 'TeamScope':
                            team = Wegas.Facade.Game.cache.getTeamById(i);
                            if (!team) {
                                continue;
                            }
                            label = (team) ? team.get(NAME) : "undefined";
                            break;
                        case 'GameScope':
                        case 'GameModelScope':
                            label = 'Global';
                            break;
                    }
                    children.push(this.genVariableInstanceElements(label, instance));
                }
            }
            return children;
        },
        /**
         * @function
         * @private
         */
        genVariableInstanceElements: function(label, el) {
            var selected = (+this.currentSelection === +el.get(ID)) ? 2 : 0,
                k, children, collapsed;
            switch (el.get(CLASS)) {
                case 'StringInstance':
                case 'TextInstance':
                case 'NumberInstance':
                case 'ListInstance':
                    return {
                        label: label + ': ' + el.get("value"),
                        selected: selected,
                        data: {
                            entity: el
                        }
                    };
                case 'QuestionInstance':
                    return {
                        label: label + ((el.get("replies").length > 0) ? ': ' + el.get("replies").get(NAME) : ': unanswered'),
                        selected: selected,
                        data: {
                            entity: el
                        }
                    };
                case 'InboxInstance':
                    children = [];
                    collapsed = !this.isNodeExpanded(el);
                    label += "(" + el.get("messages").length + ")";
                    for (k = 0; k < el.get("messages").length; k += 1) {
                        children.push({
                            label: el.get("messages")[k].get("subject")
                        });
                    }
                    return {
                        type: 'TreeNode',
                        label: label,
                        selected: selected,
                        collapsed: collapsed,
                        data: {
                            entity: el
                        },
                        children: children
                    };
                default:
                    return {
                        label: label,
                        selected: selected,
                        data: {
                            entity: el
                        }
                    };
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
            //    doExpand.call(this, this.get(HOST).treeView);         // Recursively walk treeview to reload expanded nodes
            //});
        },
        fillsLeaf: function(e) {
            var node = e.node,
                entity = node.get("data.entity"),
                id = entity.get(ID);
            if (entity instanceof Wegas.persistence.ListDescriptor) {
                if (node.size() > 0) {
                    return;
                }
                node.add(this.get("host").genTreeViewElements(entity.get("items")));
            } else if (entity instanceof Wegas.persistence.VariableDescriptor && !(Wegas.persistence.ChoiceDescriptor && entity instanceof Wegas.persistence.ChoiceDescriptor)) { // @hack

                if (node.size() > 1) { /* @fixme @hack What if there is only 1 player in the game ? */
                    return;
                }
                node.destroyAll();
                node.set("loading", true);
                Wegas.Facade.Variable.sendRequest({
                    request: "/" + id + "?view=Editor"
                });
            }
        }
    }, {
        NS: "EditorTVNodeLoader",
        NAME: "EditorTVNodeLoader"
    });
});
