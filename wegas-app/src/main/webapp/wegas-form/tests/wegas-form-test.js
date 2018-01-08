/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-form-test', function(Y) {

    Y.Test.Runner.add(new Y.Test.Case({
        name: 'Y.FormTest',
        /*
         * Sets up data that is needed by each test.
         */
        testStringField: function() {
            var string = new Y.String({
                placeholder: "type here",
                label: "String test",
                description: "test",
                value: "v1"
            });
            string.render();

            Y.Assert.areEqual(string.get("value"), "v1");

            string.once("valueChange", function(e) {
                Y.Assert.areEqual(e.newVal, "v2");
            });
            string.set("value", "v2");
            Y.Assert.areEqual(string.get("value"), "v2");

            string.destroy();
        },
        testSelect: function() {
            var select = new Y.Select({
                placeholder: "type here",
                label: "String test",
                description: "test",
                children: [{
                        label: "v1",
                        value: "v1"
                    }, {
                        label: "v2",
                        value: "v2"
                    }]
            });
            select.render();

            Y.Assert.areEqual(select.get("value"), "v1");

            select.once("valueChange", function(e) {
                Y.Assert.areEqual(e.newVal, "v2");
            });
            select.set("value", "v2");
            Y.Assert.areEqual(select.get("value"), "v2");

            //select.destroy();
        },
        testTextarea: function() {
            var textarea = new Y.Textarea({
                placeholder: "type here",
                label: "Textearea test"
            });
            textarea.render();

            Y.Assert.areEqual(textarea.get("value"), "");

            textarea.once("valueChange", function(e) {
                Y.Assert.areEqual(e.newVal, "v2");
            });
            textarea.set("value", "v2");
            Y.Assert.areEqual(textarea.get("value"), "v2");

            textarea.destroy();
        },
        testRichTextEditor: function() {
            var richTextEditor = new Y.RichTextEditor({
                placeholder: "type here",
                label: "Textearea test"
            });
            richTextEditor.render();

            Y.Assert.areEqual(richTextEditor.get("value"), "");

            richTextEditor.once("valueChange", function(e) {
                Y.Assert.areEqual(e.newVal, "v2");
            });
            richTextEditor.set("value", "v2");
            Y.Assert.areEqual(richTextEditor.get("value"), "v2");

            //richTextEditor.destroy();
        },
        testCheckboxField: function() {
            return;
            var checkbox = new Y.Checkbox({
                value: true,
                label: "test",
                description: "test"
            });
            checkbox.render();
            checkbox.on("*:update", function(e) {
                console.log(e);
            });

            checkbox.destroy();
        },
        testGroup: function() {
            var group = new Y.Group({
                children: [{
                        type: "String",
                        label: "test",
                        name: "name",
                        placeholder: "mmmm",
                        description: "test"
                    }, {
                        type: "Select",
                        name: "value",
                        label: "test",
                        description: "test",
                        value: "default",
                        children: [{
                                label: "s1",
                                value: "s1"
                            }, {
                                label: "s2",
                                value: "s2"
                            }]
                    }],
                value: {
                    name: "v1",
                    value: "s2"
                }
            });
            group.render();

//            Y.Assert.areEqual(group.get("value"), {
//                name: "v1",
//                value: "default"
//            });

            var v2 = {
                name: "v2",
                description: "v3"
            };
            group.on("valueChange", function(e) {
//                Y.Assert.areEqual(e.newVal, v2);
                Y.log("Group value change.");
            });
            group.set("value", v2);
//            Y.Assert.areEqual(group.get("value"), v2);
        }
    }));
}, '@VERSION@', {
    requires: ['form', "form-rte"]
});

