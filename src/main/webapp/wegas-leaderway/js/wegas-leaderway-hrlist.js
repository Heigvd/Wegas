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
        handlers: new Array(),

        //*** Particular Methods ***/  
        getResourcesData: function(listResourcesDescriptor){
            var i, picture, resourceDescriptor, resourceInstance, needPicture = false;
            if(listResourcesDescriptor.get('items')[0].getInstance().get('properties').picture != null){
                needPicture = true;
                this.table.addColumn({ key: 'picture', label: 'Portrait', allowHTML: true }, 0);
            }
            for (i = 0; i < listResourcesDescriptor.get('items').length; i++) {
                resourceDescriptor = listResourcesDescriptor.get('items')[i];
                resourceInstance = resourceDescriptor.getInstance();
                if(needPicture){
                     picture = '<img src="'+resourceInstance.get('properties').picture+'" alt="picture" width="60" height="70" />';
                     this.data.push({
                        picture:picture,
                        name:resourceDescriptor.get('name'),
                        surname:resourceInstance.get('properties').surname,
                        occupation:this.getOccupation(resourceInstance),
                        folder:i,
                        speak:i
                    })                   
                }
                else{
                    this.data.push({
                        name:resourceDescriptor.get('name'),
                        surname:resourceInstance.get('properties').surname,
                        occupation:this.getOccupation(resourceInstance),
                        folder:i,
                        speak:i
                    })
                }
            }
        },
        
        getOccupation: function(resourceInstance){
            var occupation, listDescriptor = Y.Wegas.VariableDescriptorFacade.rest.find("name", "tasks"), taskDescriptor;
            if(resourceInstance.get('assignments').length == 0){
                occupation = 'Libre';
            }
            else{
                for (var i = 0; i < listDescriptor.get('items').length; i = i + 1) {
                        taskDescriptor = listDescriptor.get('items')[i];
                        if(taskDescriptor.get('id') == resourceInstance.get('assignments')[0].get('taskDescriptorId')){
                            occupation = taskDescriptor.get('name');
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
                ]
            });
            this.table.render(this.get(CONTENTBOX));
        },
            
        bindUI: function() {
            this.handlers.push(Y.Wegas.VariableDescriptorFacade.after("response", this.syncUI, this));
            this.handlers.push(Y.Wegas.app.after('currentPlayerChange', this.syncUI, this));
            this.table.delegate('click', function (e) {
                alert('todo');
            }, '.yui3-datatable-data .folder', this.table);
        },
        
        syncUI: function (){
            var listResourcesDescriptor = Y.Wegas.VariableDescriptorFacade.rest.find("name", "resources");
            if(listResourcesDescriptor == null) return;
            this.data.length = 0;
            this.getResourcesData(listResourcesDescriptor);
            this.table.addRows(this.data);
            if(this.data[0] == null){
                this.table.showMessage("Personne n'est disponible.");
            }
        },
        
        destroy: function(){
            var i;
            this.table.destroy();
            for (i=0; i<this.handlers.length;i++) {
                this.handlers[i].detach();
            }
        }
    },
    {
        ATTRS : {}
    });

    Y.namespace('Wegas').HRList = HRList;
});