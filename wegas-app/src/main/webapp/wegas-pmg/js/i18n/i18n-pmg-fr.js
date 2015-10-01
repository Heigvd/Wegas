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

YUI.add("wegas-i18n-pmg-fr", function(Y) {
    Y.Wegas.I18n.register("wegas-i18n-pmg", "fr", {
        pmg: {
            navigation: {
                thisWeek: "cette semaine",
                thisMonth: "ce mois",
                home: "accueil",
                project: "projet",
                tasks: "tâches",
                gantt: "gantt",
                resources: "ressources",
                evm: "evm",
                iterations: "iterations",
                actions: "actions",
                questions: "questions",
                mailbox: "messagerie",
                history: "historique",
                nextPeriod: "periode suivante",
                nextPhase: "phase suivante",
                news: "nouvelles",
                confirm: "Êtes-vous sûr de vouloir continuer ?"
            },
            indicators: {
                costs: "coûts",
                quality: "qualité",
                schedule: "délais",
                timebudget: "carte-temps"
            },
            project: {
                overview: "vue d'ensemble du projet",
                details: "état d'avancement du projet",
                history: "historique des indicateurs ",
                initialBudget: "budget initial",
                percentOfInitialBudget: "{{percent}}% du budget initial",
                bac: "coût planifié (BAC)",
                sumBac: "total des BAC : {{total}}",
                bac_short: "BAC",
                percentOfBac: "{{percent}}% du coût planifié",
                progress: "avancement global",
                wages: "salaires",
                fixedCosts: "frais fixes du projet",
                tasksFixedCosts: "frais fixes des tâches",
                unworkedHours: "heures non-travaillées"
            },
            tasks: {
                index: "n°",
                name: "nom",
                estimatedDuration: "durée <br/>estimée",
                duration: "durée",
                fixedCosts: "frais fixes",
                requirements: "ressources requises",
                assignees: "ressources assignées",
                realized: "réalisé"
            },
            resources: {
                name: "nom",
                grade: "niveau",
                wages: "salaire mensuel",
                rate: "taux",
                motivation: "motiv.",
                assignments: "affectations",
                willWork: "travaillera selon"
            },
            gantt: {
                worked: 'a travaillé',
                willWork: 'travaillera',
                mayWork: 'pourrait travailler',
                unavailable: "indisponible",
                delay: "délai d'engagement",
                baseline: "planification",
                effective: "effectif",
                projection: "projection"
            },
            grade: {
                apprentice: "apprenti",
                junior: "junior",
                senior: "senior",
                expert: "expert"
            },
            evm: {
                pv: "coût planifié (PV)",
                ev: "valeur acquise (EV)",
                ac: "coût réel (AC)"
            },
            mcq: {
                actionsTitle: "Actions disponibles durant la phase courante",
                questionsTitle: "Questions à répondre durant {{thisTime}}"
            },
            mailbox: {
                title: "boîte de réception",
                message: "message"
            },
            iterations: {
                tasks: "tâches",
                teamSize: "taille d'équipe",
                workloads: "charges de travail",
                period: "période",
                willBeginAt: "Commencera à la période",
                beganAt: "A commencé à la période",
                planned: "planifié",
                realized: "réalisé",
                projection: "projeté",
                spent: "dépensé",
                deleteConfirmation: "Êtes-vous sûr de vouloir supprimer cette itération ?"
            }
        }
    });
});
