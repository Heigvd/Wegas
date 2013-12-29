YUI.add("wegas-teaching-main", function(Y) {
    "use strict";

    var CONTENTBOX = "contentBox", TeachingMain;

    TeachingMain = Y.Base.create("wegas-teaching-main", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        CONTENT_TEMPLATE: "<div><div class='layer' style='width:100%;height:620px;'></div></div>",
        // Graphic (Y.Graphic used to draw arrows)
        graphic: null,
        // Arrow const
        ARROW_NONE: 0,
        ARROW_NORMAL: 1,
        ARROW_INVERSE: 2,
        ARROW_DOUBLE: 3,
        // Orientation const
        ORIENTATION_HORIZONTAL: 0,
        ORIENTATION_VERTICAL: 1,
        // Ref on selected arrow
        currentArrow: null,
        // Ref on selected rectangle
        currentRectangle: null,
        // Editors (modal form)
        arrowEditor: null,
        rectangleEditor: null,
        editor: null,
        renderUI: function() {
            this.graphic = new Y.Graphic({
                render: this.get(CONTENTBOX).one(".layer"),
                autoDraw: true
            });
            /* Create and add 12 arrows */
            this.createArrow(100, 225, 100, 300, 1);// Horizontal
            this.createArrow(375, 225, 375, 300, 2);
            this.createArrow(650, 225, 650, 300, 3);
            this.createArrow(200, 150, 295, 150, 4);
            this.createArrow(495, 150, 590, 150, 5);
            this.createArrow(200, 375, 295, 375, 6);
            this.createArrow(495, 375, 590, 375, 7);
            this.createArrow(100, 450, 100, 525, 8);
            this.createArrow(375, 450, 375, 525, 9);
            this.createArrow(650, 450, 650, 525, 10);
            this.createArrow(200, 600, 295, 600, 11);
            this.createArrow(495, 600, 590, 600, 12);

            /* Create and add 9 rectangles */
            var i, themes = this.get("themes"),
                    pos = [
                [3, 78], [300, 78], [595, 78],
                [3, 305], [300, 305], [595, 305],
                [3, 530], [300, 530], [595, 530]
            ];
            for (i = 0; i < 9; i += 1) {
                this.createRectangle(pos[i][0], pos[i][1], i, themes[i] || "Undefined");
            }

            /* Init editors */
            this.initArrowEditor();
            this.initRectangleEditor();
        },
        bindUI: function() {
            this.bindDragDrop();
        },
        destructor: function() {
            this.buttonGroup.destroy();
            this.arrowEditor.destroy();
            this.editor.destroy();
            this.rectangleEditor.destroy();
        },
        showRectangleEditor: function(e, rectangle) {
            if (e.domEvent.target.hasClass("label"))                            // Clicks on label dont show editor
                return;

            this.currentRectangle = rectangle;

            this.rectangleEditor.set("headerContent", "Edit definition for " + this.currentRectangle.get("label"));
            this.editor.set('content', rectangle.get('description'));
            this.rectangleEditor.show();
            this.editor.focus();
        },
        showArrowEditor: function(arrow) {
            this.currentArrow = arrow;

            // Set correct image (vertical or horizontal)
            var direction = (arrow.get('orientation') == this.ORIENTATION_HORIZONTAL) ? "horizontal" : "vertical",
                    buttons = this.buttonGroup.getButtons();

            buttons.item(0).set('label', '<span class="icon ' + direction + '-normal"></span>');
            buttons.item(1).set('label', '<span class="icon ' + direction + '-inverse"></span>');
            buttons.item(2).set('label', '<span class="icon ' + direction + '-double"></span>');
            buttons.item(3).set('label', '<span class="icon ' + direction + '-none"></span>');

            this.setArrowEditorButtons(arrow.get('val'));
            this.getArrowEditorInput().set("value", arrow.get('text'));//.focus();
            this.arrowEditor.show();
        },
        createArrow: function(x1, y1, x2, y2, id) {
            //var arrowInstance = Y.Wegas.Facade.VariableDescriptor.cache.find("name", "arrow" + id);
            //var val = arrowInstance.getInstance().get("value");
            var arrowInstance = Y.Wegas.Facade.VariableDescriptor.cache.find("name", "fleche" + id).getInstance(),
                    val = arrowInstance.get("properties").value,
                    text = arrowInstance.get("properties").text,
                    color = this.getColorByVal(val),
                    orientation = x1 == x2, // true = 1: vertical (else horizontal)
                    arrow = this.graphic.addShape({
                type: Y.TeachingArrow,
                stroke: {
                    weight: 5,
                    color: color
                },
                src: [x1, y1],
                tgt: [x2, y2],
                id: id,
                val: val,
                text: text,
                orientation: orientation
            }),
            handleClick = Y.bind(this.showArrowEditor, this, arrow),
                    node = Y.Node(arrow.get('node'));

            node.on('click', handleClick);
            //this.createButton(x1, y1, orientation, handleClick);
            arrow.label = this.createLabel(x1, y1, text, orientation, handleClick);
        },
        createButton: function(x1, y1, orientation, handleClick) {
            // Button to edit arrow
            var cb = this.get("contentBox"),
                    buttonWidget = new Y.Button({
                label: "Éditer",
                render: cb
            }), button = buttonWidget.get("contentBox");

            button.setStyle('position', 'absolute');

            // Apply styles (difference between vertical and horizontal arrow)
            if (orientation == this.ORIENTATION_VERTICAL) {
                button.setStyles({left: x1 - 60, top: y1 + 26});
            } else { // horizontal
                button.setStyles({left: x1 + 16, top: y1 - 40});

            }
            buttonWidget.on('click', handleClick, this);
        },
        createLabel: function(x1, y1, text, orientation, handleClick) {
            var cb = this.get("contentBox"),
                    label = Y.Node.create("<div class='yui3-tooltip'><div class='yui3-tooltip-content'><div class='yui3-widget-bd' style='overflow:hidden;text-overflow:ellipsis;'>Lien blabla blabla blabla</div><div class='yui3-widget-ft'><div></div></div></div></div>");
            cb.append(label);
            label.setStyle('position', 'absolute');
            var child = label.one('*');
            child.one('*').setHTML((text && text.length > 0) ? text : "<em>Click to edit</em>");

            if (orientation == this.ORIENTATION_VERTICAL) {
                label.setStyle('left', x1 + 25);
                label.setStyle('top', y1 + 25);
                child.addClass('yui3-tooltip-align-right');
            } else { // horizontal
                label.setStyle('left', x1 + 13);
                label.setStyle('top', y1 + 25);
                child.addClass('yui3-tooltip-align-bottom');
            }
            label.on('click', handleClick, this);

            return label;
        },
        createRectangle: function(x, y, id, label) {
            //var rectangles = Y.Wegas.Facade.VariableDescriptor.cache.find("name", "rectangles").getAttrs().items;
            //var val = rectangles[id].getInstance().get("value");
            var cb = this.get("contentBox"),
                    rectangleInstance = Y.Wegas.Facade.VariableDescriptor.cache.find("name", "rectangle" + (id + 1)),
                    val = rectangleInstance.getInstance().get("value");
            var ereg = /(.*)\|\|\|/i, // the label is the first part of the string separated with a "|||"
                    label = (val.match(ereg, "$1") && val.match(ereg, "$1")[1]) || label,
                    description = val.replace(ereg, ""),
                    rectangle = new Y.Wegas.TeachingRectangle({
                x: x,
                y: y,
                label: label,
                description: description,
                id: id
            });

            rectangle.render(cb);
            rectangle.on('click', this.showRectangleEditor, this, rectangle);
        },
        saveCurrentArrow: function() {
            Y.Wegas.Facade.VariableDescriptor.sendRequest({
                request: "/Script/Run/" + Y.Wegas.app.get('currentPlayer'),
                cfg: {
                    method: "POST",
                    data: {
                        "@class": "Script",
                        language: "JavaScript",
                        content: "importPackage(com.wegas.core.script);\n" +
                                "\nfleche" + this.currentArrow.get("id") + ".properties.put('value','" + this.currentArrow.get("val") + "');" +
                                "\nfleche" + this.currentArrow.get("id") + ".properties.put('text','" + this.currentArrow.get("text") + "');"
                    }
                }
            });
        },
        saveCurrentRectangle: function() {
            this.saveRectangle(this.currentRectangle);
        },
        saveRectangle: function(rectangle) {
            Y.Wegas.Facade.VariableDescriptor.sendRequest({
                request: "/Script/Run/" + Y.Wegas.app.get('currentPlayer'),
                cfg: {
                    method: "POST",
                    data: {
                        "@class": "Script",
                        language: "JavaScript",
                        content: "importPackage(com.wegas.core.script);\n"
                                + "rectangle" + (rectangle.get("id") + 1) + ".value='" + String(rectangle.get("label")).replace(/'/g, '&#39;') + "|||" + String(rectangle.get("description")).replace(/'/g, '&#39;') + "';"
                    }
                }
            });
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
                xy: [120, 100],
                width: 300,
                zIndex: 50000,
                modal: true,
                visible: false,
                render: true
                        //plugins: [Y.Plugin.Drag]
            });
            this.arrowEditor.addButton({
                value: 'Save',
                section: Y.WidgetStdMod.FOOTER,
                context: this,
                action: function() {
                    var text = this.getArrowEditorInput().get('value');
                    this.currentArrow.setType(this.getArrowEditorType());
                    this.currentArrow.setText(text);
                    this.saveCurrentArrow();
                    this.currentArrow.label.one('* *').setHTML((text && text.length > 0) ? text : "<em>Click to edit</em>");
                    this.arrowEditor.hide();
                }
            });

            var links = this.get("availableLinkLabels"),
                    bodyNode = this.arrowEditor.getStdModNode("body"),
                    inputNode = bodyNode.one("input");

            bodyNode.setStyles({
                padding: "8px",
                overflow: "visible"
            });
            inputNode.plug(Y.Plugin.AutoComplete, {
                resultHighlighter: "phraseMatch",
                //resultFilters: "phraseMatch",
                source: links,
                queryDelay: 0,
                minQueryLength: 0
            });
            inputNode.on(['focus', "click"], function(e) {
                this.ac.sendRequest(this.get("value"));
                this.ac.show();
            });
            inputNode.on("clickoutside", inputNode.ac.hide, inputNode.ac);

            this.buttonGroup = new Y.ButtonGroup({
                srcNode: bodyNode.one(".arrow-buttons"),
                type: 'radio'
            }).render();
        },
        initRectangleEditor: function() {
            this.rectangleEditor = new Y.Panel({
                bodyContent: "<div id='editor'></div>",
                width: 300,
                zIndex: 50000,
                xy: [120, 100],
                modal: true,
                visible: false,
                //plugins: [Y.Plugin.Drag],
                render: true
            });
            this.rectangleEditor.addButton({
                value: 'Save',
                section: Y.WidgetStdMod.FOOTER,
                context: this,
                action: function(e) {
                    this.currentRectangle.set("description", this.editor.get("content"));
                    this.saveCurrentRectangle();
                    this.rectangleEditor.hide();
                }
            });

            var bodyNode = this.rectangleEditor.getStdModNode("body");
            bodyNode.setStyle("padding", "8px");

            this.editor = new Y.EditorBase({
                content: '<p>Test</p>'
            });
            this.editor.plug(Y.Plugin.ITSAToolbar, {
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
            });
            this.editor.render(bodyNode.one("#editor"));
        },
        getColorByVal: function(val) {
            if (val == this.ARROW_NONE) {
                return 'rgb(200,200,200)';
            } else {
                return 'rgb(0,0,0)';
            }
        },
        setArrowEditorButtons: function(val) {
            this.buttonGroup.getButtons().each(function(n) {
                n.toggleClass(Y.ButtonGroup.CLASS_NAMES.SELECTED, +n.get("value") === +val);
            });
        },
        getArrowEditorType: function() {
            return +this.buttonGroup.getSelectedButtons()[0].get("value");
        },
        getArrowEditorInput: function() {
            return this.arrowEditor.getStdModNode("body").one("input");
        },
        bindDragDrop: function() {
            this.get(CONTENTBOX).all('.yui3-wegas-teaching-rectangle').each(function(n) {
                var drop = new Y.DD.Drop({//                                    // Init drop
                    node: n
                }),
                drag = new Y.DD.Drag({//                                        // Init drag
                    node: n
                }).plug(Y.Plugin.DDProxy, {
                    moveOnEnd: false                                            // We don't want the node to move on end drag
                }).plug(Y.Plugin.DDConstrained, {
                    constrain2node: this.get(CONTENTBOX)                        // Keep nodes inside the workarea
                });

                drag.on('drag:drophit', function(e) {
                    var drag = Y.Widget.getByNode(e.drag.get('node')),
                            drop = Y.Widget.getByNode(e.drop.get('node')),
                            tmpDescription = drag.get("description"),
                            tmpLabel = drag.get("label");

                    drag.set("description", drop.get("description"));           // Switch descriptionsand label
                    drag.set("label", drop.get("label"));
                    drop.set("description", tmpDescription);
                    drop.set("label", tmpLabel);
                    this.saveRectangle(drag);
                    this.saveRectangle(drop);
                }, this);
            }, this);
        },
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

    Y.namespace("Wegas").TeachingMain = TeachingMain;
});
