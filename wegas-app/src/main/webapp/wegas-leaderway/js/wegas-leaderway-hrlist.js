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
        /**
         * Add rows to the datatable. Get informations on the resources  
         * @param ListDescriptor listResourcesDescriptor, A list of all resources.
         */
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
                     picture = '<img src="'+resourceInstance.get('properties').picture+'" alt="picture" width="70" height="70" />';
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
        
        /**
         * Return the text of the occupation.
         * @deprecated check only if a assignement exist in the given resource.
         * @param ResourceInstance resourceInstance, the resource to get the occupation text.
         * @return String 'libre' or the name of the occupation 
         */
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
        /**
         * Render the widget.
         * Create the child widget "table"  
         */
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
          
        /**
         * Bind some function at nodes of this widget
         */
        bindUI: function() {
            this.handlers.push(Y.Wegas.VariableDescriptorFacade.after("response", this.syncUI, this));
            this.handlers.push(Y.Wegas.app.after('currentPlayerChange', this.syncUI, this));
            this.table.delegate('click', function (e) {
                alert('todo');
            }, '.yui3-datatable-data .folder', this.table);
        },
        
        /**
         * Synchronise the content of this widget.
         */
        syncUI: function (){
            var listResourcesDescriptor = Y.Wegas.VariableDescriptorFacade.rest.find("name", "resources");
            if(listResourcesDescriptor == null) return;
            this.data.length = 0;
            this.getResourcesData(listResourcesDescriptor);
            this.table.addRows(this.data);
            if(this.data[0] == null){
                this.table.showMessage("Personne n'est disponible.");
            }
            this.goToFinalPage();// ! hack function            
        },
        
        /*
         * Destroy all child widget and all remanent function
         */
        destructor: function(){
            var i;
            this.table.destroy();
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
            var currentWeek = Y.Wegas.VariableDescriptorFacade.rest.find("name", "week"),
            targetPageLoader = Y.Wegas.PageLoader.find(this.get('targetPageLoaderId'));
            if(parseInt(currentWeek.getInstance().get('value')) > currentWeek.get('maxValue')){
                targetPageLoader.once("widgetChange", function(e) {
                    e.newVal.setCurrentDialogue("dialogueFinal");
                });
                targetPageLoader.set("pageId", this.get('dialoguePageId'));    
            }
        }
    },
    {
        ATTRS : {
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

    Y.namespace('Wegas').HRList = HRList;
});