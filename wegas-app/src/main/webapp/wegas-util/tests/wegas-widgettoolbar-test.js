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
YUI.add('wegas-widgettoolbar-test', function(Y) {

    Y.Test.Runner.add(new Y.Test.Case({
        name: 'Y.Wegas.WidgetToolbar',
        'should plug a WidgetToolbar': function() {

            this.widget = new Y.Wegas.Text({
                render: true,
                content: "Hello wegas"
            });
            this.widget.plug(Y.Plugin.WidgetToolbar, {
                children: [{
                        type: Y.Wegas.Button,
                        label: "test"
                    }]
            });

            Y.Assertions.isTrue(this.widget.get("boundingBox").hasClass('wegas-hastoolbar'));
        },
        "should add a button": function() {
            this.widget.toolbar.add({
                type: Y.Wegas.Button,
                label: "test"
            });
            Y.Assertions.areEqual(2, this.widget.toolbar.size());
        }

        //"shoud destroy": function () {
        //    this.widget.unplug(Y.Plugin.WidgetToolbar);
        //    this.widget.destroy();
        //
        //    Y.Assertions.isTrue(this.widget.get("destroyed"));
        //}

    }));
}, '@VERSION@', {
    requires: ['wegas-widgettoolbar', 'wegas-text', 'wegas-button', 'test']
});

