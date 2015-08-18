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
            numberOfValues: values.length,
            averageNumberOfWords: wc,
            averageNumberOfCharacters: cc
        };
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
            pris, pri, reviews, review, evs, ev, evK, i, j, k,
            key, entry, nbRDone, nbRTot, nbRCom, nbRComTotal,
            evaluations, evaluationsValues = {}, evDescriptor,
            evDescriptors = {},
            result = {}, extra = {},
            maxNumberOfValue = 0,
            instanceFacade = lookupBean("VariableInstanceFacade");

        evaluations = Java.from(prd.getFeedback().getEvaluations()).concat(Java.from(prd.getFbComments().getEvaluations()));

        for (i = 0; i < evaluations.length; i += 1) {
            evaluationsValues[evaluations[i].getId()] = [];
        }

        pris = Java.from(prd.getScope().getVariableInstances().values());

        for (i in pris) {
            if (pris.hasOwnProperty(i)) {
                key = i;
                pri = pris[i];
                if (pris.length > 1 && instanceFacade.findAPlayer(pri).getTeam() instanceof  com.wegas.core.persistence.game.DebugTeam) {
                    // Skip Debug Team
                    continue;
                }

                entry = {};

                reviews = Java.from(pri.getToReview());
                maxNumberOfValue += reviews.length;

                nbRDone = nbRTot = reviews.length;
                entry.comments = {};
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
                                        entry.comments[evK] = entry.comments[evK] || {summary: {}, values: []};
                                        entry.comments[evK].values.push(ev.getValue());
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
                for (evK in entry.comments) {
                    entry.comments[evK].summary = getEvSummary(entry.comments[evK].values, evDescriptors[evK]);
                }

                reviews = Java.from(pri.getReviewed());
                nbRCom = nbRComTotal = 0;
                entry.review = {};
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
                                        entry.review[evK] = entry.review[evK] || {summary: {}, values: []};
                                        entry.review[evK].values.push(ev.getValue());
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
                for (evK in entry.review) {
                    entry.review[evK].summary = getEvSummary(entry.review[evK].values, evDescriptors[evK]);
                }

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

                result[key] = entry;
            }
        }

        for (i = 0; i < evaluations.length; i += 1) {
            evDescriptor = evaluations[i];
            extra[evDescriptor.getId()] = getEvSummary(evaluationsValues[evDescriptor.getId()], evDescriptor);
        }
        extra.maxNumberOfValue = maxNumberOfValue;

        return {summary: result, evaluations: extra};
    }


    return {
        summarize: function(peerReviewDescriptorName) {
            return summarize(peerReviewDescriptorName);
        }
    };

}());