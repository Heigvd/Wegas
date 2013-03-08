/**
 * @author Benjamin Gerber <ger.benjamin@gmail.com>
 */

YUI.add('wegas-leaderway-folder', function (Y) {
    "use strict";
    var CONTENTBOX = 'contentBox', Folder;
    Folder = Y.Base.create("wegas-leaderway-folder", Y.Wegas.ItemSelector, [Y.Wegas.Widget], {
        handlers: null,
        menuAction: null,
        varToHide: null,
        // *** Lifecycle Methods *** //
        initializer: function () {
            this.menuAction = new Y.Wegas.Button({
                label: "Interagir",
                cssClass: "actions"
            });
            this.menuAction.plug(Y.Plugin.WidgetMenu, {
                children: [{
                        type: "Button",
                        label: "Attribuer un mandat",
                        cssClass: "folder-action-giveTask"
                    }, {
                        type: "Button",
                        label: "S'entretenir",
                        cssClass: "folder-action-speak"
                    }]
            });
            this.handlers = {};
            this.varToHide = [];
        },
        /**
         * Render the widget.
         */
        renderUI: function () {
            var cb = this.get(CONTENTBOX);
            Folder.superclass.renderUI.apply(this);
            this.menuAction.render(cb);
        },
        /**
         * Bind some function at nodes of this widget
         */
        bindUI: function () {
            Folder.superclass.bindUI.apply(this);

            this.handlers.update = Y.Wegas.VariableDescriptorFacade.after("update", this.syncUI, this);

            //bind each action 'giveTask' change widget depending to the ATTRS 'taskListPageId'
            this.handlers.giveTask = Y.one('body').delegate('click', function (e) {
                var targetPageLoader = Y.Wegas.PageLoader.find(this.get('targetPageLoaderId'));
                if (this.menuAction.menu.getMenu().toJSON()[0].get("disabled")) {
                    return;
                }
                targetPageLoader.once("widgetChange", function (e) {
                    e.newVal.switchToPickingMode(this.resourceDescriptor, this.folderPageId);
                }, {
                    resourceDescriptor: this.currentItem,
                    folderPageId: this.get('folderPageId')
                });
                targetPageLoader.set("pageId", this.get('taskListPageId'));
            }, '.folder-action-giveTask', this);

            //bind each action 'speak' change widget depending to the ATTRS 'dialoguePageId'
            this.handlers.speak = Y.one('body').delegate('click', function (e) {
                if (this.menuAction.menu.getMenu().toJSON()[1].get("disabled")) {
                    return;
                }
                var targetPageLoader = Y.Wegas.PageLoader.find(this.get('targetPageLoaderId'));
                targetPageLoader.once("widgetChange", function (e) {
                    e.newVal.setCurrentDialogue(this.resourceDescriptor.getInstance().get('properties').dialogue);
                }, {
                    resourceDescriptor: this.currentItem
                });
                Y.Wegas.VariableDescriptorFacade.rest.sendRequest({// decrease number of actions by 1
                    request: "/Script/Run/" + Y.Wegas.app.get('currentPlayer'),
                    cfg: {
                        method: "POST",
                        data: Y.JSON.stringify({
                            "@class": "Script",
                            "language": "JavaScript",
                            "content": "importPackage(com.wegas.core.script);\nactions.value--;"
                        })
                    }
                });
                targetPageLoader.set("pageId", this.get('dialoguePageId'));
            }, '.folder-action-speak', this);

            //syncAction when menu is open (and menu's sub-element exists)
            this.handlers.syncAction = this.menuAction.menu.after('menuOpen', this.syncAction, this);
        },
        /**
         * Synchronise the content of this widget.
         */
        syncUI: function () {
            var cb = this.get(CONTENTBOX);
            Folder.superclass.syncUI.apply(this);
            if (!this.currentItem) {
                return;
            }
            this.addOccupation();
            if (cb.one('.occupation')) {
                cb.one('.occupation').append(this.getTextOccupation(this.currentItem.getInstance()));
            }
            this.createHiddenVarList();
            this.hideElements();
            this.syncAction(cb);
            this.goToFinalPage(); // ! hack function
        },
        /*
         * Destroy all child widget and all remanent function
         */
        destructor: function () {
            var k;
            for (k in this.handlers) {
                this.handlers[k].detach();
            }
            this.menuAction.destroy();
        },
        //*** Particular Methods ***/
        /**
         * set the resource displayed bay this widget.
         * call the function syncUI of this widget.
         * @param ResourceDescriptor resourceDescriptor, the new resource.
         */
        setResourceDescriptor: function (resourceDescriptor) {
            if (!resourceDescriptor && !resourceDescriptor.getInstance()) {
                return;
            }
            this.currentItem = resourceDescriptor;
            this.syncUI();
        },
        addOccupation: function () {
            var i, selectorNo = -1, resource, resources, occupation, cb = this.get(CONTENTBOX);
            if (!this.get('listVariables')) {
                return;
            }
            resources = Y.Wegas.VariableDescriptorFacade.rest.find("name", this.get('listVariables'));
            if (!resources) {
                return;
            }
            for (i = 0; i < resources.get('items').length; i += 1) {
                resource = resources.get('items')[i];
                switch (this.getOccupationObject(resource.getInstance()).code) {
                    case 0 :
                        occupation = "Libre";
                        break;
                    case 1 :
                        occupation = "Occupé";
                        break;
                    default :
                        occupation = "Malade";
                }
                if (resource.getInstance().get('active') === null || resource.getInstance().get('active') === true) {
                    selectorNo++;
                    cb.all('.selector').item(selectorNo).append('<p>' + occupation + '</p>');
                }
            }
        },
        /**
         * Get the occupation of the given resource. this resource can be vacant, sick or on work.
         * @param ResourceInstance resourceInstance, the resource to get the occupation.
         * @return Object with two argument : a code (Integer) and a task if the resource is sick or on work. The code must be 0 (vacant), 1 (on work), 2 (sick)
         */
        getOccupationObject: function (resourceInstance) {
            var i, j, occupationObject = null, sick = false,
                    taskListDescriptor = Y.Wegas.VariableDescriptorFacade.rest.find("name", "tasks"),
                    listAbsenceDescriptor = Y.Wegas.VariableDescriptorFacade.rest.find("name", "absences"),
                    taskDescriptor;
            for (i = 0; i < listAbsenceDescriptor.get('items').length; i++) {
                taskDescriptor = listAbsenceDescriptor.get('items')[i];
                if (taskDescriptor.getInstance().get('active')) {
                    for (j = 0; j < resourceInstance.get('assignments').length; j++) {
                        if (taskDescriptor.get('id') === resourceInstance.get('assignments')[j].get('taskDescriptorId')) {
                            sick = true;
                            occupationObject = {
                                code: 2,
                                taskDescriptor: taskDescriptor
                            };
                            break;
                        }
                    }
                }
            }
            if (!sick) {
                for (i = 0; i < taskListDescriptor.get('items').length; i++) {
                    for (j = 0; j < resourceInstance.get('assignments').length; j++) {
                        taskDescriptor = taskListDescriptor.get('items')[i];
                        if (taskDescriptor.get('id') === resourceInstance.get('assignments')[j].get('taskDescriptorId')) {
                            occupationObject = {
                                code: 1,
                                taskDescriptor: taskDescriptor
                            };
                        }
                    }
                }
            }
            if (occupationObject === null) {
                occupationObject = {
                    code: 0,
                    taskDescriptor: null
                };
            }
            return occupationObject;
        },

        /**
         * @param TaskDescriptor td, the task to get Requirements
         * @return String, a texte including all the Requirements
         *  of the given task (example : 1x engineer - 48).
         */
        getRequirements: function (td) {
            var i, j, temp = [], req;
            for (i in td.get('requirements')) {
                if (td.get('requirements')[i].getAttrs && td.get('requirements')[i].getAttrs().needs) {
                    req = td.get('requirements')[i].getAttrs();
                    for (j in req.needs) {
                        //temp.push(req.needs[j] + "x " + i + " - " + j);
                        temp.push(i + " - " + j);
                    }

                }
            }
            return temp.join(", ");
        },

        /**
         * Get a descripton of the occupation of the given resource. this resource can be vacant, sick or on work.
         * @param ResourceInstance resourceInstance, the resource to get the occupation text.
         * @return String decription of the occupation of the given resource
         */
        getTextOccupation: function (resourceInstance) {
            var occupationObject, occupation = [], taskDescriptor, taskInstance, taskSkills = [], key;
            occupationObject = this.getOccupationObject(resourceInstance);
            if (occupationObject.taskDescriptor !== null) {
                taskDescriptor = occupationObject.taskDescriptor;
                taskInstance = taskDescriptor.getInstance();
            }
            switch (occupationObject.code) {
                case 0 :
                    occupation.push('Libre pour un mandat, travail habituel.');
                    break;
                case 1 :
                    occupation.push('<div class="task">');
                    occupation.push('<div class="task-name"><span class= class"task-name-label">Mandat : </span><span= class"task-name-value">');
                    occupation.push(occupationObject.taskDescriptor.get('name'));
                    occupation.push('</span></div>');
                    occupation.push('<ul class="task-skill"><span class="task-skill-label">Compétence demandée : </span>');
                    occupation.push(this.getRequirements(taskDescriptor));
                    occupation.push('</ul></div>');
                    occupation.push('<div class="task-salary"><span class="task-salary-label">Rémunération : </span><span class="task-salary-value">');
                    occupation.push(taskDescriptor.get('properties').salary);
                    occupation.push('</span></div>');
                    occupation.push('<div class="task-duration"><span class="task-duration-label">Durée de travail restant : </span><span class="task-duration-value">');
                    occupation.push(taskInstance.get('duration'));
                    occupation.push('</span></div>');
                    occupation.push("</div>");
                    break;
                default :
                    occupation.push('Arrêt maladie (revient dans ');
                    occupation.push(taskInstance.get('duration'));
                    (taskInstance.get('duration') > 1) ? occupation.push(' semaines).') : occupation.push(' semaine).');
            }
            return occupation.join("");
        },
        /**
         * Syncronise action part in tabview.
         * Show and hide action's buttons
         */
        syncAction: function (e) {
            var resourceInstance, occupation, actions;
            actions = Y.Wegas.VariableDescriptorFacade.rest.find("name", "actions");
            this.menuAction.menu.getMenu().toJSON()[0].set('disabled', false)
            this.menuAction.menu.getMenu().toJSON()[1].set('disabled', false)
            if (this.currentItem == null)
                return;
            resourceInstance = this.currentItem.getInstance();
            occupation = this.getOccupationObject(resourceInstance).code;
            if (occupation != 0) {
                this.menuAction.menu.getMenu().toJSON()[0].set('disabled', true);
            }
            if (occupation < 2 && actions.getInstance().get('value') <= 0) {// ! no more protections ?
                this.menuAction.menu.getMenu().toJSON()[1].set('disabled', true);
            }
        },
        /**
         * Decrease moral by 15 and confidence by 10 for the current resource
         */
        decreaseResourceState: function () {
            if (!this.currentResourceDescriptor)
                return;
            Y.Wegas.VariableDescriptorFacade.rest.sendRequest({
                request: "/Script/Run/" + Y.Wegas.app.get('currentPlayer'),
                cfg: {
                    method: "POST",
                    data: Y.JSON.stringify({
                        "@class": "Script",
                        "language": "JavaScript",
                        "content": "importPackage(com.wegas.core.script);var i, listRes, resInst;\nlistRes = VariableDescriptorFacade.findByName(self.getGameModel(), 'resources');\nfor(i=0;i<listRes.items.size();i++){\nif(listRes.items.get(i).getName() == '" + this.currentResourceDescriptor.get('name') + "'){\nresInst = listRes.items.get(i).getInstance(self);\nbreak;\n}\n}\nresInst.setMoral(resInst.getMoral()-15);\nresInst.setConfidence(resInst.getConfidence()-10);"
                    })
                }
            });
        },
        createHiddenVarList: function () {
            var i, j, vari, list,
                    splitter = this.get('hiddenVariablesSeparator'),
                    hiddenVar = this.get('hiddenVariables');
            if (!splitter || !hiddenVar) {
                return;
            }
            this.varToHide.length = 0;
            for (i = 0; i < hiddenVar.length; i += 1) {
                vari = this.getVariableValue(this.currentItem, hiddenVar[i]);
                list = (vari) ? vari.split(splitter) : list = [];
                for (j = 0; j < list.length; j += 1) {
                    this.varToHide.push(list[j]);
                }
            }
        },
        hideElements: function () {
            var j, cb = this.get(CONTENTBOX);
            cb.all('.informations>div, .selectors>div').each(function (node, i) {
                for (j = 0; j < this.varToHide.length; j += 1) {
                    if (node.getAttribute('data-name') == this.varToHide[j]) {
                        node.remove();
                        break;
                    }
                }
            }, this);
        },
        // *** hack Methods *** //
        /**
         * if current week > max value of week value, then
         * change the current widget to go on the "dialogue" widget.
         */
        goToFinalPage: function () {
            var currentWeek = Y.Wegas.VariableDescriptorFacade.rest.find("name", "week"),
                    targetPageLoader = Y.Wegas.PageLoader.find(this.get('targetPageLoaderId'));
            if (parseInt(currentWeek.getInstance().get('value')) > currentWeek.get('maxValue')) {
                targetPageLoader.once("widgetChange", function (e) {
                    e.newVal.setCurrentDialogue("dialogueFinal");
                });
                targetPageLoader.set("pageId", this.get('dialoguePageId'));
            }
        }

    }, {
        ATTRS: {
            folderPageId: {
                value: null,
                validator: function (s) {
                    return s === null || Y.Lang.isString(s);
                }
            },
            taskListPageId: {
                value: null,
                validator: function (s) {
                    return s === null || Y.Lang.isString(s);
                }
            },
            dialoguePageId: {
                value: null,
                validator: function (s) {
                    return s === null || Y.Lang.isString(s);
                }
            },
            targetPageLoaderId: {
                value: null,
                validator: function (s) {
                    return s === null || Y.Lang.isString(s);
                }
            },
            hiddenVariablesSeparator: {
                value: null,
                validator: function (s) {
                    return s === null || Y.Lang.isString(s);
                }
            },
            hiddenVariables: {
                validator: Y.Lang.isArray,
                value: new Array()
            }
        }
    });
    Y.namespace('Wegas').LWFolder = Folder;
});
