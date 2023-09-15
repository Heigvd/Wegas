/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/* global Variable, self, gameModel, Event, Java, com, QuestionFacade, I18n */

/**
 * @fileoverview
 * @author Maxence Laurent <maxence.laurent@gmail.com>
 */

var WegasDashboard = (function () {
    "use strict";
    var dashConfigs = {};

    var Long = Java.type("java.lang.Long");

    var defaultDashboardName = 'overview';

    // Record<OverviewName, function[]>
    var initCallbacks = {};

    function runInitCallbacks(dashboardName) {
        var cbs = initCallbacks[dashboardName] || [];

        var originalDefaultDashboardName = defaultDashboardName;
        defaultDashboardName = dashboardName;
        for (var i in cbs) {
            var cb = cbs[i];
            if (cb instanceof Function){
                cb();
            }
        }
        defaultDashboardName = originalDefaultDashboardName;
    }

    function registerInitCallback(initCb, dashboardName) {
        if (!dashboardName) {
           dashboardName = defaultDashboardName;
        }
        if (initCb instanceof Function === false) {
            throw "Callback is not a function";
        }

        initCallbacks[dashboardName] = initCallbacks[dashboardName] || [];

        initCallbacks[dashboardName].push(initCb);
    }

    function getInstances(name) {
        return Variable.getInstancesByKeyStringId(Variable.find(gameModel, name));
    }

    function getOrCreateDashboard(dashboardName) {
        var dName = dashboardName || defaultDashboardName;
        if (!dashConfigs[dName]) {
            dashConfigs[dName] = {};
        }
        return dashConfigs[dName];
    }

    function getOrCreateSection(dashboardName, sectionName) {
        var sName = sectionName || "monitoring";
        var dashboard = getOrCreateDashboard(dashboardName || defaultDashboardName);
        var section = (dashboard[sName] = dashboard[sName] || {
            title: sName,
            items: {}
        });
        return section;
    }

    function registerVariable(varName, userConfig) {
        var cfg = userConfig || {};

        var section = getOrCreateSection(cfg.dashboard, cfg.section);

        var id = cfg.id || varName;

        // check id
        var dashboard = getOrCreateDashboard(cfg.dashboard);
        for (var i in dashboard) {
            if (dashboard[i].items[id]) {
                throw "Error dashboard item '" + id + "' already exists in section " + i;
            }
        }

        var order = Object.keys(section.items).length;

        section.items[id] = {
            order: order,
            varName: varName,
            itemType: "variable",
            formatter: cfg.formatter,
            label: cfg.label,
            index: cfg.index || Object.keys(section).length,
            active: cfg.active !== undefined ? cfg.active : true,
            sortable: cfg.sortable,
            preventClick: cfg.preventClick,
            sortFn: cfg.sortFn,
            mapFn: cfg.mapFn,
            mapFnExtraArgs: cfg.mapFnExtraArgs,
            kind: cfg.kind,
        };
    }

    /**
     *
     * @param {string} questName
     * @param {object} cfg : {label?:string; react?:boolean; display: 'absolute' | 'percent'}
     * @returns {undefined}
     */
    function registerQuest(questName, aCfg) {
        var cfg = aCfg || {};

        var reactFormatter = function (data) {
            return data + "&nbsp;%";
        };

        var yuiFormatter = function (bloc, value) {
            bloc.one('.bloc__value').append("&nbsp;%");
        };

        var formatter = cfg.display !== 'absolute' ? cfg.react ? reactFormatter : yuiFormatter : undefined;

        registerVariable(null, {
            id: 'QUEST_' + questName,
            label: cfg.label || questName,
            kind: 'number',
            mapFn: function (teamId) {
                var ads = Java.from(Variable.findByClass(gameModel,
                    com.wegas.core.persistence.variable.primitive.AchievementDescriptor.class));

                var stats = ads
                    .filter(function (ad) {
                        // only keep achievement which match the quest
                        return ad.getQuest() === questName;
                    })
                    .reduce(function (acc, curr) {
                        acc.total += curr.getWeight();
                        var inst = Variable.getInstancesByKeyId(curr)[teamId];
                        if (inst.isAchieved()) {
                            acc.current += curr.getWeight();
                        }
                        return acc;
                    }, {total: 0, current: 0});
                if (cfg.display === 'absolute') {
                    return stats.current + " / " +  stats.total;
                } else {
                    return ((stats.current / stats.total) * 100).toFixed();
                }
            },
            formatter: "" + formatter
        });
    }

    function registerAction(id, doFn, userConfig) {
        var cfg = userConfig || {};

        var section = getOrCreateSection(cfg.dashboard, cfg.section);

        // check id
        var dashboard = getOrCreateDashboard(cfg.dashboard);
        for (var i in dashboard) {
            if (dashboard[i].items[id]) {
                throw "Error dashboard item '" + id + "' already exists in section " + i;
            }
        }

        var order = cfg.order === "number" ? cfg.order : Object.keys(section.items).length;

        section.items[id] = {
            itemType: 'action',
            order: order,
            doFn: doFn,
            label: cfg.label,
            icon: cfg.icon || "fa fa-pencil",
            hasGlobal: cfg.hasGlobal,
        };
    }

    /**
     * hack; remove sanitizer marks
     *
     * @param {type} fn function to serialize
     * @returns function source-code
     */
    function serializeFunction(fn) {
        // TODO: not injected any lpnger
        return (fn + "").replaceAll("RequestManager.isInterrupted\\(\\);", "");
    }

    function registerStatExporter(id, activityPattern, userConfig) {
        var fn = function (owner, payload) {
            var logId = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().get("properties").get("val").logID;
            var path = owner.name === "Game" || owner.name === "DebugGame" ? "Games" : "Teams";
            window.open("rest/Statistics/ExportXLSX/" + logId
                + "/" + path + "/" + owner.get("id") + "QUERYSTRING", "_blank");
        };

        fn = "" + fn;

        fn = fn.replace("QUERYSTRING", activityPattern ? "?activityPattern=" + activityPattern : "");

        var cfg = userConfig || {};


        registerAction(id, fn, {
            section: cfg.section || 'actions',
            order: typeof cfg.order === "number" ? cfg.order : -1,
            icon: cfg.icon || "fa fa-pie-chart",
            label: cfg.label || "View statistics",
            hasGlobal: cfg.hasOwnProperty("hasGlobal") ? cfg.hasGlobal : true,
        });
    }

    function getAllOverviews() {
        var overviews = [];
        for (var name in dashConfigs) {
            overviews.push({
                name: name,
                overview: overview(name, true)
            });
        }
        return overviews;
    }

    function overview(name, doNotStringify) {
        name = name || defaultDashboardName;
        var overview = {};
        runInitCallbacks(name);

        if (dashConfigs[name]) {

            var game = self.getGame(),
                teams = game.getTeams(),
                isIndividual = game.getProperties().getFreeForAll(),
                items = {},
                variables = {};

            var theCfg = dashConfigs[name];
            // Columns & data object structure
            overview = {
                structure: [],
                data: {}
            };

            /*
             * Build structure
             */
            for (var sectionName in theCfg) {
                var sectionCfg = theCfg[sectionName];

                var section = {
                    id: sectionName,
                    title: sectionCfg.title || sectionName,
                    items: []
                };

                for (var id in sectionCfg.items) {
                    var itemCfg = sectionCfg.items[id];
                    var item = {
                        id: id,
                        order: itemCfg.order
                    };

                    switch (itemCfg.itemType) {
                        case "action":
                            item.itemType = 'action';
                            item.label = itemCfg.label || id;
                            item.icon = itemCfg.icon;
                            if (typeof itemCfg.doFn === "function") {
                                item.do = itemCfg.doFn + "";
                            } else if (typeof itemCfg.doFn === "object") {
                                if ("type" in itemCfg.doFn) {
                                    switch (itemCfg.doFn.type) {
                                        case "ModalAction":
                                        {
                                            var actions = itemCfg.doFn.actions.map(function (f) {
                                                return {
                                                    doFn: f.doFn + "",
                                                    schemaFn: f.schemaFn + ""
                                                }
                                            })
                                            item.do = JSON.stringify({
                                                type: itemCfg.doFn.type,
                                                actions: actions,
                                                showAdvancedImpact: itemCfg.doFn.showAdvancedImpact
                                            })
                                        }
                                    }

                                }
                            }
                            item.hasGlobal = itemCfg.hasGlobal;

                            items[id] = {
                                itemType: 'action',
                                item: item
                            };


                            break;
                        case "variable":
                            var varName = itemCfg.varName;

                            if (varName) {
                                if (!variables[varName]) {
                                    variables[varName] = {
                                        descriptor: Variable.find(gameModel, varName),
                                        instances: getInstances(varName)
                                    }
                                }
                            }

                            if (items[id]) {
                                throw "Items '" + id + "' already exists";
                            }

                            items[id] = {
                                itemType: 'variable',
                                varName: varName,
                                mapFn: itemCfg.mapFn,
                                mapFnExtraArgs: itemCfg.mapFnExtraArgs,
                                item: item
                            };

                            item.label = itemCfg.label || variables[varName]?.descriptor.getLabel()
                                .translateOrEmpty(self)  || 'unnamed';
                            item.formatter = itemCfg.formatter;
                            item.active = itemCfg.active;
                            item.preventClick = itemCfg.preventClick;
                            item.sortable = itemCfg.sortable;
                            item.sortFn = itemCfg.sortFn;
                            if (itemCfg.kind != null) {
                                item.kind = itemCfg.kind;
                            } else {
                                item.kind = variables[varName]?.descriptor.getJSONClassName()
                                    .replace("Descriptor", "").toLowerCase();
                            }
                            break;
                        default:
                    }
                    section.items.push(item);
                }

                overview.structure.push(section);
            }

            var currTeam, players, aPlayer, teamName, teamId;

            // Find data by team
            for (var t = 0; t < teams.size(); t++) {
                currTeam = teams.get(t);
                players = currTeam.getPlayers();
                aPlayer = currTeam.getAnyLivePlayer();
                if (aPlayer !== null) {
                    teamName = isIndividual ? "Player " + aPlayer.getName() : "Team " + currTeam.getName();
                    teamId = new Long(currTeam.getId());
                    var teamData = {};

                    for (var id in items) {
                        var item = items[id];
                        if (item.itemType === "variable") {
                            var variable = variables[item.varName];

                            if (item.mapFn) {
                                var args = [teamId, variable && variable.instances.get("" + teamId)];
                                for (const extraVarName of (item.mapFnExtraArgs || [])) {
                                    if (!variables[extraVarName]) {
                                        variables[extraVarName] = {
                                            descriptor: Variable.find(gameModel, extraVarName),
                                            instances: getInstances(extraVarName)
                                        };
                                    }
                                    args.push(variables[extraVarName].instances.get("" + teamId));
                                }
                                // last arguments contains some useful data
                                args.push({
                                    teamName: teamName,
                                    label: item.item.label
                                });
                                teamData[id] = item.mapFn.apply(this, args);
                            } else {
                                if (item.item.kind === "inbox") {
                                    teamData[id] = WegasHelper.getInboxInstanceContent(variable.instances.get("" +teamId), item.item.label, teamName);
                                } else if (item.item.kind === "text") {
                                    teamData[id] = WegasHelper.getTextInstanceContent(variable.instances.get("" + teamId), item.item.label, teamName);
                                } else if (item.item.kind === "object") {
                                    teamData[id] = WegasHelper.getObjectInstanceContent(variable.instances.get("" + teamId), item.item.label, teamName);
                                } else {
                                    teamData[id] = variable.instances.get("" + teamId).getValue();
                                }
                            }
                        }
                    }

                    overview.data[teamId] = teamData;
                }
            }

            // Stringify formatter functions
            overview.structure.forEach(function (groupItems) {
                groupItems.items.forEach(function (item) {
                    if (item.formatter) {
                        item.formatter = serializeFunction(item.formatter);
                    }
                    if (item.sortFn) {
                        item.sortFn = serializeFunction(item.sortFn);
                    }
                    if (item.do) {
                        item.do = serializeFunction(item.do);
                    }
                });
            });
        }

        if (doNotStringify) {
            return overview;
        } else {
            // Return stringified object
            return JSON.stringify(overview);
        }
    }


    return {
        createDashboard: registerInitCallback,
        /**
         *
         * @param {string} varName
         * @param {object} cfg {
         *  section = 'monitoring',
         *  dashboard = 'overview',
         *  label =varLabel,
         *  formatter,
         *  index,
         *  preventClick,
         *  sortable,
         *  sortFn,
         *  active,
         *  mapFn = function(teamId, instance, ...extraInstances),
         *  mapFnExtraArgs = [vdNanem, vdName2, ...]}
         * @returns {undefined}
         */
        registerVariable: function (varName, cfg) {
            return registerVariable(varName, cfg);
        },
        registerQuest: function (questName, cfg) {
            return registerQuest(questName, cfg);
        },
        /**
         *
         * @param {type} id
         * @param {type} cfg
         * @returns {undefined}
         */
        registerAction: function (id, doFn, cfg) {
            return registerAction(id, doFn, cfg);
        },
        registerStatExporter: function (id, activityPattern, cfg) {
            return registerStatExporter(id, activityPattern, cfg);
        },
        getOverview: function (name) {
            return overview(name);
        },
        getAllOverviews: function () {
            return getAllOverviews();
        },
        setSectionLabel: function (label, sectionName, dashboardName) {
            getOrCreateSection(dashboardName, sectionName).title = label;
        },
        getNumberFormatter: function (/*color1, threshold1, color2, threshold2, ..., thresholdN, colorN*/) {
            var args = Array.prototype.slice.call(arguments);

            var color, threshold;
            var defineColor = "var bgColor = 'white'; switch (true){";

            while (args.length > 0) {
                color = args.shift();
                threshold = args.shift();
                if (typeof threshold === 'number' && !isNaN(threshold)) {
                    defineColor += "case value < " + threshold + " : bgColor = '" + color + "'; break;";
                } else {
                    defineColor += "default: bgColor = '" + color + "'";
                }
            }

            defineColor += "}";

            return "function(bloc, value) {"
                + defineColor
                + "     bloc.one('.bloc__value')"
                + "       .setStyle('background-color', bgColor)"
                + "       .setStyle('color', 'white')"
                + "       .setStyle('font-weight', 'bold')"
                + "       .setStyle('border-radius', '2px');"
                + "}";
        }
    };
}());
