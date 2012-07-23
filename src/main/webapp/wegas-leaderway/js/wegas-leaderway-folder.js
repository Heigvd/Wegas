/**
* @author Benjamin Gerber <ger.benjamin@gmail.com>
*/

YUI.add('wegas-leaderway-folder', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox', Folder;

    Folder = Y.Base.create("wegas-folder", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {

        tabview: null,
        currentResourceDescriptor: null,
        currentResourceId:0,

        //*** Particular Methods ***/
        clearBeforeSync: function(){
            //is .empty() function more correct?
            Y.one('.leaderway-folder .listResources').setHTML();
            Y.one('.leaderway-folder .folder .name').setHTML();
            Y.one('.leaderway-folder .folder .surname').setHTML();
            Y.one('.leaderway-folder .folder .salary-value').setHTML();
            Y.one('.leaderway-folder .folder .picture').setHTML();
            Y.one('.leaderway-folder .folder .leadershipLevel').setHTML();
            Y.one('.leaderway-folder .folder .moral').setHTML();
            Y.one('.leaderway-folder .folder .confidence').setHTML();
            Y.one('.leaderway-folder .folder .occupation-value').setHTML();
            Y.one('.leaderway-folder .folder .skillsets-value').setHTML();
            Y.one('.leaderway-folder .folder .description-value').setHTML();
        },

        makeListResources: function(listResourcesDescriptor){
            var i, resourceSelector = new Array(), resourceInstance, resourceExist=false, resourceDescriptor;
            for(i=0; i<listResourcesDescriptor.items.length; i++){
                resourceSelector.length = 0;
                resourceDescriptor = listResourcesDescriptor.items[i];
                resourceInstance = resourceDescriptor.getInstance();
                resourceSelector.push('<div class="resourceSelector">');
                resourceSelector.push('<div class="ID" style="display:none;"><p>');
                resourceSelector.push(resourceDescriptor.id);
                resourceSelector.push('</p></div>');
                if(resourceInstance.properties.picture != null){
                    resourceSelector.push('<div class="picture">');
                    resourceSelector.push('<img src="'+resourceInstance.properties.picture+'" alt="picture" width="30" height="35" />');
                    resourceSelector.push('</div>');
                }
                resourceSelector.push('<div class="name"><p>');
                resourceSelector.push(resourceDescriptor.name);
                resourceSelector.push('</p></div>');
                resourceSelector.push('</div>');
                Y.one('.leaderway-folder .listResources').insert(resourceSelector.join(""));
            }
            Y.all('.leaderway-folder .listResources .resourceSelector').on('click', function (e) {
                resourceExist = false;
                var target = parseInt(e._currentTarget.all[0].innerText);
                for(i=0; i<listResourcesDescriptor.items.length; i++){
                    resourceDescriptor = listResourcesDescriptor.items[i];
                    if(resourceDescriptor.id == target) resourceExist = true;
                }
                if(!resourceExist) target = listResourcesDescriptor.items[0].id;
                this.currentResourceId = target;
                this.syncUI();
            },this);
        },

        setCurrentResourceDescriptor: function(listResourcesDescriptor){
            var i, resourceDescriptor;
            this.currentResourceDescriptor = listResourcesDescriptor.items[0];
            for(i=0; i<listResourcesDescriptor.items.length;i++){
                resourceDescriptor = listResourcesDescriptor.items[i];
                if(resourceDescriptor.id == this.currentResourceId){
                   this.currentResourceDescriptor = resourceDescriptor;
                   break;
                }
            }
        },

        syncFolderInformations: function(){
            var currentResourceInstance = this.currentResourceDescriptor.getInstance();
            Y.one('.leaderway-folder .folder .name').insert(this.currentResourceDescriptor.name);
            if(currentResourceInstance.properties.surname){
                Y.one('.leaderway-folder .folder .surname').insert(currentResourceInstance.properties.surname);
            }
            if(currentResourceInstance.properties.salary){
                Y.one('.leaderway-folder .folder .salary-value').insert(currentResourceInstance.properties.salary);
            }
            if(currentResourceInstance.properties.picture != null){
                Y.one('.leaderway-folder .folder .picture').insert('<img src="'+currentResourceInstance.properties.picture+'" alt="picture" width=120 height="140" />');
            }
            this.addLevelOfLeadershipInformations(currentResourceInstance);
            Y.one('.leaderway-folder .folder .moral').insert(this.createGauge('Moral', parseInt(currentResourceInstance.moral)));
            Y.one('.leaderway-folder .folder .confidence').insert(this.createGauge('Confiance envers son leader', parseInt(currentResourceInstance.confidence)));
            Y.one('.leaderway-folder .folder .occupation-value').insert(this.getOccupation(currentResourceInstance));
            for (var key in currentResourceInstance.skillset){
                Y.one('.leaderway-folder .folder .skillsets-value').insert('<div class="skillset gauge">'+this.createGauge(key, parseInt(currentResourceInstance.skillset[key]))+'</div>');
            }
            Y.one('.leaderway-folder .folder .description-value').insert(this.currentResourceDescriptor.description);
        },

        addLevelOfLeadershipInformations: function(resourceInstance){
            var i, leadershipInfo = new Array(), leadershipLevel;
            if(resourceInstance.properties.leadershipLevel){
                leadershipLevel = parseInt(resourceInstance.properties.leadershipLevel);
                if(leadershipLevel >= 1 && leadershipLevel <=5){
                    leadershipInfo.push('<ul class="leadershipLevel-ul">');
                    leadershipInfo.push('<li class="leadershipLevel-label">Votre niveau de leadership avec ce membre est : </li>');
                    leadershipInfo.push('<li class="leadershipLevel-info">Niveau 5 : '+resourceInstance.properties.surname+" voit en vous un modèle à atteindre.</li>");
                    leadershipInfo.push('<li class="leadershipLevel-info">Niveau 4 : '+resourceInstance.properties.surname+" se rend compte de toute l'énergie que vous avez dépensé pour lui et veux donner l'envie aux autres de se battre pour l'entreprise. </li>");
                    leadershipInfo.push('<li class="leadershipLevel-info">Niveau 3 : '+resourceInstance.properties.surname+" sais ce que vous avez fait pour l'entreprise et travaillera à son tour pour la survie de l'entreprise. </li>");
                    leadershipInfo.push('<li class="leadershipLevel-info">Niveau 2 : '+resourceInstance.properties.surname+" suis vos directives car il vous considère et pense que vos choix sont justifiés.</li>");
                    leadershipInfo.push('<li class="leadershipLevel-info">Niveau 1 : '+resourceInstance.properties.surname+" suis vos directives uniquement parce qu'il en a le devoir.</li>");
                    leadershipInfo.push('</ul>');
                    Y.one('.leaderway-folder .leadershipLevel').insert(leadershipInfo.join(""));

                    Y.all('.leaderway-folder .leadershipLevel-info').item(5-leadershipLevel).addClass('currentLevel');
                    for(i=0 ; i<=leadershipLevel-1 ; i++){
                        Y.all('.leaderway-folder .leadershipLevel-info').item(4-i).addClass('levelActive');
                    }
                }
                else{
                    Y.one('.leaderway-folder .leadershipLevel').insert('<div class="error">Leadership level must to be between 1 to 5)</div>')
                    }
            }
        },

        getOccupation: function(resourceInstance){
            var i, j, occupation = new Array(), sick=false, taskListDescriptor = Y.Wegas.app.dataSources.VariableDescriptor.rest.getCachedVariableBy("name", "tasks"),
            listAbsenceDescriptor = Y.Wegas.app.dataSources.VariableDescriptor.rest.getCachedVariableBy("name", "absences"), taskDescriptor, taskInstance, taskSkills = new Array();
            for (i = 0; i < listAbsenceDescriptor.items.length; i++) {
                taskDescriptor = listAbsenceDescriptor.items[i];
                taskInstance = taskDescriptor.getInstance();
                if(taskInstance.active){
                    for(j = 0; j < resourceInstance.assignments.length; j++){
                        if(taskDescriptor.id == resourceInstance.assignments[j].taskDescriptorId){
                            sick=true;
                            occupation.push('Arrêt maladie (revient dans ');
                            occupation.push(taskInstance.duration);
                            (taskInstance.duration > 1)?occupation.push(' semaines).') : occupation.push(' semaine).');
                            break;
                        }
                    }
                }
            }
            if(!sick){
                for (i = 0; i < taskListDescriptor.items.length; i++) {
                    for(j = 0; j < resourceInstance.assignments.length; j++){
                        taskDescriptor = taskListDescriptor.items[i];
                        if(taskDescriptor.id == resourceInstance.assignments[j].taskDescriptorId){
                            taskInstance = taskDescriptor.getInstance();
                            for(var key in taskInstance.skillset){
                                taskSkills.push('<li class="task-skill-value">'+key+' ('+taskInstance.skillset[key]+')</li>');
                            }
                            occupation.push('<div class="task">');
                            occupation.push('<div class="task-name"><span class= class"task-name-label">Mandat : </span><span= class"task-name-value">'+taskDescriptor.name+'</span></div>');
                            occupation.push('<ul class="task-skill"><span class="task-skill-label">Compétence demandée : </span>'+taskSkills.join("")+'</ul></div>');
                            occupation.push('<div class="task-salary"><span class="task-salary-label">Rémunération : </span><span class="task-salary-value">'+taskInstance.properties.salary+'</span></div>');
                            occupation.push('<div class="task-duration"><span class="task-duration-label">Durée de travail restant : </span><span class="task-duration-value">'+taskInstance.duration+'</span></div>');
                            occupation.push("</div>");
                            sick=false;
                            taskSkills.length = 0;
                        }
                    }
                }
            }
            if(occupation.length <= 0){
                occupation.push('Libre pour un mandat, travail habituel.');
            }
            return occupation.join("");
        },

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


        syncArchivesInformations: function(){
            Y.one('.archives').insert("<p>Aucune archive de discussion n'est actuellement disponible.</p>");
        },

        // *** Lifecycle Methods *** //
        renderUI: function (){
            return;
            this.tabview = new Y.TabView({
                children: [{
                    label: 'Dossier',
                    content: '<div class="folder">'
                +   '<div class="basic_informations section">'
                +       '<div class="picture"></div>'
                +       '<div class="name_surname"><span class="name"></span><span class="surname"></span></div>'
                +       '<div class="salary"><span class="salary-label">Salaire hebdomadaire : </span><span class="salary-value"></span></div>'
                +   '</div>'
                +   '<div class="occupation section"><div class="title-section">Occupation actuelle : </div><div class="occupation-value"></div></div>'
                +   '<div class="characteristics section"><div class="title-section">Caractéristiques : </div>'
                +   '<div class="leadershipLevel"></div>'
                +   '<div class="moral gauge"></div>'
                +   '<div class="confidence gauge"></div>'
                +   '</div>'
                +   '<div class="skillsets section"><div class="title-section">Compétences : </div><div class="skillsets-value"></div></div>'
                +   '<div class="description section"><div class="title-section">Description : </div><div class="description-value"></div></div>'
                +'</div>'
                }, {
                    label: 'Archives',
                    content: '<div class="archives"></div>'
                +'<div class="weekSelector"></div>'
                +'<div class="pastDialogues"></div>'
                +'</div>'
                }]
            });
            this.get(CONTENTBOX).insert('<div class="menuFolder"><div class="listResources"></div><div class="speakButton"><p>Discuter</p></div></div>');
            this.tabview.render(this.get(CONTENTBOX));
        },

        bindUI: function(){
            return;
            Y.Wegas.app.dataSources.VariableDescriptor.after("response", this.syncUI, this);
            Y.Wegas.app.after('currentPlayerChange', this.syncUI, this);
        },

        syncUI: function () {
            return;
            var listResourcesDescriptor = Y.Wegas.app.dataSources.VariableDescriptor.rest.getCachedVariableBy("name", "resources");
            if(listResourcesDescriptor == null) return;
            this.clearBeforeSync();
            this.makeListResources(listResourcesDescriptor);
            this.setCurrentResourceDescriptor(listResourcesDescriptor);
            this.syncFolderInformations();
            this.syncArchivesInformations();
        }
    }, {
        ATTRS : {
            content: { }
        }
    });

    Y.namespace('Wegas').Folder = Folder;
});