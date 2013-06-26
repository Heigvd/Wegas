/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

/**
 * @fileoverview
 * @author Benjamin Gerber <ger.benjamin@gmail.com>
 */

YUI.add('wegas-itemselector', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox', ItemSelector;
    /**
     * @lends Y.Wegas.ItemSelector#
     */
    /**
     * @name Y.Wegas.ItemSelector
     * @extends Y.Widget
     * @borrows Y.Wegas.Widget, Y.Wegas.Editable, Y.Wegas.NodeFormatter
     * @class class to select single descriptor (from a list) to display desired variables from it.
     * @constructor
     * @description Display a given list of descriptor, each is selectable to display desired variables from it.
     */
    ItemSelector = Y.Base.create("wegas-itemselector", Y.Widget, [Y.Wegas.Widget, Y.Wegas.Editable, Y.Wegas.NodeFormatter], {
        /** @lends Y.Wegas.ItemSelector# */

        // *** Private fields *** //
        /**
         * Reference to each used functions
         */
        handlers: null,
        /**
         * The selected variable descriptor
         */
        currentItem: null,
        /**
         * The reference to the ScrollView widget
         */
        scrollView: null,
        // *** Lifecycle Methods *** //
        /**
         * @function
         * @private
         * @description Set variables with initials values.
         */
        initializer: function () {
            this.handlers = {};
        },
        /**
         * @function
         * @private
         * @description Select the first available variable instance and init
         * a ScrollView widget.
         */
        renderUI: function () {
            var i, variables, cb = this.get(CONTENTBOX);
            cb.append('<div class="selectors"></div>');
            cb.append('<div class="informations"></div>');
            if (!this.get('listVariables')) {
                return;
            }
            variables = Y.Wegas.Facade.VariableDescriptor.cache.find("name", this.get('listVariables'));
            if (!variables || !variables.get('items')) {
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
         * @function
         * @private
         * @description bind function to events.
         * When VariableDescriptorFacade is updated, do syncUI
         * When a "selector" div is clicked, set current item. PreventDevault to
         * prevent problem between click action and slide action (on SlidePanel)
         */
        bindUI: function () {
            var cb = this.get(CONTENTBOX);
            this.handlers.itemSelectorUpdate = Y.Wegas.Facade.VariableDescriptor.after("update", this.syncUI, this);

            this.handlers.itemSelectorSelect = cb.one('.selectors').delegate('click', function (e) {
                var i, variables, name;
                e.preventDefault();
                if (e.target.ancestors('.selector').item(0)) {
                    name = e.target.ancestors('.selector').item(0).getAttribute("data-name");
                } else {
                    name = e.target.getAttribute("data-name");
                }
                variables = Y.Wegas.Facade.VariableDescriptor.cache.find("name", this.get('listVariables'));
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

        },
        /**
         * @function
         * @private
         * @description refresh displayed values.
         */
        syncUI: function () {
            var cb = this.get(CONTENTBOX), variables;
            if (!this.get('listVariables'))
                return;
            variables = Y.Wegas.Facade.VariableDescriptor.cache.find("name", this.get('listVariables'));
            if (!variables || !variables.get('items') || variables.get('items').length <= 0)
                return;
            this.createSelector(cb, variables.get('items'));
            this.createInformations(cb);
        },
        /**
         * @function
         * @private
         * @description Detach all functions created by this widget.
         */
        destructor: function () {
            for (var k in this.handlers) {
                this.handlers[k].detach();
            }
        },
        // *** Private Methods *** //
        /**
         * @function
         * @private
         * @param cb
         * @param variables
         * @description Delete selectors and, for all available instance,
         * re-create a selector.
         */
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
        /**
         * @function
         * @private
         * @param cb
         * @description Delete all values relative to the selected
         * instance and re-create them with the niew selected instance.
         */
        createInformations: function (cb) {
            var node = cb.one('.informations');
            node.empty();
            this.createDOMProperties(node, this.currentItem, this.get('informations'));
        },
        /**
         * @function
         * @private
         * @param node
         * @param variable
         * @param attrs
         * @description Create DOM nodes from selected instance and desired
         * value to display from it. Some "mode" are available, display as :
         * image: put the value as source (src) of the image.
         * position: Use value to highlight a line in a given DOM list
         * valuebox: Display equivalent number of div than the number indicates
         *  by the value
         * default : Display value as a simple text
         * Label and classname can be added for each variable.
         */
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
                                "data-file": value,
                                "width": obj['height'],
                                "height": obj['width']
                            }, className);
                            break;
                        case 'position' :
                            child = this.makeNodePosition(obj['html'], obj['selector'], value, obj['minVal'], obj['invert'], className);
                            break;
                        case 'valueBox' :
                            child = this.makeNodeValueBox('' + value, obj['maxValue'], label, className);
                            break;
                        case 'longText':
                            child = this.makeNodeText("<i>Loading</i>", label, className || value);
                            this.makeNodeLongText(this.get(CONTENTBOX), variable, value,  className || value);
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
        /**
         * @function
         * @private
         * @param variable
         * @param varName
         * @return value
         * @description return a value corresponding to its name
         *  from a given variable
         */
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
                    if (variable.get(prop[i]) != null && variable.get(prop[i])[varName] != null) {
                        value = variable.get(prop[i])[varName];
                        break;
                    }
                    else if (variable.getInstance().get(prop[i]) != null && variable.getInstance().get(prop[i])[varName] != null) {
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
        /**
         * @lends Y.Wegas.ItemSelector#
         */
        /**
         * @field
         * @static
         * @description
         * <p><strong>Attributes</strong></p>
         * <ul>
         *    <li>listVariables: A variable reference to a list of variable descriptor.</li>
         *    <li>searchInProperties: Name of list (like properties) to seacrch in.</li>
         *    <li>selectors: Array of values to display in selectors</li>
         *    <li>informations: Array of values to display as information of a selected instance</li>
         * </ul>
         */
        ATTRS: {
            /**
             * A variable reference to a list of variable descriptor
             */
            listVariables: {
                value: null,
                validator: function (s) {
                    return s === null || Y.Lang.isString(s);
                }
            },
            /**
             * Name of list (like properties) to seacrch in.
             */
            searchInProperties: {
                validator: Y.Lang.isArray,
                value: []
            },
            /**
             * Array of values to display in selectors
             */
            selectors: {
                validator: Y.Lang.isArray,
                value: []
            },
            /**
             * Array of values to display as information of a selected instance
             */
            informations: {
                validator: Y.Lang.isArray,
                value: []
            }
        }
    });

    Y.namespace('Wegas').ItemSelector = ItemSelector;
});
