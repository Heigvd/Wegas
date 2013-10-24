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
        btnArrowNormal: null,
        btnArrowInverse: null,
        btnArrowDouble: null,
        btnArrowNone: null,
        rectangleEditor: null,
        editor: null,
        renderUI: function() {
            this.graphic = new Y.Graphic({
                render: this.get(CONTENTBOX).one(".layer"),
                autoDraw: true
            });
            /* Create and add 12 arrows */
            this.createArrow(100, 225, 100, 300, 1);
            this.createArrow(375, 225, 375, 300, 2);
            this.createArrow(650, 225, 650, 300, 3);
            this.createArrow(200, 150, 275, 150, 4);
            this.createArrow(475, 150, 550, 150, 5);
            this.createArrow(200, 375, 275, 375, 6);
            this.createArrow(475, 375, 550, 375, 7);
            this.createArrow(100, 450, 100, 525, 8);
            this.createArrow(375, 450, 375, 525, 9);
            this.createArrow(650, 450, 650, 525, 10);
            this.createArrow(200, 600, 275, 600, 11);
            this.createArrow(475, 600, 550, 600, 12);
            /* Create and add 9 rectangles */
            this.createRectangle(3, 78, 0);
            this.createRectangle(280, 78, 1);
            this.createRectangle(555, 78, 2);
            this.createRectangle(3, 305, 3);
            this.createRectangle(280, 305, 4);
            this.createRectangle(555, 305, 5);
            this.createRectangle(3, 530, 6);
            this.createRectangle(280, 530, 7);
            this.createRectangle(555, 530, 8);
            /* Init editors */
            this.initArrowEditor();
            this.initRectangleEditor();
        },
        bindUI: function() {

        },
        syncUI: function() {

        },
        destructor: function() {
            this.btnArrowNormal.destroy();
            this.btnArrowInverse.destroy();
            this.btnArrowDouble.destroy();
            this.btnArrowNone.destroy();
            this.arrowEditor.destroy();
            this.editor.destroy();
            this.rectangleEditor.destroy();
        },
        showRectangleEditor: function(e, rectangle) {
            this.currentRectangle = rectangle;
            this.editor.set('content', rectangle.get('label'));
            this.rectangleEditor.show();
            this.editor.focus();
        },
        showArrowEditor: function(arrow) {
            this.currentArrow = arrow;
            // Set correct image (vertical or horizontal)
            var direction = (arrow.get('orientation') === this.ORIENTATION_HORIZONTAL) ? "horizontal" : "vertical";
            this.btnArrowNormal.set('label', '<span class="icon ' + direction + '-normal"></span>');
            this.btnArrowInverse.set('label', '<span class="icon ' + direction + '-inverse"></span>');
            this.btnArrowDouble.set('label', '<span class="icon ' + direction + '-double"></span>');
            this.btnArrowNone.set('label', '<span class="icon ' + direction + '-none"></span>');

            this.setArrowEditorButtons(arrow.get('val'));
            this.arrowEditor.show();
            this.getArrowEditorInput().set("value", arrow.get('text')).focus();
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

            this.createButton(x1, y1, orientation, handleClick);
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
            if (orientation === this.ORIENTATION_VERTICAL) {
                button.setStyles({left: x1 - 60, top: y1 + 26});

            } else { // horizontal
                button.setStyles({left: x1 + 16, top: y1 - 40});

            }
            buttonWidget.on('click', handleClick, this);
        },
        createLabel: function(x1, y1, text, orientation, handleClick) {
            var cb = this.get("contentBox"),
                    label = Y.Node.create("<div class='yui3-tooltip'><div class='yui3-tooltip-content'><div class='yui3-widget-bd' style='white-space:nowrap;overflow:hidden;text-overflow:ellipsis;'>Lien blabla blabla blabla</div><div class='yui3-widget-ft'><div></div></div></div></div>");

            cb.append(label);

            label.setStyle('position', 'absolute');
            var child = label.one('*');
            child.one('*').setHTML(text);
            child.setStyle('height', '30px');

            if (orientation === this.ORIENTATION_VERTICAL) {
                label.setStyle('left', x1 + 25);
                label.setStyle('top', y1 + 25);
                child.addClass('yui3-tooltip-align-right');
                child.setStyle('width', '70px');
            } else { // horizontal
                label.setStyle('left', x1 + 13);
                label.setStyle('top', y1 + 25);
                child.addClass('yui3-tooltip-align-bottom');
                child.setStyle('width', '60px');
            }
            label.on('click', handleClick, this);

            return label;
        },
        createRectangle: function(x, y, id) {
            //var rectangles = Y.Wegas.Facade.VariableDescriptor.cache.find("name", "rectangles").getAttrs().items;
            //var val = rectangles[id].getInstance().get("value");
            var cb = this.get("contentBox"),
                    rectangleInstance = Y.Wegas.Facade.VariableDescriptor.cache.find("name", "rectangle" + (id + 1)),
                    val = rectangleInstance.getInstance().get("value"),
                    rectangle = new Y.Wegas.TeachingRectangle({
                        x: x,
                        y: y,
                        label: val,
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
                        "language": "JavaScript",
                        "content": "importPackage(com.wegas.core.script);\n" +
                                "\nfleche" + this.currentArrow.get("id") + ".properties.put('value','" + this.currentArrow.get("val") + "');" +
                                "\nfleche" + this.currentArrow.get("id") + ".properties.put('text','" + this.currentArrow.get("text") + "');"
                    }
                }
            });
        },
        saveCurrentRectangle: function() {
            Y.Wegas.Facade.VariableDescriptor.sendRequest({
                request: "/Script/Run/" + Y.Wegas.app.get('currentPlayer'),
                cfg: {
                    method: "POST",
                    data: {
                        "@class": "Script",
                        "language": "JavaScript",
                        "content": "importPackage(com.wegas.core.script);\nrectangle" + (this.currentRectangle.get("id") + 1) + ".value='" + String(this.currentRectangle.get("label")).replace(/'/g, '&#39;') + "';"
                    }
                }
            });
        },
        initArrowEditor: function() {
            this.arrowEditor = new Y.Panel({
                headerContent: "Éditer le lien",
                bodyContent: "<input /><br />",
                xy: [120, 100],
                width: 300,
                zIndex: 50000,
                modal: true,
                visible: false,
                render: true,
                plugins: [Y.Plugin.Drag]
            });
            this.arrowEditor.addButton({
                value: 'Sauvegarder',
                section: Y.WidgetStdMod.FOOTER,
                context: this,
                action: function(e) {
                    var text = this.getArrowEditorInput().get('value');
                    this.currentArrow.setType(this.getArrowEditorType());
                    this.currentArrow.setText(text);
                    this.saveCurrentArrow();
                    this.currentArrow.label.one('* *').setHTML(text);
                    this.arrowEditor.hide();
                }
            });

            var links = [], listLinks = Y.Wegas.Facade.VariableDescriptor.cache.find("name", "links").getAttrs().items;
            for (var i = 0; i < listLinks.length; i++) {
                links.push(listLinks[i].getInstance().get("value"));
            }

            var bodyNode = this.arrowEditor.getStdModNode("body");
            bodyNode.setStyle("padding", "8px");

            bodyNode.one("input").plug(Y.Plugin.AutoComplete, {
                resultHighlighter: "phraseMatch",
                resultFilters: "phraseMatch",
                source: links,
                minQueryLength: 0
            });

            this.btnArrowNormal = new Y.ToggleButton({
                label: '<span class="icon horizontal-normal"></span>'
            }).render(bodyNode);
            this.btnArrowNormal.on('click', function() {
                this.setArrowEditorButtons(this.ARROW_NORMAL);
            }, this);

            this.btnArrowInverse = new Y.ToggleButton({
                label: '<span class="icon horizontal-inverse"></span>'
            }).render(bodyNode);
            this.btnArrowInverse.on('click', function() {
                this.setArrowEditorButtons(this.ARROW_INVERSE);
            }, this);

            this.btnArrowDouble = new Y.ToggleButton({
                label: '<span class="icon horizontal-double"></span>'
            }).render(bodyNode);
            this.btnArrowDouble.on('click', function() {
                this.setArrowEditorButtons(this.ARROW_DOUBLE);
            }, this);

            this.btnArrowNone = new Y.ToggleButton({
                label: '<span class="icon horizontal-none"></span>'
            }).render(bodyNode);
            this.btnArrowNone.on('click', function() {
                this.setArrowEditorButtons(this.ARROW_NONE);
            }, this);
        },
        initRectangleEditor: function() {
            this.rectangleEditor = new Y.Panel({
                headerContent: "Éditer la définition",
                bodyContent: "<div id='editor'></div>",
                width: 300,
                zIndex: 50000,
                xy: [120, 100],
                modal: true,
                visible: false,
                plugins: [Y.Plugin.Drag],
                render: true
            });
            this.rectangleEditor.addButton({
                value: 'Sauvegarder',
                section: Y.WidgetStdMod.FOOTER,
                context: this,
                action: function(e) {
                    this.currentRectangle.set("label", this.editor.get("content"));
                    this.currentRectangle.syncUI();
                    this.saveCurrentRectangle();
                    this.rectangleEditor.hide();
                }
            });

            var bodyNode = this.rectangleEditor.getStdModNode("body");
            bodyNode.setStyle("padding", "8px");

            this.editor = new Y.EditorBase({
                content: '<p>Test</p>'
            });
            this.editor.render(bodyNode);
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
        },
        getColorByVal: function(val) {
            if (val == this.ARROW_NONE) {
                return 'rgb(200,200,200)';
            }
            else {
                return 'rgb(0,0,0)';
            }
        },
        setArrowEditorButtons: function(val) {
            this.btnArrowNormal.set('pressed', false);
            this.btnArrowInverse.set('pressed', false);
            this.btnArrowDouble.set('pressed', false);
            this.btnArrowNone.set('pressed', false);

            switch (parseInt(val)) {
                case this.ARROW_NORMAL:
                    this.btnArrowNormal.set('pressed', true);
                    break;
                case this.ARROW_INVERSE:
                    this.btnArrowInverse.set('pressed', true);
                    break;
                case this.ARROW_DOUBLE:
                    this.btnArrowDouble.set('pressed', true);
                    break;
                case this.ARROW_NONE:
                    this.btnArrowNone.set('pressed', true);
                    break;
                default:
                    Y.log("unknown");
                    break;
            }
        },
        getArrowEditorType: function() {
            if (this.btnArrowNormal.get('pressed')) {
                return this.ARROW_NORMAL;
            }
            else if (this.btnArrowInverse.get('pressed')) {
                return this.ARROW_INVERSE;
            }
            else if (this.btnArrowDouble.get('pressed')) {
                return this.ARROW_DOUBLE;
            }
            else if (this.btnArrowNone.get('pressed')) {
                return this.ARROW_NONE;
            }
        },
        getArrowEditorInput: function() {
            return this.arrowEditor.getStdModNode("body").one("input");
        }
    });

    Y.namespace("Wegas").TeachingMain = TeachingMain;
});
