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
        selectedTaskDescriptor:null,
        handlers: new Array(),

        initializer: function() {
            this.publish("rowSelected", {
//               bubbling
//               defautCb
            });
        },
        //*** Particular Methods ***/
        getTasksData: function(listTasksDescriptor){
            var i, j, k, termData, workers = new Array(), taskDescriptor, taskInstance, resourceDescriptor, resourceInstance, comment,
            listResourcesDescriptor = Y.Wegas.app.dataSources.VariableDescriptor.rest.getCachedVariableBy("name", "resources"),
            currentWeekInstance = Y.Wegas.app.dataSources.VariableDescriptor.rest.getCachedVariableBy("name", "week").getInstance();
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
                    termData = (workers.length <= 0)?(taskInstance.properties.disappearAtWeek - currentWeekInstance.value) : "-";
                    comment = new Array();
                    if(taskInstance.properties.comment) comment.push(taskInstance.properties.comment);
                    if(taskInstance.properties.workWithLeader == 'true') comment.push("S'effectue en coopération avec le leader.");
                    if(comment.length <= 0) comment.push("-");
                    if(workers.length <= 0) workers.push("-");
                        this.data.push({
                            id:taskDescriptor.id,
                            task:taskDescriptor.name,
                            skill:this.getSkillsets(taskInstance),
                            duration:taskInstance.duration,
                            term:termData,
                            salary:taskInstance.properties.salary,
                            comment:comment.join(" "),
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
        
        getSelectedTaskDescriptor: function(){
            return this.selectedTaskDescriptor;
        },

        // *** Lifecycle Methods *** //
        renderUI: function (){
            this.table = new Y.DataTable({
                columns: [
                {
                    key:"id",
                    className: 'hidden'
                },
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
            if(this.get('pickingMode')){
                this.get(CONTENTBOX).addClass('modePicking');
            }
        },
            
        bindUI: function() {
            this.handlers.push(Y.Wegas.app.dataSources.VariableDescriptor.after("response", this.syncUI, this));
            this.handlers.push(Y.Wegas.app.after('currentPlayerChange', this.syncUI, this));
            this.table.delegate('click', function (e) {
                var i, listTasksDescriptor = Y.Wegas.app.dataSources.VariableDescriptor.rest.getCachedVariableBy("name", "tasks"), taskDescriptorId;
                taskDescriptorId = e.currentTarget._node.all[0].innerText;
                for (i = 0; i < listTasksDescriptor.items.length; i++) {
                    if(listTasksDescriptor.items[i].id == taskDescriptorId){
                        this.selectedTaskDescriptor = listTasksDescriptor.items[i];
                        this.fire("rowSelected", this.selectedTaskDescriptor);
                        break;
                    }
                }
            }, '.yui3-datatable-data tr', this);
        },
        
        syncUI: function () {
            var cb = this.get(CONTENTBOX),
            listTasksDescriptor = Y.Wegas.app.dataSources.VariableDescriptor.rest.getCachedVariableBy("name", "tasks");
            if(!listTasksDescriptor) return;
            this.data.length = 0;
            this.getTasksData(listTasksDescriptor);
            this.table.addRows(this.data);
            if(this.data[0] == null){
                this.table.showMessage("Aucun mandat n'est disponible.");
            }
            else{
                this.table.hideMessage();
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
        ATTRS : {
           pickingMode : {
               value: false
           }
        }
    });

    Y.namespace('Wegas').TaskList = TaskList;
});