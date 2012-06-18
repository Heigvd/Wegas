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
        
          renderUI: function (){
            this.previousMembreButton = new Y.Wegas.Button({
                label: "Membre précédent",
                cssClass:'wegas-folder-previousMembrebutton',
                view:'button'
            });
            this.nextMembreButton = new Y.Wegas.Button({
                label: "Membre suivant",
                cssClass:'wegas-folder-nextMembreButton',
                view:'button'
            });
            this.tabview = new Y.TabView({
                children: [{
                    label: 'Dossier',
                    content: '<div class="folder">'
                    +'<div class="basic_informations"></div>'
                    +'<div class="picture"></div>'
                    +'<div class="characteristics"></div>'
                    +'<div class="skills"></div>'
                    +'<div class="description"></div>'
                    +'</div>'
                }, {
                    label: 'Archives',
                    content: '<div class="archives"></div>'
                    +'<div class="week_selector"></div>'
                    +'<div class="past_dialogues"></div>'
                    +'</div>'
                }]
            });
            this.get(CONTENTBOX).insert('<div class="wegas-folder-container-previousMembrebutton"></div>');
            this.previousMembreButton.render('.wegas-folder-container-previousMembrebutton');
            this.get(CONTENTBOX).insert('<div class="wegas-folder-container-nextMembrebutton"></div>');
            this.nextMembreButton.render('.wegas-folder-container-nextMembrebutton');
            this.tabview.render(this.get(CONTENTBOX));
          },
        
          syncUI: function () {
              var folder = this.get(CONTENTBOX).one(".folder");
              var content = "<p>image</p>";
              folder.one(".picture").insert(content);
          }
    }, {
        ATTRS : {
            content: { }
        }
    });

    Y.namespace('Wegas').Folder = Folder;
});