/**
* @author Benjamin Gerber <ger.benjamin@gmail.com>
*/

YUI.add('wegas-leaderway-folder', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox', Folder;

    Folder = Y.Base.create("wegas-folder", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {

        tabview: null,
        currentResourceDescriptor: null,
        handlers: new Array(),

        //*** Particular Methods ***/
        /**
         * set the resource displayed bay this widget.
         * call the function syncUI of this widget.
         * @param ResourceDescriptor resourceDescriptor, the new resource.
         */
        setResourceDescriptor: function(resourceDescriptor){
            if(!resourceDescriptor.getInstance()) return;
            this.currentResourceDescriptor = resourceDescriptor;
            this.syncUI();
        },

        /**
         * Clear each node created in the renderUI function
         * @param String cb, the widget's contentbox.
         */
        clearBeforeSync: function(cb){
            cb.one('.folder .name').setHTML();
            cb.one('.folder .surname').setHTML();
            cb.one('.folder .salary-value').setHTML();
            cb.one('.folder .picture').setHTML();
            cb.one('.folder .leadershipLevel-value').setHTML();
            cb.one('.folder .moral').setHTML();
            cb.one('.folder .confidence').setHTML();
            cb.one('.folder .occupation-value').setHTML();
            cb.one('.folder .skillsets-value').setHTML();
            cb.one('.folder .description-value').setHTML();
        },

        selectCurrentRessource: function(listResourcesDescriptor){
            var i, resourceDescriptor;
            for(i=0; i<listResourcesDescriptor.get('items').length; i++){
                resourceDescriptor = listResourcesDescriptor.get('items')[i];
                if(resourceDescriptor.getInstance().get('active') == true){
                    this.currentResourceDescriptor = resourceDescriptor
                    break;
                }
            }
        },

       /**
        * For each active resource creat a div with picture, surname and ocuppation of the resource.
         * @param String cb, the widget's contentbox.
         * @param ListDescriptor listResourcesDescriptor, A list of all resources.
        */
        makeResourcesSelector: function(cb, listResourcesDescriptor){
            var i, resourceSelector = new Array(), resourceInstance,
            resourceDescriptor, textOccupation;
            if(cb.one('.listResources') != null) cb.one('.listResources').setHTML();
            for(i=0; i<listResourcesDescriptor.get('items').length; i++){
                resourceSelector.length = 0;
                resourceDescriptor = listResourcesDescriptor.get('items')[i];
                resourceInstance = resourceDescriptor.getInstance();
                if(resourceInstance.get('active') == true){
                    switch(this.getOccupationObject(resourceInstance).code){
                        case 0 : textOccupation = "Libre";
                            break;
                            case 1 : textOccupation = "Occupé";
                            break;
                            default : textOccupation = "Malade";
                    }
                    resourceSelector.push('<div class="resourceSelector">');
                    resourceSelector.push('<div class="ID" style="display:none;"><p>');
                    resourceSelector.push(resourceDescriptor.get('id'));
                    resourceSelector.push('</p></div>');
                    if(resourceInstance.get('properties').picture != null){
                        resourceSelector.push('<div class="picture">');
                        resourceSelector.push('<img src="'+resourceInstance.get('properties').picture+'" alt="picture" width="35" height="35" />');
                        resourceSelector.push('</div>');
                    }
                    resourceSelector.push('<div class="name"><p>');
                    resourceSelector.push(resourceInstance.get('properties').surname);
                    resourceSelector.push('</p></div>');
                    resourceSelector.push('<div class="occupation"><p>');
                    resourceSelector.push(textOccupation);
                    resourceSelector.push('</p></div>');
                    resourceSelector.push('</div>');
                    cb.one('.listResources').insert(resourceSelector.join(""));
                }
            }
        },

        /**
         * Syncronise folder part in tabview.
         * @param String cb, the widget's contentbox.
         */
        syncFolderInformations: function(cb){
            var i, currentResourceInstance = this.currentResourceDescriptor.getInstance(),
            hiddenSkillset = currentResourceInstance.get('properties').hiddenSkillsets.split(new RegExp("[,;]+", "g")),
            idHidden;
            cb.one('.folder .name').insert(this.currentResourceDescriptor.get('name'));
            cb.one('.folder .surname').insert(currentResourceInstance.get('properties').surname);
            cb.one('.folder .salary-value').insert(currentResourceInstance.get('properties').salary);
            if(currentResourceInstance.get('properties').picture != null){
                cb.one('.folder .picture').insert('<img src="'+currentResourceInstance.get('properties').picture+'" alt="picture" width=140 height="140" />');
            }
            cb.one('.leadershipLevel').show();
            if(currentResourceInstance.get('properties').leadershipLevelIsHidden == 'false'){
                this.addLevelOfLeadershipInformations(cb, currentResourceInstance);
            }
            else{
                cb.one('.leadershipLevel').hide();
            }
            cb.one('.folder .moral').insert(this.createGauge('Moral', parseInt(currentResourceInstance.get('moral'))));
            cb.one('.folder .confidence').insert(this.createGauge('Confiance envers son leader', parseInt(currentResourceInstance.get('confidence'))));
            cb.one('.folder .occupation-value').insert(this.getTextOccupation(currentResourceInstance));
            for (var key in currentResourceInstance.get('skillset')){
                idHidden = false;
                for(i=0; i<hiddenSkillset.length; i++){
                    if(hiddenSkillset[i] == key) idHidden = true;
                }
                if(!idHidden){
                    cb.one('.folder .skillsets-value').insert('<div class="skillset gauge">'+this.createGauge(key, parseInt(currentResourceInstance.get('skillset')[key]))+'</div>');
                }
        }
            cb.one('.folder .description-value').insert(this.currentResourceDescriptor.get('description'));
        },

        /**
         * Create a descriptive of the differents levels of leadership.
         * A node corresponding with the current leve of leadership of the given resource will be indicated by a class named "currentLevel"
         * The descriptive is conjugated according to the sex of the given resource.
         * This information will be added in the node ".leadershipLevel" of this widget
         * @param String cb, the widget's contentbox.
         * @param ResourceInstance resourceInstance, the resource to get the level of leadership.
         */
        addLevelOfLeadershipInformations: function(cb, resourceInstance){
            var i, leadershipInfo = new Array(), leadershipLevel, surname = resourceInstance.get('properties').surname;
            if(resourceInstance.get('properties').leadershipLevel){
                leadershipLevel = parseInt(resourceInstance.get('properties').leadershipLevel);
                if(leadershipLevel >= 1 && leadershipLevel <=5){
                    leadershipInfo.push('<ul class="leadershipLevel-ul">');
                    leadershipInfo.push('<li class="leadershipLevel-label">Votre niveau de leadership avec '+surname+' est : </li>');
                    if(resourceInstance.get('properties').male == 'true'){
                        leadershipInfo.push('<li class="leadershipLevel-info">Niveau 5 : '+surname+" voit en vous un modèle à atteindre.</li>");
                        leadershipInfo.push('<li class="leadershipLevel-info">Niveau 4 : '+surname+" se rend compte de toute l'énergie que vous avez dépensé pour lui et veux donner l'envie aux autres de se battre pour l'entreprise. </li>");
                        leadershipInfo.push('<li class="leadershipLevel-info">Niveau 3 : '+surname+" sais ce que vous avez fait pour l'entreprise et travaillera à son tour pour la dévelloper.</li>");
                        leadershipInfo.push('<li class="leadershipLevel-info">Niveau 2 : '+surname+" suis vos directives car il vous considère et pense que vos choix sont justifiés.</li>");
                        leadershipInfo.push('<li class="leadershipLevel-info">Niveau 1 : '+surname+" suis vos directives uniquement parce qu'il en a le devoir.</li>");
                    }
                    else{
                        leadershipInfo.push('<li class="leadershipLevel-info">Niveau 5 : '+surname+" voit en vous un modèle à atteindre.</li>");
                        leadershipInfo.push('<li class="leadershipLevel-info">Niveau 4 : '+surname+" se rend compte de toute l'énergie que vous avez dépensé pour elle et veux donner l'envie aux autres de se battre pour l'entreprise. </li>");
                        leadershipInfo.push('<li class="leadershipLevel-info">Niveau 3 : '+surname+" sais ce que vous avez fait pour l'entreprise et travaillera à son tour pour la dévelloper.</li>");
                        leadershipInfo.push('<li class="leadershipLevel-info">Niveau 2 : '+surname+" suis vos directives car elle vous considère et pense que vos choix sont justifiés.</li>");
                        leadershipInfo.push('<li class="leadershipLevel-info">Niveau 1 : '+surname+" suis vos directives uniquement parce qu'elle en a le devoir.</li>");
                    }
                    leadershipInfo.push('</ul>');
                    cb.one('.leadershipLevel-value').insert(leadershipInfo.join(""));

                    cb.all('.leadershipLevel-info').item(5-leadershipLevel).addClass('currentLevel');
                    for(i=0 ; i<=leadershipLevel-1 ; i++){
                        cb.all('.leadershipLevel-info').item(4-i).addClass('levelActive');
                    }
                }
                else{
                    cb.one('.leadershipLevel').insert('<div class="error">Leadership level must to be between 1 to 5)</div>')
                }
            }
        },
        /**
        * Get the occupation of the given resource. this resource can be vacant, sick or on work.
        * @param ResourceInstance resourceInstance, the resource to get the occupation.
        * @return Object with two argument : a code (Integer) and a task if the resource is sick or on work. The code must be 0 (vacant), 1 (on work), 2 (sick)
        */
        getOccupationObject: function(resourceInstance){
            var i, j, occupationObject = null, sick=false,
            taskListDescriptor = Y.Wegas.VariableDescriptorFacade.rest.find("name", "tasks"),
            listAbsenceDescriptor = Y.Wegas.VariableDescriptorFacade.rest.find("name", "absences"),
            taskDescriptor;
            for (i = 0; i < listAbsenceDescriptor.get('items').length; i++) {
                taskDescriptor = listAbsenceDescriptor.get('items')[i];
                if(taskDescriptor.getInstance().get('active')){
                    for(j = 0; j < resourceInstance.get('assignments').length; j++){
                        if(taskDescriptor.get('id') == resourceInstance.get('assignments')[j].get('taskDescriptorId')){
                            sick=true;
                            occupationObject = {code:2, taskDescriptor: taskDescriptor};
                            break;
                        }
                    }
                }
            }
            if(!sick){
                for (i = 0; i < taskListDescriptor.get('items').length; i++) {
                    for(j = 0; j < resourceInstance.get('assignments').length; j++){
                        taskDescriptor = taskListDescriptor.get('items')[i];
                        if(taskDescriptor.get('id') == resourceInstance.get('assignments')[j].get('taskDescriptorId')){
                            occupationObject = {code:1, taskDescriptor: taskDescriptor};
                        }
                    }
                }
            }
            if(occupationObject == null){
                occupationObject = {code:0, taskDescriptor: null};
            }
            return occupationObject;
        },

        /**
        * Get a descripton of the occupation of the given resource. this resource can be vacant, sick or on work.
        * @param ResourceInstance resourceInstance, the resource to get the occupation text.
        * @return String decription of the occupation of the given resource
        */
        getTextOccupation: function(resourceInstance){
            var occupationObject, occupation = new Array(), taskInstance, taskSkills = new Array();
            occupationObject = this.getOccupationObject(resourceInstance);
            if(occupationObject.taskDescriptor != null) taskInstance = occupationObject.taskDescriptor.getInstance();
            switch(occupationObject.code){
                case 0 :
                    occupation.push('Libre pour un mandat, travail habituel.');
                    break;
                case 1 :
                        for(var key in taskInstance.get('skillset')){
                            taskSkills.push('<li class="task-skill-value">'+key+' ('+taskInstance.get('skillset')[key]+')</li>');
                        }
                        occupation.push('<div class="task">');
                        occupation.push('<div class="task-name"><span class= class"task-name-label">Mandat : </span><span= class"task-name-value">');
                        occupation.push(occupationObject.taskDescriptor.get('name'));
                        occupation.push('</span></div>');
                        occupation.push('<ul class="task-skill"><span class="task-skill-label">Compétence demandée : </span>');
                        occupation.push(taskSkills.join(""));
                        occupation.push('</ul></div>');
                        occupation.push('<div class="task-salary"><span class="task-salary-label">Rémunération : </span><span class="task-salary-value">');
                        occupation.push(taskInstance.get('properties').salary);
                        occupation.push('</span></div>');
                        occupation.push('<div class="task-duration"><span class="task-duration-label">Durée de travail restant : </span><span class="task-duration-value">');
                        occupation.push(taskInstance.get('duration'));
                        occupation.push('</span></div>');
                        occupation.push("</div>");
                    break;
                default :
                    occupation.push('Arrêt maladie (revient dans ');
                    occupation.push(taskInstance.get('duration'));
                    (taskInstance.get('duration') > 1)?occupation.push(' semaines).') : occupation.push(' semaine).');
            }
            return occupation.join("");
        },

        /**
        * Create a DOM element usable as a gauge.
        * @param String label, the label of the gauge (must be between 0 and 100)
        * @param Integer nombreOfUnits, the nombre of div in the gauge container (the value of the gauge).
        * @return String div container of the gauge
        */
        createGauge: function(label, nomberOfUnits){
            var gauge = new Array("");
            if(typeof nomberOfUnits === 'number'){
                if(nomberOfUnits>=0 && nomberOfUnits<=100){
                    gauge.push('<span class="gauge-label">');
                    gauge.push(label);
                    gauge.push(' <span class="gauge-value">(');
                    gauge.push(nomberOfUnits);
                    gauge.push('/100)</span><span class="gauge-units">');
                    for(var i=0; i<nomberOfUnits; i++){
                        gauge.push('<div class="gauge-unit"></div>');
                    }
                    gauge.push('</span></div>');
                }
                else{
                    gauge.push('<span class="error">The number for the gauge "'+label+'" must to be between 0 to 100.</span>');
                }
            }
            else{
                gauge.push('<span class="error">Unvalid number to create gauge : '+ label+"</span>");
            }
            return gauge.join("");
        },

        /**
         * Syncronise action part in tabview.
         * Show and hide action's buttons
         * @param String cb, the widget's contentbox.
         */
        syncAction: function(cb){
            var noAction = true, resourceInstance, occupation, actions;
            actions = Y.Wegas.VariableDescriptorFacade.rest.find("name", "actions");
            if(this.currentResourceDescriptor != null){
                resourceInstance = this.currentResourceDescriptor.getInstance();
                cb.one('.actions .noAction').setHTML();
                cb.one('.actions .giveTask').setHTML("<p>Donner un Mandat à  "+resourceInstance.get('properties').surname+"</p>");
                cb.one('.actions .speak').setHTML("<p>S'entretenir avec "+resourceInstance.get('properties').surname+"</p>");
                occupation = this.getOccupationObject(resourceInstance).code;
                cb.one('.actions .giveTask').hide();
                cb.one('.actions .speak').hide();
                if(occupation == 0){
                    cb.one('.actions .giveTask').show();
                    noAction = false;
                }
                if(occupation < 2 && actions.getInstance().get('value') > 0){// ! no more protections ?
                    cb.one('.actions .speak').show();
                    noAction = false;
                }
            }
            if(noAction){
                cb.one('.actions .noAction').setHTML("Aucune action n'est disponible.");
            }
        },

        setTextSelectedTask: function(eventContainTask){
            var selectedRowInformation = this.tasksChooser.get(CONTENTBOX).one('.yui3-widget-ft .selectedTask');
            selectedRowInformation.setHTML();
            selectedRowInformation.insert("Mandat sélectionné : "+eventContainTask.taskDescriptor.get('name'));
        },

        // *** Lifecycle Methods *** //
        /**
         * Render the widget.
         * create the child widget "tabview"
         */
        renderUI: function(){
            var cb = this.get(CONTENTBOX);
            this.tabview = new Y.TabView({
                children: [{
                    label: 'Dossier',
                    content: '<div class="folder">\n\
                    <div class="basic_informations section">\n\
                    <div class="picture"></div>\n\
                        <div class="name_surname"><span class="name"></span><span class="surname"></span></div>\n\
                        <div class="salary"><span class="salary-label">Salaire hebdomadaire : </span><span class="salary-value"></span></div>\n\
                    </div>\n\
                    <div class="occupation section"><div class="title-section">Occupation actuelle : </div><div class="occupation-value"></div></div>\n\
                    <div class="leadershipLevel section"><div class="title-section">Niveau de leadership : </div><div class="leadershipLevel-value"></div></div>\n\
                    <div class="conditions section"><div class="title-section">Conditions : </div>\n\
                        <div class="moral gauge"></div>\n\
                        <div class="confidence gauge"></div>\n\
                    </div>\n\
                    <div class="skillsets section"><div class="title-section">Compétences : </div><div class="skillsets-value"></div></div>\n\
                    <div class="description section"><div class="title-section">Description : </div><div class="description-value"></div></div>\n\
                </div>'
                },
                {
                    label: 'Actions',
                    content: '\n\
                    <div class="actions">\n\
                        <div class="noAction"></div>\n\
                        <div class="actions-list">\n\
                            <div class="speak action"></div>\n\
                            <div class="giveTask action"></div>\n\
                        </div>\n\
                    </div>'
                }]
            });
            cb.insert('<div class="menuFolder"><div class="listResources"></div></div>');
            this.tabview.render(cb);
        },

        /**
         * Bind some function at nodes of this widget
         */
        bindUI: function(){
            var cb = this.get(CONTENTBOX);
            this.handlers.push(Y.Wegas.VariableDescriptorFacade.after("response", this.syncUI, this));
            this.handlers.push(Y.Wegas.app.after('currentPlayerChange', this.syncUI, this));
            //bind each resource selector
            this.handlers.push(cb.one('.listResources').delegate('click', function (e) {
                var i, newResource = null, resourceID = parseInt(e.currentTarget._node.childNodes[0].innerText),
                listResourcesDescriptor = Y.Wegas.VariableDescriptorFacade.rest.find("name", "resources"),
                resourceDescriptor;
                for(i=0; i<listResourcesDescriptor.get('items').length; i++){
                    resourceDescriptor = listResourcesDescriptor.get('items')[i];
                    if(resourceDescriptor.get('id') == resourceID) newResource = resourceDescriptor;
                }
                if(newResource == null) newResource = listResourcesDescriptor.get('items')[0];
                this.setResourceDescriptor(newResource);
            }, '.resourceSelector', this));
            //bind each action 'giveTask' change widget depending to the ATTRS 'taskListPageId'
            this.handlers.push(cb.one('.actions').delegate('click', function (e) {
                var targetPageLoader = Y.Wegas.PageLoader.find(this.get('targetPageLoaderId'));
                targetPageLoader.once("widgetChange", function(e) {
                    e.newVal.switchToPickingMode(this.resourceDescriptor, this.folderPageId);
                },{resourceDescriptor:this.currentResourceDescriptor, folderPageId :  this.get('folderPageId')});
                targetPageLoader.set("pageId", this.get('taskListPageId'));
            }, '.giveTask', this));
            //bind each action 'speak' change widget depending to the ATTRS 'dialoguePageId'
            this.handlers.push(cb.one('.actions').delegate('click', function (e) {
                var targetPageLoader = Y.Wegas.PageLoader.find(this.get('targetPageLoaderId'));
                targetPageLoader.once("widgetChange", function(e) {
                    e.newVal.setCurrentDialogue(this.resourceDescriptor.getInstance().get('properties').dialogue);
                },{resourceDescriptor:this.currentResourceDescriptor});
                // decrease number of actions by 1
                Y.Wegas.VariableDescriptorFacade.rest.sendRequest({
                    request: "/Script/Run/Player/" + Y.Wegas.app.get('currentPlayer'),
                    headers:{
                        'Content-Type': 'application/json; charset=ISO-8859-1',
                        'Managed-Mode':'true'
                    },
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
            }, '.speak', this));
        },

        /**
         * Synchronise the content of this widget.
         */
        syncUI: function() {
            var cb = this.get(CONTENTBOX),
            listResourcesDescriptor = Y.Wegas.VariableDescriptorFacade.rest.find("name", "resources");
            if(listResourcesDescriptor == null) return;
            if(!this.currentResourceDescriptor) this.selectCurrentRessource(listResourcesDescriptor);
            this.clearBeforeSync(cb);
            if(!this.currentResourceDescriptor) return;
            this.makeResourcesSelector(cb, listResourcesDescriptor);
            this.syncFolderInformations(cb);
            this.syncAction(cb)
            this.goToFinalPage();// ! hack function
        },

        /*
         * Destroy all child widget and all remanent function
         */
        destroy: function(){
            var i;
            this.tabview.destroy();
            for (i=0; i<this.handlers.length;i++) {
                this.handlers[i].detach();
            }
        },

        // *** hack Methods *** //
        /**
         * if current week > max value of week value, then
         * change the current widget to go on the "dialogue" widget.
         */
        goToFinalPage: function(){
            var currentWeek = Y.Wegas.VariableDescriptorFacade.rest.find("name", "week");
            var targetPageLoader = Y.Wegas.PageLoader.find(this.get('targetPageLoaderId'));
            if(parseInt(currentWeek.getInstance().get('value')) > currentWeek.get('maxValue')){
                targetPageLoader.once("widgetChange", function(e) {
                    e.newVal.setCurrentDialogue();
                });
                targetPageLoader.set("pageId", this.get('dialoguePageId'));    
            }
        }

    }, {
        ATTRS : {
            folderPageId: {
                value:null,
                validator: function (s){
                    return s === null || Y.Lang.isString(s);
                }
            },
            taskListPageId: {
                value:null,
                validator: function (s){
                    return s === null || Y.Lang.isString(s);
                }
            },
            dialoguePageId: {
                value:null,
                validator: function (s){
                    return s === null || Y.Lang.isString(s);
                }
            },
            targetPageLoaderId: {
                value:null,
                validator: function (s){
                    return s === null || Y.Lang.isString(s);
                }
            }
        }
    });

    Y.namespace('Wegas').Folder = Folder;
});
