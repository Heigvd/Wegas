/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
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
                        type: Y.Wegas.Button,
                        label: "test"
                    }]
            });

            Y.Assertions.isTrue(this.widget.get("boundingBox").hasClass('wegas-widgetmenu-hassubmenu'));

            this.widget.menu.on("button:click", function(e) {
                console.log("MENUUUUU", e, arguments, e.target.get("label"));
            });
        },
        "should replace all children a button": function() {
            this.widget.menu.set("children", [{
                    type: Y.Wegas.Button,
                    label: "Second button"
                }]);
            Y.Assertions.areEqual(1, this.widget.menu.size());
        },
        "should add a button": function() {
            this.widget.menu.add([{
                    type: Y.Wegas.Button,
                    label: "Third button"
                }]);
            Y.Assertions.areEqual(2, this.widget.menu.size());

        },
        "should add a nested menu": function() {

            this.widget.menu.add({
                type: Y.Wegas.Button,
                label: "test",
                plugins: [{
                        fn: "WidgetMenu",
                        cfg: {
                            menuCfg: {
                                points: ["tl", "tr"]
                            },
                            event: "mouseenter",
                            children: [{
                                    type: Y.Wegas.Button,
                                    label: "Text"
                                }]
                        }
                    }]
            });
        }

        //"shoud destroy": function () {
        //    this.widget.unplug(Y.Plugin.WidgetMenu);
        //    this.widget.destroy();
        //
        //    Y.Assertions.isTrue(this.widget.get("destroyed"));
        //}

    }));
}, '@VERSION@', {
    requires: ['wegas-widgetmenu', 'wegas-button', 'test']
});

