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
            this.handlers.push(cb.one('.wegas-langselector-select').on('change', function (e) {
               var lang = e.currentTarget.get('value'),
               url = window.location.href,
               urlStart, urlEnd;
               if(url.indexOf("&lang=") > -1){
                  urlStart = url.substring(0, url.indexOf("&lang="));
                  urlEnd = url.substring(url.indexOf("&lang=")+1);
                    if(urlEnd.indexOf("&")>-1){
                        urlEnd = urlEnd.substring(urlEnd.indexOf("&"));   
                    }else{
                        urlEnd = "";
                    }
                    location.replace(urlStart+urlEnd+"&lang="+lang);
               }else{
                    location.replace(url+"&lang="+lang);
               }
            },'option', this));
        },
        
        syncUI: function () {
            if(this.items == null) return;
            var i, cb=this.get(CONTENTBOX), browserLang, pageLang, url, selected = false;
            url = window.location.href;
            browserLang = (navigator.language) ? navigator.language : navigator.userLanguage; 
            if(url.indexOf("&lang=")>-1){
                pageLang = url.substring(url.indexOf("&lang=")+6);
                if(pageLang.indexOf("&")>-1){
                    pageLang = pageLang.substring(0, pageLang.indexOf("&"));
                }
            }
            for(i=0;i<this.items.length;i++){
                if(!selected){
                    if(pageLang && (this.items[i].indexOf(pageLang)>-1 || pageLang.indexOf(this.items[i])>-1)){
                        cb.one('.wegas-langselector-select').insert("<option selected='selected'>"+this.items[i]+"</option>");
                        selected = true;
                    }else if((this.items[i].indexOf(browserLang)>-1 || browserLang.indexOf(this.items[i])>-1)&&url.indexOf("&lang=")<=-1){
                        cb.one('.wegas-langselector-select').insert("<option selected='selected'>"+this.items[i]+"</option>");
                        selected = true;
                    }
                    else{
                        cb.one('.wegas-langselector-select').insert("<option>"+this.items[i]+"</option>");
                    }
                }else{
                    cb.one('.wegas-langselector-select').insert("<option>"+this.items[i]+"</option>");
                }
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