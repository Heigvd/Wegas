/**
* @author Benjamin Gerber <ger.benjamin@gmail.com>
*/

YUI.add('wegas-leaderway', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox', HRList;

    HRList = Y.Base.create("wegas-hrlist", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {
        
        // *** Fields *** /
        table: null,
        
        data: [
        {
            nom: "Justin", 
            prenom: "Béatrice",   
            occupation: "Libre", 
            dossier:'1', 
            parler:'1'
        },

        {
            nom: "Pierre", 
            prenom: "Zimmerman",   
            occupation: "Occupé", 
            dossier:'2', 
            parler:'2'
        },

        {
            nom: "Boniface", 
            prenom: "Laurentin", 
            occupation: "Occupé", 
            dossier:'3', 
            parler:'3'
        },

        {
            nom: "Valerie", 
            prenom: "Philbert",   
            occupation: "Libre", 
            dossier:'4', 
            parler:'4'
        },

        {
            nom: "Hercule", 
            prenom: "Auguste",   
            occupation: "Occupé", 
            dossier:'5', 
            parler:'5'
        }
        ],

        // *** Lifecycle Methods *** //
        renderUI: function (){
            this.table = new Y.DataTable({
                columns: [
                {
                    key:"nom", 
                    label:"Nom",
                    sortable:true
                },

                {
                    key:"prenom", 
                    label:"Prenom",
                    sortable:true
                },

                {
                    key:"occupation", 
                    label:"Occupation",
                    sortable:true
                },

                {
                    key: "dossier",
                    formatter: '<input class="dossier" type="button" name="dossier" value="dossier">',
                    label: 'Dossier',
                    allowHTML: true
                },
                
                {
                    key: "parler",
                    formatter: '<input class="parler" type="button" name="parler" value="Parler">',
                    label: 'Parler',
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
            }, '.yui3-datatable-data .parler', this.table);
            
            this.table.delegate('click', function (e) {
                alert("Comment afficher le dossier et cacher le reste..?");
            }, '.yui3-datatable-data .dossier', this.table);
        },
        
        syncUI: function () {
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