/**
* @author Benjamin Gerber <ger.benjamin@gmail.com>
*/

YUI.add('wegas-leaderway-folder', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox', Folder;

    Folder = Y.Base.create("wegas-folder", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {
        
        previousMembreButton: null,
        nextMembreButton: null,
        tabview: null,
        currentMemberDescriptor: null,
        
        //*** Particular Methods ***/
        syncFolderInformations: function(){
            var currentMemberInstance = Y.Wegas.app.dataSources.VariableDescriptor.rest.getDescriptorInstance(this.currentMemberDescriptor);
            Y.one('#leaderway-folder .name').insert(this.currentMemberDescriptor.name);
            if(currentMemberInstance.properties.surname){
                Y.one('#leaderway-folder .surname').insert(currentMemberInstance.properties.surname);   
            }
            if(currentMemberInstance.properties.salary){
                Y.one('#leaderway-folder .salary-value').insert(currentMemberInstance.properties.salary);   
            }            
            /*temporary hard-coded*/
            Y.one('#leaderway-folder .name_surname').insert('<div class="picture"><img src="http://www.clker.com/cliparts/5/9/4/c/12198090531909861341man%20silhouette.svg.med.png" alt="face" width=100 height="100" /></div>', 'before');
            Y.one('#leaderway-folder .characteristics').insert('<div class="moral gauge">'+this.createGauge('Moral', parseInt(currentMemberInstance.properties.moral))+'</div>');
            Y.one('#leaderway-folder .characteristics').insert('<div class="confidence gauge">'+this.createGauge('Confiance envers son leader', parseInt(currentMemberInstance.properties.confidence))+'</div>');
            Y.one('#leaderway-folder .occupation').insert(this.getOccupation(currentMemberInstance));
            for (var key in currentMemberInstance.skillset){
                Y.one('#leaderway-folder .skillsets').insert('<div class="skillset gauge">'+this.createGauge(key, parseInt(currentMemberInstance.skillset[key]))+'</div>');
            }
            Y.one('#leaderway-folder .description-value').insert(this.currentMemberDescriptor.description);            
        },
        
        getOccupation: function(memberInstance){
            var occupation = new Array(), sick=true, listDescriptor = Y.Wegas.app.dataSources.VariableDescriptor.rest.getCachedVariableBy("name", "tasks"), taskDescriptor, taskInstance, taskSkills = new Array();
            if(memberInstance.assignments.length == 0){
                occupation.push('<div class="occupation-value">Libre</div>');
            }
            else{
                for (var i = 0; i < listDescriptor.items.length; i = i + 1) {
                        taskDescriptor = listDescriptor.items[i];
                        if(taskDescriptor.id == memberInstance.assignments[0].taskDescriptorId){
                            taskInstance = Y.Wegas.app.dataSources.VariableDescriptor.rest.getDescriptorInstance(taskDescriptor);
                            for(var key in taskInstance.skillset){
                                taskSkills.push('<span class="task-skill-value">'+key+' ('+taskInstance.skillset[key]+')</span>');
                            }
                            occupation.push('<div class="occupation-value">');
                            occupation.push('<div class="task-name"><span="task-name-label">Mandat : </span><span="task-name-value">'+taskDescriptor.name+'</span></div>');
                            occupation.push('<div class="task-skill"><span="task-skill-label">Compétence demandée : </span><span="task-skill-values">'+taskSkills.join("")+'</span></div>');
                            occupation.push('<div class="task-salary"><span="task-salary-label">Rémunération : </span><span="task-salary-value">'+taskInstance.properties.salary+'</span></div>');
                            occupation.push('<div class="task-duration"><span="task-duration-label">Durée de travail restant : </span><span="task-duration-value">'+taskDescriptor.duration+'</span></div>');
                            occupation.push('</div>');
                            sick=false;
                        }
                }
                if(sick){
                    occupation.push('<div class="occupation-value">Arrêt maladie</div>');
                }
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
                    gauge.push('The number for the gauge "'+label+'" must to be between 0 and 100.');
                }
            }
            else{
                gauge.push('Unvalid number to create gauge : '+ label);
            }
            return gauge.join("");
        },
        
    
        syncArchivesInformations: function(){
            Y.one('.archives').insert("<p>Aucune archive de discussion n'est actuellement disponible.</p>");
        },
        
        // *** Lifecycle Methods *** //
        renderUI: function (){
            this.previousMembreButton = new Y.Wegas.Button({
                label: "Membre précédent",
                cssClass:'previousMembrebutton',
                view:'button'
            });
            this.nextMembreButton = new Y.Wegas.Button({
                label: "Membre suivant",
                cssClass:'nextMembreButton',
                view:'button'
            });
            this.tabview = new Y.TabView({
                children: [{
                    label: 'Dossier',
                    content: '<div class="folder">'
                +   '<div class="basic_informations folder-section">'
                +       '<div class="name_surname"><span class="name"></span><span class="surname"></span></div>'
                +       '<div class="salary"><span class="salary-label">Salaire hebdomadaire : </span><span class="salary-value"></span></div>'
                +   '</div>'
                +   '<div class="occupation folder-section"><div class="title-folder-section">Occupation actuelle : </div></div>'
                +   '<div class="characteristics folder-section"><div class="title-folder-section">Caractéristiques : </div></div>'
                +   '<div class="skillsets folder-section"><div class="title-folder-section">Compétences : </div></div>'
                +   '<div class="description folder-section"><div class="title-folder-section">Description : </div><div class="description-value"></div></div>'
                +'</div>'
                }, {
                    label: 'Archives',
                    content: '<div class="archives"></div>'
                +'<div class="week_selector"></div>'
                +'<div class="past_dialogues"></div>'
                +'</div>'
                }]
            });
            this.get(CONTENTBOX).insert('<div class="container-previousMembrebutton"></div>');
            this.previousMembreButton.render('.container-previousMembrebutton');
            this.get(CONTENTBOX).insert('<div class="container-nextMembrebutton"></div>');
            this.nextMembreButton.render('.container-nextMembrebutton');
            this.tabview.render(this.get(CONTENTBOX));
        },
          
        syncUI: function () {
            var resourcesDescriptor = Y.Wegas.app.dataSources.VariableDescriptor.rest.getCachedVariableBy("name", "resources");
            /*temporary, must match with a given resource*/
            this.currentMemberDescriptor = resourcesDescriptor.items[0];
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