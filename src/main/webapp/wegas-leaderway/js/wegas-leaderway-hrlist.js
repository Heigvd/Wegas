/**
* @author Benjamin Gerber <ger.benjamin@gmail.com>
*/

YUI.add('wegas-leaderway', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox', HRList;

    HRList = Y.Base.create("wegas-hrlist", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {
        
        // *** Fields *** /
        table: null,
        data: new Array(),
        //        data: [
        //        {
        //            nom: "Justin", 
        //            prenom: "Béatrice",   
        //            occupation: "Libre", 
        //            dossier:'1', 
        //            parler:'1'
        //        },
        //
        //        {
        //            nom: "Pierre", 
        //            prenom: "Zimmerman",   
        //            occupation: "Occupé", 
        //            dossier:'2', 
        //            parler:'2'
        //        },
        //
        //        {
        //            nom: "Boniface", 
        //            prenom: "Laurentin", 
        //            occupation: "Occupé", 
        //            dossier:'3', 
        //            parler:'3'
        //        },
        //
        //        {
        //            nom: "Valerie", 
        //            prenom: "Philbert",   
        //            occupation: "Libre", 
        //            dossier:'4', 
        //            parler:'4'
        //        },
        //
        //        {
        //            nom: "Hercule", 
        //            prenom: "Auguste",   
        //            occupation: "Occupé", 
        //            dossier:'5', 
        //            parler:'5'
        //        }
        //        ],

        //*** Particular Methods ***/
        getMembersData: function(){
            var resourcesDescriptor = Y.Wegas.app.dataSources.VariableDescriptor.rest.getCachedVariableBy("name", "resources"),
            resourceDescriptor,resourceInstance;
            for (var i = 0; i < resourcesDescriptor.items.length; i = i + 1) {
                resourceDescriptor = resourcesDescriptor.items[i];
                resourceInstance = Y.Wegas.app.dataSources.VariableDescriptor.rest.getDescriptorInstance(resourceDescriptor);
                this.data.push({
                    name:resourceDescriptor.name,
                    surname:resourceInstance.properties.surname,
                    occupation:this.getOccupation(resourceInstance),
                    folder:i,
                    speak:i
                })
            }
        },
        
        getOccupation: function(resourceInstance){
            var occupation, listDescriptor = Y.Wegas.app.dataSources.VariableDescriptor.rest.getCachedVariableBy("name", "tasks"), taskDescriptor;
            if(resourceInstance.assignments.length == 0){
                occupation = 'Libre';
            }
            else{
                for (var i = 0; i < listDescriptor.items.length; i = i + 1) {
                        taskDescriptor = listDescriptor.items[i];
                        if(taskDescriptor.id == resourceInstance.assignments[0].taskDescriptorId){
                            occupation = taskDescriptor.name;
                            break;
                        }
                }
            }
            return occupation;
        },

        // *** Lifecycle Methods *** //
        renderUI: function (){
            this.table = new Y.DataTable({
                columns: [
                {
                    key:"name", 
                    label:"Nom",
                    sortable:true
                },

                {
                    key:"surname", 
                    label:"Prenom",
                    sortable:true
                },

                {
                    key:"occupation", 
                    label:"Occupation",
                    sortable:true
                },

                {
                    key: "folder",
                    formatter: '<input class="folder" type="button" name="folder" value="dossier">',
                    label: ' ',
                    allowHTML: true
                },
                
                {
                    key: "speak",
                    formatter: '<input class="speak" type="button" name="speak" value="Parler">',
                    label: ' ',
                    allowHTML: true
                }
                
                ]
            });
            this.table.render(this.get(CONTENTBOX));
        },
            
        bindUI: function() {
            this.table.delegate('click', function (e) {
                var tr_id = e.currentTarget._node.parentElement.parentElement.id,  
                model = this.getRow(tr_id);
                alert(model._node.childNodes[0].textContent);
            }, '.yui3-datatable-data .speak', this.table);
            
            this.table.delegate('click', function (e) {
                //afficher le widget "folder et passer l'id du membre."
            }, '.yui3-datatable-data .folder', this.table);
        },
        
        syncUI: function () {
            this.getMembersData();
            this.table.addRows(this.data);
            if(this.data[0] == null){
                this.table.showMessage("Personne n'est disponible.");
            }
            else{
                this.table.hideMessage();
            }
        }
        
    },
    {
        ATTRS : {
            content: { }
        }
    });

    Y.namespace('Wegas').HRList = HRList;
});