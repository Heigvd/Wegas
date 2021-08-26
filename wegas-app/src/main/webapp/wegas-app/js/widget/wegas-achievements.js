/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author maxence
 */
YUI.add('wegas-achievements', function(Y) {
    'use strict';

    function findAllAchievementByQuest(quest) {
        var all = Y.Wegas.Facade.Variable.cache.findAll("@class", "AchievementDescriptor");
        if (quest) {
            return all.filter(function(ad) {
                return ad.get("quest") === quest;
            });
        } else {
            return all;
        }
    }

    var CONTENTBOX = 'contentBox';

    var QuestProgressBar = Y.Base.create(
        'wegas-achievements-progressbar',
        Y.Widget,
        [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable],
        {
            renderUI: function() {
                this.get(CONTENTBOX).setHTML(
                    "<div class='progressbar__text'></div>"
                    + "<div class='progressbar__container'>"
                    + "<div class='progressbar__bar' style='width: 0%'>"
                    + "<div class='progressbar__value'></div>"
                    + "</div>"
                    + "</div>");
            },
            bindUI: function() {
                this.vdUpdateHandler = Y.Wegas.Facade.Instance.after('update', this.syncUI, this);
            },
            syncUI: function() {
                // find relevant descriptors
                var all = findAllAchievementByQuest(this.get("quest"));
                // sum weights
                var stats = all.reduce(function(acc, curr) {
                    acc.total += curr.get("weight");
                    if (curr.getInstance().get("achieved")) {
                        acc.current += curr.get("weight");
                    }
                    return acc;
                }, {total: 0, current: 0});

                // compute data
                var p = ((stats.current / stats.total) * 100).toFixed() + "%";
                var label;
                switch (this.get("displayValue")) {
                    case 'no':
                        label = "";
                        break;
                    case 'absolute':
                        label = stats.current + " / " + stats.total;
                        break;
                    case 'percentage':
                    default:
                        label = p;
                        break;
                }

                // update display
                var cb = this.get(CONTENTBOX);
                cb.setAttribute("title", label);
                cb.toggleClass("showText", this.get("display") === 'text');
                cb.toggleClass("showBar", this.get("display") === 'bar');

                cb.one(".progressbar__text").setContent(label);
                cb.one(".progressbar__bar").setStyle("width", p);
                cb.one(".progressbar__value").setContent(label);
            }
            ,
            getEditorLabel: function() {
                return "ProgressBar(" + this.get("quest") + ")";
            },
            destructor: function() {
                this.vdUpdateHandler.detach();
            }
        },
        {
            EDITORNAME: 'Progress Bar',
            ATTRS: {
                quest: {
                    type: "string",
                    minLength: 1,
                    view: {
                        label: 'Quest',
                        type: 'questselect'
                    }
                },
                display: {
                    view: {
                        type: 'select',
                        choices: [
                            {
                                value: 'bar'
                            }, {
                                value: 'text'
                            }
                        ],
                        label: "Display"
                    }
                },
                displayValue: {
                    view: {
                        type: 'select',
                        choices: [
                            {
                                value: 'no'
                            }, {
                                value: 'percentage'
                            }, {
                                value: 'absolute'
                            }
                        ],
                        label: "Value Display"
                    }
                }
            }
        }
    );
    Y.Wegas.QuestProgressBar = QuestProgressBar;


    var AchievementPopup = Y.Base.create(
        'wegas-achievements-popup',
        Y.Widget,
        [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable],
        {
            renderUI: function() {
                // build status map
                ////////////////////
                // find relevant descriptors
                var all = findAllAchievementByQuest(this.get("quest"));
                var status = all.reduce(function(acc, curr) {
                    acc[curr.get("id")] = curr.getInstance().get("achieved");
                    return acc;
                }, {});
                this._status = status;

            },
            bindUI: function() {
                this.vdUpdateHandler = Y.Wegas.Facade.Instance.after('update', this.syncUI, this);
            },
            syncUI: function() {
                // find relevant descriptors
                var all = findAllAchievementByQuest(this.get("quest"));

                all.forEach(function(ad) {
                    var achieved = ad.getInstance().get("achieved");
                    if (achieved) {
                        if (!this._status[ad.get("id")]) {
                            this._status[ad.get("id")] = true;
                            Y.Wegas.Alerts.showNotification(I18n.t(ad.get("message")) || "You got a badge", {
                                iconCss: "fa " + (ad.get("icon") || "fa fa-certificate")
                            });
                        }
                    }
                    this._status[ad.get("id")] = achieved;
                }, this);
            }
            ,
            getEditorLabel: function() {
                return "AchievementPopup(" + this.get("quest") + ")";
            },
            destructor: function() {
                this.vdUpdateHandler.detach();
            }
        },
        {
            EDITORNAME: 'AchievementPopup',
            ATTRS: {
                quest: {
                    type: "string",
                    minLength: 1,
                    view: {
                        label: 'Quest',
                        type: 'questselect'
                    }
                }
            }
        }
    );
    Y.Wegas.AchievementPopup = AchievementPopup;

    var AchievementExhibition = Y.Base.create(
        'wegas-achievements-exhibition',
        Y.Widget,
        [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable],
        {
            renderUI: function() {
            },
            bindUI: function() {
                this.vdUpdateHandler = Y.Wegas.Facade.Instance.after('update', this.syncUI, this);
            },
            syncUI: function() {
                // find relevant descriptors
                var all = findAllAchievementByQuest(this.get("quest"));
                const badges = all.filter(function(ad) {
                    return ad.getInstance().get("achieved");
                }).map(function(ad) {
                    var icon = ad.get("icon");
                    var color = ad.get("color");

                    return "<div>"
                        + "<span class='fa-stack fa-3x'>"
                        + "<i class='fa fa-certificate fa-stack-2x'></i>"
                        + (icon ?
                            "<i class='fa fa-circle fa-stack-2x' style='color:white;font-size: 1.3em; color: white; top: 13px;'></i>"
                            + "<i class='fa " + icon + " fa-stack-1x'"
                            + "style='font-size:0.7em;" + (color ? "color:" + color + ";'" : "") + "></i>" : '')
                        + "</span>"
                        + "<span>"
                        + (I18n.t(ad.get("message")) || "You got a badge")
                        + "</span>"
                        + "</div>";
                });
                this.get(CONTENTBOX).setHTML(badges.join(""));
            }
            ,
            getEditorLabel: function() {
                return "AchievementExhibition(" + (this.get("quest") || "all") + ")";
            },
            destructor: function() {
                this.vdUpdateHandler.detach();
            }
        },
        {
            EDITORNAME: 'AchievementExhibition',
            ATTRS: {
                quest: {
                    type: "string",
                    minLength: 0,
                    view: {
                        label: 'Quest',
                        type: 'questselect'
                    }
                }
            }
        }
    );
    Y.Wegas.AchievementExhibition = AchievementExhibition;


});
