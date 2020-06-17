/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */


/**
 * ReviewHelper
 *
 * @fileoverview
 *
 * @author Maxence Laurent (maxence.laurent gmail.com)
 */
/*global self, Variable, gameModel, Java, javax, com, Infinity, StatisticHelper*/
var ReviewHelper = (function() {
    "use strict";
    var Long = Java.type("java.lang.Long");

    /*
     * { 
     *  "type" : "GradeSummary",
     *  name: "name1", 
     *  label: "Name 1",
     *  min: a
     *  max: b
     *  mean: _x
     *  median: ~x
     *  sd: sd,
     *  histogram: [{
     *      min: a,
     *      max: b,
     *      nb: count
     *  },{
     *  }, ... ,{
     *  }
     *  ]
     * }
     */
    function getGradeSummary(values, descriptor, includeData) {
        var stats = StatisticHelper.getNumericStatistics(values, descriptor.getMinValue(), descriptor.getMaxValue());

        stats.type = "GradeSummary";
        stats.id = descriptor.getId();
        stats.name = descriptor.getName();
        stats.label = descriptor.getLabel().translateOrEmpty(self);
        stats.data = (includeData ? values : []);

        return stats;
    }


    /* 
     * {
     *  type" : "CategorizationSummary",
     *  name: "name2",
     *  label: "Name 2",
     *  histogram: {
     *      "CategoryA" : count
     *      "CategoryB" : count
     *  }
     * }
     */
    function getCategorizationSummary(values, descriptor, includeData) {
        var cats, i, histogram = {},
            numberOfValues = values.length;
        cats = Java.from(descriptor.getCategories());

        for (i = 0; i < cats.length; i += 1) {
            histogram[cats[i].getName()] = 0;
        }

        for (i in values) {
            if (values[i]) {
                histogram[values[i]] += 1;
            } else {
                numberOfValues -= 1;
            }
        }

        return {
            type: "CategorizationSummary",
            name: descriptor.getName(),
            id: descriptor.getId(),
            label: descriptor.getLabel().translateOrEmpty(self),
            numberOfValues: numberOfValues,
            histogram: histogram,
            data: (includeData ? values : [])
        };
    }

    /* {
     *  type" : "TextSummary",
     *  name: "name3",
     *  label: "Name 3",
     *  averageNumberOfWords: ~x
     *  averageNumberOfCharacters: ~y
     * }
     */
    function getTextSummary(values, descriptor, includeData) {
        var i, wc = 0, cc = 0, r;

        for (i = 0; i < values.length; i += 1) {
            r = StatisticHelper.getTextStatistics(values[i]);
            wc += r.wc;
            cc += r.cc;
        }
        wc /= values.length;
        cc /= values.length;

        return {
            type: "TextSummary",
            name: descriptor.getName(),
            label: descriptor.getLabel().translateOrEmpty(self),
            id: descriptor.getId(),
            numberOfValues: values.length,
            averageNumberOfWords: wc,
            averageNumberOfCharacters: cc,
            data: (includeData ? values : [])
        };
    }

    function colorize(o) {
        o.cell.setHTML("<span>" + o.value + "</span>");
        o.cell.addClass("status-" + o.data.color);
    }

    function colorizeDone(o) {
        o.cell.setHTML("<span>" + o.value + "</span>");
        o.cell.addClass("status-" + o.data.done_color);
    }

    function colorizeComments(o) {
        o.cell.setHTML("<span>" + o.value + "</span>");
        o.cell.addClass("status-" + o.data.comments_color);
    }



    function formatToFixed2(o) {
        if (o.value !== undefined && o.value !== null) {
            return o.value.toFixed(2);
        }
        return "N/A";
    }

    function getEvStructure(evDescriptor) {
        var i, cats, structure;

        structure = {
            id: "ev-" + evDescriptor.getId(),
            title: evDescriptor.getLabel().translateOrEmpty(self),
            items: []
        };

        if (evDescriptor instanceof com.wegas.reviewing.persistence.evaluation.TextEvaluationDescriptor) {
            structure.items.push({"id": evDescriptor.getId() + "-wc", "label": I18n.t("wc"), formatter: formatToFixed2});
            structure.items.push({"id": evDescriptor.getId() + "-cc", "label": I18n.t("cc"), formatter: formatToFixed2});
            structure.items.push({"id": evDescriptor.getId() + "-data", "label": I18n.t("data"), formatter: '<span class="texteval-data"><i data-ref="' + evDescriptor.getId() + '-data" class="fa fa-info-circle"></i></span>'});
        } else if (evDescriptor instanceof com.wegas.reviewing.persistence.evaluation.GradeDescriptor) {
            structure.items.push({"id": evDescriptor.getId() + "-mean", "label": I18n.t("mean"), formatter: '<span class="gradeeval-data">{value} <i data-ref="' + evDescriptor.getId() + '-data" class="fa fa-info-circle"></i></span>'});
            //structure.items.push({"id": evDescriptor.getId() + "-median", "label": "median", formatter: null});
            structure.items.push({"id": evDescriptor.getId() + "-sd", "label": I18n.t("sd"), formatter: formatToFixed2});
        } else if (evDescriptor instanceof com.wegas.reviewing.persistence.evaluation.CategorizedEvaluationDescriptor) {
            cats = Java.from(evDescriptor.getCategories());
            for (i = 0; i < cats.length; i += 1) {
                structure.items.push({"id": evDescriptor.getId() + "-" + cats[i].getName(), "label": cats[i].getLabel().translateOrEmpty(self), formatter: null});
            }
        }
        return structure;
    }

    function mergeEvSummary(entry, values, evDescriptor) {
        var summary, k;
        if (evDescriptor instanceof com.wegas.reviewing.persistence.evaluation.TextEvaluationDescriptor) {
            summary = getTextSummary(values, evDescriptor, true);
            entry[summary.id + "-wc"] = summary.averageNumberOfWords;
            entry[summary.id + "-cc"] = summary.averageNumberOfCharacters;
            entry[summary.id + "-data"] = values;
        } else if (evDescriptor instanceof com.wegas.reviewing.persistence.evaluation.GradeDescriptor) {
            summary = getGradeSummary(values, evDescriptor, true);
            entry[summary.id + "-mean"] = (summary.mean.toFixed ? summary.mean.toFixed(2) : summary.mean);
            entry[summary.id + "-sd"] = summary.sd;
            entry[summary.id + "-data"] = values;
        } else if (evDescriptor instanceof com.wegas.reviewing.persistence.evaluation.CategorizedEvaluationDescriptor) {
            summary = getCategorizationSummary(values, evDescriptor, true);
            for (k in summary.histogram) {
                entry[summary.id + "-" + k] = summary.histogram[k];
            }
        }
    }

    function getEvSummary(values, evDescriptor) {
        if (evDescriptor instanceof com.wegas.reviewing.persistence.evaluation.TextEvaluationDescriptor) {
            return getTextSummary(values, evDescriptor);
        } else if (evDescriptor instanceof com.wegas.reviewing.persistence.evaluation.GradeDescriptor) {
            return getGradeSummary(values, evDescriptor);
        } else if (evDescriptor instanceof com.wegas.reviewing.persistence.evaluation.CategorizedEvaluationDescriptor) {
            return getCategorizationSummary(values, evDescriptor);
        } else {
            return {type: "Error"};
        }
    }

    function summarize(peerReviewDescriptorName) {
        var prd = Variable.find(gameModel, peerReviewDescriptorName),
            game = self.getGame(), teams = game.getLiveTeams(), t, teamId, team,
            pris, pri, reviews, review, evs, ev, evK, i, j, k,
            entry, nbRDone, nbRTot, nbRCom, nbRComClosed, nbRComTotal,
            evaluationsR, evaluationsC, evaluationsAll, evaluationsValues = {}, evDescriptor,
            evDescriptors = {}, tmp, key, expectedStatus = null, workDone,
            maxNumberOfValue = 0,
            maxNumberOfReview = Math.min(prd.getMaxNumberOfReview(), teams.size() - 2), // Assume team scoped review. !~_~! 
            aPlayer,
            monitoring = {
                structure: {
                    overview: [{
                            title: I18n.t("overview"),
                            items: [
                                {id: "status", label: I18n.t("editionStatus"), formatter: null, nodeFormatter: colorize, allowHTML: true},
                                {id: "done", label: I18n.t("reviewDoneTitle"), formatter: null, nodeFormatter: colorizeDone, allowHTML: true},
                                {id: "commented", label: I18n.t("commentsDoneTitle"), formatter: null, nodeFormatter: colorizeComments, allowHTML: true}
                            ]
                        }
                    ],
                    reviews: [],
                    comments: []
                },
                data: {},
                extra: {},
                variable: {}
            };

        evaluationsR = Java.from(prd.getFeedback().getEvaluations());
        evaluationsC = Java.from(prd.getFbComments().getEvaluations());
        evaluationsAll = evaluationsC.concat(evaluationsR);

        for (i = 0; i < evaluationsR.length; i += 1) {
            ev = evaluationsR[i].getId();
            evaluationsValues[ev] = [];
            monitoring.structure.reviews.push(getEvStructure(evaluationsR[i]));
        }


        for (i = 0; i < evaluationsC.length; i += 1) {
            ev = evaluationsC[i].getId();
            evaluationsValues[ev] = [];
            monitoring.structure.comments.push(getEvStructure(evaluationsC[i]));
        }

        pris = Variable.getInstances(prd);

        for (t = 0; t < teams.size(); t += 1) {
            team = teams.get(t);
            teamId = new Long(team.getId());
            pri = pris[team];
            if (!expectedStatus || pri.getReviewState().ordinal() > expectedStatus.ordinal()) {
                expectedStatus = pri.getReviewState();
            }
        }



        for (t = 0; t < teams.size(); t += 1) {
            team = teams.get(t);
            teamId = new Long(team.getId());
            pri = pris[team];

            if (team.getPlayers().size() > 0) {
                aPlayer = pri.getOwner().getAnyLivePlayer();
            } else {
                aPlayer = null;
            }
            if (aPlayer === null || (pris.length > 1 && aPlayer.getTeam() instanceof  com.wegas.core.persistence.game.DebugTeam)) {
                // Skip Debug & empty Teams
                continue;
            }

            entry = {
                overview: {},
                reviews: {},
                comments: {}
            };

            //if (pri.getReviewState().toString() === "EVICTED") {
            //    entry.overview.status = "Evicted";
            //} else {
            {
                reviews = Java.from(pri.getToReview());
                maxNumberOfValue += reviews.length;

                nbRDone = nbRTot = reviews.length;
                tmp = {};
                for (j in reviews) {
                    if (reviews.hasOwnProperty(j)) {
                        review = reviews[j];
                        switch (review.getReviewState().toString()) {
                            case "DISPATCHED":
                                nbRDone -= 1;
                                break;
                            case "CLOSED":
                            case "COMPLETED":
                                // Comments about reviews pri owner wrote
                                evs = Java.from(review.getComments());

                                for (k in evs) {
                                    if (evs.hasOwnProperty(k)) {
                                        ev = evs[k];
                                        evK = ev.getDescriptor().getId();
                                        evDescriptors[evK] = ev.getDescriptor();
                                        tmp[evK] = tmp[evK] || [];
                                        tmp[evK].push(ev.getValue());
                                        evaluationsValues[evK].push(ev.getValue());
                                        workDone = workDone && ev.getValue();
                                    }
                                }
                            case "NOTIFIED":
                            case "REVIEWED":
                                // Reviewer work
                                /*workDone = true;
                                 evs = Java.from(review.getFeedback());
                                 for (k in evs) {
                                 if (evs.hasOwnProperty(k)) {
                                 workDone = workDone && evs[k].getValue();
                                 }
                                 }
                                 if (!workDone) {
                                 //nbRDone -= 1;
                                 }*/
                                break;
                            default:
                                break;
                        }
                    }
                }



                if (pri.getReviewState().toString() === "DISPATCHED" ||
                    pri.getReviewState().toString() === "NOTIFIED" ||
                    pri.getReviewState().toString() === "COMPLETED") {
                    entry.overview.done = nbRDone + " / " + nbRTot;
                    entry.overview.done_color = (nbRDone / nbRTot < 1 ? 'orange' : 'green');
                } else {
                    entry.overview.done = nbRDone + " / " + maxNumberOfReview;
                    entry.overview.done_color = 'grey';
                }
                for (evK in tmp) {
                    mergeEvSummary(entry.comments, tmp[evK], evDescriptors[evK]);
                }

                reviews = Java.from(pri.getReviewed());
                nbRComClosed = nbRCom = nbRComTotal = 0;
                tmp = {};
                for (j in reviews) {
                    if (reviews.hasOwnProperty(j)) {
                        review = reviews[j];

                        workDone = false;
                        switch (review.getReviewState().toString()) {
                            case "CLOSED":
                                nbRComClosed += 1;
                            case "COMPLETED":
                                workDone = true;

                                evs = Java.from(review.getComments());
                                for (k in evs) {
                                    if (evs.hasOwnProperty(k)) {
                                        workDone = workDone && evs[k].getValue();
                                    }
                                }
                                if (true || workDone) {
                                    nbRCom += 1;
                                }
                            case "NOTIFIED":
                                nbRComTotal += 1;
                            case "REVIEWED":
                                evs = Java.from(review.getFeedback());
                                for (k in evs) {
                                    if (evs.hasOwnProperty(k)) {
                                        ev = evs[k];
                                        evK = ev.getDescriptor().getId();
                                        evDescriptors[evK] = ev.getDescriptor();
                                        tmp[evK] = tmp[evK] || [];
                                        tmp[evK].push(ev.getValue());
                                        evaluationsValues[evK].push(ev.getValue());
                                    }
                                }
                                break;
                            default:
                                break;
                        }
                    }
                }

                //entry.overview.commented = nbRCom + " / " + (nbRComTotal > 0 ? nbRComTotal : maxNumberOfReview);
                entry.overview.commented = nbRCom + " / " + nbRComTotal;
                if (nbRComTotal > 0) {
                    entry.overview.comments_color = (nbRCom / nbRComTotal < 1 ? 'orange' : 'green');
                }
                for (evK in tmp) {
                    mergeEvSummary(entry.reviews, tmp[evK], evDescriptors[evK]);
                }

                // Set status
                if (pri.getReviewState().toString() === "EVICTED"  //explicitly evicted
                    || (
                        !pri.getReviewState().equals(expectedStatus)  // or not in the same phase as most advanced teams
                        && !(pri.getReviewState().toString() === "NOT_STARTED" //not that NS and SUBM. status stands in the same phase !
                            && expectedStatus.toString() === "SUBMITTED"))
                    ) {
                    entry.overview.color = "red";
                    entry.overview.internal_status = "evicted";
                    entry.overview.status = I18n.t("evicted");
                    //} else if (nbRComTotal > 0) {
                } else if (pri.getReviewState().toString() === "COMPLETED") {
                    entry.overview.color = "green";
                    entry.overview.internal_status = "closed";
                    entry.overview.status = I18n.t("ready");
                } else if (pri.getReviewState().toString() === "NOTIFIED") {
                    if (nbRComTotal === nbRCom) {
                        entry.overview.color = "green";
                        entry.overview.internal_status = "completed";
                        entry.overview.status = I18n.t("ready");
                    } else {
                        entry.overview.color = "green";
                        entry.overview.internal_status = "commenting";
                        entry.overview.status = I18n.t("ready");
                    }
                } else if (pri.getReviewState().toString() === "DISPATCHED") {
                    if (nbRTot === nbRDone) {
                        entry.overview.color = "green";
                        entry.overview.internal_status = "done";
                        entry.overview.status = I18n.t("ready");
                    } else {
                        entry.overview.color = "green";
                        entry.overview.internal_status = "reviewing";
                        entry.overview.status = I18n.t("ready");
                    }
                } else if (pri.getReviewState().toString() === "NOT_STARTED") {
                    entry.overview.color = "orange";
                    entry.overview.internal_status = "editing";
                    entry.overview.status = I18n.t("editing");
                } else if (pri.getReviewState().toString() === "SUBMITTED") {
                    entry.overview.color = "green";
                    entry.overview.internal_status = "ready";
                    entry.overview.status = I18n.t("ready");
                } else {
                    entry.overview.color = "red";
                    entry.overview.internal_status = "na";
                    entry.overview.status = I18n.t("na");
                }
            }

            monitoring.data[teamId] = entry;
            monitoring.variable[teamId] = prd.getToReview().getInstance(aPlayer).getValue();
        }

        for (i = 0; i < evaluationsAll.length; i += 1) {
            evDescriptor = evaluationsAll[i];
            monitoring.extra[evDescriptor.getId()] = getEvSummary(evaluationsValues[evDescriptor.getId()], evDescriptor);
        }

        if (maxNumberOfValue === 0) {
            if (game instanceof com.wegas.core.persistence.game.DebugGame) {
                maxNumberOfValue = 1;
            } else {
                // evict test teams...
                maxNumberOfValue = (teams.size() - 1) * maxNumberOfReview;
            }
        }

        monitoring.extra.maxNumberOfValue = maxNumberOfValue;

        for (key in monitoring.structure) {
            monitoring.structure[key].forEach(function(groupItems) {
                groupItems.items.forEach(function(item) {
                    item.formatter = item.formatter + "";
                    if (item.nodeFormatter) {
                        item.nodeFormatter = item.nodeFormatter + "";
                    }
                });
            });
        }

        return JSON.stringify(monitoring);
    }


    return {
        summarize: function(peerReviewDescriptorName) {
            return summarize(peerReviewDescriptorName);
        }
    };

}());
