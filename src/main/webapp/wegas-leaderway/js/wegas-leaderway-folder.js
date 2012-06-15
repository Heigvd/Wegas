/**
* @author Benjamin Gerber <ger.benjamin@gmail.com>
*/

YUI.add('wegas-leaderway-folder', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox', Folder;

    Folder = Y.Base.create("wegas-folder", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {
        
        tabview: null,
        
          renderUI: function (){
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
}, '3.5.0', {
    requires: ['tabview']
});