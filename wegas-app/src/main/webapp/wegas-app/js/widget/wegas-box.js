/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileOverview
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
YUI.add('wegas-box', function(Y) {
    'use strict';
    /**
     * @name Y.Wegas.Box
     * @extends Y.Widget
     * @borrows Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable
     * @class Displays a box widget
     * @constructor
     * @description  Display a simple box
     */
    var Box = Y.Base.create(
        'wegas-box',
        Y.Widget,
        [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable],
        {
            /** @lends Y.Wegas.Box# */
            CONTENT_TEMPLATE: null,
            getEditorLabel: function() {
                return Y.Wegas.Helper.stripHtml(this.get('name'));
            }
        },
        {
            /** @lends Y.Wegas.Box */
            EDITORNAME: 'Box',
            ATTRS: {
                name: {
                    value: 'box',
                    type: 'string',
                    view: {label: 'Name'}
                }
            }
        }
    );
    Y.Wegas.Box = Box;



    var Line = Y.Base.create('wegas-line', Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        /** @lends Y.Wegas.Box# */
        CONTENT_TEMPLATE: null,
        getEditorLabel: function() {
            return Y.Wegas.Helper.stripHtml(this.get('name'));
        },
        initializer: function() {
            this.handlers = {};

            this.defs = "<defs>"
                + "  <marker orient='auto' refY='0.0' refX='0.0' id='triangleStart' style='overflow:visible'>"
                + "    <path id='triangle_start_path'"
                + "      d='M 8.5,5 L 0,0 L 8.5,-5 L 8.5,5 z '/>"
                + "  </marker>"
                + "  <marker orient='auto' refY='0.0' refX='0.0' id='triangleEnd' style='overflow:visible'>"
                + "    <path id='triangle_end_path'"
                + "      d='M 0,0.0 L -8,5.0 L -8,-5.0 L 0,0.0 z '/>"
                + "  </marker>"
                + "</defs>";
        },
        destructor: function() {
            var k;
            for (k in this.handlers) {
                this.handlers[k].detach();
            }
            this._windowResizeCb && window.removeEventListener("resize", this._windowResizeCb);
        },
        cross_product: function(x1, y1, x2, y2, x3, y3) {
            return (x2 - x1) * (y3 - y1) - (x3 - x1) * (y2 - y1);
        },
        isSegIntersects: function(x1, y1, x2, y2, x3, y3, x4, y4) {
            return (this.cross_product(x1, y1, x2, y2, x3, y3) * this.cross_product(x1, y1, x2, y2, x4, y4) < 0
                && this.cross_product(x3, y3, x4, y4, x1, y1) * this.cross_product(x3, y3, x4, y4, x2, y2) < 0);
        },
        getIntersection: function(x1, y1, x2, y2, x3, y3, x4, y4) {
            var a1 = y2 - y1;
            var b1 = x1 - x2;
            var c1 = x2 * y1 - x1 * y2;

            var a2 = y4 - y3;
            var b2 = x3 - x4;
            var c2 = x4 * y3 - x3 * y4;

            var denom = a1 * b2 - a2 * b1;
            if (Math.abs(denom) < 0.010) {
                return false;
            } else {
                return [(b1 * c2 - b2 * c1) / denom, (a2 * c1 - a1 * c2) / denom]
            }
        },
        getBoxCentroid: function(box) {
            return [box.x + box.width / 2, box.y + box.height / 2];
        },
        getSegBoxIntersection: function(x1, y1, x2, y2, box) {
            if (this.isSegIntersects(x1, y1, x2, y2, box.left, box.top, box.right, box.top)) {
                return this.getIntersection(x1, y1, x2, y2, box.left, box.top, box.right, box.top);

            } else if (this.isSegIntersects(x1, y1, x2, y2, box.right, box.top, box.right, box.bottom)) {
                return this.getIntersection(x1, y1, x2, y2, box.right, box.top, box.right, box.bottom);

            } else if (this.isSegIntersects(x1, y1, x2, y2, box.left, box.bottom, box.right, box.bottom)) {
                return this.getIntersection(x1, y1, x2, y2, box.left, box.bottom, box.right, box.bottom);

            } else if (this.isSegIntersects(x1, y1, x2, y2, box.left, box.top, box.left, box.bottom)) {
                return this.getIntersection(x1, y1, x2, y2, box.left, box.top, box.left, box.bottom);
            }
            return null;
        },
        getEllipseIntersection: function(deltaY, deltaX, box) {
            var a = box.width / 2;
            var b = box.height / 2;

            var point = [box.left + a, box.top + b]; // init point to ellipse center

            if (Math.abs(deltaY) < 4) {
                // ϑ ~= 0° | 180° => tan(ϑ) = 0
                // less than 4px high means horizontal line
                point[0] += deltaX < 0 ? -a : a;
            } else if (Math.abs(deltaX) < 4) {
                // ϑ ~= +/- 90° => tan(ϑ) = NaN
                // less than 4px wide means vertical line
                point[1] += deltaY < 0 ? -b : b;
            } else {
                var tan = deltaY / deltaX;


                var x = (a * b) / (Math.sqrt(b * b + a * a * tan * tan));
                var y = x * tan;

                if (deltaX < 0) {
                    point[0] -= x;
                    point[1] -= y;
                } else {
                    point[0] += x;
                    point[1] += y;
                }

            }

            return  point;
        },
        bindUI: function() {
            // rely on document resize and layout-resize
            this._windowResizeCb = Y.bind(this.syncUI, this);
            window.addEventListener("resize", this._windowResizeCb);
            this.handlers.layoutResize = Y.Wegas.app.on("layout:resize", Y.bind(this.syncUI, this));

            Y.later(50, this, this.syncUI);
        },
        getOrigin: function() {
            var oNode = this.get("boundingBox").ancestor(".wegas-line-origin");
            if (oNode) {
                var bbox = oNode.getDOMNode().getBoundingClientRect();
                return [bbox.x, bbox.y];
            } else {
                return [0, 0];
            }
        },
        syncUI: function() {
            var startSelector = this.get("startNode");
            var endSelector = this.get("endNode");

            var start, end, width, height, position;

            var startDom;
            var endDom;

            var bbox = this.get("boundingBox").getDOMNode();


            if (startSelector) {
                var startNode = Y.one(startSelector);
                if (startNode) {
                    startDom = startNode.getDOMNode();
                }
            } else {
                startDom = bbox.previousSibling;
            }

            if (endSelector) {
                var endNode = Y.one(endSelector);
                if (endNode) {
                    endDom = endNode.getDOMNode();
                }
            } else {
                endDom = bbox.nextSibling;
            }

            if (startDom && endDom) {

                var startBox = startDom.getBoundingClientRect();
                var endBox = endDom.getBoundingClientRect();

                var top, left;

                // full line, centroid to centroid 
                var startPoint = this.getBoxCentroid(startBox);
                var endPoint = this.getBoxCentroid(endBox);

                if (this.get("startPoint") === "edge") {
                    startPoint = this.getSegBoxIntersection(startPoint[0], startPoint[1], endPoint[0], endPoint[1], startBox);
                } else if (this.get("startPoint") === "ellipse") {
                    startPoint = this.getEllipseIntersection(endPoint[1] - startPoint[1], endPoint[0] - startPoint[0], startBox);
                }

                if (this.get("endPoint") === "edge") {
                    endPoint = this.getSegBoxIntersection(startPoint[0], startPoint[1], endPoint[0], endPoint[1], endBox);
                } else if (this.get("endPoint") === "ellipse") {
                    endPoint = this.getEllipseIntersection(startPoint[1] - endPoint[1], startPoint[0] - endPoint[0], endBox);
                }

                var origin = this.getOrigin();

                if (startPoint && endPoint) {

                    startPoint[0] -= origin[0];
                    startPoint[1] -= origin[1];

                    endPoint[0] -= origin[0];
                    endPoint[1] -= origin[1];

                    width = Math.abs(startPoint[0] - endPoint[0]); //delta x
                    height = Math.abs(startPoint[1] - endPoint[1]); // delty y

                    start = [null, null];
                    end = [null, null];

                    if (startPoint[0] < endPoint[0]) {
                        // left to right
                        left = startPoint[0];
                        start[0] = 0;
                        end[0] = width;
                    } else {
                        // right to left
                        left = endPoint[0];
                        start[0] = width;
                        end[0] = 0;
                    }

                    if (startPoint[1] < endPoint[1]) {
                        // top to bottom
                        top = startPoint[1];
                        start[1] = 0;
                        end[1] = height;
                    } else {
                        //bottom to top
                        top = endPoint[1];
                        start[1] = height;
                        end[1] = 0;
                    }

                    height += 1;
                    width += 1;

                    position = "position: fixed; top: " + (top) + "px; left: " + (left) + "px";
                }
            }

            if (!start || !end) {
                width = 100;
                height = 100;
                start = [0, 0];
                end = [width, height];
                position = null;
            }


            var pathStyle = "";

            if (this.get("startArrow")) {
                pathStyle += "marker-start: url(#triangleStart);";
            }

            if (this.get("endArrow")) {
                pathStyle += "marker-end: url(#triangleEnd);";
            }

            this.get("boundingBox").setContent("<svg "
                //+ "viewbox='-" + margin + " -" + margin + " " + (width + margin) + " " + (height + margin) + "'"
                + "style='" + position + "' width='" + width + "px' height='" + height + "px'>"
                + this.defs
                + "<path "
                + "style='" + pathStyle + "'"
                + "d='M " + start[0] + ' ' + start[1] + ' ' + end[0] + ' ' + end[1] + "'/></svg>");
        }
    }, {
        /** @lends Y.Wegas.Box */
        EDITORNAME: 'Line',
        ATTRS: {
            name: {
                value: 'line',
                type: 'string',
                view: {label: 'Name'}
            },
            startNode: {
                type: "string",
                value: "",
                view: {
                    label: "Start Node",
                    description: "CSS Selector"
                }
            },
            endNode: {
                type: "string",
                value: "",
                view: {
                    label: "End Node",
                    description: "CSS Selector"
                }
            },
            startArrow: {
                type: "boolean",
                value: false,
                view: {
                    label: "arrow on line start"
                }
            },
            endArrow: {
                type: "boolean",
                value: false,
                view: {
                    label: "arrow on line end"
                }
            },
            startPoint: {
                type: "string",
                value: "edge",
                view: {
                    type: "select",
                    label: "put start point on",
                    choices: [
                        "edge",
                        "centroid",
                        "ellipse"
                    ]
                }
            },
            endPoint: {
                type: "string",
                value: "edge",
                view: {
                    type: "select",
                    label: "put end point on",
                    choices: [
                        "edge",
                        "centroid",
                        "ellipse"
                    ]
                }
            }
        }
    });
    Y.Wegas.Line = Line;
});