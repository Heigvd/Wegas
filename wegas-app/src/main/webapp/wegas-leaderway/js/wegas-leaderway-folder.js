/**
 * @author Benjamin Gerber <ger.benjamin@gmail.com>
 */

YUI.add('wegas-leaderway-folder', function(Y) {
    "use strict";
    var CONTENTBOX = 'contentBox', Folder;
    Folder = Y.Base.create("wegas-leaderway-folder", Y.Wegas.ItemSelector, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        handlers: null,
        varToHide: null,
        // *** Lifecycle Methods *** //
        initializer: function() {
            this.handlers = {};
            this.varToHide = [];
        },
        /**
         * Render the widget.
         */
        renderUI: function() {
            var cb = this.get(CONTENTBOX);
            Folder.superclass.renderUI.apply(this);
        },
        /**
         * Bind some function at nodes of this widget
         */
        bindUI: function() {
            Folder.superclass.bindUI.apply(this);
            this.handlers.update = Y.Wegas.Facade.VariableDescriptor.after("update", this.syncUI, this);
        },
        /**
         * Synchronise the content of this widget.
         */
        syncUI: function() {
            var cb = this.get(CONTENTBOX);
            Folder.superclass.syncUI.apply(this);
            if (!this.currentItem) {
                return;
            }
            this.setCurrentRessource();
            this.addOccupation();
            if (cb.one('.occupation')) {
                cb.one('.occupation').append(this.getTextOccupation(this.currentItem.getInstance()));
            }
            this.createHiddenVarList();
            this.hideElements();
            this.goToFinalPage(); // ! hack function
        },
        /*
         * Destroy all child widget and all remanent function
         */
        destructor: function() {
            var k;
            this.setCurrentPage();
            for (k in this.handlers) {
                this.handlers[k].detach();
            }
        },
        //*** Particular Methods ***/
        addOccupation: function() {
            var i, selectorNo = -1, resource, resources, occupation, cb = this.get(CONTENTBOX);
            if (!this.get('listVariables')) {
                return;
            }
            resources = Y.Wegas.Facade.VariableDescriptor.cache.find("name", this.get('listVariables'));
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
        setCurrentRessource: function() {
            var currentRes = this.currentItem.get("name");
            if (!currentRes) {
                return;
            }
            Y.Wegas.Facade.VariableDescriptor.sendRequest({
                request: "/Script/Run/" + Y.Wegas.app.get('currentPlayer'),
                'Managed-Mode': 'false',
                cfg: {
                    method: "POST",
                    data: Y.JSON.stringify({
                        "@class": "Script",
                        "language": "JavaScript",
                        "content": "importPackage(com.wegas.core.script);\nVariableDescriptorFacade.findByName(self.getGameModel(), 'nameOfCurrentEmployee').getInstance(self).setValue('" + currentRes + "');"
                    })
                }
            });
        },
        setCurrentPage: function() {
            var currentPage = this.get("root").get("@pageId");
            if (currentPage || currentPage === 0) {
                Y.Wegas.Facade.VariableDescriptor.sendRequest({
                    request: "/Script/Run/" + Y.Wegas.app.get('currentPlayer'),
                    'Managed-Mode': 'false',
                    cfg: {
                        method: "POST",
                        data: Y.JSON.stringify({
                            "@class": "Script",
                            "language": "JavaScript",
                            "content": "importPackage(com.wegas.core.script);\nVariableDescriptorFacade.findByName(self.getGameModel(), 'previousPage').getInstance(self).setValue(" + currentPage + ");"
                        })
                    }
                });
            }
        },
        /**
         * Get the occupation of the given resource. this resource can be vacant, sick or on work.
         * @param ResourceInstance resourceInstance, the resource to get the occupation.
         * @return Object with two argument : a code (Integer) and a task if the resource is sick or on work. The code must be 0 (vacant), 1 (on work), 2 (sick)
         */
        getOccupationObject: function(resourceInstance) {
            var i, j, occupationObject = null, sick = false,
                    taskListDescriptor = Y.Wegas.Facade.VariableDescriptor.cache.find("name", "tasks"),
                    listAbsenceDescriptor = Y.Wegas.Facade.VariableDescriptor.cache.find("name", "absences"),
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
            return temp.join(", ");
        },
        /**
         * Get a descripton of the occupation of the given resource. this resource can be vacant, sick or on work.
         * @param ResourceInstance resourceInstance, the resource to get the occupation text.
         * @return String decription of the occupation of the given resource
         */
        getTextOccupation: function(resourceInstance) {
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
                    occupation.push(this.getRequirements(taskInstance));
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
         * Decrease moral by 15 and confidence by 10 for the current resource
         */
        decreaseResourceState: function() {
            if (!this.currentResourceDescriptor)
                return;
            Y.Wegas.Facade.VariableDescriptor.sendRequest({
                request: "/Script/Run/" + Y.Wegas.app.get('currentPlayer'),
                cfg: {
                    method: "POST",
                    data: Y.JSON.stringify({
                        "@class": "Script",
                        "language": "JavaScript",
                        "content": "importPackage(com.Wegas.Facade.core.script);var i, listRes, resInst;\nlistRes = VariableDescriptor.findByName(self.getGameModel(), 'resources');\nfor(i=0;i<listRes.items.size();i++){\nif(listRes.items.get(i).getName() == '" + this.currentResourceDescriptor.get('name') + "'){\nresInst = listRes.items.get(i).getInstance(self);\nbreak;\n}\n}\nresInst.setMoral(resInst.getMoral()-15);\nresInst.setConfidence(resInst.getConfidence()-10);"
                    })
                }
            });
        },
        createHiddenVarList: function() {
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
        hideElements: function() {
            var j, cb = this.get(CONTENTBOX);
            cb.all('.informations>div, .selectors>div').each(function(node, i) {
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
            dialoguePageId: {
                value: null,
                validator: function(s) {
                    return s === null || Y.Lang.isString(s);
                }
            },
            hiddenVariablesSeparator: {
                value: null,
                validator: function(s) {
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
