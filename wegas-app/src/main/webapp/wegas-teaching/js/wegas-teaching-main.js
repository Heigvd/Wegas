/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
YUI.add("wegas-teaching-main", function(Y) {
    "use strict";

    var CONTENTBOX = "contentBox", Wegas = Y.Wegas;

    Wegas.TeachingMain = Y.Base.create("wegas-teaching-main", Y.Widget, [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
        CONTENT_TEMPLATE: "<div><div class='layer' style='width:100%;height:620px;'></div></div>",
        renderUI: function() {
            var rectangles = [
                [3, 0], [300, 0], [595, 0],
                [3, 225], [300, 225], [595, 225],
                [3, 450], [300, 450], [595, 450]
            ],
                arrows = [[[100, 145], [100, 220]], [[375, 145], [375, 220]],
                    [[650, 145], [650, 220]], [[200, 70], [295, 70]],
                    [[495, 70], [590, 70]], [[200, 295], [295, 295]],
                    [[495, 295], [590, 295]], [[100, 370], [100, 445]],
                    [[375, 370], [375, 445]], [[650, 370], [650, 445]],
                    [[200, 520], [295, 520]], [[495, 520], [590, 520]]];

            this.graphic = new Y.Graphic({
                autoDraw: true
            }).render(this.get(CONTENTBOX).one(".layer"));

            Y.Array.each(arrows, function(a, i) {                               // Create and add 12 arrows 
                this.createArrow(a[0], a[1], i + 1);
            }, this);

            Y.Array.each(rectangles, function(r, i) {                           // Create and add the 9 rectangles
                this.createRectangle(r, i + 1);
            }, this);

            this.initArrowEditor();                                             // Init editors
            this.initRectangleEditor();
        },
        bindUI: function() {
            this.get(CONTENTBOX).all(".yui3-wegas-teaching-rectangle").each(function(n) {
                var drop = new Y.DD.Drop({//                                    // Init drop
                    node: n
                }),
                    drag = new Y.DD.Drag({//                                    // Init drag
                        node: n
                    }).plug(Y.Plugin.DDProxy, {
                    moveOnEnd: false                                            // We don't want the node to move on end drag
                }).plug(Y.Plugin.DDConstrained, {
                    constrain2node: this.get(CONTENTBOX)                        // Keep nodes inside the workarea
                });
                drag.on("drag:drophit", function(e) {
                    var drag = Y.Widget.getByNode(e.drag.get("node")),
                        drop = Y.Widget.getByNode(e.drop.get("node")),
                        tmpDescription = drag.get("description"),
                        tmpLabel = drag.get("label"),
                        tmpId = drag.get("rId");

                    drag.set("description", drop.get("description"))            // Switch descriptionsand label
                        .set("label", drop.get("label"))
                        .set("rId", drop.get("rId"));
                    drop.set("description", tmpDescription)
                        .set("label", tmpLabel)
                        .set("rId", tmpId);

                    Wegas.Facade.Variable.script.run(
                        'Variable.find(gameModel, "positions").setProperty(self, "position' + drop.get("position") + '", "' + drop.get("rId") + '");'
                        + 'Variable.find(gameModel, "positions").setProperty(self, "position' + drag.get("position") + '", "' + drag.get("rId") + '");');
                }, this);
            }, this);
        },
        destructor: function() {
            this.graphic.destroy();
            this.buttonGroup.destroy();
            this.arrowEditor.destroy();
            try {
                this.editor.destroy();
            } catch (e) {
                // @FIXME Editor do throw errors on destruction
            }
            this.rectangleEditor.destroy();
        },
        showRectangleEditor: function(e) {
            if (e.domEvent.target.hasClass("label"))                            // Clicks on label dont show editor
                return;

            this.currentRectangle = e.target;
            this.rectangleEditor.set("headerContent", "Edit definition of " + this.currentRectangle.get("label"));
            this.editor.set("content", e.target.get("description"));
            this.rectangleEditor.show()
                .set("xy", [(Y.DOM.winWidth() / 2) - 300, 100]);
        },
        showArrowEditor: function(arrow) {
            var direction = arrow.get("orientation") ? "vertical" : "horizontal",
                directions = ["normal", "inverse", "double", "none"],
                buttons = this.buttonGroup.getButtons();

            this.currentArrow = arrow;

            buttons.each(function(n, i) {
                n.toggleClass(Y.ButtonGroup.CLASS_NAMES.SELECTED, +n.get("value") == +arrow.get("val"))
                    .set("labelHTML", '<span class="icon ' + direction + '-' + directions[i] + '"></span>');// Set correct image (vertical or horizontal)
            });
            this.getArrowEditorInput().set("value", arrow.get("text"));
            this.arrowEditor.show().set("xy", [(Y.DOM.winWidth() / 2) - 150, 100]);
        },
        createArrow: function(xyStart, xyEnd, id) {
            var arrowInstance = Wegas.Facade.Variable.cache.find("name", "fleche" + id).getInstance(),
                val = arrowInstance.get("properties").value,
                text = arrowInstance.get("properties").text,
                orientation = xyStart[0] == xyEnd[0], // true = 1: vertical (else horizontal)
                arrow = this.graphic.addShape({
                    type: Y.TeachingArrow,
                    stroke: {
                        weight: 5,
                        color: val == 0 ? "rgb(200,200,200)" : "rgb(0,0,0)",
                    },
                    src: xyStart,
                    tgt: xyEnd,
                    id: id,
                    val: val,
                    text: text,
                    orientation: orientation
                }),
                handleClick = Y.bind(this.showArrowEditor, this, arrow);

            Y.Node(arrow.get("node")).on("click", handleClick);
            arrow.label = this.createLabel(xyStart[0], xyStart[1], text, orientation);
            arrow.label.on("click", handleClick);
        },
        createLabel: function(x1, y1, text, orientation) {
            var label = Y.Node.create("<div class='yui3-tooltip'><div class='yui3-tooltip-content'><div class='yui3-widget-bd'>" + (text || "<em>Click to edit</em>") + "</div><div class='yui3-widget-ft'><div></div></div></div></div>");

            this.get(CONTENTBOX).append(label);

            label.one("*").addClass(orientation ? "yui3-tooltip-align-right" : "yui3-tooltip-align-bottom");
            label.setStyles(orientation ? {
                left: x1 + 25,
                top: y1 + 25
            } : {// horizontal
                left: x1 + 13,
                top: y1 + 25
            });
            return label;
        },
        createRectangle: function(xy, position) {
            var positions = Wegas.Facade.Variable.cache.find("name", "positions"),
                id = positions.getInstance().get("properties.position" + position),
                rectangleInstance = Wegas.Facade.Variable.cache.find("name", "rectangle" + id),
                val = rectangleInstance.getInstance().get("value");

            new Wegas.TeachingRectangle({
                x: xy[0],
                y: xy[1],
                label: this.get("themes")[parseInt(id) - 1] || "Undefined",
                description: val,
                rId: id,
                position: position,
                on: {
                    click: Y.bind(this.showRectangleEditor, this)
                }
            }).render(this.get(CONTENTBOX));
        },
        initArrowEditor: function() {
            this.arrowEditor = new Y.Panel({
                headerContent: "Edit relation",
                bodyContent: "<br/>Type:&nbsp;&nbsp;<input placeholder=\"Not set\"/><br /><br />"
                    + "Direction:<br/>"
                    + "<div class='arrow-buttons'>"
                    + "<button value=\"1\"></button>"
                    + "<button value=\"2\"></button>"
                    + "<button value=\"3\"></button>"
                    + "<button value=\"0\"></button></div><br/>",
                width: 300,
                zIndex: 50000,
                modal: true,
                visible: false
            }).render().addButton({
                value: "Save",
                section: Y.WidgetStdMod.FOOTER,
                context: this,
                action: function() {
                    var text = this.getArrowEditorInput().get("value");
                    this.currentArrow.setType(+this.buttonGroup.getSelectedButtons()[0].get("value"));
                    this.currentArrow.setText(text);
                    this.currentArrow.label.one("* *").setHTML(text || "<em>Click to edit</em>");
                    this.arrowEditor.hide();

                    Wegas.Facade.Variable.script.run(
                        "Variable.find(gameModel, 'fleche" + this.currentArrow.get("id") + "').getInstance(self).setProperty('value','" + this.currentArrow.get("val") + "');" +
                        "Variable.find(gameModel, 'fleche" + this.currentArrow.get("id") + "').getInstance(self).setProperty('text','" + this.currentArrow.get("text") + "');");
                }
            });

            var bodyNode = this.arrowEditor.getStdModNode("body"),
                inputNode = bodyNode.one("input");

            bodyNode.setStyles({
                padding: "8px",
                overflow: "visible"
            });

            inputNode.plug(Y.Plugin.AutoComplete, {
                resultHighlighter: "phraseMatch",
                source: this.get("availableLinkLabels"),
                queryDelay: 0,
                minQueryLength: 0
            });
            inputNode.on(["focus", "click"], function() {
                this.ac.sendRequest(this.get("value"));
                this.ac.show();
            });
            inputNode.on("clickoutside", inputNode.ac.hide, inputNode.ac);

            this.buttonGroup = new Y.ButtonGroup({
                srcNode: bodyNode.one(".arrow-buttons"),
                type: "radio"
            }).render();
        },
        initRectangleEditor: function() {
            this.rectangleEditor = new Y.Panel({
                bodyContent: "<div id='editor'></div>",
                width: 600,
                zIndex: 50000,
                modal: true,
                visible: false
            }).render().addButton({
                value: "Save",
                section: Y.WidgetStdMod.FOOTER,
                context: this,
                action: function() {
                    this.currentRectangle.set("description", this.editor.get("content"));
                    Wegas.Facade.Variable.script.run(
                        "Variable.find(gameModel, 'rectangle" + this.currentRectangle.get("rId") + "').setValue(self, '" + this.currentRectangle.get("description").replace(/'/g, '&#39;') + "');");
                    this.rectangleEditor.hide();
                }
            });

            var bodyNode = this.rectangleEditor.getStdModNode("body")
                .setStyle("padding", "8px");

            this.editor = new Y.EditorBase()
                .plug(Y.Plugin.ITSAToolbar, {
                    btnEmail: false,
                    btnFontfamily: false,
                    btnHeader: false,
                    btnFontsize: false,
                    btnHyperlink: false,
                    btnMarkcolor: false,
                    btnTextcolor: false,
                    grpAlign: false,
                    grpIndent: false,
                    grpLists: false,
                    grpSubsuper: false,
                    grpUndoredo: false,
                    btnSize: 3
                }).render(bodyNode.one("#editor"));
        },
        getArrowEditorInput: function() {
            return this.arrowEditor.getStdModNode("body").one("input");
        }
    }, {
        ATTRS: {
            themes: {
                type: "array",
                value: []
            },
            availableLinkLabels: {
                type: "array",
                value: ["Est équivalent", "Utilise", "Spécialise", "Sous-ensemble", "Appartient"]
            }
        }
    });
});
