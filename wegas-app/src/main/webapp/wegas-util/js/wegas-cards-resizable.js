/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @author Raphaël Schmutz <raph@hat-owl.cc>
 */
YUI.add('wegas-cards-resizable', function (Y) {
    "use strict";
    var HOST = "host",
        CONTENT_BOX = "contentBox";
    Y.Wegas.CardsResizable = Y.Base.create("wegas-cards-resizable", Y.Plugin.Base, [Y.Wegas.Plugin, Y.Wegas.Editable], {
        LIMITS: {
            LARGE: 0,
            MEDIUM: 0,
            SMALL: 0
        },
        size: {
            title: 150,
            illustration: 0,
            blocs: {
                monitoring: {
                    cases: 0,
                    large: 0,
                    medium: 0,
                    small: 0
                },
                action: {
                    cases: 0,
                    large: 0,
                    medium: 0,
                    small: 0
                }
            }
        },
        _initValues: function () {
            var host = this.get(HOST),
                size = this.size,
                card = host.get("cardsData")[0] || [],
                smallTop, smallBottom,
                cardNode;
            cardNode = host.get(CONTENT_BOX).one(".card");
            size.illustration = (cardNode && cardNode.hasClass("card--illustred")) ? 80 : 0;
            Y.Array.each(card.blocs, function (bloc) {
                var blocs = size.blocs;
                blocs[bloc.cardBlocType].large += 2;
                blocs[bloc.cardBlocType].medium += 2;
                blocs[bloc.cardBlocType].small += (bloc.cardBlocType === "action" ? 2 : 0);
                Y.Array.each(bloc.items, function () {
                    blocs[bloc.cardBlocType].cases = blocs[bloc.cardBlocType].cases + 1;
                    blocs[bloc.cardBlocType].large += ((bloc.cardBlocType === "monitoring") ? 80 : 65);
                    blocs[bloc.cardBlocType].medium += 65;
                    blocs[bloc.cardBlocType].small += 65;
                }, this);
            }, this);
            smallTop = size.illustration + size.title + size.blocs.action.small;
            smallBottom = size.blocs.monitoring.small;
            this.LIMITS.SMALL = (smallTop > smallBottom) ? smallTop : smallBottom;
            this.LIMITS.MEDIUM = size.illustration + size.title + size.blocs.monitoring.medium + size.blocs.action.medium;
            this.LIMITS.LARGE = size.illustration + size.title + size.blocs.monitoring.large + size.blocs.action.large;
            host.get(CONTENT_BOX).addClass("resizable");
        },
        _resizeElements: function (size) {
            var sizeCharged = 0;
            this.get(HOST).get(CONTENT_BOX).all(".card__title").removeAttribute("style");
            this.get(HOST).get(CONTENT_BOX).all(".bloc").removeAttribute("style");
            switch (size) {
                case "BIG":
                    sizeCharged = this.size.illustration + this.size.blocs.monitoring.large + this.size.blocs.action.large;
                    break;
                case "LARGE":
                    sizeCharged = this.size.illustration + this.size.blocs.monitoring.medium + this.size.blocs.action.medium;
                    break;
                case "MEDIUM":
                    sizeCharged = this.size.illustration + this.size.blocs.action.medium;
                    this.get(HOST).get(CONTENT_BOX).all(".card__blocs--monitoring .bloc").setStyle("width", (100 / this.size.blocs.monitoring.cases) + "%");
                    break;
                case "SMALL":
                    sizeCharged = null;
                    break;
            }
            if (sizeCharged) {
                this.get(HOST).get(CONTENT_BOX).all(".card__title").setStyle("width", "calc(100% - " + sizeCharged + "px)");
            }
        },
        _checkResize: function (cardsWidth, limitIndex) {
            var limits = ["BIG", "LARGE", "MEDIUM", "SMALL"];
            if (cardsWidth > 0 && limits[limitIndex]) {
                if (limits[limitIndex + 1]) {
                    if (cardsWidth > this.LIMITS[limits[limitIndex + 1]]) {
                        if (!this.get(HOST).get(CONTENT_BOX).hasClass("resizable--" + limits[limitIndex].toLowerCase())) {
                            this.resetClassSize();
                            this.get(HOST).get(CONTENT_BOX).addClass("resizable--" + limits[limitIndex].toLowerCase());
                            this._resizeElements(limits[limitIndex]);
                        }
                    } else {
                        limitIndex += 1;
                        this._checkResize(cardsWidth, limitIndex);
                    }
                } else {
                    if (!this.get(HOST).get(CONTENT_BOX).hasClass("resizable--" + limits[limitIndex].toLowerCase())) {
                        this.resetClassSize();
                        this.get(HOST).get(CONTENT_BOX).addClass("resizable--" + limits[limitIndex].toLowerCase());
                        this._resizeElements(limits[limitIndex]);
                    }
                }
            }
        },
        resetClassSize: function () {
            var context = this,
                limits = ["BIG", "LARGE", "MEDIUM", "SMALL"];
            limits.forEach(function (limit) {
                context.get(HOST).get(CONTENT_BOX).removeClass("resizable--" + limit.toLowerCase());
            });
        },
        resize: function () {
            var cardNode, cardsWidth;
            cardNode = this.get(HOST).get(CONTENT_BOX).one(".card");
            if (cardNode) {
                cardsWidth = cardNode.get("offsetWidth");
            }
            this._checkResize(cardsWidth, 0);
        },
        initializer: function () {
            var resizeTimer = null;
            this.afterHostEvent("render", function () {
                YUI.use("event-resize", function(Y) {
                    this._initValues();
                    this.resizeHandle = Y.on("windowresize", function () { // "windowresize" instead of just "resize"
                        // Is this ever executed?
                        clearTimeout(resizeTimer);
                        resizeTimer = setTimeout(Y.bind(this.resize, this), 250);
                    } /*, this */);
                });
            });
        },
        destructor: function () {
            this.resizeHandle.detach();
            this.get(CONTENT_BOX) && this.get(CONTENT_BOX).removeClass("resizable");
        }
    });
    Y.Wegas.CardsResizable.NS = "CardsResizable";
});
