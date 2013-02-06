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

YUI.add('wegas-nodeformatter', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox', NodeFormatter;

    /**
     * @name Y.Wegas.NodeFormatter
     * @extends Y.Widget
     * @borrows Y.Wegas.Widget
     * @class return value in specifique node.
     * @constructor
     * @description returm value in specifique node. Available type:
     * Text node, image node, value box node, and position node.
     */
    NodeFormatter = Y.Base.create("wegas-nodeformatter", Y.Widget, [Y.Wegas.Widget], {
        /**
         * @lends Y.Wegas.NodeFormatter#
         */
        // ** Lifecycle Methods ** //
        /**
         * @function
         * @private
         * @param value
         * @param label
         * @param className
         * @return node
         * @description return a div node containing a node value and a node
         *  label corresponding with the given parameters.
         *  Returned node have the given class name.
         */
        makeNodeText: function (value, label, className) {
            var node = Y.Node.create('<div class="nodeformatter-properties"></div>');
            value = (value !== null) ? value : 'undefine';
            if (className) {
                node.addClass(className);
            }
            if (label) {
                node.append('<span class="label">' + label + '</span>');
            }
            node.append('<span class="value">' + value + '</span>');
            return node;
        },
        /**
         * @function
         * @private
         * @param value
         * @param label
         * @param className
         * @return node
         * @description return a div node containing an image node. This image
         * will have the given attrs parameters as attribute.
         * Returned node have the given class name.
         */
        makeNodeImage: function (attrs, className) {
            var k, node = new Y.Node.create('<div class="nodeformatter-img"></div>');
            node.append('<img></img>');
            if (className) {
                node.one('img').addClass(className);
            }
            if (typeof attrs !== 'object') {
                return node;
            }
            for (k in attrs) {
                node.one('img').setAttribute(k, attrs[k]);
            }
            return node;
        },
        /**
         * @function
         * @private
         * @param value
         * @param maxVal
         * @param label
         * @param className
         * @return node
         * @description return a div node containing a node label, a node
         *  containing as many nodes as shown in value and a node shown the
         *  value and the max value.
         *  Returned node have the given class name.
         */
        makeNodeValueBox: function (value, maxVal, label, className) {
            var i, acc = [], node = new Y.Node.create('<div class="nodeformatter-valuebox"></div>');
            value = (typeof parseInt(value) === 'number') ? parseInt(value) : 0;
            maxVal = (maxVal || 'undefine');
            label = (label || 'undefine');
            if (className) {
                node.addClass(className);
            }
            for (i = 0; i < value; i += 1) {
                acc.push('<div class="box-unit"></div>');
            }
            node.append('<div class="label">' + label + '</div>');
            node.append('<span class="box-units">' + acc.join('') + '</span>');
            node.append('<span class="box-value">(' + value + '<span class="box-valueMax">/' + maxVal + '</span>)</span>');
            return node;
        },
        /**
         * @function
         * @private
         * @param html
         * @param selector
         * @param value
         * @param minVal
         * @param invert
         * @param className
         * @return node
         * @description return a div node containing the given html and
         *  highlight a nodes according to the given values (a number).  
         *  To highlight a node this function count same type node as the
         *   "selector" parameter (like 'li', 'div', 'p', 'img', etc...).
         * The first value depending of the given 'minVal'
         * The 'invert' parameter allow to count reversely.
         * Returned node have the given class name.
         */
        makeNodePosition: function (html, selector, value, minVal, invert, className) {
            var node = new Y.Node.create('<div class="nodeformatter-position"></div>');
            minVal = (typeof parseInt(minVal) === 'number') ? parseInt(minVal) : 0;
            value = (typeof parseInt(value) === 'number') ? parseInt(value) - minVal : -1 - minVal; // if value isn't a number, value egal minVal - 1 (and thus never selected)
            invert = (invert === 'true' || invert === true) ? true : false;
            if (className) {
                node.addClass(className);
            }
            node.append(html);
            node.all(selector).each(function (n, i, q) { //n = node, i = iteration, q = number of iterations.
                i = (invert) ? (q.size() - 1 - i) : i;
                n.setAttribute('data-position', i + minVal); //keep a reference to real number position
                if (i < value) {
                    n.addClass('previous');
                } else if (i === value) {
                    n.addClass('current');
                } else {
                    n.addClass('next');
                }
            });
            return node;
        }

    }, {
        /*
         * @lends Y.Wegas.NodeFormatter#
         */
        /**
         * @field
         * @static
         * @description
         * <p><strong>Method (none)</strong></p>
         */
        ATTRS: {}
    });

    Y.namespace('Wegas').NodeFormatter = NodeFormatter;
});
