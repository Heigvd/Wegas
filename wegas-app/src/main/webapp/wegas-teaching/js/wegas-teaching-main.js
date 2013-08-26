YUI.add( "wegas-teaching-main", function ( Y ) {
    "use strict";
    
    var CONTENTBOX = "contentBox", TeachingMain;
    
    TeachingMain = Y.Base.create("wegas-teaching-main", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        
        // Graphic (Y.Graphic used to draw arrows)
        graphic: null,
        // Arrows (persistent data)
        arrow1: null,
        arrow2: null,
        arrow3: null,
        arrow4: null,
        arrow5: null,
        arrow6: null,
        arrow7: null,
        arrow8: null,
        arrow9: null,
        arrow10: null,
        arrow11: null,
        arrow12: null,
        // Arrow const
        ARROW_NONE: 0,
        ARROW_NORMAL: 1,
        ARROW_INVERSE: 2,
        ARROW_DOUBLE: 3,
        // Ref on selected arrow
        currentArrow: null,
        // Rectangles (persistent data)
        rectangle1: null,
        rectangle2: null,
        rectangle3: null,
        rectangle4: null,
        rectangle5: null,
        rectangle6: null,
        rectangle7: null,
        rectangle8: null,
        rectangle9: null,
        // Ref on selected rectangle
        currentRectangle: null,
        // Editors (modal form)
        arrowEditor: null,
        rectangleEditor: null,
        editor: null,
        
        initializer: function(){
            /* Nothing */
        },
        
        showRectangleEditor: function(rectangle) {
            this.currentRectangle = rectangle;
            this.editor.set('content', rectangle.get('label'));
            this.editor.focus();
            this.rectangleEditor.show();
        },
        
        showArrowEditor: function(arrow) {
            this.currentArrow = arrow;
            Y.one('#arrowCurrentValue').setHTML(this.getStringByVal(arrow.get('val')));
            this.arrowEditor.show();
        },
        
        createArrow: function(x1, y1, x2, y2, id) {
            var arrowInstance = Y.Wegas.Facade.VariableDescriptor.cache.find("name", "arrow" + id);
            var val = arrowInstance.getInstance().get("value");
            var color = this.getColorByVal(val);
            var arrow = this.graphic.addShape({
                type: Y.TeachingArrow,
                stroke: {
                    weight: 5,
                    color: color
                },
                src: [x1, y1],
                tgt: [x2, y2],
                id: id,
                val: val
            });
            var handleClick = function(e, parent) {
                parent.showArrowEditor(arrow);
            };
            Y.Node(arrow.get('node')).on('click', handleClick, this, this);
            return arrow;
        },
        
        createRectangle: function(x, y, id, cb) {
            var rectangleInstance = Y.Wegas.Facade.VariableDescriptor.cache.find("name", "rectangle" + id);
            var val = rectangleInstance.getInstance().get("value");
            var rectangle = new Y.Wegas.TeachingRectangle({
                x: x,
                y: y,
                label: val,
                id: id
            });
            var handleClick = function(e, parent) {
                parent.showRectangleEditor(rectangle);
            };
            Y.one("#rectangle" + id).on('click', handleClick, this, this);
            rectangle.render(cb.one("#rectangle" + id));
            return rectangle;
        },
        
        renderUI: function() {
            var cb = this.get(CONTENTBOX);
            cb.append("<div id='layer' style='width:100%;height:620px;'></div>");
            cb.append("<div id='arrowEditor'><div class='yui3-widget-bd' style='padding:8px;'><p>Lien: </p><div id='arrowCurrentValue'></div><button id='btnArrowNormal'>Normal</button><button id='btnArrowInverse'>Inverse</button><button id='btnArrowDouble'>Double</button><button id='btnArrowNone'>Aucun</button></div></div>");
            cb.append("<div id='rectangleEditor'><div class='yui3-widget-bd' style='padding:8px;'><p>Contenu:</p><div id='editor'></div><button id='btnSaveRectangle'>Sauvegarder</button></div></div>");
            cb.append("<div id='rectangle1' class='invisible'></div>");
            cb.append("<div id='rectangle2' class='invisible'></div>");
            cb.append("<div id='rectangle3' class='invisible'></div>");
            cb.append("<div id='rectangle4' class='invisible'></div>");
            cb.append("<div id='rectangle5' class='invisible'></div>");
            cb.append("<div id='rectangle6' class='invisible'></div>");
            cb.append("<div id='rectangle7' class='invisible'></div>");
            cb.append("<div id='rectangle8' class='invisible'></div>");
            cb.append("<div id='rectangle9' class='invisible'></div>");
            
            this.graphic = new Y.Graphic({render: "#layer", autoDraw: true});
            /* Create and add 12 arrows */
            this.arrow1 = this.createArrow(100, 225, 100, 300, 1);
            this.arrow2 = this.createArrow(375, 225, 375, 300, 2);
            this.arrow3 = this.createArrow(625, 225, 625, 300, 3);
            this.arrow4 = this.createArrow(200, 150, 275, 150, 4);
            this.arrow5 = this.createArrow(475, 150, 550, 150, 5);
            this.arrow6 = this.createArrow(200, 375, 275, 375, 6);
            this.arrow7 = this.createArrow(475, 375, 550, 375, 7);
            this.arrow8 = this.createArrow(100, 450, 100, 525, 8);
            this.arrow9 = this.createArrow(375, 450, 375, 525, 9);
            this.arrow10 = this.createArrow(625, 450, 625, 525, 10);
            this.arrow11 = this.createArrow(200, 600, 275, 600, 11);
            this.arrow12 = this.createArrow(475, 600, 550, 600, 12);
            /* Create and add 9 rectangles */
            this.rectangle1 = this.createRectangle(3, 78, 1, cb);            
            this.rectangle2 = this.createRectangle(280, 78, 2, cb);
            this.rectangle3 = this.createRectangle(555, 78, 3, cb);
            this.rectangle4 = this.createRectangle(3, 305, 4, cb);
            this.rectangle5 = this.createRectangle(280, 305, 5, cb);
            this.rectangle6 = this.createRectangle(555, 305, 6, cb);
            this.rectangle7 = this.createRectangle(3, 530, 7, cb);
            this.rectangle8 = this.createRectangle(280, 530, 8, cb);
            this.rectangle9 = this.createRectangle(555, 530, 9, cb);
            
            this.initArrowEditor();
            this.initRectangleEditor();
        },
        
        bindUI: function() {

        },
                
        syncUI: function() {
    
        },
                
        destructor: function() {

        },
        
        saveCurrentArrow: function() {
            Y.Wegas.Facade.VariableDescriptor.sendRequest({
                request: "/Script/Run/" + Y.Wegas.app.get('currentPlayer'),
                headers: {
                    'Content-Type': 'application/json; charset=ISO-8859-1',
                    'Managed-Mode': 'true'
                },
                cfg: {
                    method: "POST",
                    data: Y.JSON.stringify({
                        "@class": "Script",
                        "language": "JavaScript",
                        "content": "importPackage(com.wegas.core.script);\narrow" + this.currentArrow.get("id") + ".value=" + this.currentArrow.get("val") + ";"
                    })
                }
            });
        },
                
        saveCurrentRectangle: function() {
            Y.Wegas.Facade.VariableDescriptor.sendRequest({
                request: "/Script/Run/" + Y.Wegas.app.get('currentPlayer'),
                headers: {
                    'Content-Type': 'application/json; charset=ISO-8859-1',
                    'Managed-Mode': 'true'
                },
                cfg: {
                    method: "POST",
                    data: Y.JSON.stringify({
                        "@class": "Script",
                        "language": "JavaScript",
                        "content": "importPackage(com.wegas.core.script);\nrectangle" + this.currentRectangle.get("id") + ".value='" + String(this.currentRectangle.get("label")).replace(/'/g, '&#39;') + "';"
                    })
                }
            });
        },
                
        initArrowEditor: function() {
            this.arrowEditor = new Y.Panel({
                srcNode: "#arrowEditor",
                headerContent: "Editeur lien",
                width: 300,
                zIndex: 5,
                centered: true,
                modal: true,
                visible: false,
                render: true,
                plugins: [Y.Plugin.Drag]
            });
            
            var onNormalClick = function(e, parent) {
                parent.currentArrow.setType(parent.ARROW_NORMAL);
                parent.saveCurrentArrow();
                parent.arrowEditor.hide();
            };
            var btnNormal = new Y.Button({
               srcNode: '#btnArrowNormal'
            }).render();
            btnNormal.on('click', onNormalClick, this, this);
            
            var onInverseClick = function(e, parent) {
                parent.currentArrow.setType(parent.ARROW_INVERSE);
                parent.saveCurrentArrow();
                parent.arrowEditor.hide();
            };
            var btnInverse = new Y.Button({
                srcNode: '#btnArrowInverse'
            }).render();
            btnInverse.on('click', onInverseClick, this, this);
            
            var onDoubleClick = function(e, parent) {
                parent.currentArrow.setType(parent.ARROW_DOUBLE);
                parent.saveCurrentArrow();
                parent.arrowEditor.hide();
            };
            var btnDouble = new Y.Button({
                srcNode: '#btnArrowDouble'
            }).render();
            btnDouble.on('click', onDoubleClick, this, this);
            
            var onNoneClick = function(e, parent) {
                parent.currentArrow.setType(parent.ARROW_NONE);
                parent.saveCurrentArrow();
                parent.arrowEditor.hide();
            };
            var btnNone = new Y.Button({
                srcNode: '#btnArrowNone'
            }).render();
            btnNone.on('click', onNoneClick, this, this);
        },
                
        initRectangleEditor: function() {
            this.rectangleEditor = new Y.Panel({
               srcNode: "#rectangleEditor",
               headerContent: "Editeur définition",
               width: 300,
               zIndex: 5,
               centered: true,
               modal: true,
               visible: false,
               render: true,
               plugins: [Y.Plugin.Drag]
            });
            
            var onSaveClick = function(e, parent) {
                parent.currentRectangle.set("label", parent.editor.get("content"));
                parent.currentRectangle.syncUI();
                //Y.one("#rectangle" + parent.currentRectangle.get("id")).setHTML(parent.editor.get("content"));
                parent.saveCurrentRectangle();
                parent.rectangleEditor.hide();
            };
            var btnSave = new Y.Button({
                srcNode: '#btnSaveRectangle'
            }).render();
            btnSave.on('click', onSaveClick, this, this);
            
            this.editor = new Y.EditorBase({
                content: '<p>Test</p>'
            });
            this.editor.render('#editor');
        },
        
        getColorByVal: function(val) {
            if (val === this.ARROW_NONE) {
                return 'rgb(200,200,200)';
            }
            else {
                return 'rgb(0,0,0)';
            }
        },
        
        getStringByVal: function(val) {
            switch (val) {
                case this.ARROW_NORMAL:
                    return "Normal";
                case this.ARROW_INVERSE:
                    return "Inverse";
                case this.ARROW_DOUBLE:
                    return "Double";
                case this.ARROW_NONE:
                    return "Aucun";
                default:
                    return "UNKNOWN";
            }
        }
        
    }, {
        ATTRS: {
            
        }
    });
    
    Y.namespace("Wegas").TeachingMain = TeachingMain;
});
