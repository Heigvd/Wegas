/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/* global YUI */

YUI.add("wegas-tutorial", function(Y) {
    "use strict";
    var PANEL_TEMPLATE = "<div class='wegas-tutorial'><div class='container'>" +
        "<div class='wegas-tutorial-content'></div>" +
        "<div class='wegas-tutorial-footer'>" +
        "<span class='wegas-tutorial-counter'></span>" +
        "<span class='wegas-tutorial-button-skip wegas-tutorial-button'>{skip}</span>" +
        "<span class='wegas-tutorial-button-next wegas-tutorial-button'>{next}</span>" +
        "</div></div></div>",
        Promise = Y.Promise,
        POSITION = {
            left: "left",
            right: "right",
            top: "top",
            bottom: "bottom"
        },
        OPOSITE_POS = {
            left: "right",
            right: "left",
            top: "bottom",
            bottom: "top"
        };
    /**
     * @param elementList Array of 
     *  {
     *      html: html to put into the overlay,
     *      pos: Array [ preferred pos, alternate pos ] pos in ["left", "right", "top", "bottom"],
     *      node: Y.Node | selector node to highlight
     *  }
     * @param config Object containing button text default to {skip:"Skip tutorial", next:"Next"}
     * @param index index to start from in elementList, default to 0
     * @return Y.Promise always resolves to last seen index. -1 if an error occured
     */
    function tutorial(elementList, config, index) {
        var panel = Y.Node.create(Y.Lang.sub(PANEL_TEMPLATE, Y.merge({
            skip: "Skip tutorial",
            next: "Next"
        }, config || {}))),
            validElements = elementList.filter(function(element) {
                return getNode(element.node);
            }),
            count = validElements.length,
            timer,
            toDetach = [],
            overlay1 = Y.Node.create("<div class='wegas-tutorial-overlay1'></div>"), //top left
            overlay2 = Y.Node.create("<div class='wegas-tutorial-overlay2'></div>"), //top right
            overlay3 = Y.Node.create("<div class='wegas-tutorial-overlay3'></div>"), //bottom right
            overlay4 = Y.Node.create("<div class='wegas-tutorial-overlay4'></div>"); //bottom left

        function show() {
            timer && timer.cancel();
            showTutorial(panel, validElements[index], index, count);
            highlight(validElements[index], overlay1, overlay2, overlay3, overlay4);
            // timer = Y.later(1000, null, function() {
            //     showTutorial(panel, validElements[index], index, count);
            //     highlight(validElements[index], overlay1, overlay2, overlay3, overlay4);
            // }, null, true);
        }
        index = Y.Lang.isNumber(index) ? index : 0;
        return (new Promise(function(resolve) {
            var body = Y.one("body");
            if (index < count) {
                body.append(panel);
                body.append(overlay1);
                body.append(overlay2);
                body.append(overlay3);
                body.append(overlay4);
                show();
            } else {
                resolve(index);
            }

            toDetach.push(panel.one(".wegas-tutorial-button-next").on("click", function() {
                if (index + 1 < count) {
                    index += 1;
                    show();
                } else {
                    resolve(index);
                }
            }));
            toDetach.push(panel.one(".wegas-tutorial-button-skip").on("click", function() {
                resolve(index);
            }));
            toDetach.push(Y.after("windowresize", show));
        }))
            .catch(function(err) {
                Y.log(err, "error");
                return -1;
            })
            .then(function(index) {
                timer && timer.cancel();
                Y.Array.each(toDetach, function(handle) {
                    handle.detach();
                });
                overlay1.remove(true);
                overlay2.remove(true);
                overlay3.remove(true);
                overlay4.remove(true);
                panel.remove(true);
                return index;
            });
    }
    /**
     * @param {string} nodeSelector css selector
     * @returns {Node} a visible node or undefined
     */
    function getNode(nodeSelector) {
        var all = Y.all(nodeSelector),
            result;

        all.some(function(node) {
            if (node.get("region").width > 0) {
                result = node;
                return true;
            }
        });

        return result;
    }
    function showTutorial(panel, element, index, count) {
        var node = getNode(element.node);
        if (node) {
            node.scrollIntoView();
            panel.one(".wegas-tutorial-content").setHTML(element.html);
            if (count > 1) {
                panel.one(".wegas-tutorial-counter").set("text", (index + 1) + "  / " + count);
            }
            if (index + 1 === count) {
                panel.one(".wegas-tutorial-button-skip").hide();
            }
            Y.later(10, null, setPos, [panel, node, element.pos]);
        }
    }
    /**
     * @param Node panel the panel
     * @param Node node the node
     * @param Array pos [Position, orthogonal position]
     */
    function setPos(panel, node, pos) {
        var region = node.get("region"),
            panelRegion = panel.get("region"),
            x, y, cssClass;
        if (pos && !Y.Lang.isArray(pos)) {
            pos = [pos];
        }
        pos = pos || autoPos(panel, node);
        var margin = 28;
        switch (pos[0]) {
            case POSITION.top:
                y = region.top - panelRegion.height;
                x = region.left + (pos[1] === POSITION.left && panelRegion.width > region.width ?
                    region.width - panelRegion.width : 0) - margin;
                break;
            case POSITION.bottom:
                y = region.bottom + margin;
                x = region.left + (pos[1] === POSITION.left && panelRegion.width > region.width ?
                    region.width - panelRegion.width : 0);
                break;
            case POSITION.left:
                y = region.top + (pos[1] === POSITION.top && panelRegion.height > region.height ?
                    region.height - panelRegion.height : 0);
                x = region.left - panelRegion.width - margin;
                break;
            case POSITION.right:
                y = region.top + (pos[1] === POSITION.top && panelRegion.height > region.height ?
                    region.height - panelRegion.height : 0);
                x = region.right + margin;
                break;
            default:
                Y.log("Unknown position: " + pos[0]);
                break;
        }
        panel.setXY([Math.round(x), Math.round(y)]);
        cssClass = OPOSITE_POS[pos[0]] + "-" + OPOSITE_POS[pos[1]];
        Y.Array.each(['top-left', 'top-right', 'bottom-left', 'bottom-right', 'bottom-left', 'right-top', 'right-bottom', 'left-top', 'left-bottom'], function(cssClass) {
            panel.removeClass(cssClass);
        });
        panel.addClass(cssClass);
        return pos;
    }
    function autoPos(tool, node) {
        var viewport = node.get("viewportRegion"),
            region = node.get("region");
        var vertPos, horizPos;
        var bottomSpace = viewport.height - region.bottom;
        var rightSpace = viewport.width - region.right;
        if (bottomSpace > region.top) {
            vertPos = POSITION.bottom;
        } else {
            vertPos = POSITION.top;
        }
        if (rightSpace > region.left) {
            horizPos = POSITION.right;
        } else {
            horizPos = POSITION.left;
        }
        if (Math.max(bottomSpace, region.top) > Math.max(rightSpace, region.left)) {
            return [vertPos, horizPos];
        }
        return [horizPos, vertPos];
    }
    function highlight(element, overlay1, overlay2, overlay3, overlay4) {
        var node = getNode(element.node);
        var margin = 10;
        if (node) {
            var rect = node.get("region"),
                viewport = node.get("viewportRegion");
            overlay1.setStyles({
                width: Math.max(rect.left + rect.width + margin, 0),
                height: Math.max(rect.top - margin, 0)
            });
            overlay2.setStyles({
                width: Math.max(viewport.width - rect.right - margin, 0),
                height: Math.max(rect.top + rect.height + margin, 0)
            });
            overlay3.setStyles({
                width: Math.max(viewport.width - rect.left + margin, 0),
                height: Math.max(viewport.height - rect.bottom - margin, 0)
            });
            overlay4.setStyles({
                width: Math.max(rect.left - margin, 0),
                height: Math.max(viewport.height - rect.top + margin, 0)
            });
        }
    }

    Y.Wegas.Tutorial = tutorial;
});
