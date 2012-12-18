/**
 * @author Benjamin Gerber <ger.benjamin@gmail.com>
 */

YUI.add('wegas-itemselector', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox', ItemSelector;

    ItemSelector = Y.Base.create("wegas-itemselector", Y.Widget, [Y.Wegas.Widget, Y.Wegas.Editable, Y.Wegas.NodeFormatter], {
        handlers: null,
        currentItem: null,
        scrollView: null,
        // *** Lifecycle Methods *** //
        initializer: function () {
            this.handlers = {};
        },
        /**
         * Render the widget.
         */
        renderUI: function () {
            var i, variables, cb = this.get(CONTENTBOX);
            cb.append('<div class="selectors"></div>');
            cb.append('<div class="informations"></div>');
            if (!this.get('listVariables')) {
                return;
            }
            variables = Y.Wegas.VariableDescriptorFacade.rest.find("name", this.get('listVariables'));
            if(!variables || !variables.get('items')){
                return;
            }
            for (i = 0; i < variables.get('items').length; i++) {
                if (variables.get('items')[i].getInstance().get('active') == null || variables.get('items')[i].getInstance().get('active') == true) {
                    this.currentItem = variables.get('items')[i];
                    break;
                }
            }
            this.scrollView = new Y.ScrollView({
                id: 'itemselector-scrollview',
                srcNode: cb.one('.selectors'),
                width: cb.one('.selectors').offsetwidth,
                flick: {
                    minDistance: 20,
                    minVelocity: 0.6,
                    axis: 'x'
                }
            });
        },
        /**
         * Bind some function at nodes of this widget
         */
        bindUI: function () {
            var cb = this.get(CONTENTBOX);
            this.handlers.update = Y.Wegas.VariableDescriptorFacade.after("update", this.syncUI, this);
            
            this.handlers.select = cb.one('.selectors').delegate('click', function (e) {
                var i, variables, name;
                if (e.target.ancestors('.selector').item(0)) {
                    name = e.target.ancestors('.selector').item(0).getAttribute("data-name");
                } else {
                    name = e.target.getAttribute("data-name");
                }
                variables = Y.Wegas.VariableDescriptorFacade.rest.find("name", this.get('listVariables'));
                if (!variables || !variables.get('items'))
                    return;
                for (i = 0; i < variables.get('items').length; i++) {
                    if (variables.get('items')[i].get('name') === name) {
                        this.currentItem = variables.get('items')[i];
                        break;
                    }
                }
                this.syncUI();
            }, '.selector', this);

            this.handlers.preventDefault = cb.one('.selectors').delegate('click', function (e) {
                e.preventDefault();
            }, '.selector', this);

        },
        /**
         * Synchronise the content of this widget.
         */
        syncUI: function () {
            var cb = this.get(CONTENTBOX), variables;
            if (!this.get('listVariables'))
                return;
            variables = Y.Wegas.VariableDescriptorFacade.rest.find("name", this.get('listVariables'));
            if (!variables || !variables.get('items') || variables.get('items').length <= 0)
                return;
            this.createSelector(cb, variables.get('items'));
            this.createInformations(cb);
        },
        /*
         * Destroy all child widget and all remanent function
         */
        destructor: function () {
            var k;
            for (k in this.handlers) {
                this.handlers[k].detach();
            }
        },
        createSelector: function (cb, variables) {
            var i, node = cb.one('.selectors'), selector;
            node.empty();
            for (i = 0; i < variables.length; i++) {
                if (variables[i].getInstance().get('active') == null || variables[i].getInstance().get('active') == true) {
                    selector = Y.Node.create('<div class="selector" data-name="' + variables[i].get('name') + '"></div>');
                    if (variables[i] === this.currentItem) {
                        selector.addClass('current');
                    }
                    this.createDOMProperties(selector, variables[i], this.get('selectors'));
                    node.append(selector);
                }
            }
            this.scrollView.render();
        },
        createInformations: function (cb) {
            var node = cb.one('.informations');
            node.empty();
            this.createDOMProperties(node, this.currentItem, this.get('informations'));
        },
        createDOMProperties: function (node, variable, attrs) {
            var i, type, value, label, className, obj, child;
            if (!node || !variable || !attrs)
                return;
            for (i = 0; i < attrs.length; i++) {
                obj = attrs[i];
                if (typeof obj === 'object') {
                    value = this.getVariableValue(variable, obj['name']);
                    value = (value != null) ? value : obj['name'];
                    label = (obj['label'] || null);
                    type = (obj['type'] || 'undefine');
                    className = (obj['className'] || null);
                    switch (type) {
                        case 'image' :
                            child = this.makeNodeImage({
                                "src": value,
                                "width": obj['height'],
                                "height": obj['width']
                            }, className);
                            break;
                        case 'position' :
                            child = this.makeNodePosition(obj['html'], obj['selector'], value, obj['minVal'], obj['invert'], className);
                            break;
                        case 'valueBox' :
                            child = this.makeNodeValueBox(value, obj['maxValue'], label, className);
                            break;
                        default :
                            child = this.makeNodeText(value, label, className);
                            break;
                    }
                    child.setAttribute('data-name', obj['name']);
                    node.append(child);
                }
            }
        },
        getVariableValue: function (variable, varName) {
            var i, prop = this.get('searchInProperties'), value = null;
            if (!variable || !varName)
                return value;
            if (variable.get(varName) != null) {
                value = variable.get(varName);
            } else if (variable.getInstance().get(varName) != null) {
                value = variable.getInstance().get(varName);
            } else {
                for (i = 0; i < prop.length; i++) {
                    if (variable.getInstance().get(prop[i]) != null && variable.getInstance().get(prop[i])[varName] != null) {
                        value = variable.getInstance().get(prop[i])[varName];
                        break;
                    }
                }
            }
            if (parseFloat(value)) {
                value = parseFloat(value);
            }
            return value;
        }

    }, {
        ATTRS: {
            listVariables: {
                value: null,
                validator: function (s) {
                    return s === null || Y.Lang.isString(s);
                }
            },
            searchInProperties: {
                validator: Y.Lang.isArray,
                value: []
            },
            selectors: {
                validator: Y.Lang.isArray,
                value: []
            },
            informations: {
                validator: Y.Lang.isArray,
                value: []
            }
        }
    });

    Y.namespace('Wegas').ItemSelector = ItemSelector;
});
