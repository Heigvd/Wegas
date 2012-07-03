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
            var i, j, k, termData, workers = new Array(), taskDescriptor, taskInstance, resourceDescriptor, resourceInstance, comment,
            listTasksDescriptor = Y.Wegas.app.dataSources.VariableDescriptor.rest.getCachedVariableBy("name", "tasks"),
            listResourcesDescriptor = Y.Wegas.app.dataSources.VariableDescriptor.rest.getCachedVariableBy("name", "resources"),
            currentWeekInstance = Y.Wegas.app.dataSources.VariableDescriptor.rest.getCachedVariableBy("name", "week").getInstance(),  
            currentSatisfactionInstance = Y.Wegas.app.dataSources.VariableDescriptor.rest.getCachedVariableBy("name", "clientsSatisfaction").getInstance();
            if(!listTasksDescriptor) return;
            for (i = 0; i < listTasksDescriptor.items.length; i++) {
                workers.length = 0;
                taskDescriptor = listTasksDescriptor.items[i];
                taskInstance = taskDescriptor.getInstance();
                for(j=0; j<listResourcesDescriptor.items.length; j++){
                    resourceDescriptor = listResourcesDescriptor.items[j];
                    resourceInstance = resourceDescriptor.getInstance();
                    for(k=0; k<resourceInstance.assignments.length; k++){
                        if(taskDescriptor.id == resourceInstance.assignments[k].taskDescriptorId){
                            workers.push(resourceDescriptor.name);
                            break;
                        }
                    }
                }
                if(taskInstance.active){
                    (workers.length <= 0)? termData = (taskInstance.properties.disappearAtWeek - currentWeekInstance.value) : termData = "-";
                    (taskInstance.properties.comment)? comment = taskInstance.properties.comment : comment = "-";
                    if(workers.length <= 0) workers.push("-");
                        this.data.push({
                            task:taskDescriptor.name,
                            skill:this.getSkillsets(taskInstance),
                            duration:taskInstance.duration,
                            term:termData,
                            salary:taskInstance.properties.salary,
                            comment:comment,
                            worker: workers.join(",")
                        })
                }
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
                },
                {
                    key:"worker", 
                    label:"Employé",
                    sortable: true
                }    
                ]
            });
            this.table.render(this.get(CONTENTBOX));
        },
            
        bindUI: function() {
            Y.Wegas.app.dataSources.VariableDescriptor.after("response", this.syncUI, this);
            Y.Wegas.app.after('currentPlayerChange', this.syncUI, this);
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