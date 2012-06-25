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
        currentMemberId:0,
        
        //*** Particular Methods ***/
        clearBeforeSync: function(){
            Y.one('#leaderway-folder .name').setHTML();
            Y.one('#leaderway-folder .surname').setHTML();
            Y.one('#leaderway-folder .salary-value').setHTML();
            Y.one('#leaderway-folder .picture').setHTML();
            Y.one('#leaderway-folder .moral').setHTML();
            Y.one('#leaderway-folder .confidence').setHTML();
            Y.one('#leaderway-folder .leadershipLevel').setHTML();
            Y.one('#leaderway-folder .occupation-value').setHTML();
            Y.one('#leaderway-folder .skillsets').setHTML();
            Y.one('#leaderway-folder .description-value').setHTML();
        },
        
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
            Y.one('#leaderway-folder .picture').insert('<img src="http://www.clker.com/cliparts/5/9/4/c/12198090531909861341man%20silhouette.svg.med.png" alt="face" width=100 height="100" />');
            Y.one('#leaderway-folder .moral').insert(this.createGauge('Moral', parseInt(currentMemberInstance.properties.moral)));
            Y.one('#leaderway-folder .confidence').insert(this.createGauge('Confiance envers son leader', parseInt(currentMemberInstance.properties.confidence)));
            this.addLevelOfLeadershipInformations(currentMemberInstance);
            Y.one('#leaderway-folder .occupation-value').insert(this.getOccupation(currentMemberInstance));
            for (var key in currentMemberInstance.skillset){
                Y.one('#leaderway-folder .skillsets').insert('<div class="skillset gauge">'+this.createGauge(key, parseInt(currentMemberInstance.skillset[key]))+'</div>');
            }
            Y.one('#leaderway-folder .description-value').insert(this.currentMemberDescriptor.description);            
        },
        
        addLevelOfLeadershipInformations: function(memberInstance){
            var i, leadershipInfo = new Array(), leadershipLevel;
            if(memberInstance.properties.leadershipLevel){
                leadershipLevel = parseInt(memberInstance.properties.leadershipLevel);
                if(leadershipLevel >= 1 && leadershipLevel <=5){
                    leadershipInfo.push('<ul class="leadershipLevel-ul">');
                    leadershipInfo.push('<li class="leadershipLevel-label">Votre niveau de leadership avec ce membre est : </li>');
                    leadershipInfo.push('<li class="leadershipLevel-info">Niveau 5 : '+memberInstance.properties.surname+" voit en vous un modèle à atteindre.</li>");
                    leadershipInfo.push('<li class="leadershipLevel-info">Niveau 4 : '+memberInstance.properties.surname+" se rend compte de toute l'énergie que vous avez dépensé pour lui et veux donner l'envie aux autres de se battre pour l'entreprise. </li>");
                    leadershipInfo.push('<li class="leadershipLevel-info">Niveau 3 : '+memberInstance.properties.surname+" sais ce que vous avez fait pour l'entreprise et travaillera à son tour pour la survie de l'entreprise. </li>");
                    leadershipInfo.push('<li class="leadershipLevel-info">Niveau 2 : '+memberInstance.properties.surname+" suis vos directives car il vous considère et pense que vos choix sont justifiés.</li>");
                    leadershipInfo.push('<li class="leadershipLevel-info">Niveau 1 : '+memberInstance.properties.surname+" suis vos directives uniquement parce qu'il en a le devoir.</li>");
                    leadershipInfo.push('</ul>');
                    Y.one('#leaderway-folder .leadershipLevel').insert(leadershipInfo.join(""));
                    
                    Y.all('#leaderway-folder .leadershipLevel-info').item(5-leadershipLevel).addClass('currentLevel');
                    for(i=0 ; i<=leadershipLevel-1 ; i++){
                        Y.all('#leaderway-folder .leadershipLevel-info').item(4-i).addClass('levelActive');
                    }
                }
                else{Y.one('#leaderway-folder .leadershipLevel').insert('<div class="error">Leadership level must to be between 1 to 5)</div>')}
            }
        },
        
        getOccupation: function(memberInstance){
            var i, occupation = new Array(), sick=true, listDescriptor = Y.Wegas.app.dataSources.VariableDescriptor.rest.getCachedVariableBy("name", "tasks"), taskDescriptor, taskInstance, taskSkills = new Array();
            if(memberInstance.assignments.length == 0){
                occupation.push('Libre pour un mandat, travail habituel.');
            }
            else{
                for (i = 0; i < listDescriptor.items.length; i = i + 1) {
                        taskDescriptor = listDescriptor.items[i];
                        if(taskDescriptor.id == memberInstance.assignments[0].taskDescriptorId){
                            taskInstance = Y.Wegas.app.dataSources.VariableDescriptor.rest.getDescriptorInstance(taskDescriptor);
                            for(var key in taskInstance.skillset){
                                taskSkills.push('<span class="task-skill-value">'+key+' ('+taskInstance.skillset[key]+')</span>');
                            }
                            occupation.push('<div class="task-name"><span="task-name-label">Mandat : </span><span="task-name-value">'+taskDescriptor.name+'</span></div>');
                            occupation.push('<div class="task-skill"><span="task-skill-label">Compétence demandée : </span><span="task-skill-values">'+taskSkills.join("")+'</span></div>');
                            occupation.push('<div class="task-salary"><span="task-salary-label">Rémunération : </span><span="task-salary-value">'+taskInstance.properties.salary+'</span></div>');
                            occupation.push('<div class="task-duration"><span="task-duration-label">Durée de travail restant : </span><span="task-duration-value">'+taskDescriptor.duration+'</span></div>');
                            sick=false;
                        }
                }
                if(sick){
                    occupation.push('Arrêt maladie');
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
                +       '<div class="picture"></div>'
                +       '<div class="name_surname"><span class="name"></span><span class="surname"></span></div>'
                +       '<div class="salary"><span class="salary-label">Salaire hebdomadaire : </span><span class="salary-value"></span></div>'
                +   '</div>'
                +   '<div class="occupation folder-section"><div class="title-folder-section">Occupation actuelle : </div><div class="occupation-value"></div></div>'
                +   '<div class="characteristics folder-section"><div class="title-folder-section">Caractéristiques : </div>'
                +   '<div class="moral gauge"></div>'
                +   '<div class="confidence gauge"></div>'
                +   '<div class="leadershipLevel"></div>'
                +   '</div>'
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
        
        bindUI: function(){
            var resourcesDescriptor = Y.Wegas.app.dataSources.VariableDescriptor.rest.getCachedVariableBy("name", "resources");
            this.nextMembreButton.on('click', function () {
                (resourcesDescriptor.items.length-1 <= this.currentMemberId)?this.currentMemberId = 0:this.currentMemberId++;
                this.syncUI();
            },this);
            this.previousMembreButton.on('click', function () {
                (this.currentMemberId >=1 )?this.currentMemberId--:this.currentMemberId = resourcesDescriptor.items.length-1;
                this.syncUI();
            },this);
        },
          
        syncUI: function () {
            this.clearBeforeSync();
            var resourcesDescriptor = Y.Wegas.app.dataSources.VariableDescriptor.rest.getCachedVariableBy("name", "resources");
            this.currentMemberDescriptor = resourcesDescriptor.items[this.currentMemberId];
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