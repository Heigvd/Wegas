YUI.add('wegas-langselector', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox', LangSelector;

    LangSelector = Y.Base.create("wegas-langselector", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {
        
        items: null,
        handlers:new Array(),
        
        renderUI: function() {
            this.items = this.get("items");
            this.get(CONTENTBOX).insert("<select class='wegas-langselector-select'></select>");
        },
        
        bindUI: function(){
            var cb = this.get(CONTENTBOX);
            this.handlers.push(cb.one('.wegas-langselector-select').delegate('click', function (e) {
               var lang = e.currentTarget.getContent(),
               location = window.location;
               console.log(lang);
               console.log(location+"&lang="+lang);
//               history.pushState({ foo: "bar" }, "test", location+"&lang="+lang);
            },'option', this))
        },
        
        syncUI: function () {
            var i, cb=this.get(CONTENTBOX);
            if(this.items == null) return;
            for(i=0;i<this.items.length;i++){
                cb.one('.wegas-langselector-select').insert("<option>"+this.items[i]+"</option>")
            }
        },
        
        destroy: function(){
            for (var i=0; i<this.handlers.length;i++) {
                this.handlers[i].detach();
            }
        }
        
    }, {
        ATTRS : {
            items:{
                value:null,
                validator: Y.Lang.isArray
            }
        }
    });

    Y.namespace('Wegas').LangSelector = LangSelector;
});