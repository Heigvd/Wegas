/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/* global Variable, self, gameModel, Event, Java, com, QuestionFacade, I18n */

/**
 * @fileoverview
 * @author Maxence Laurent <maxence.laurent@gmail.com>
 */

var WegasDashboard = (function() {
    "use strict";
    var dashConfigs = {};

    var Long = Java.type("java.lang.Long");

    function getInstances(name) {
        return Variable.getInstancesByKeyStringId(Variable.find(gameModel, name));
    }

    function getOrCreateDashboard(dashboardName) {
        var dName = dashboardName || "overview";
        if (!dashConfigs[dName]) {
            dashConfigs[dName] = {};
        }
        return dashConfigs[dName];
    }

    function getOrCreateSection(dashboardName, sectionName) {
        var sName = sectionName || "monitoring";
        var dashboard = getOrCreateDashboard(dashboardName || "overview")
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

        section.items[id] = {
            varName: varName,
            itemType: 'variable',
            formatter: cfg.formatter,
            transformer: cfg.transformer,
            label: cfg.label,
            index: cfg.index || Object.keys(section).length,
            active: (cfg.active !== undefined) ? cfg.active : true,
            sortable: cfg.sortable,
            sortFn: cfg.sortFn,
            mapFn: cfg.mapFn,
            mapFnExtraArgs: cfg.mapFnExtraArgs
        };
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

        section.items[id] = {
            itemType: 'action',
            doFn: doFn,
            label: cfg.label,
            icon: cfg.icon || "fa fa-pencil",
            hasGlobal: cfg.hasGlobal
        };
    }



    function overview(name) {
        name = name || "overview";
        overview = {};

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
                    title: sectionCfg.title || sectionName,
                    items: []
                };

                for (var id in sectionCfg.items) {
                    var itemCfg = sectionCfg.items[id];
                    var item = {
                        id: id
                    };

                    switch (itemCfg.itemType) {
                        case "action":
                            item.itemType = 'action';
                            item.label = itemCfg.label || id;
                            item.icon = itemCfg.icon;
                            item.do = itemCfg.doFn + "";
                            item.hasGlobal = itemCfg.hasGlobal;

                            items[id] = {
                                itemType: 'action',
                                item: item
                            };


                            break;
                        case "variable":
                            var varName = itemCfg.varName;

                            if (!variables[varName]) {
                                variables[varName] = {
                                    descriptor: Variable.find(gameModel, varName),
                                    instances: getInstances(varName)
                                };
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

                            item.label = itemCfg.label || variables[varName].descriptor.getLabel().translateOrEmpty(self);
                            item.formatter = itemCfg.formatter;
                            item.transformer = itemCfg.transformer;
                            item.active = itemCfg.active;
                            item.sortable = itemCfg.sortable;
                            item.sortFn = itemCfg.sortFn;
                            item.kind = variables[varName].descriptor.getClass().getSimpleName().replace("Descriptor", "").toLowerCase();
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
                                var args = [teamId, variable.instances.get("" + teamId)];
                                for (var extraVarName of item.mapFnExtraArgs) {
                                    if (!variables[extraVarName]) {
                                        variables[extraVarName] = {
                                            descriptor: Variable.find(gameModel, extraVarName),
                                            instances: getInstances(extraVarName)
                                        };
                                    }
                                    args.push(variables[extraVarName].instances.get("" + teamId));
                                }
                                teamData[id] = item.mapFn.apply(this, args);
                            } else {
                                if (item.item.kind === "inbox") {
                                    teamData[id] = WegasHelper.getInboxInstanceContent(variable.instances.get("" + teamId), item.item.label, teamName);
                                } else if (item.item.kind === "text") {
                                    teamData[id] = WegasHelper.getTextInstanceContent(variable.instances.get("" + teamId), item.item.label, teamName);
                                } else if (item.item.kind === "object") {
                                    teamData[id] = WegasHelper.getObjectInstanceContent(variable.instances.get("" + teamId), item.item.label, teamName)
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
            overview.structure.forEach(function(groupItems) {
                groupItems.items.forEach(function(item) {
                    if (item.formatter) {
                        item.formatter = item.formatter + "";
                    }
                    if (item.transformer) {
                        item.transformer = item.transformer + "";
                    }
                    if (item.sortFn) {
                        item.sortFn = item.sortFn + "";
                    }
                    if (item.do) {
                        item.do = item.do + "";
                    }
                });
            });
        }

        // Return stringified object
        return JSON.stringify(overview);
    }

    return {
        /**
         *
         * @param {type} varName
         * @param {type} cfg {section = 'monitoring', dashboard = 'overview', label =varLabel, formatter, transformer, index, sortable, sortFn, active, mapFn = function(teamId, instance, ...extraInstances), mapFnExtraArgs = [vdNanem, vdName2, ...]}
         * @returns {undefined}
         */
        registerVariable: function(varName, cfg) {
            return registerVariable(varName, cfg);
        },
        /**
         *
         * @param {type} id
         * @param {type} cfg
         * @returns {undefined}
         */
        registerAction: function(id, doFn, cfg) {
            return registerAction(id, doFn, cfg);
        },
        getOverview: function(name) {
            return overview(name);
        },
        setSectionLabel: function(label, sectionName, dashboardName) {
            getOrCreateSection(dashboardName, sectionName).title = label;
        },
        getNumberFormatter: function(/*color1, threshold1, color2, threshold2, ..., thresholdN, colorN*/) {
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
