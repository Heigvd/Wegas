
/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Maxence Laurent <maxence.laurent> <gmail.com>
 */
/*global Variable, gameModel, self */

YUI.add("wegas-i18n-review-en", function(Y) {
    Y.Wegas.I18n.register("wegas-i18n-review", "en", {
        review: {
            orchestrator: {
                mainTitle: "Peer Review Process for \"{{variableName}}\"",
                includeEvicted: "Allow authors who didn't wrote anything to receive something to review",
                state: {
                    edition: {
                        title: "Edition",
                        description: "The authors are editing what will be reviewed<br/> <br /><i>The process has not begun yet</i>"
                    },
                    reviewing: {
                        title: "Reviewing",
                        description: "The authors are reviewing their peers<br /><br /><i>This is the first step of the process</i>"
                    },
                    commenting: {
                        title: "Commenting",
                        description: "The authors acquaint themselves with peer reviews<br /><br /><i>They comment on those reviews</i>"
                    },
                    completed: {
                        title: "Completed",
                        description: "The reviewing process has been completed<br /><br /><i>The authors take acquaintance of comments on reviews they've done</i>"
                    }
                },
                properties: "properties",
                overview: "overview",
                reviews: "reviews",
                comments: "comments",
                charts: "charts",
                playerData: "Data reviewed by peers for player \"{{playerName}}\"",
                teamData: "Data reviewed by peers for team \"{{teamName}}\"",
                goNextConfirmation: "This action cannot be undone.<br />\nDo you really want to enter the next step of the peer reviewing process?",
                stats: {
                    mean: "avg.",
                    median: "med.",
                    sd: "&sigma;",
                    bounds: "bounds",
                    basedOn: "based on {{available}}/{{expected}} values",
                    avgWc: "Average number of words",
                    avgCc: "Average number of characters"
                },
                notAvailableYet : "Not available yet" 
            },
            global: {
                submit: "submit",
                confirmation: "Once submitted, those data will be final!<br /> Do you really want to submit them ?",
                save: "save"
            },
            tabview: {
                emptyness_message: "No review available yet",
                toReviewTitle: "Review your peers",
                toReview: "Submission",
                toCommentTitle: "Reviews of your submission",
                toComment: "Reviewer"
            },
            editor: {
                given: "Given: ",
                number: "#",
                ask_your_feedback: "Edit your feedback",
                your_feedback: "Your feedback:",
                reviewer_feedabck: "Reviewer feedback",
                ask_reviewer_feedback: "",
                ask_comment: "What do you think about your reviewer feedback?",
                comment: "Your thoughts about feedback your reviewer feedback",
                author_comment: "What author thinks about your feedback:",
                noValueProvided: "No evaluation provided",
                didNotProvide: "did not provide any evaluation",
                didNotProvidePluralized: "did not provide evaluation",
                noTeamProvide: "no team has provide evaluation",
                noPlayerProvide: "no player has provide evaluation"
            }
        }
    });
});

