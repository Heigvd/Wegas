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
YUI.add('wegas-form-test', function(Y) {

    Y.Test.Runner.add(new Y.Test.Case({
        name: 'Y.Wegas.FormTest',
        /*
         * Sets up data that is needed by each test.
         */
        testStringField: function() {
            var string = new Y.Wegas.String({
                placeholder: "type here",
                label: "test",
                description: "test",
                value: "mmii"
            });
            string.render();

            string.on("*:updated", function(e) {
                console.log(e);
            });
        },
        testCheckboxField: function() {
            var checkbox = new Y.Wegas.Checkbox({
                value: true,
                label: "test",
                description: "test"
            });
            checkbox.render();
            checkbox.on("*:updated", function(e) {
                console.log(e);
            });
        },
        testGroup: function() {
            var group = new Y.Wegas.Group({
                label: "test",
                description: "test",
                children: [{
                        type: "String",
                        name: "name",
                        label: "test",
                        description: "test"
                    }],
                value: {
                    name: "mmm"
                }
            });
            group.render();
            group.on("*:updated", function(e) {
                console.log(e);
            });
        },
        testGroup2: function() {
            var group = new Y.Wegas.Group({
                label: "test",
                description: "test",
                children: [{
                        type: "String",
                        label: "test",
                        description: "test"
                    }, {
                        type: "Group",
                        name: "name",
                        label: "subtest",
                        description: "subtest",
                        children: [{
                                type: "String",
                                name: "name",
                                label: "test",
                                description: "test"
                            }]
                    }],
                value: {
                    name: {
                        name: "mmm"
                    }
                }
            });
            group.render();
            group.on("*:updated", function(e) {
                console.log(e);
            });
        }
    }));
}, '@VERSION@', {
    requires: ['form']
});

