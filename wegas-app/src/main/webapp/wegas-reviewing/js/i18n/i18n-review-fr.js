/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Maxence Laurent <maxence.laurent> <gmail.com>
 */
/*global Variable, gameModel, self */

YUI.add("wegas-i18n-review-fr", function(Y) {
    Y.Wegas.I18n.register("wegas-i18n-review", "fr", {
        review: {
            orchestrator: {
                mainTitle: "Processus d'évaluations croisées pour \"{{variableName}}\"",
                includeEvicted: "Les auteurs qui n'ont pas soumis de données à examiner doivent quand-même recevoir quelque chose à évaluer",
                state: {
                    edition: {
                        title: "Édition",
                        description: "Les auteurs éditent ce qui sera examiné par les pairs<br/> <br /><i>Le processus n'a pas encore commencé</i>"
                    },
                    reviewing: {
                        title: "Revue par les pairs",
                        description: "Les auteurs évaluent leurs pairs<br /><br /><i>C'est la première étape du processus</i>"
                    },
                    commenting: {
                        title: "Commentaires",
                        description: "Les auteurs prennent connaissance des avis de leurs pairs<br /><br /><i>Ils commentent ces avis</i>"
                    },
                    completed: {
                        title: "Terminé",
                        description: "Le processus de révision est terminé<br /><br /><i>Les pairs prennent connaissance des commentaires qui ont été faits à propos de leurs avis</i>"
                    }
                },
                properties: "propriétés",
                overview: "aperçu",
                reviews: "feedbacks",
                comments: "commentaires",
                charts: "Statistiques",
                playerData: "Informations revues par les pairs pour le joueur \"{{playerName}}\"",
                teamData: "Informations revues par les pairs pour l'équipe \"{{teamName}}\"",
                goNextConfirmation: "Cette action est irréversible.<br />\nÊtes-vous sûr de vouloir passer à l'étape suivante ?",
                stats: {
                    mean: "moy.",
                    median: "med.",
                    sd: "&sigma;",
                    bounds: "bornes",
                    basedOn: "basé sur {{available}}/{{expected}} valeurs",
                    avgWc: "Nombre moyen de mots",
                    avgCc: "Nombre moyen de caractères"
                },
                notAvailableYet: "Pas encore disponible"
            },
            global: {
                submit: "Valider",
                confirmation: "Une fois validées, vous ne pourrez plus modifier ces informations.<br />Êtes-vous sûr de vouloir continuer ?",
                save: "Sauver"
            },
            tabview: {
                emptyness_message: "Aucune évaluation n'est actuellement visible",
                toReviewTitle: "Évaluer vos pairs",
                toReview: "Soumission",
                toCommentTitle: "Avis concernant votre soumission",
                toComment: "Avis"
            },
            editor: {
                given: "Selon : ",
                number: "n°",
                ask_your_feedback: "Donnez votre feedback",
                your_feedback: "Votre feedback",
                reviewer_feedback: "Le feedback reçu:",
                ask_reviewer_feedback: "",
                ask_comment: "Que pensez vous du feedback reçu ?",
                comment: "Ce que vous pensez du feedback reçu",
                author_comment: "Ce que l'auteur pense de votre feedback",
                noValueProvided: "Aucune évaluation n'a été fournie",
                didNotProvide: "n'a pas fourni d'évaluation",
                didNotProvidePluralized: "n'ont pas fourni d'évaluation",
                noTeamProvide: "aucune équipe n'a fourni d'évaluation",
                noPlayerProvide: "aucun joueur n'a fourni d'évaluation"
            }
        }
    });
});
