/**
 * @author Benjamin Gerber <ger.benjamin@gmail.com>
 */

YUI.add('wegas-cep-nodeformatter', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox', NodeFormatter;

    NodeFormatter = Y.Base.create("wegas-cep-nodeformatter", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {
        
        makeNodeText: function(value, label, className){
            var node = Y.Node.create('<div class="nodeformatter-properties"></div>');
            value = (value || 'undefine');
            if(className) node.addClass(className);
            if (label) node.append('<span class="label">'+label+'</span>');
            node.append('<span class="value">'+value+'</span>');
            return node;
        },
        
        makeNodeImage: function(attrs, className){
            var k, node = new Y.Node.create('<img class="nodeformatter-img"></img>');
            if(className) node.addClass(className);
            if(typeof attrs !== 'object') return node;
            for(k in attrs){
                node.set(k, attrs[k])
            }
            return node;
        },
        
        makeNodeValueBox: function(value, maxVal, label, className){
            var i, acc = [], node = new Y.Node.create('<div class="nodeformatter-valuebox"></div>');
            value = (value || 'undefine');
            maxVal = (maxVal || 'undefine');
            label = (label || 'undefine');
            if(className) node.addClass(className);
            for (i=0; i<value; i++) {
                acc.push('<div class="box-unit"></div>');
            }
            node.append('<div class="label">'+label+'</div>');
            node.append('<span class="box-units">'+acc.join('')+'</span>');
            node.append('<span class="box-value">('+value+'<span class="box-valueMax">/'+maxVal+'</span>)</span>');
            return node
        },
        
        makeNodePosition: function(html, selector, value, invert, className){
            var node = new Y.Node.create('<div class="nodeformatter-position"></div>');
            value = (typeof value === 'number' || value == 0)? value : -1;
            invert = (invert == 'true')? true : false;
            if(className) node.addClass(className);
            node.append(html);
            node.all(selector).each(function(n, i, q){
                i = (invert)? q.size()-1-i : i;
                if(i<value){
                    n.addClass('previous')
                } else if(i==value){
                    n.addClass('current')
                } else{
                    n.addClass('next');
                }
            });
            return node
        }
        
    }, {
        ATTRS : {
            
    }
    });

    Y.namespace('Wegas').CepNodeFormatter = NodeFormatter;
});
