/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */

/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-list', function (Y) {
    "use strict";

    var BOUNDINGBOX = 'boundingBox',
    CONTENTBOX = 'contentBox',
    List;

    List = Y.Base.create("wegas-list", Y.Widget, [Y.WidgetParent, Y.WidgetChild,  Y.Wegas.Widget, Y.Wegas.Editable], {


        // ** Lifecycle Methods ** //

        syncUI: function () {
            var cb = this.get(CONTENTBOX);

            if (this.get('direction') === 'vertical') {
                cb.addClass(this.getClassName('vertical'));
                cb.removeClass(this.getClassName('horizontal'));
            } else {
                cb.addClass(this.getClassName('horizontal'));
                cb.removeClass(this.getClassName('vertical'));
            }
            this.get(BOUNDINGBOX).append('<div style="clear:both"></div>');
        },
        //Children serialization
        toObject: function () {
            var i, s = Y.Wegas.Editable.prototype.toObject.call(this),
            children = [];
            for (i = 0; i < this.size(); i = i + 1) {
                children.push(this.item(i).toObject());
            }
            s.children = children;
            return s;
        }
    }, {
        ATTRS : {
            defaultChildType: {
                value: "Text",
                "transient": true
            },
            children: {
                "transient": true
            },
            direction: {
                value: 'vertical',
                type: "string",
                choices: [{value:'vertical'},{value: 'horizontal'}]
            },
            multiple: {
                "transient": true
            }

            /**
             * Prevent widgetchild selection to be propagated through the hierarchy
             */
            //selected: {
            //    value: 2,
            //    readonly: true
            //}
        }
    });

    Y.namespace('Wegas').List = List;
});
