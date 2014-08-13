/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Maxence Laurent <maxence.laurent> <gmail.com>
 */
YUI.add('wegas-pmg-abstractpert', function(Y) {
    "use strict";

    var Wegas = Y.Wegas, AbstractPert;

    /**
     *  @class abstract plugin for pert-based plugin
     *  @name Y.Plugin.AbstractPert
     *  @extends Y.Plugin.Base
     *  @constructor
     */
    AbstractPert = Y.Base.create("wegas-pmg-abstractpert", Y.Plugin.Base, [Wegas.Plugin, Wegas.Editable], {
        /** @lends Y.Plugin.AbstractPert */
        initializer: function() {
            //this.taskTable;
            Y.log("initializer", "info", "Wegas.AbstractPert");
        },
        timeSolde: function(taskDesc) {
            var taskInst = taskDesc.getInstance(), properties = taskInst.get("properties"), timeSolde;
            if (taskInst.get("plannification").length > 0) {
                timeSolde = (1 - parseInt(properties.completeness) / 100) * taskInst.get("plannification").length;
            } else {
                timeSolde = (1 - parseInt(properties.completeness) / 100) * taskInst.get("duration");
            }
            return timeSolde;
        },
        startPlannif: function(taskDesc) {
            var taskInst = taskDesc.getInstance(), plannification = taskInst.get("plannification"), min;
            min = Math.min.apply(Math, plannification);
            if (min !== Infinity) {
                return min;
            } else {
                return 0;
            }
        },
        computePert: function(taskTable, currentPeriod) {
            var predecessors, taskId, taskDesc, i, maxPert, predecessorDuration,
                allPredDefine, countPertValue = 0, treated = [], predecessorId;

            while (countPertValue < Y.Object.size(taskTable)) {
                for (taskId in taskTable) {
                    taskDesc = taskTable[taskId];

                    if (Y.Array.indexOf(treated, taskId) > -1) {
                        continue;
                    }

                    maxPert = currentPeriod;
                    allPredDefine = true;
                    predecessors = taskDesc.get("predecessors");

                    for (i = 0; i < predecessors.length; i++) {
                        predecessorId = predecessors[i].get("id");
                        if (!taskTable[predecessorId]) {
                            continue;
                        }
                        // verifie si le prédecesseur possede le debut pert
                        if (taskTable[predecessorId].startPert) {
                            // defini la durée du prédecesseur
                            predecessorDuration = taskTable[predecessorId].startPert + taskTable[predecessorId].timeSolde;
                            // verifie si la durée du prédecesseur et la plus grande
                            if (predecessorDuration > maxPert) {
                                maxPert = predecessorDuration;
                            }
                        } else {
                            allPredDefine = false;
                        }
                    }
                    // si tous les prédecesseur on un debut pert alors on l'ajoute dans la liste
                    if (allPredDefine) {
                        treated.push(taskId);
                        taskDesc.startPert = maxPert;
                        taskDesc.startMax = Math.max(taskDesc.startPert, taskDesc.startPlannif);
                        taskDesc.end = taskDesc.startMax + taskDesc.timeSolde;
                        countPertValue++;
                    }
                }
            }
        }
    }, {
        NS: "abstractpert",
        NAME: "abstractpert"
    });
    Y.Plugin.AbstractPert = AbstractPert;
});
