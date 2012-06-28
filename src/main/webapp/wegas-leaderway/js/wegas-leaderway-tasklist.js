/**
* @author Benjamin Gerber <ger.benjamin@gmail.com>
*/

YUI.add('wegas-leaderway-tasklist', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox', TaskList;

    TaskList = Y.Base.create("wegas-tasklist", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {
        
        // *** Fields *** /
        table: null,
        data: new Array(),

        //*** Particular Methods ***/
        getTasksData: function(){
            var listDescriptor = Y.Wegas.app.dataSources.VariableDescriptor.rest.getCachedVariableBy("name", "tasks"),taskDescriptor, taskInstance, comment; 
            for (var i = 0; i < listDescriptor.items.length; i++) {
                    taskDescriptor = listDescriptor.items[i];
                    taskInstance = taskDescriptor.getInstance();
                    (taskInstance.properties.comment)? comment = taskInstance.properties.comment : comment = "-";
                    this.data.push({
                        task:taskDescriptor.name,
                        skill:this.getSkillsets(taskInstance),
                        duration:taskDescriptor.duration,
                        term:taskInstance.properties.term,
                        salary:taskInstance.properties.salary,
                        comment:comment
                    })
            }
        },
        
        getSkillsets: function(taskInstance){
            var temp = new Array();
            for (var key in taskInstance.skillset){
                temp.push(key+' ('+taskInstance.skillset[key]+')\n');
            }
            return temp.join("");
        },

        // *** Lifecycle Methods *** //
        renderUI: function (){
            this.table = new Y.DataTable({
                columns: [
                {
                    key:"task", 
                    label:"Mandat",
                    sortable:true
                },
                {
                    key:"skill", 
                    label:"Compétence",
                    sortable:true
                },
                {
                    key:"duration", 
                    label:"Durée",
                    sortable:true
                },
                {
                    key:"term", 
                    label:"Echéance",
                    sortable:true
                },
                {
                    key:"salary", 
                    label:"Remunération",
                    sortable:true
                },
                {
                    key:"comment", 
                    label:"Remarque",
                    sortable: true
                }          
                ]
            });
            this.table.render(this.get(CONTENTBOX));
        },
            
        bindUI: function() {
        },
        
        syncUI: function () {
            this.data.length = 0;
            this.getTasksData();
            this.table.addRows(this.data);
            if(this.data[0] == null){
                this.table.showMessage("Aucun mandat n'est disponible.");
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

    Y.namespace('Wegas').TaskList = TaskList;
});