/**
 * @author Benjamin Gerber <ger.benjamin@gmail.com>
 */

YUI.add('wegas-cep-itemselector', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox', ItemSelector;

    ItemSelector = Y.Base.create("wegas-cep", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {
        
        handlers: null,
        currentItem:null,
        
        createSelector: function(cb, variables){
            var i, node = cb.one('.selectors'), selector
            node.empty()
            for(i=0; i<variables.length; i++){
                selector = Y.Node.create('<div class="selector" data-name="'+variables[i].get('name')+'"></div>')
                if(variables[i] === this.currentItem){
                    selector.addClass('current');
                }
                this.createDOMProperties(selector, variables[i], this.get('selectorNames'), this.get('selectorLabels'));
                node.append(selector);
            }
        },
        
        createInformations: function(cb){
            var node = cb.one('.informations'),
            variable = this.currentItem,
            names = this.get('informationsNames'),
            labels = this.get('informationsLabels');
            node.empty();
            this.createDOMProperties(node, variable, names, labels);
        },
        
        createDOMProperties: function(node, variable, names, labels){
            var j, value, content,label;
            if(!node || !variable || !names || !labels) return;
            for(j=0; j<names.length; j++){
                content = Y.Node.create('<div class="'+names[j]+'"></div>')
                value = this.getVariableValue(variable, names[j]);
                label = (labels[j] || 'undefine');
                content.append('<span class="label">'+label+'</span>');
                content.append('<span class="value">'+value+'</span>');
                node.append(content);
            }
        },
        
        getVariableValue:function(variable, varName){
            var value = 'undefine';
            if(!variable || !varName) return value;
            if(variable.get(varName)){
                value = variable.get(varName);
            }else if(variable.getInstance().get(varName)){
                value = variable.getInstance().get(varName);
            }else {
                value = variable.getInstance().get('properties')[varName];
            }
            return value;
        },

        // *** Lifecycle Methods *** //
        initializer: function(){
            this.handlers = new Array();
        },
        
        /**
         * Render the widget.
         */
        renderUI: function(){
            var variables, cb = this.get(CONTENTBOX);
            cb.append('<div class="selectors"></div>');
            cb.append('<div class="informations"></div>');
            if(!this.get('listVariables')) return;
            variables = Y.Wegas.VariableDescriptorFacade.rest.find("name", this.get('listVariables'));
            this.currentItem = variables.get('items')[0];
        },

        /**
         * Bind some function at nodes of this widget
         */
        bindUI: function(){
            var cb = this.get(CONTENTBOX);
            this.handlers.push(Y.Wegas.VariableDescriptorFacade.after("response", this.syncUI, this));
            this.handlers.push(Y.Wegas.app.after('currentPlayerChange', this.syncUI, this));
            this.handlers.push(cb.one('.selectors').delegate('click', function (e) {
                var i, variables, name = e.target.ancestors('.selector').item(0).getAttribute("data-name");
                variables = Y.Wegas.VariableDescriptorFacade.rest.find("name", this.get('listVariables'));
                if(!variables || !variables.get('items')) return;
                for(i=0; i<variables.get('items').length; i++){
                    if(variables.get('items')[i].get('name') === name){
                        this.currentItem = variables.get('items')[i];
                        break;
                    }
                }
                this.syncUI();
            }, '.selector', this));
        },

        /**
         * Synchronise the content of this widget.
         */
        syncUI: function() {
            var cb = this.get(CONTENTBOX), variables;
            if(!this.get('listVariables')) return;
            variables = Y.Wegas.VariableDescriptorFacade.rest.find("name", this.get('listVariables'));
            if(!variables || !variables.get('items') || variables.get('items').length<=0) return;
            this.createSelector(cb, variables.get('items'));
            this.createInformations(cb);
        },

        /*
         * Destroy all child widget and all remanent function
         */
        destructor: function(){
            var i;
            for (i=0; i<this.handlers.length;i++) {
                this.handlers[i].detach();
            }
        }
        
    }, {
        ATTRS : {
            listVariables: {
                value:null,
                validator: function (s){
                    return s === null || Y.Lang.isString(s);
                }
            },
            informationsNames: {
                validator: Y.Lang.isArray,
                value: new Array()
            },
            informationsLabels: {
                validator: Y.Lang.isArray,
                value: new Array()
            },
            selectorNames: {
                validator: Y.Lang.isArray,
                value: new Array()
            },
            selectorLabels: {
                validator: Y.Lang.isArray,
                value: new Array()
            }
        }
    });

    Y.namespace('Wegas').CepItemSelector = ItemSelector;
});
