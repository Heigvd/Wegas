/**
* @author Benjamin Gerber <ger.benjamin@gmail.com>
*/

YUI.add('wegas-leaderway-score', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox', Score;

    Score = Y.Base.create("wegas-score", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {
        
        // *** Fields *** /
        table: null,
        //data: new Array,
        
        data:[
            {"number":1, "team":"tertgrst", "score":11278},
            {"number":2, "team":"afsfyf", "score":10740},
            {"number":3, "team":"tegtrst", "score":9684},
            {"number":4, "team":"tertgrrtgst", "score":8649},
            {"number":5, "team":"tertgrrtgst", "score":19}
        ],

        //*** Particular Methods ***/
        getTeamScore: function(){
            var listDescriptor = Y.Wegas.app.dataSources.VariableDescriptor.rest.getCachedVariableBy("name", "resources"),resourceDescriptor,resourceInstance;
            for (var i = 0; i < listDescriptor.items.length; i = i + 1) {
                    resourceDescriptor = listDescriptor.items[i];
                    resourceInstance = Y.Wegas.app.dataSources.VariableDescriptor.rest.getDescriptorInstance(resourceDescriptor);
                    console.log(resourceDescriptor, resourceInstance);
            }
        },

        // *** Lifecycle Methods *** //
        renderUI: function (){
            this.table = new Y.DataTable({
                columns: [
                {
                    key:"number", 
                    label:"#"
                },
                {
                    key:"team", 
                    label:"Entreprises"
                },
                {
                    key:"score", 
                    label:"Score"
                }               
                ]
            });
            this.get(CONTENTBOX).setContent('<div class="scoreTitle">'+this.get('title')+'</div>');
            this.table.render(this.get(CONTENTBOX));
        },
            
        bindUI: function() {
        },
        
        syncUI: function () {
            this.getTeamScore();
            this.table.addRows(this.data);
            if(this.data[0] == null){
                this.table.showMessage("Aucun score n'est disponible.");
            }
            else{
                this.table.hideMessage();
            }
        }
        
    },
    {
        ATTRS : {
            title: { }
        }
    });

    Y.namespace('Wegas').Score = Score;
});