/**
* @author Benjamin Gerber <ger.benjamin@gmail.com>
*/

YUI.add('wegas-leaderway-dialogue', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox', Dialogue;

    Dialogue = Y.Base.create("wegas-dialogue", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {
        
        tabview: null,
        
          renderUI: function (){
              this.get(CONTENTBOX).setContent(
              '<div class="pictures"></div>'
              +'<div class="oscilloscope"></div>'
              +'<div class="speaker-name">Leader</div>'
              +'<div class="dialogue"></div>'
              );
          },
        
          syncUI: function () {

          }
    }, {
        ATTRS : {
            content: { }
        }
    });

    Y.namespace('Wegas').Dialogue = Dialogue;
});