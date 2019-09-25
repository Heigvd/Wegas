
/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Maxence Laurent <maxence.laurent> <gmail.com>
 */
/*global Variable, gameModel, self */

YUI.add("wegas-i18n-review-it", function(Y) {
    Y.Wegas.I18n.register("wegas-i18n-review", "it", {
        review: {
            orchestrator: {
                mainTitle: "Peer Review Process for \"{{variableName}}\"",
                includeEvicted: "Authors who did not submit anything for review shall still receive something to review",
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
                goNextConfirmation: "This action cannot be undone.<br />\nDo you want to enter the next step of the reviewing process?",
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
                reviewer_feedback: "Reviewer feedback",
                ask_reviewer_feedback: "",
                ask_comment: "What do you think about your reviewer's feedback?",
                comment: "Your thoughts about feedback your reviewer's feedback",
                author_comment: "What this author thinks about your feedback:",
                noValueProvided: "No evaluation provided",
                didNotProvide: "did not provide any evaluation",
                didNotProvidePluralized: "did not provide any evaluation",
                noTeamProvide: "no team has provided any evaluation",
                noPlayerProvide: "no player has provided any evaluation"
            }
        }
    });
});

