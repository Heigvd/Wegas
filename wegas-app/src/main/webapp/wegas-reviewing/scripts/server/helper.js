/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */


/**
 * ReviewHelper
 *
 * @fileoverview
 *
 * @author Maxence Laurent (maxence.laurent gmail.com)
 */
/*global Variable, gameModel, Java, javax, com, Infinity, StatisticHelper*/
var ReviewHelper = (function() {
    "use strict";
    var Long = Java.type("java.lang.Long");

    /**
     * 
     * @param {type} name bean name
     * @returns {unresolved}
     */
    function lookupBean(name) {
        "use strict";
        var ctx = new javax.naming.InitialContext();
        return ctx.lookup('java:module/' + name);
    }


    /*
     * { 
     *  "type" : "GradeSummary",
     *  name: "name1", 
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
    function getGradeSummary(values, descriptor) {
        var stats = StatisticHelper.getNumericStatistics(values, descriptor.getMinValue(), descriptor.getMaxValue());

        stats.type = "GradeSummary";
        stats.id = descriptor.getId();
        stats.name = descriptor.getName();

        return stats;
    }


    /* 
     * {
     *  type" : "CategorizationSummary",
     *  name: "name2",
     *  histogram: {
     *      "CategoryA" : count
     *      "CategoryB" : count
     *  }
     * }
     */
    function getCategorizationSummary(values, descriptor) {
        var cats, i, histogram = {},
            numberOfValues = values.length;
        cats = Java.from(descriptor.getCategories());

        for (i = 0; i < cats.length; i += 1) {
            histogram[cats[i]] = 0;
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
            numberOfValues: numberOfValues,
            histogram: histogram
        };
    }

    /* {
     *  type" : "TextSummary",
     *  name: "name3",
     *  averageNumberOfWords: ~x
     *  averageNumberOfCharacters: ~y
     * }
     */
    function getTextSummary(values, descriptor) {
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
            id: descriptor.getId(),
            numberOfValues: values.length,
            averageNumberOfWords: wc,
            averageNumberOfCharacters: cc
        };
    }

    function getEvStructure(evDescriptor) {
        var i, cats, structure;

        structure = {
            title: evDescriptor.getName(),
            items: []
        };

        if (evDescriptor instanceof com.wegas.reviewing.persistence.evaluation.TextEvaluationDescriptor) {
            structure.items.push({"id": evDescriptor.getId() + "-wc", "label": "Word Count", formatter: null});
            structure.items.push({"id": evDescriptor.getId() + "-cc", "label": "Char Count", formatter: null});
        } else if (evDescriptor instanceof com.wegas.reviewing.persistence.evaluation.GradeDescriptor) {
            structure.items.push({"id": evDescriptor.getId() + "-mean", "label": "mean", formatter: null});
            structure.items.push({"id": evDescriptor.getId() + "-median", "label": "median", formatter: null});
            structure.items.push({"id": evDescriptor.getId() + "-sd", "label": "sd", formatter: null});
        } else if (evDescriptor instanceof com.wegas.reviewing.persistence.evaluation.CategorizedEvaluationDescriptor) {
            cats = Java.from(evDescriptor.getCategories());
            for (i = 0; i < cats.length; i += 1) {
                structure.items.push({"id": evDescriptor.getId() + "-" + cats[i], "label": cats[i], formatter: null});
            }
        }
        return structure;
    }

    function mergeEvSummary(entry, values, evDescriptor) {
        var summary, k;
        if (evDescriptor instanceof com.wegas.reviewing.persistence.evaluation.TextEvaluationDescriptor) {
            summary = getTextSummary(values, evDescriptor);
            entry[summary.id + "-wc"] = summary.averageNumberOfCharacters;
            entry[summary.id + "-cc"] = summary.averageNumberOfWords;
        } else if (evDescriptor instanceof com.wegas.reviewing.persistence.evaluation.GradeDescriptor) {
            summary = getGradeSummary(values, evDescriptor);
            entry[summary.id + "-mean"] = summary.mean;
            entry[summary.id + "-median"] = summary.median;
            entry[summary.id + "-sd"] = summary.sd;
        } else if (evDescriptor instanceof com.wegas.reviewing.persistence.evaluation.CategorizedEvaluationDescriptor) {
            summary = getCategorizationSummary(values, evDescriptor);
            for (k in summary.histogram) {
                entry[summary.id + "-" + k] = summary.histogram[k];
            }
        }
    }

    function getEvSummary(values, evDescriptor) {
        if (values.length === 0) {
            return {type: "Empty"};
        } else if (evDescriptor instanceof com.wegas.reviewing.persistence.evaluation.TextEvaluationDescriptor) {
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
        var prd = Variable.findByName(gameModel, peerReviewDescriptorName),
            teams = self.getGame().getTeams(), t, teamId,
            pris, pri, reviews, review, evs, ev, evK, i, j, k,
            entry, nbRDone, nbRTot, nbRCom, nbRComTotal,
            evaluations, evaluationsValues = {}, evDescriptor,
            evDescriptors = {}, summary, tmp,
            maxNumberOfValue = 0,
            instanceFacade = lookupBean("VariableInstanceFacade"),
            monitoring = {
                structure: [{
                        title: "Overview",
                        items: [
                            {id: "status", label: "Status", formatter: null},
                            {id: "done", label: "Review Done", formatter: null},
                            {id: "commented", label: "Review Commented", formatter: null}
                        ]
                    }],
                data: {},
                extra: {}
            };

        evaluations = Java.from(prd.getFeedback().getEvaluations()).concat(Java.from(prd.getFbComments().getEvaluations()));

        for (i = 0; i < evaluations.length; i += 1) {
            ev = evaluations[i].getId();
            evaluationsValues[ev] = [];
            monitoring.structure.push(getEvStructure(evaluations[i]));
        }

        pris = prd.getScope().getVariableInstances();

        for (t = 0; t < teams.size(); t += 1) {
            teamId = new Long(teams.get(t).getId());
            pri = pris[teamId];
            if (pris.length > 1 && instanceFacade.findAPlayer(pri).getTeam() instanceof  com.wegas.core.persistence.game.DebugTeam) {
                // Skip Debug Team
                continue;
            }

            entry = {};

            reviews = Java.from(pri.getToReview());
            maxNumberOfValue += reviews.length;

            nbRDone = nbRTot = reviews.length;
            //entry.comments = {};
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
                            // Comments about reviews
                            evs = Java.from(review.getComments());
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
            entry.done = nbRDone + " / " + nbRTot;
            for (evK in tmp) {
                mergeEvSummary(entry, tmp[evK], evDescriptors[evK]);
            }

            reviews = Java.from(pri.getReviewed());
            nbRCom = nbRComTotal = 0;
            tmp = {};
            for (j in reviews) {
                if (reviews.hasOwnProperty(j)) {
                    review = reviews[j];
                    evs = Java.from(review.getFeedback());

                    switch (review.getReviewState().toString()) {
                        case "COMPLETED":
                        case "CLOSED":
                            nbRCom += 1;
                            /*falls through*/
                        case "NOTIFIED":
                            nbRComTotal += 1;
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
            entry.commented = nbRCom + " / " + nbRComTotal;
            for (evK in tmp) {
                mergeEvSummary(entry, tmp[evK], evDescriptors[evK]);
            }

            // Set status
            if (nbRComTotal > 0) {
                if (nbRComTotal === nbRCom) {
                    entry.status = "Completed";
                } else {
                    entry.status = "Commenting";
                }
            } else if (nbRTot > 0) {
                if (nbRTot === nbRDone) {
                    entry.status = "Review done";
                } else {
                    entry.status = "Reviewing";
                }
            } else if (pri.getReviewState().toString() === "NOT_STARTED") {
                entry.status = "Editing";
            } else if (pri.getReviewState().toString() === "SUBMITTED") {
                entry.status = "Ready to review";
            } else {
                entry.status = "N/A";
            }

            monitoring.data[teamId] = entry;
        }

        for (i = 0; i < evaluations.length; i += 1) {
            evDescriptor = evaluations[i];
            monitoring.extra[evDescriptor.getId()] = getEvSummary(evaluationsValues[evDescriptor.getId()], evDescriptor);
        }
        monitoring.extra.maxNumberOfValue = maxNumberOfValue;

        monitoring.structure.forEach(function(groupItems) {
            groupItems.items.forEach(function(item) {
                item.formatter = item.formatter + "";
            });
        });
        return JSON.stringify(monitoring);
    }


    return {
        summarize: function(peerReviewDescriptorName) {
            return summarize(peerReviewDescriptorName);
        }
    };

}());