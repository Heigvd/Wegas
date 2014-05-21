/**
 * @author Benjamin Gerber <ger.benjamin@gmail.com>
 */

YUI.add('wegas-leaderway-tasklist', function(Y) {
    "use strict";
    var CONTENTBOX = 'contentBox', TaskList;
    TaskList = Y.Base.create("wegas-tasklist", Y.Widget, [Y.Wegas.Widget, Y.WidgetChild, Y.Wegas.Editable], {
// *** Fields *** /
        table: null,
        data: null,
        selectedTaskDescriptor: null,
        resourceDescriptor: null,
        handlers: null,
        pickingMode: null,
        // *** Lifecycle Methods *** //
        initializer: function() {
            var name;
            this.data = [];
            this.handlers = {};
            this.waitOnServer = false;
            this.table = new Y.DataTable({
                columns: [
                    {
                        key: "id",
                        className: 'hidden'
                    },
                    {
                        key: "task",
                        label: "Mandat",
                        sortable: true
                    },
                    {
                        key: "skill",
                        label: "Comp�tence",
                        allowHTML: true,
                        sortable: true
                    },
                    {
                        key: "duration",
                        label: "Dur�e",
                        sortable: true
                    },
                    {
                        key: "term",
                        label: "Ech�ance",
                        sortable: true
                    },
                    {
                        key: "salary",
                        label: "Remun�ration",
                        sortable: true
                    },
                    {
                        key: "comment",
                        label: "Remarque",
                        sortable: true
                    },
                    {
                        key: "worker",
                        label: "Employ�",
                        sortable: true
                    }
                ]
            });
            name = Y.Wegas.Facade.VariableDescriptor.cache.find("name", 'nameOfCurrentEmployee');
            this.resourceDescriptor = Y.Wegas.Facade.VariableDescriptor.cache.find("name", name.getInstance().get("value"));
        },
        /**
         * Render the widget.
         * Hide node corresponding used only with the "picking mode" of this widget
         */
        renderUI: function() {
            var cb = this.get(CONTENTBOX);
            cb.insert('<div class="resourceName"><p></p></div>');
            this.table.render(cb);
            cb.insert('<div class="footer"><div class="assignInfo"></div><div class="buttons"><div class="buttonOK">Assigner</div><div class="buttonCancel">Annuler</div></div></div>');
            cb.one('.resourceName').hide();
            cb.one('.footer').hide();
            cb.one('.footer .buttonOK').hide();
            if (this.get("pickingMode") === "true") {
                this.switchToPickingMode();
            }
        },
        /**
         * Bind some function at nodes of this widget
         */
        bindUI: function() {
            var cb = this.get(CONTENTBOX);
            this.handlers.update = Y.Wegas.Facade.VariableDescriptor.after("update", this.syncUI, this);
            this.handlers.selectRow = this.table.delegate('click', function(e) {
                this.selectRow(e);
            }, '.yui3-datatable-data tr', this);
            this.handlers.assignTask = cb.one('.buttons').delegate('click', function(e) {
                this.showOverlay();
                this.assignTask(this.resourceDescriptor, this.selectedTaskDescriptor);
            }, '.buttonOK', this);
            this.handlers.cancelAssign = cb.one('.buttons').delegate('click', function(e) {
                this.backToPreviousPage();
            }, '.buttonCancel', this);
        },
        /**
         * Synchronise the content of this widget.
         */
        syncUI: function() {
            var listTasksDescriptor = Y.Wegas.Facade.VariableDescriptor.cache.find("name", "tasks");
            if (!listTasksDescriptor) {
                return;
            }
            this.data.length = 0;
            this.getTasksData(listTasksDescriptor);
            this.table.addRows(this.data);
            if (!this.data[0]) {
                this.table.showMessage("Aucun mandat n'est disponible.");
            } else {
                this.table.hideMessage();
            }
            this.goToFinalPage(); // ! hack function
        },
        /*
         * Destroy all child widget and all function
         */
        destructor: function() {
            var k;
            this.table.destroy();
            for (k in this.handlers) {
                this.handlers[k].detach();
            }
        },
        //*** Particular Methods ***/
        /**
         * Change this widget to its picking mode
         * The picking mode is used to add a task to a resource.
         * Add class "modePicking".
         * Display the surname of the selected resoure
         * Display the button used to assign the task and display the informations of the selected task.
         * Set the identifiant of the next page reached by quitting this widget by a hit on the picking-mode's buttons
         */
        switchToPickingMode: function() {
            var cb = this.get(CONTENTBOX);
            if (this.resourceDescriptor) {
                cb.addClass('modePicking');
                cb.one('.resourceName p').setHTML('Assigner un mandat � ' + this.resourceDescriptor.getInstance().get('properties').surname);
                cb.one('.resourceName').show();
                cb.one('.footer').show();
            }
        },
        /**
         * Add rows to the datatable. Get informations on the valide tasks
         * @param ListDescriptor listTasksDescriptor, A list of all tasks.
         */
        getTasksData: function(listTasksDescriptor) {
            var i, j, k, termData, workers = new Array(), taskDescriptor, taskInstance, resourceDescriptor, resourceInstance, comment,
                    listResourcesDescriptor = Y.Wegas.Facade.VariableDescriptor.cache.find("name", "resources"),
                    currentWeekInstance = Y.Wegas.Facade.VariableDescriptor.cache.find("name", "week").getInstance();
            for (i = 0; i < listTasksDescriptor.get('items').length; i++) {
                workers.length = 0;
                taskDescriptor = listTasksDescriptor.get('items')[i];
                taskInstance = taskDescriptor.getInstance();
                for (j = 0; j < listResourcesDescriptor.get('items').length; j++) {
                    resourceDescriptor = listResourcesDescriptor.get('items')[j];
                    resourceInstance = resourceDescriptor.getInstance();
                    for (k = 0; k < resourceInstance.get('assignments').length; k++) {
                        if (taskDescriptor.get('id') == resourceInstance.get('assignments')[k].get('taskDescriptorId')) {
                            workers.push(resourceDescriptor.get('properties').surname);
                            break;
                        }
                    }
                }
                if (taskInstance.get('active')) {
                    termData = (workers.length <= 0) ? (taskDescriptor.get('properties').disappearAtWeek - currentWeekInstance.get('value')) : "-";
                    comment = new Array();
                    if (taskDescriptor.get('properties').comment)
                        comment.push(taskDescriptor.get('properties').comment);
                    if (taskDescriptor.get('properties').workWithLeader == 'true')
                        comment.push("S'effectue en coop�ration avec le leader.");
                    if (comment.length <= 0)
                        comment.push("-");
                    if (workers.length <= 0)
                        workers.push("-");
                    this.data.push({
                        id: taskDescriptor.get('id'),
                        task: taskDescriptor.get('name'),
                        skill: this.getRequirements(taskInstance),
                        duration: taskInstance.get('duration'),
                        term: termData,
                        salary: taskDescriptor.get('properties').salary,
                        comment: comment.join(" "),
                        worker: workers.join(",")
                    });
                }
            }
        },
        /**
         * @param TaskDescriptor td, the task to get Requirements
         * @return String, a texte including all the Requirements
         *  of the given task (example : engineer - 48).
         */
        getRequirements: function(ti) {
            var i, j, temp = [], req = [];
            for (i = 0; i < ti.get('requirements').length; i++) {
                if (ti.get('requirements')[i].getAttrs) {
                    req = ti.get('requirements')[i].getAttrs();
                    temp.push(req.work + " - " + req.level);
                }
            }
            return temp.join("<br />");
        },
        /**
         * @return the current selected task.
         */
        getSelectedTaskDescriptor: function() {
            return this.selectedTaskDescriptor;
        },
        /**
         * This function must be called by a click event.
         * set the current selected task
         * @param e, a click event on a row from the datatable.
         */
        selectRow: function(e) {
            var i, cb = this.get(CONTENTBOX),
                    listTasksDescriptor = Y.Wegas.Facade.VariableDescriptor.cache.find("name", "tasks"), taskDescriptorId;
            //deselect old row
            if (this.get("pickingMode") === "true") {
                cb.all('.yui3-datatable-content .selected').removeClass('selected');
            }
            //select new row
            taskDescriptorId = e.currentTarget.one("*").getContent();
            if (this.get("pickingMode") === "true") {
                e.currentTarget.addClass('selected');
            }
            //get new task descriptor
            for (i = 0; i < listTasksDescriptor.get('items').length; i++) {
                if (listTasksDescriptor.get('items')[i].get('id') == taskDescriptorId) {
                    this.selectedTaskDescriptor = listTasksDescriptor.get('items')[i];
                    break;
                }
            }
            if (this.selectedTaskDescriptor) {
                cb.one('.footer .assignInfo').setHTML('Assigner le mandat : ' + this.selectedTaskDescriptor.get('name'));
                cb.one('.footer .buttonOK').show();
            }
        },
        /**
         * Assign the given task to the given ressource.
         * @param ResourceDescriptor resourceDescriptor, the resource to assign a task.
         * @param TaskDescriptor taskDescriptor, the task to assign at a ressource.
         */
        assignTask: function(resourceDescriptor, taskDescriptor) {
            if (taskDescriptor && resourceDescriptor) {
                Y.Wegas.Facade.VariableDescriptor.sendRequest({
                    request: "/Script/Run/" + Y.Wegas.Facade.Game.get('currentPlayerId'),
                    cfg: {
                        method: "POST",
                        data: {
                            "@class": "Script",
                            language: "JavaScript",
                            content: "importPackage(com.wegas.core.script);\nactions.value -= 1\nassignTask(" + resourceDescriptor.get('id') + "," + taskDescriptor.get('id') + ");"
                        }
                    },
                    on: {
                        success: Y.bind(this.assignTaskResult, this, true),
                        failure: Y.bind(this.assignTaskResult, this, false)
                    }
                });
            }
            this.syncUI();
        },
        /**
         * Display a feedback on the operation "add task to a resource"
         * This feedback will disappear after 5 seconde.
         * the feedback message appear in node ".leaderway-feedback"
         * @param Boolean success, true if the opreation was a success, false otherwise.
         */
        assignTaskResult: function(success) {
            this.hideOverlay();
            Y.one('.leaderway-feedback').setStyle('display', 'block'); //yes "Y.one" because we want the feed back on each widgets.
            if (success) { // useless, players expect a success
//                Y.one('.leaderway-feedback').one('p').addClass('green');
//                Y.one('.leaderway-feedback').one('p').insert("Le mandat � �t� d�l�gu� !");
            } else {
                Y.one('.leaderway-feedback').one('p').addClass('red');
                Y.one('.leaderway-feedback').one('p').insert("Le mandat n'a pas pu �tre d�l�gu�.");
            }
            setTimeout(function() {
                Y.one('.leaderway-feedback').setHTML('<p></p>');
                Y.one('.leaderway-feedback').setStyle('display', 'none');
                Y.one('.leaderway-feedback').one('p').removeClass('green');
                Y.one('.leaderway-feedback').one('p').removeClass('red');
            }, 5000);
            //change the current page
            this.backToPreviousPage();
        },
        backToPreviousPage: function() {
            var targetPageLoader = Y.Wegas.PageLoader.find("maindisplayarea");
            var previousPageId = Y.Wegas.Facade.VariableDescriptor.cache.find("name", "previousPage").getInstance().get("value");
            targetPageLoader.set("pageId", targetPageLoader.set("pageId", previousPageId));
        },
        // *** hack Methods *** //
        /**
         * if current week > max value of week value, then
         * change the current widget to go on the "dialogue" widget.
         */
        goToFinalPage: function() {
            var currentWeek = Y.Wegas.Facade.VariableDescriptor.cache.find("name", "week"),
                    targetPageLoader = Y.Wegas.PageLoader.find("maindisplayarea");
            if (parseInt(currentWeek.getInstance().get('value')) > currentWeek.get('maxValue')) {
                targetPageLoader.once("widgetChange", function(e) {
                    e.newVal.setCurrentDialogue("dialogueFinal");
                });
                targetPageLoader.set("pageId", this.get('dialoguePageId'));
            }
        }

    }, {
        ATTRS: {
            pickingMode: {
                value: null,
                validator: function(s) {
                    return s === null || Y.Lang.isString(s);
                }
            },
            dialoguePageId: {
                value: null,
                validator: function(s) {
                    return s === null || Y.Lang.isString(s);
                }
            },
        }
    });
    Y.namespace('Wegas').TaskList = TaskList;
});
