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
 * @author Benjamin Gerber <ger.benjamin@gmail.com>
 */
YUI.add("wegas-pmg-resourcelist", function (Y) {
    "use strict";

    var CONTENTBOX = "contentBox", ResourceList;

    ResourceList = Y.Base.create("wegas-pmg-resourcelist", Y.Wegas.PmgGantt, [Y.Wegas.Editable], {
        handlers: null,
        menu: null,
        menuDetails: null,
        sortable: null,
        initializer: function () {
            this.handlers = {};
            this.menu = new Y.Wegas.Menu();
            this.menuDetails = new Y.Wegas.Menu({
                width: "250px"
            });
            this.sortable = [];
        },
        renderUI: function () {
            var i, columns;
            ResourceList.superclass.renderUI.apply(this);
            columns = this.datatable.head.columns[0];
            for (i = 0; i < columns.length; i++) {
                if (columns[i].key == 'week1') {
                    break;
                }
            }
            this.datatable.addColumn({
                key: 'assignements',
                label: "Assignements"
            }, i);
        },
        bindUI: function () {
            ResourceList.superclass.bindUI.apply(this);
            this.handlers.update = Y.Wegas.VariableDescriptorFacade.after("update", this.syncUI, this);

            this.handlers.createMenu = this.datatable.delegate('click', function (e) {            // fill the "add" menu on click
                this.createMenu(e, true);
            }, '.yui3-datatable-data .assignement .assign', this);

            this.handlers.moveMenu = this.menu.on("button:mouseenter", function (e) {           // align the menu
                this.menuDetails.set("align", {
                    node: this.menu.get("boundingBox"),
                    points: (e.details[0].domEvent.clientX > Y.DOM.winWidth() / 2) ?
                            ["tr", "tl"] : ["tl", "tr"]
                });
                this.menuDetails.show();
                this.menuDetails.get("contentBox").setHTML('<div style="padding:5px 10px"><i>' + e.target.get("data").description + '</i></div>');
            }, this);

            this.handlers.hideMenu = this.menu.on("visibleChange", function (e) {                 // When the menu is hidden, hide the details panel
                if (!e.newVal) {
                    this.menuDetails.hide();
                }
            }, this);

            this.handlers.assignTask = this.menu.on("button:click", this.onMenuClick, this);     // assign a task to a resource
        },
        syncUI: function () {
            ResourceList.superclass.syncUI.apply(this);
            this.addButtonsAssignement();
            this.syncSortable();
        },
        destructor: function () {
            var k;
            for (k in this.handlers) {
                this.handlers[k].detach();
            }
            this.menu.destroy();
            this.menuDetails.destroy();
        },
        addButtonsAssignement: function () {
            var cb = this.get(CONTENTBOX);
            cb.all(".yui3-datatable-data tr .yui3-datatable-col-assignements").each(function (node) {
                node.append("<div class='assignement'></div>");
                node.one('.assignement').append("<span class='assign'></span>");
                node.addClass('noDescription');
            });
        },
        syncSortable: function () {
            var i, node, cb = this.get(CONTENTBOX);
            //temporary
            node = cb.one('.yui3-datatable-data .yui3-datatable-col-assignements');
            node.append("<div class='tasks'></div>");
            node.one('.tasks').append('<span class="task">t</span>');
            node.one('.tasks').append('<span class="task">e</span>');
            node.one('.tasks').append('<span class="task">s</span>');
            node.one('.tasks').append('<span class="task">t</span>');
            node.one('.tasks').append('<span class="task">1</span>');
            node.one('.tasks').append('<span class="task">2</span>');

            //the drag and drop feature to reorganise tasks.
            for (i = 0; i < this.sortable.length; i++) {
                this.sortable[i].destroy();
            }

            cb.all('.yui3-datatable-data tr .yui3-datatable-col-assignements .tasks').each(function (row, i) {
                this.sortable.push(new Y.Sortable({
                    container: row,
                    nodes: '.task',
                    opacity: '.1'
                }));
            }, this);

            for (i = 0; i < this.sortable.length; i++) {
                this.sortable[i].delegate.after('drag:over', function (e) {
                    var drag = e.drag.get('dragNode');
                    drag.setStyle('color', 'black');
                });
                this.sortable[i].delegate.after('drag:exit', function (e) {
                    var drag = e.drag.get('dragNode');
                    drag.setStyle('color', 'red');
                });
                this.sortable[i].delegate.after('drag:dropmiss', function (e) {
                    var node = e.target.get('node');
                    this.removeTask(node);
                }, this);
            }
        },
        removeTask: function (node) {
            //todo
        },
        createMenu: function (e, add) {
            var i, tasks, resources, resourceDesc, resourceId;
            resourceId = e.target.ancestor().ancestor().ancestor().one('*').getContent();
            resources = Y.Wegas.VariableDescriptorFacade.rest.find("name", this.get('variables'));
            for (i = 0; i < resources.get('items').length; i++) {
                if (resources.get('items')[i].get('id') == resourceId) {
                    resourceDesc = resources.get('items')[i];
                    break;
                }
            }
            this.menu.removeAll();
            tasks = this.getTasks(resourceDesc);
            if (!tasks || tasks.lenght <= 0) {
                return;
            }
            this.menu.add(tasks);
            this.menu.attachTo(e.target);
        },
        compareTask: function (a, b) {
            var sort = (this.get("taskSortBy") || "name");
            if (a.get(sort)) {
                if (a.get(sort) < b.get(sort))
                    return -1;
                if (a.get(sort) > b.get(sort))
                    return 1;
            } else if (a.getInstance().get(sort)) {
                if (a.getInstance().get(sort) < b.getInstance().get(sort))
                    return -1;
                if (a.getInstance().get(sort) > b.getInstance().get(sort))
                    return 1;
            } else {
                if (a.getInstance().get('properties')[sort] < b.getInstance().get('properties')[sort])
                    return -1;
                if (a.getInstance().get('properties')[sort] > b.getInstance().get('properties')[sort])
                    return 1;
            }
            return 0;
        },
        getTasks: function (resourceDesc) {
            //add is a boolean to determine if target is remove or add a task
            //you can only add a task which isn't already added. 
            //you can only remove a task which is added. 
            var i, tasks, items, taskDesc, description, label, array = new Array(), no;
            if (!this.get("taskList")) {
                return;
            }
            tasks = Y.Wegas.VariableDescriptorFacade.rest.find("name", this.get("taskList"));
            items = tasks.get('items');
            items.sort(Y.bind(this.compareTask, this));
            for (i = 0; i < items.length; i++) {
                taskDesc = items[i];
                no = (taskDesc.getInstance().get('properties').no || "");
                label = (taskDesc.get("label") || taskDesc.get("name") || "undefined");
                description = (taskDesc.get("description") || "No description.");
                array.push({
                    type: "Button",
                    label: no + ". " + label,
                    data: {
                        resource: resourceDesc,
                        task: taskDesc,
                        description: description
                    }
                });
            }
            return array;
        },
        onMenuClick: function (e) {
            var data = e.target.get("data");
            //console.log('to do...')
            //console.log(e.target.get("data"), data.resource.get('name'), data.task.get('name'));
        }

    }, {
        ATTRS: {
            taskList: {
                value: null,
                validator: function (s) {
                    return s === null || Y.Lang.isString(s);
                }
            },
            taskSortBy: {
                value: null,
                validator: function (s) {
                    return s === null || Y.Lang.isString(s);
                }
            }
        }
    });

    Y.namespace("Wegas").PmgResourcelist = ResourceList;
});