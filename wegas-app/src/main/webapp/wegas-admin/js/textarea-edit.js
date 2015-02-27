/* 
 * Wegas
 * http://wegas.albasim.ch
 
 * Copyright (c) 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

define(["ember"], function(Ember){
    var editor=Ember.TextArea.extend({
        didInsertElement: function(){
            this.$().focus();
        }
    });
    Ember.Handlebars.helper('textarea-edit', editor);
});
