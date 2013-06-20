/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-widgetmenu-test', function(Y) {

    Y.Test.Runner.add(new Y.Test.Case({
        name: 'Y.Wegas.WidgetMenu',

        'should plug a WidgetMenu': function() {

            this.widget = new Y.Wegas.Button({
                render: true,
                label: "Widget menu test"
            });
            this.widget.plug(Y.Plugin.WidgetMenu, {
                children: [{
                    type: Y.Button,
                    label: "test"
                }]
            });

            Y.Assert.isTrue(this.widget.get("boundingBox").hasClass('wegas-widgetmenu-hassubmenu'));
        },

        "should replace all children a button": function () {
            this.widget.menu.set("children", [{
                type: Y.Button,
                label: "Second button"
            }]);
            Y.Assert.areEqual(1, this.widget.menu.size());
        },

        "should add a button": function () {
            this.widget.menu.add([{
                type: Y.Button,
                label: "Third button"
            }]);
            Y.Assert.areEqual(2, this.widget.menu.size());
        }

        //"shoud destroy": function () {
        //    this.widget.unplug(Y.Plugin.WidgetMenu);
        //    this.widget.destroy();
        //
        //    Y.Assert.isTrue(this.widget.get("destroyed"));
        //}

    }));
}, '@VERSION@' ,{
    requires:['wegas-widgetmenu', 'wegas-button', 'test']
});

