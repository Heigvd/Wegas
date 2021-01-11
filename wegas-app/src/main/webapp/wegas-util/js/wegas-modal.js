/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @author Raphaël Schmutz
 */
YUI.add('wegas-modal', function(Y) {
    Y.Wegas.Modal = Y.Base.create("wegas-modal", Y.Widget, [Y.Wegas.Widget, Y.Wegas.Editable, Y.WidgetParent, Y.WidgetChild], {
        BOUNDING_TEMPLATE:  "<div class='shadow' />",
        CONTENT_TEMPLATE:   "<div class='modal__content' />",
        MODAL_TEMPLATE:     "<div class='modal'>"+
                                "<div class='modal__header'>"+
                                    "<div class='title'></div>"+
                                    "<a href='#' class='button button--close'><i class='fa fa-times'></i></a>"+
                                "</div>"+
                            "</div>",
        srcNode: "body",
        renderUI: function(){
            this.set("modalBox", Y.Node.create(this.MODAL_TEMPLATE));
            this.get("boundingBox").append(this.get("modalBox").append(this.get("contentBox")));
        },
        bindUI: function(){
            this.get("modalBox").delegate("click", function(e){
                this.close();
            }, ".modal__header .button.button--close", this);
        },
        syncUI: function(){
            this.setTitle(this.get("title"));
            if(this.get("icon") !== null){
                this.setIcon(this.get("icon"));
            }
            if(this.get("actions") && this.get("actions").length > 0){
                this.displayFooter();
            }
        },
        close: function(){
            this.get("modalBox").purge();
            this.destroy();
        },
        setTitle: function(newTitle){
            this.set("title", newTitle)
                .get("modalBox").one(".modal__header .title")
                    .setContent(newTitle);
        },
        setIcon: function(newIcon){
            this.removeIcon();
            this.set("icon", newIcon);
            this.get("modalBox").one(".modal__header")
                .addClass("modal__header--illustred")
                .prepend("<div class='icon'><i class='fa fa-"+newIcon+"'></i></div>");
        },
        removeIcon: function(){
            if(this.get("modalBox").one(".modal__header").hasClass(".modal__header--illustred")){
                this.set("icon", null)
                    .get("modalBox").one(".modal__header")
                    .removeClass("modal__header--illustred")
                    .one(".icon")
                        .remove();
            }
        },
        displayFooter: function(){
           if(!this.get("modalBox").one(".modal__footer")){
                var footer = Y.Node.create("<div class='modal__footer' />"), modalContext = this, button;
                this.get("actions").forEach(function(action){
                    button = Y.Node.create("<a href='#' class='button'>" + action.label + "</a>");
                    if(action.types && action.types.length > 0){
                        action.types.forEach(function(type){
                            button.addClass("button--" + type);
                        });
                    }
                    footer.append(button);
                    button.on("click", function(event){
                        event.preventDefault();
                        event.stopPropagation();
                        modalContext.do = action.do;
                        modalContext.do();
                    }, this);
                });
                this.get("modalBox")
                    .append(footer)
                    .one(".modal__content").addClass("modal__content--able-footer");
           }
        }, 
        removeFooter: function(){
            if(this.get("modalBox").one(".modal__footer")){
                this.get("modalBox")
                    .one(".modal__footer button")
                    .purge();
                this.get("modalBox")
                    .remove();
            }
        }
    }, {
        ATTRS:{
            "title":{
                'value': "Modal"
            },
            "icon":{
                'value': null
            },
            "actions":{
                'value': []
            }
        }
    });
});