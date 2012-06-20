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
            Y.one('#leaderway-folder .occupation-value').insert('Libre');
            
            /*temporary hard-coded*/
                Y.one('#leaderway-folder .name_surname').insert('<div class="picture"><img src="http://www.clker.com/cliparts/5/9/4/c/12198090531909861341man%20silhouette.svg.med.png" alt="face" width=100 height="100" /></div>', 'before');
                
            for (var key in currentMemberInstance.skillset){
                if (typeof currentMemberInstance.skillset[key] === 'number') {
                    if(currentMemberInstance.skillset[key]>=0 && currentMemberInstance.skillset[key]<=100);
                        Y.one('#leaderway-folder .skillsets').insert('<div class="skillset"><span class="skillset-label">'
                            +key+' <span class="skillset-value">('+currentMemberInstance.skillset[key]+'/100)</span><span class="skillset-units">'
                            +this.createGaugeUnits(currentMemberInstance.skillset[key])+'</span></div>');
                }
            }
            if(this.currentMemberDescriptor.description){
                Y.one('#leaderway-folder .description-value').insert(this.currentMemberDescriptor.description);   
            }            
        },
    
        syncArchivesInformations: function(){
            Y.one('.archives').insert("<p>Aucune archive de discussion n'est actuellement disponible.</p>");
        },
        
        createGaugeUnits: function(nomberOfUnits){
            var temp = new Array("");
            for(var i=0; i<nomberOfUnits; i++){
                temp.push('<div class="skillset-unit"></div>');
            }
            return temp.join("");
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
                +       '<div class="occupation"><span class="occupation-label">Occupation : </span><span class="occupation-value"></span></div>'
                +   '</div>'
                +   '<div class="characteristics folder-section"></div>'
                +   '<div class="skillsets folder-section"></div>'
                +   '<div class="description folder-section"><span class="description-label">Description : </span><span class="description-value"></span></div>'
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