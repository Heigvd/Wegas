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
/*global Variable, gameModel, print, Java, javax, com*/
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

    function summarize(peerReviewDescriptorName) {
        var prd = Variable.findByName(gameModel, peerReviewDescriptorName),
            pris, pri, reviews, review, evs, ev, evK, i, j, k,
            key, entry, nbRDone, nbRTot, nbRCom, nbRComTotal,
            result = {},
            instanceFacade = lookupBean("VariableInstanceFacade");


        print("SUMMARY:");

        pris = Java.from(prd.getScope().getVariableInstances().values());

        for (i in pris) {
            if (pris.hasOwnProperty(i)) {
                key = i;
                pri = pris[i];
                print("I: " + i);
                if (instanceFacade.findAPlayer(pri).getTeam() instanceof  com.wegas.core.persistence.game.DebugTeam) {
                    // Skip Debug Team
                    continue;
                }

                entry = {};

                reviews = Java.from(pri.getToReview());

                nbRDone = nbRTot = reviews.length;
                entry.comments = {};
                for (j in reviews) {
                    if (reviews.hasOwnProperty(j)) {
                        review = reviews[j];
                        switch (review.getReviewState().toString()) {
                            case "DISPATCHED":
                                nbRDone--;
                                break;
                            case "COMPLETED":
                                evs = Java.from(review.getComments());
                                for (k in evs) {
                                    if (evs.hasOwnProperty(k)) {
                                        ev = evs[k];
                                        evK = ev.getDescriptor().getName();
                                        entry.comments[evK] = entry.comments[evK] || [];
                                        entry.comments[evK].push(ev.getValue());
                                    }
                                }
                                break;
                            default:
                                break;
                        }
                    }
                }
                entry.done = nbRDone + " / " + nbRTot;

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
                                nbRCom++;
                                /*falls through*/
                            case "NOTIFIED":
                                nbRComTotal++;
                                for (k in evs) {
                                    if (evs.hasOwnProperty(k)) {
                                        ev = evs[k];
                                        evK = ev.getDescriptor().getName();
                                        entry.review[evK] = entry.review[evK] || [];
                                        entry.review[evK].push(ev.getValue());
                                    }
                                }
                                break;
                            default:
                                break;
                        }
                    }
                }
                entry.commented = nbRCom + " / " + nbRComTotal;

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
        return {summary: result};
    }

    return {
        summarize: function(peerReviewDescriptorName) {
            return summarize(peerReviewDescriptorName);
        }
    };

}());