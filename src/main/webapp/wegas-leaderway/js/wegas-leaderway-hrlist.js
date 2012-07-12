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

        //*** Particular Methods ***/        
        getResourcesData: function(listResourcesDescriptor){
            var i, picture, resourceDescriptor, resourceInstance, needPicture = false;
            if(listResourcesDescriptor.items[0].getInstance().properties.picture != null){
                needPicture = true;
                this.table.addColumn({ key: 'picture', label: 'Portrait', allowHTML: true }, 0);
            }
            for (i = 0; i < listResourcesDescriptor.items.length; i++) {
                resourceDescriptor = listResourcesDescriptor.items[i];
                resourceInstance = resourceDescriptor.getInstance();
                if(needPicture){
                     picture = '<img src="'+resourceInstance.properties.picture+'" alt="picture" width="60" height="70" />';
                     this.data.push({
                        picture:picture,
                        name:resourceDescriptor.name,
                        surname:resourceInstance.properties.surname,
                        occupation:this.getOccupation(resourceInstance),
                        folder:i,
                        speak:i
                    })                   
                }
                else{
                    this.data.push({
                        name:resourceDescriptor.name,
                        surname:resourceInstance.properties.surname,
                        occupation:this.getOccupation(resourceInstance),
                        folder:i,
                        speak:i
                    })
                }
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
                ]
            });
            this.table.render(this.get(CONTENTBOX));
        },
            
        bindUI: function() {
            Y.Wegas.app.dataSources.VariableDescriptor.after("response", this.syncUI, this);
            Y.Wegas.app.after('currentPlayerChange', this.syncUI, this);
            this.table.delegate('click', function (e) {
                var tr_id = e.currentTarget._node.parentElement.parentElement.id,  
                model = this.getRow(tr_id);
                alert(model._node.childNodes[1].textContent);
            }, '.yui3-datatable-data .speak', this.table);
            
            this.table.delegate('click', function (e) {
                //afficher le widget "folder et passer l'id du membre."
            }, '.yui3-datatable-data .folder', this.table);
        },
        
        syncUI: function (){
            var listResourcesDescriptor = Y.Wegas.app.dataSources.VariableDescriptor.rest.getCachedVariableBy("name", "resources");
            if(listResourcesDescriptor == null) return;
            this.data.length = 0;
            this.getResourcesData(listResourcesDescriptor);
            this.table.addRows(this.data);
            if(this.data[0] == null){
                this.table.showMessage("Personne n'est disponible.");
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