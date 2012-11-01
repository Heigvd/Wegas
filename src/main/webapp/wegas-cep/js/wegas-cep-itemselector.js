/**
 * @author Benjamin Gerber <ger.benjamin@gmail.com>
 */

YUI.add('wegas-cep-itemselector', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox', ItemSelector;

    ItemSelector = Y.Base.create("wegas-cep-itemselector", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.persistence.Editable, Y.Wegas.CepNodeFormatter], {
        
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
                this.createDOMProperties(selector, variables[i], this.get('selectors'));
                node.append(selector);
            }
        },
        
        createInformations: function(cb){
            var node = cb.one('.informations');
            node.empty();
            this.createDOMProperties(node, this.currentItem, this.get('informations'));
        },
        
        createDOMProperties: function(node, variable, attrs){
            var i, type, value, label, className, obj;
            if(!node || !variable || !attrs) return;
            for(i=0; i<attrs.length; i++){
                obj = attrs[i];
                if(typeof obj === 'object'){
                    value = (this.getVariableValue(variable, obj['name']) || obj['name']);
                    label = (obj['label'] || null);
                    type = (obj['type'] || 'undefine');
                    className = (obj['className'] || null);
                    switch(type){
                        case 'image' :
                            node.append(this.makeNodeImage({
                                "src":value,
                                "width":obj['height'],
                                "height":obj['width']
                            }, className));
                            break;
                        case 'position' :
                            node.append(this.makeNodePosition(obj['html'], obj['selector'], value, obj['invert'], className));
                            break;
                        case 'valueBox' :
                            node.append(this.makeNodeValueBox(value, obj['maxValue'], label, className));
                            break;
                        default :
                            node.append(this.makeNodeText(value, label, className));
                            break;
                    }      
                }
            }
        },
        
        getVariableValue:function(variable, varName){
            var i, prop = this.get('searchInProperties'), value = null;
            if(!variable || !varName) return value;
            if(variable.get(varName)){
                value = variable.get(varName);
            }else if(variable.getInstance().get(varName)){
                value = variable.getInstance().get(varName);
            }else {
                for(i=0;i<prop.length; i++){
                    if(variable.getInstance().get(prop[i]) && variable.getInstance().get(prop[i])[varName]){
                        value = variable.getInstance().get(prop[i])[varName];
                        break;
                    }
                }
            }
            if(parseFloat(value)){
                value = parseFloat(value);
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
                var i, variables, name;
                if(e.target.ancestors('.selector').item(0)){
                    name = e.target.ancestors('.selector').item(0).getAttribute("data-name");
                }else{
                    name = e.target.getAttribute("data-name");
                }
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
            searchInProperties:{
                validator: Y.Lang.isArray,
                value: new Array()
            },
            selectors: {
                validator: Y.Lang.isArray,
                value: new Array()
            },
            informations: {
                validator: Y.Lang.isArray,
                value: new Array()
            }
        }
    });

    Y.namespace('Wegas').CepItemSelector = ItemSelector;
});
