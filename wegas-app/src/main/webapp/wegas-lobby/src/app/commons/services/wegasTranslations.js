angular.module('wegas.service.wegasTranslations', [])
    .provider('WegasTranslations', function($translateProvider) {
        "use strict";
        return {
            getTranslations: function(language) {
                var translations = this.$get().translations,
                    translationsToReturn = {};
                for (var label in translations) {
                    translationsToReturn[label] = translations[label][language];
                }
                return translationsToReturn;
            },
            default: function() {
                $translateProvider.useSanitizeValueStrategy('escape'); // Minimal security required against XSS, but it prevents HTML inside translation strings.
                var cfg = localStorage.getObject("wegas-config");
                if (cfg && cfg.commons && cfg.commons.language) {
                    $translateProvider.preferredLanguage(cfg.commons.language);
                } else {
                    var frList = ['fr', 'fr-fr', 'fr-ch', 'fr-mc', 'fr-ca', 'fr-lu'],
                        isFr = false,
                        language = window.navigator.userLanguage || window.navigator.language;
                    language = language.toLowerCase();
                    frList.forEach(function(frCode) {
                        if (language === frCode) {
                            isFr = true;
                        }
                    });
                    localStorage.setObject("wegas-config", {
                        'commons': {
                            'language': (isFr ? 'fr' : 'en')
                        },
                        'users': {}
                    });
                    $translateProvider.preferredLanguage(isFr ? 'fr' : 'en');
                }
            },
            $get: function() {
                var keywords = {
                    'user': {
                        singular: {
                            en: "user",
                            fr: "utilisateur"
                        },
                        plural: {
                            en: "users",
                            fr: "utilisateurs"
                        }
                    },
                    'player': {
                        singular: {
                            en: "player",
                            fr: "joueur"
                        },
                        plural: {
                            en: "players",
                            fr: "joueurs"
                        }
                    },
                    'trainer': {
                        singular: {
                            en: "trainer",
                            fr: "animateur"
                        },
                        plural: {
                            en: "trainers",
                            fr: "animateurs"
                        }
                    },
                    'scenarist': {
                        singular: {
                            en: "scenarist",
                            fr: "scénariste"
                        },
                        plural: {
                            en: "scenarists",
                            fr: "scénaristes"
                        }
                    },
                    'modeler': {
                        singular: {
                            en: "modeler",
                            fr: "modeleur"
                        },
                        plural: {
                            en: "modelers",
                            fr: "modeleurs"
                        }
                    },
                    'admin': {
                        singular: {
                            en: "administrator",
                            fr: "administrateur"
                        },
                        plural: {
                            en: "administrators",
                            fr: "administrateurs"
                        }
                    },
                    'team': {
                        singular: {
                            en: "team",
                            fr: "équipe"
                        },
                        plural: {
                            en: "teams",
                            fr: "équipes"
                        }
                    },
                    'session': {
                        singular: {
                            en: "session",
                            fr: "partie"
                        },
                        plural: {
                            en: "sessions",
                            fr: "parties"
                        }
                    },
                    'scenario': {
                        singular: {
                            en: "scenario",
                            fr: "scénario"
                        },
                        plural: {
                            en: "scenarios",
                            fr: "scénarios"
                        }
                    },
                    'model': {
                        singular: {
                            en: "model",
                            fr: "modèle"
                        },
                        plural: {
                            en: "models",
                            fr: "modèles"
                        }
                    },
                    'token': {
                        singular: {
                            en: "access key",
                            fr: "clé d'accès"
                        },
                        plural: {
                            en: "access keys",
                            fr: "clés d'accès"
                        }
                    },
                    'workspace': {
                        singular: {
                            en: "workspace",
                            fr: "espace de travail"
                        },
                        plural: {
                            en: "workspaces",
                            fr: "espaces de travail"
                        }
                    }
                },
                    startSentence = function(word) {
                        return word.charAt(0).toUpperCase() + word.slice(1);
                    };
                return {
                    'languages': [
                        {
                            'key': 'fr',
                            'name': "Français"
                        },
                        {
                            'key': 'en',
                            'name': "English"
                        }
                    ],
                    'translations': {
                        //warning
                        'DEPRECATED-BROWSER': {
                            'en': 'You are using an outdated and unsupported browser. Please upgrade your browser to log in',
                            'fr': 'Vous utilisez un navigateur obsolète. Veuillez le mettre à jour pour pouvoir vous connecter',
                        },
                        // Commons
                        'WEGAS-KEYWORD-AND': {
                            'en': 'and',
                            'fr': "et"
                        },
                        'WEGAS-TERMS-OF-USE-TITLE': {
                            'en': 'the general terms of use',
                            'fr': "les conditions générales"
                        },
                        'WEGAS-DATA-PRIVACY-TITLE': {
                            'en': 'the data management policy',
                            'fr': "la politique de gestion des données"
                        },
                        'WEGAS-TERMS-OF-USE-URL': {
                            'en': 'https://www.albasim.ch/en/terms-of-use/',
                            'fr': 'https://www.albasim.ch/en/terms-of-use/'
                        },
                        'WEGAS-DATA-PRIVACY-URL': {
                            'en': 'https://www.albasim.ch/en/data-policy/',
                            'fr': 'https://www.albasim.ch/en/data-policy/'
                        },
                        'LANGUAGE-FRENCH-NAME': {
                            'en': "Français",
                            'fr': "Français"
                        },
                        'LANGUAGE-ENGLISH-NAME': {
                            'en': "English",
                            'fr': "English"
                        },
                        'LOADING': {
                            'en': "Loading ...",
                            'fr': "Chargement ..."
                        },
                        'MODALE-CLOSE': {
                            'en': "Close",
                            'fr': "Fermer"
                        },

                        // Public
                        'WEGAS-TITLE': {
                            'en': "Wegas",
                            'fr': "Wegas"
                        },
                        'WEGAS-SLOGAN': {
                            'en': "The \"learning by doing\" solution from AlbaSim",
                            'fr': "La solution \"learning by doing\" développée par AlbaSim"
                        },
                        'CHOOSE-LANGUAGE-BTN': {
                            'en': "Change language",
                            'fr': "Changer de langue"
                        },
                        'LOGIN-BTN': {
                            'en': "Login",
                            'fr': "Connexion"
                        },
                        'LOGIN-INPUT-EMAIL': {
                            'en': "email or username",
                            'fr': "email ou nom d'utilisateur"
                        },
                        'LOGIN-INPUT-PASSWORD': {
                            'en': "password",
                            'fr': "mot de passe"
                        },
                        'LOGIN-INPUT-AGREE': {
                            'en': 'The use of this service implies that you agree to',
                            'fr': "L'utilisation de ce service implique que vous en acceptez"
                        },
                        'LOGIN-FLASH-EMPTY': {
                            'en': "Username and password cannot be empty",
                            'fr': "Veuillez renseigner l'email et le mot de passe"
                        },
                        'LOGIN-AAI-ACCOUNT-BTN': {
                            'en': "Recommended to AAI users:",
                            'fr': "Recommandé aux utilisateurs AAI:"
                        },
                        'CREATE-ACCOUNT-BTN': {
                            'en': "Create Wegas account",
                            'fr': "Créer un compte Wegas"
                        },
                        'CREATE-ACCOUNT-TITLE': {
                            'en': "Create account",
                            'fr': "Créer un compte"
                        },
                        'CREATE-ACCOUNT-INPUT-EMAIL': {
                            'en': "E-mail",
                            'fr': "E-mail"
                        },
                        'CREATE-ACCOUNT-INPUT-PASSWORD': {
                            'en': "Password",
                            'fr': "Mot de passe"
                        },
                        'CREATE-ACCOUNT-INPUT-PASSWORD-AGAIN': {
                            'en': "Password again",
                            'fr': "Répéter le mot de passe"
                        },
                        'CREATE-ACCOUNT-INPUT-USERNAME': {
                            'en': "Username",
                            'fr': "Nom d'utilisateur"
                        },
                        'CREATE-ACCOUNT-INPUT-FIRSTNAME': {
                            'en': "First name",
                            'fr': "Prénom"
                        },
                        'CREATE-ACCOUNT-INPUT-LASTNAME': {
                            'en': "Last name",
                            'fr': "Nom de famille"
                        },
                        'CREATE-ACCOUNT-INPUT-AGREE': {
                            'en': 'I agree with',
                            'fr': "J'accepte"
                        },
                        'CREATE-ACCOUNT-SEND-BTN': {
                            'en': "Let's go!",
                            'fr': "C'est parti !"
                        },
                        // Referenced server side:
                        'CREATE-ACCOUNT-TAKEN-USERNAME': {
                            'en': "This username is already taken",
                            'fr': "Ce nom d'utilisateur est déjà pris"
                        },
                        // Referenced server side:
                        'CREATE-ACCOUNT-TAKEN-EMAIL': {
                            'en': "This e-mail address is already taken",
                            'fr': "Cette adresse e-mail est déjà prise"
                        },
                        // Referenced server side:
                        'CREATE-ACCOUNT-INVALID-EMAIL': {
                            'en': "This e-mail address is not valid",
                            'fr': "Cette adresse e-mail n'est pas valide"
                        },
                        'CREATE-ACCOUNT-FLASH-WRONG-EMAIL': {
                            'en': "An e-mail address is required",
                            'fr': "Veuillez entrer votre adresse e-mail"
                        },
                        'CREATE-ACCOUNT-FLASH-WRONG-EMAIL-IN-USERNAME': {
                            'en': "A username can not contain the '@' character",
                            'fr': "Le nom d'utilisateur ne peux pas contenir de '@'"
                        },
                        'CREATE-ACCOUNT-FLASH-WRONG-USERNAME': {
                            'en': "A username is required",
                            'fr': "Veuillez entrer un nom d'utilisateur"
                        },
                        'CREATE-ACCOUNT-FLASH-WRONG-NAME': {
                            'en': "First and last names are required",
                            'fr': "Veuillez renseigner votre prénom et nom de famille"
                        },
                        'CREATE-ACCOUNT-FLASH-WRONG-PASS': {
                            'en': "The password must contain at least 3 characters",
                            'fr': "Le mot de passe doit contenir au moins 3 caractères"
                        },
                        'CREATE-ACCOUNT-FLASH-WRONG-PASS2': {
                            'en': "Passwords must be identical",
                            'fr': "Les mots de passe doivent être identiques"
                        },
                        'CREATE-ACCOUNT-FLASH-MUST-AGREE': {
                            'en': "Please agree with the terms of use",
                            'fr': "Merci d'accepter les conditions d'utilisation"
                        },
                        'PASSWORD-BTN': {
                            'en': "Forgotten password?",
                            'fr': "Mot de passe oublié ?"
                        },
                        'PASSWORD-INPUT-EMAIL': {
                            'en': "type your email",
                            'fr': "entrez votre email"
                        },
                        'PASSWORD-TITLE': {
                            'en': "Password forgotten",
                            'fr': "Mot de passe oublié"
                        },
                        'PASSWORD-SEND-BTN': {
                            'en': 'Send me a new password',
                            'fr': "Envoyez-moi un nouveau mot de passe"
                        },
                        'PASSWORD-FLASH-EMPTY': {
                            'en': "Please, enter your email",
                            'fr': "Merci d'entrer votre email"
                        },
                        // Commons dates
                        'COMMONS-DATE': {
                            'en': "{{date | date:'MM/dd/yyyy'}}",
                            'fr': "{{date | date:'dd.MM.yyyy'}}"
                        },

                        // Commons Auth service
                        'COMMONS-AUTH-PASSWORD-FLASH-SUCCESS': {
                            'en': "A new password has been sent by e-mail.\nWe recommend that you check your spam/junk mail folder.\n ",
                            'fr': "Un nouveau mot de passe a été envoyé par e-mail.\nVérifiez éventuellement dans vos messages indésirables (spam).\n "
                        },
                        'COMMONS-AUTH-PASSWORD-FLASH-ERROR': {
                            'en': "Error during password generation",
                            'fr': "Erreur durant la génération du mot de passe"
                        },
                        'COMMONS-AUTH-EMAIL-VERIFY-FLASH-SUCCESS': {
                            'en': "A validation request has been sent by e-mail.\nWe recommend that you check your spam/junk mail folder.\n ",
                            'fr': "Une demande de validation a été envoyée par e-mail.\nVérifiez éventuellement dans vos messages indésirables (spam).\n "
                        },
                        'COMMONS-AUTH-EMAIL-VERIFY-FLASH-ERROR': {
                            'en': "Error during email validation request",
                            'fr': "Erreur durant la requête de vérification de l'adresse e-mail"
                        },
                        'COMMONS-AUTH-CREATE-ACCOUNT-FLASH-SUCCESS': {
                            'en': "AlbaSim - Wegas",
                            'fr': "AlbaSim - Wegas"
                        },
                        'COMMONS-AUTH-CREATE-ACCOUNT-FLASH-ERROR': {
                            'en': "Error while creating account",
                            'fr': "Erreur durant la création du compte"
                        },
                        'COMMONS-AUTH-LOGIN-FLASH-SUCCESS': {
                            'en': "You are logged in",
                            'fr': "Vous êtes connecté"
                        },
                        'COMMONS-AUTH-LOGIN-FLASH-ERROR-CLIENT': {
                            'en': "Login or password is wrong",
                            'fr': "Login ou mot de passe incorrect"
                        },
                        'COMMONS-AUTH-LOGIN-FLASH-ERROR-SERVER': {
                            'en': "Server error during connection",
                            'fr': "Erreur serveur durant la connexion"
                        },
                        'COMMONS-AUTH-LOGOUT-FLASH-SUCCESS': {
                            'en': "You are logged out",
                            'fr': "Vous êtes déconnecté"
                        },
                        'COMMONS-AUTH-LOGOUT-FLASH-ERROR': {
                            'en': "Error during logout",
                            'fr': "Erreur durant la déconnexion"
                        },
                        'COMMONS-AUTH-CURRENT-FLASH-ERROR': {
                            'en': "You need to be logged in",
                            'fr': "Connexion nécessaire"
                        },
                        'COMMONS-AUTH-IS-ADMIN-FLASH-ERROR': {
                            'en': "You need to be admin",
                            'fr': "Connexion comme administrateur nécessaire"
                        },
                        'COMMONS-AUTH-GUEST-FLASH-SUCCESS': {
                            'en': "Connected as guest",
                            'fr': "Connecté en tant qu'invité"
                        },
                        'COMMONS-AUTH-GUEST-FLASH-ERROR': {
                            'en': "Error while logging in",
                            'fr': "Erreur durant la connexion"
                        },

                        // Commons Teams model
                        'COMMONS-TEAMS-FIND-FLASH-SUCCESS': {
                            'en': startSentence(keywords.team.plural.en) + " found",
                            'fr': startSentence(keywords.team.plural.fr) + " trouvées"
                        },
                        'COMMONS-TEAMS-GET-FLASH-SUCCESS': {
                            'en': startSentence(keywords.team.singular.en) + " found",
                            'fr': startSentence(keywords.team.singular.fr) + " trouvée"
                        },
                        'COMMONS-TEAMS-GET-FLASH-ERROR': {
                            'en': "No " + keywords.team.singular.en + " found",
                            'fr': "Aucune " + keywords.team.singular.fr + " trouvée"
                        },
                        'COMMONS-TEAMS-JOIN-FLASH-SUCCESS': {
                            'en': "You just joined the " + keywords.team.singular.en,
                            'fr': "Vous avez rejoint l'" + keywords.team.singular.fr
                        },
                        'COMMONS-TEAMS-JOIN-FLASH-ERROR': {
                            'en': "Error while joining " + keywords.team.singular.en,
                            'fr': "Erreur durant la tentative de rejoindre l'" + keywords.team.singular.fr
                        },
                        'COMMONS-TEAMS-JOIN-INDIVIDUALLY-FLASH-SUCCESS': {
                            'en': "You just joined the " + keywords.session.singular.en,
                            'fr': "Vous avez rejoint la " + keywords.session.singular.fr
                        },
                        'COMMONS-TEAMS-JOIN-INDIVIDUALLY-FLASH-ERROR': {
                            'en': "Error while joining " + keywords.session.singular.en,
                            'fr': "Erreur durant la tentative de rejoindre la " + keywords.session.singular.fr
                        },
                        'COMMONS-TEAMS-JOIN-RETRY': {
                            'en': "Retry to join the " + keywords.session.singular.en,
                            'fr': "Tenter de rejoindre la " + keywords.session.singular.fr + " à nouveau"
                        },
                        'COMMONS-TEAMS-JOIN-QUEUED': {
                            'en': "Scheduled for initialization",
                            'fr': "En attente de création"
                        },
                        'COMMONS-TEAMS-JOIN-TIME-TO-GO': {
                            'en': "Still {{t}}s to go",
                            'fr': "Encore {{t}}s"
                        },
                        'COMMONS-TEAMS-JOIN-PROCESSING': {
                            'en': "In progress",
                            'fr': "En cours de création"
                        },
                        'COMMONS-TEAMS-ALREADY-JOIN-FLASH-INFO': {
                            'en': "You have already joined this " + keywords.session.singular.en,
                            'fr': "Vous avez déjà rejoint cette " + keywords.session.singular.fr
                        },
                        'COMMONS-TEAMS-LEAVE-FLASH-SUCCESS': {
                            'en': "You have left the " + keywords.session.singular.en,
                            'fr': "Vous avez rejoint la " + keywords.session.singular.fr
                        },
                        'COMMONS-TEAMS-LEAVE-FLASH-ERROR': {
                            'en': "Error while leaving " + keywords.session.singular.en,
                            'fr': "Erreur durant la tentative de quitter la " + keywords.session.singular.fr
                        },
                        'COMMONS-TEAMS-NO-TEAM-FLASH-ERROR': {
                            'en': "No " + keywords.team.singular.en + " found",
                            'fr': "Aucune " + keywords.team.singular.fr + " trouvée"
                        },
                        'COMMONS-TEAMS-NO-PLAYER-FLASH-ERROR': {
                            'en': "No " + keywords.player.singular.en + " found",
                            'fr': "Aucun " + keywords.player.singular.fr + " trouvé"
                        },
                        'COMMONS-TEAMS-RELOAD-FLASH-SUCCESS': {
                            'en': startSentence(keywords.team.singular.en) + " reloaded",
                            'fr': startSentence(keywords.team.singular.fr) + " rechargée"
                        },
                        'COMMONS-TEAMS-RELOAD-FLASH-ERROR': {
                            'en': "Error while reloading " + keywords.team.singular.en,
                            'fr': "Erreur durant le rechargement de l'" + keywords.team.singular.fr
                        },
                        'COMMONS-TEAMS-CREATE-FLASH-SUCCESS': {
                            'en': startSentence(keywords.team.singular.en) + " created",
                            'fr': startSentence(keywords.team.singular.fr) + " créée"
                        },
                        'COMMONS-TEAMS-CREATE-EXISTING-TEAM-FLASH-INFO': {
                            'en': "Existing name " + keywords.team.singular.en,
                            'fr': "Ce nom de " + keywords.team.singular.fr + " est déjà utilisé"
                        },
                        'COMMONS-TEAMS-CREATE-FLASH-ERROR': {
                            'en': "Error while creating " + keywords.team.singular.en,
                            'fr': "Erreur durant la création de l'" + keywords.team.singular.fr
                        },
                        'COMMONS-TEAMS-GUEST-JOINING': {
                            'en': "Preparation of anonymous guest account ...",
                            'fr': "Préparation d'un compte invité anonyme ..."
                        },

                        // Commons Sessions Model
                        'COMMONS-SESSIONS-LOADING': {
                            'en': "Loading " + keywords.session.plural.en,
                            'fr': "Chargement des " + keywords.session.plural.fr
                        },
                        'COMMONS-SESSIONS-CLOSE-FLASH-ERROR': {
                            'en': "Closed " + keywords.session.singular.en,
                            'fr': startSentence(keywords.session.singular.fr) + " fermée"
                        },
                        'COMMONS-SESSIONS-NO-SESSION-FLASH-ERROR': {
                            'en': "No " + keywords.session.singular.en + " selected",
                            'fr': "Aucune " + keywords.session.singular.fr + " choisie"
                        },
                        'COMMONS-SESSIONS-FIND-FLASH-SUCCESS': {
                            'en': startSentence(keywords.session.plural.en) + " found",
                            'fr': startSentence(keywords.session.plural.fr) + " trouvées"
                        },
                        'COMMONS-SESSIONS-FIND-FLASH-ERROR': {
                            'en': "Error while loading  " + keywords.session.plural.en,
                            'fr': "Une erreur est survenue durant le chargement des " + keywords.session.plural.fr
                        },
                        'COMMONS-SESSIONS-GET-FLASH-SUCCESS': {
                            'en': startSentence(keywords.session.singular.en) + " found",
                            'fr': startSentence(keywords.session.singular.fr) + " trouvée"
                        },
                        'COMMONS-SESSIONS-GET-FLASH-ERROR': {
                            'en': "No " + keywords.session.singular.en + " found",
                            'fr': "Aucune " + keywords.session.singular.fr + " trouvée"
                        },
                        'COMMONS-SESSIONS-UPDATE-FLASH-SUCCESS': {
                            'en': startSentence(keywords.session.singular.en) + " up-to-date",
                            'fr': startSentence(keywords.session.singular.fr) + " mise à jour"
                        },
                        'COMMONS-SESSIONS-UPDATE-FLASH-ERROR': {
                            'en': "Error while updating  " + keywords.session.singular.en,
                            'fr': "Une erreur est survenue durant la mise à jour de la " + keywords.session.singular.fr
                        },
                        // Referenced server side:
                        'COMMONS-SESSIONS-EMPTY-TOKEN-ERROR': {
                            'en': "Access key cannot be empty",
                            'fr': "La clé d'accès ne peut pas être vide"
                        },
                        // Referenced server side:
                        'COMMONS-SESSIONS-TAKEN-TOKEN-ERROR': {
                            'en': "This access key is already used for another " + keywords.session.singular.en,
                            'fr': "Cette clé d'accès est déjà utilisée pour une autre " + keywords.session.singular.fr
                        },
                        'COMMONS-SESSIONS-UPDATE-NO-SESSION-FLASH-ERROR': {
                            'en': "No " + keywords.session.singular.en + " to update",
                            'fr': "Aucune " + keywords.session.singular.fr + " à mettre à jour"
                        },
                        'COMMONS-SESSIONS-TEAM-REMOVE-FLASH-SUCCESS': {
                            'en': startSentence(keywords.team.singular.en) + " has been removed from the " +
                                keywords.session.singular.en,
                            'fr': keywords.team.singular.fr + " supprimée de la " +
                                keywords.session.singular.fr
                        },
                        'COMMONS-SESSIONS-TEAM-REMOVE-FLASH-ERROR': {
                            'en': "Error during deletion of " + keywords.team.singular.en,
                            'fr': "Une erreur est survenue durant la suppression de l'" + keywords.team.singular.fr
                        },
                        'COMMONS-SESSIONS-PLAYER-REMOVE-FLASH-SUCCESS': {
                            'en': startSentence(keywords.player.singular.en) + " has been removed from the " +
                                keywords.session.singular.en,
                            'fr': "Le " + keywords.player.singular.fr + " a été retiré de la " +
                                keywords.session.singular.fr
                        },
                        'COMMONS-SESSIONS-PLAYER-REMOVE-FLASH-ERROR': {
                            'en': "Error during deletion of " + keywords.player.singular.en,
                            'fr': "Une erreur est survenue durant la suppression du " + keywords.player.singular.fr
                        },
                        'COMMONS-SESSIONS-REFRESH-SUCCESS': {
                            'en': startSentence(keywords.session.singular.en) + " refreshed",
                            'fr': startSentence(keywords.session.singular.fr) + " rafraichie"
                        },
                        'COMMONS-SESSIONS-REFRESH-ERROR': {
                            'en': "Error while refreshing " + keywords.session.singular.en,
                            'fr': "Une erreur est survenue durant le rafraichissement du " +
                                keywords.session.singular.fr
                        },
                        'COMMONS-SESSIONS-EDIT-ACCESS-SUCCESS': {
                            'en': "{{access}} " + keywords.session.singular.en,
                            'fr': startSentence(keywords.session.singular.fr) + " {{access}}"
                        },
                        'COMMONS-SESSIONS-EDIT-ACCESS-ERROR': {
                            'en': "Error while editing " + keywords.session.singular.en + " access",
                            'fr': "Une erreur est survenue durant l'édition de l'accès à la " +
                                keywords.session.singular.fr
                        },
                        'COMMONS-SESSIONS-CREATE-SUCCESS': {
                            'en': startSentence(keywords.session.singular.en) + " created",
                            'fr': startSentence(keywords.session.singular.fr) + " créée"
                        },
                        'COMMONS-SESSIONS-CREATE-ERROR': {
                            'en': "Error while creating " + keywords.session.singular.en,
                            'fr': "Une erreur est survenue durant la création de la " + keywords.session.singular.fr
                        },
                        'COMMONS-SESSIONS-NO-NAME-FLASH-ERROR': {
                            'en': "Please give a name to the " + keywords.session.singular.en,
                            'fr': "Veuillez donner un nom à la " + keywords.session.singular.fr
                        },
                        'COMMONS-SESSIONS-ADD-TRAINER-SUCCESS': {
                            'en': startSentence(keywords.trainer.singular.en) + " added",
                            'fr': startSentence(keywords.trainer.singular.fr) + " ajouté"
                        },
                        'COMMONS-SESSIONS-ADD-TRAINER-ERROR': {
                            'en': "Error while adding " + keywords.trainer.singular.en,
                            'fr': "Une erreur est survenue durant l'ajout du " + keywords.trainer.singular.fr
                        },
                        'COMMONS-SESSIONS-ALREADY-TRAINER-INFO': {
                            'en': "This user is already a " + keywords.trainer.singular.en + " for this " +
                                keywords.session.singular.en,
                            'fr': "Cet utilisateur est déjà un " + keywords.trainer.singular.fr + " pour la " +
                                keywords.session.singular.fr
                        },
                        'COMMONS-SESSIONS-NO-ACCESS-ERROR': {
                            'en': "This user is already a " + keywords.trainer.singular.en + " for this " +
                                keywords.session.singular.en,
                            'fr': "Cet utilisateur est déjà un " + keywords.trainer.singular.fr + " pour la " +
                                keywords.session.singular.fr
                        },
                        'COMMONS-SESSIONS-REMOVE-TRAINER-SUCCESS': {
                            'en': startSentence(keywords.trainer.singular.en) + " removed",
                            'fr': startSentence(keywords.trainer.singular.fr) + " enlevé"
                        },
                        'COMMONS-SESSIONS-REMOVE-TRAINER-ERROR': {
                            'en': "You can not remove this " + keywords.trainer.singular.en,
                            'fr': "Vous ne pouvez pas enlever cet " + keywords.trainer.singular.fr
                        },
                        'COMMONS-SESSIONS-ARCHIVE-SUCCESS': {
                            'en': startSentence(keywords.session.singular.en) + " archived",
                            'fr': startSentence(keywords.session.singular.fr) + " archivée"
                        },
                        'COMMONS-SESSIONS-ARCHIVE-ERROR': {
                            'en': "Error while archiving " + keywords.session.singular.en,
                            'fr': "Une erreur est survenue durant l'archivage de la " + keywords.session.singular.fr
                        },
                        'COMMONS-SESSIONS-UNARCHIVE-SUCCESS': {
                            'en': startSentence(keywords.session.singular.en) + " unarchived",
                            'fr': startSentence(keywords.session.singular.fr) + " désarchivée"
                        },
                        'COMMONS-SESSIONS-UNARCHIVE-ERROR': {
                            'en': "Error while unarchiving " + keywords.session.singular.en,
                            'fr': "Une erreur est survenue durant le désarchivage de la " +
                                keywords.session.singular.fr
                        },
                        'COMMONS-SESSIONS-SUPPRESSION-SUCCESS': {
                            'en': startSentence(keywords.session.singular.en) + " suppressed",
                            'fr': startSentence(keywords.session.singular.fr) + " supprimée"
                        },
                        'COMMONS-SESSIONS-SUPPRESSION-ERROR': {
                            'en': "Error while unarchiving " + keywords.session.singular.en,
                            'fr': "Une erreur est survenue durant le désarchivage de la " +
                                keywords.session.singular.fr
                        },
                        'COMMONS-SESSIONS-WRONG-OBJECT-ERROR': {
                            'en': "This is not a " + keywords.session.singular.en,
                            'fr': "Ce n'est pas une " + keywords.session.singular.fr
                        },

                        // Commons Scenarios Model

                        'COMMONS-SCENARIOS-LOADING': {
                            'en': "Loading " + keywords.scenario.plural.en,
                            'fr': "Chargement des " + keywords.scenario.plural.fr
                        },
                        'COMMONS-SCENARIO-UPLOADING': {
                            'en': "Loading " + keywords.scenario.singular.en,
                            'fr': "Chargement du " + keywords.scenario.singular.fr
                        },
                        'COMMONS-SCENARIOS-NO-SCENARIO-FLASH-ERROR': {
                            'en': "No " + keywords.scenario.singular.en + " selected",
                            'fr': "Aucun " + keywords.scenario.singular.fr + " choisi"
                        },
                        'COMMONS-SCENARIOS-NO-TEMPLATE-FLASH-ERROR': {
                            'en': "You need to pick a " + keywords.scenario.singular.en + " as basis",
                            'fr': "Vous devez sélectionner un " + keywords.scenario.singular.fr + " de base"
                        },
                        'COMMONS-SCENARIOS-EMPTY-NAME-FLASH-ERROR': {
                            'en': "Name field can not be empty",
                            'fr': "Veuillez donner un nom à votre " + keywords.scenario.singular.fr
                        },
                        'COMMONS-SCENARIOS-NO-NAME-TEMPLATE-FLASH-ERROR': {
                            'en': "Name or template is missing",
                            'fr': "Vous devez renseigner le nom et le template"
                        },
                        'COMMONS-SCENARIOS-FIND-FLASH-SUCCESS': {
                            'en': startSentence(keywords.scenario.plural.en) + " found",
                            'fr': startSentence(keywords.scenario.plural.fr) + " trouvés"
                        },
                        'COMMONS-SCENARIOS-FIND-FLASH-ERROR': {
                            'en': "Error while loading  " + keywords.scenario.plural.en,
                            'fr': "Une erreur est survenue durant le chargement des " + keywords.scenario.plural.fr
                        },
                        'COMMONS-SCENARIOS-GET-FLASH-SUCCESS': {
                            'en': startSentence(keywords.scenario.singular.en) + " found",
                            'fr': startSentence(keywords.scenario.singular.fr) + " trouvé"
                        },
                        'COMMONS-SCENARIOS-GET-FLASH-ERROR': {
                            'en': "No " + keywords.scenario.singular.en + " found",
                            'fr': "Aucun " + keywords.scenario.singular.fr + " trouvé"
                        },
                        'COMMONS-SCENARIOS-CREATE-FLASH-SUCCESS': {
                            'en': startSentence(keywords.scenario.singular.en) + " created",
                            'fr': startSentence(keywords.scenario.singular.fr) + " créé"
                        },
                        'COMMONS-SCENARIOS-CREATE-FLASH-ERROR': {
                            'en': "Error while creating  " + keywords.scenario.singular.en,
                            'fr': "Une erreur est survenue durant la création des " + keywords.scenario.singular.fr
                        },
                        'COMMONS-SCENARIOS-COPY-FLASH-SUCCESS': {
                            'en': startSentence(keywords.scenario.singular.en) + " copied",
                            'fr': startSentence(keywords.scenario.singular.fr) + " copié"
                        },
                        'COMMONS-SCENARIOS-COPY-FLASH-ERROR': {
                            'en': "Error while copying  " + keywords.scenario.singular.en,
                            'fr': "Une erreur est survenue durant la copie du " + keywords.scenario.singular.fr
                        },
                        'COMMONS-SCENARIOS-NO-COPY-FLASH-ERROR': {
                            'en': "You need to set which " + keywords.scenario.singular.en + " will be copied",
                            'fr': "Vous devez selectionner un " + keywords.scenario.singular.fr + " à copier"
                        },
                        'COMMONS-SCENARIOS-UPDATE-FLASH-SUCCESS': {
                            'en': startSentence(keywords.scenario.singular.en) + " updated",
                            'fr': startSentence(keywords.scenario.singular.fr) + " modifié"
                        },
                        'COMMONS-SCENARIOS-UPDATE-FLASH-ERROR': {
                            'en': "Error while updating " + keywords.scenario.singular.en,
                            'fr': "Une erreur est survenue durant la mis à jour du " + keywords.scenario.singular.fr
                        },
                        'COMMONS-SCENARIOS-NO-UPDATE-FLASH-ERROR': {
                            'en': "No " + keywords.scenario.singular.en + " to update",
                            'fr': "Pas de " + keywords.scenario.singular.fr + " à mettre à jour"
                        },
                        'COMMONS-SCENARIOS-VERSIONS-FIND-FLASH-SUCCESS': {
                            'en': "Versions loaded",
                            'fr': "Versions chargées"
                        },
                        'COMMONS-SCENARIOS-VERSIONS-FIND-FLASH-ERROR': {
                            'en': "Error while loading versions",
                            'fr': "Une erreur est survenue durant le chargement des versions"
                        },
                        'COMMONS-SCENARIOS-VERSIONS-CREATE-FLASH-SUCCESS': {
                            'en': "Version created",
                            'fr': "Version créée"
                        },
                        'COMMONS-SCENARIOS-VERSIONS-CREATE-FLASH-ERROR': {
                            'en': "Error while creating version",
                            'fr': "Une erreur est survenue durant la création de la version"
                        },
                        'COMMONS-SCENARIOS-VERSIONS-DELETE-FLASH-SUCCESS': {
                            'en': "Version deleted",
                            'fr': "Version supprimée"
                        },
                        'COMMONS-SCENARIOS-VERSIONS-DELETE-FLASH-ERROR': {
                            'en': "Error while deleting version",
                            'fr': "Une erreur est survenue durant la suppression de la version"
                        },
                        'COMMONS-SCENARIOS-VERSIONS-RESTORE-FLASH-SUCCESS': {
                            'en': startSentence(keywords.scenario.singular.en) +
                                " has been duplicated with name: \"{{name}}\"",
                            'fr': startSentence(keywords.scenario.singular.fr) +
                                " a été dupliqué sous le nom : \"{{name}}\""
                        },
                        'COMMONS-SCENARIOS-VERSIONS-RESTORE-FLASH-ERROR': {
                            'en': "Error while duplicating  " + keywords.scenario.singular.en,
                            'fr': "Une erreur est survenue durant la duplication des " + keywords.scenario.singular.fr
                        },

                        'COMMONS-SCENARIOS-ARCHIVE-FLASH-SUCCESS': {
                            'en': startSentence(keywords.scenario.singular.en) + " archived",
                            'fr': startSentence(keywords.scenario.singular.fr) + " archivé"
                        },
                        'COMMONS-SCENARIOS-ARCHIVE-FLASH-ERROR': {
                            'en': "Error while archiving " + keywords.scenario.singular.en,
                            'fr': "Une erreur est survenue durant l'archivage du " + keywords.scenario.singular.fr
                        },
                        'COMMONS-SCENARIOS-UNARCHIVE-FLASH-SUCCESS': {
                            'en': startSentence(keywords.scenario.singular.en) + " unarchived",
                            'fr': startSentence(keywords.scenario.singular.fr) + " désarchivé"
                        },
                        'COMMONS-SCENARIOS-UNARCHIVE-FLASH-ERROR': {
                            'en': "Error while unarchiving " + keywords.scenario.singular.en,
                            'fr': "Une erreur est survenue durant le désarchivage du " +
                                keywords.scenario.singular.fr
                        },
                        'COMMONS-SCENARIOS-SUPPRESSION-FLASH-SUCCESS': {
                            'en': startSentence(keywords.scenario.singular.en) + " suppressed",
                            'fr': startSentence(keywords.scenario.singular.fr) + " supprimé"
                        },
                        'COMMONS-SCENARIOS-SUPPRESSION-FLASH-ERROR': {
                            'en': "Error while unarchiving " + keywords.scenario.singular.en,
                            'fr': "Une erreur est survenue durant le désarchivage de la " +
                                keywords.scenario.singular.fr
                        },
                        'COMMONS-SCENARIOS-WRONG-OBJECT-FLASH-ERROR': {
                            'en': "This is not a " + keywords.session.singular.en,
                            'fr': "Ce n'est pas un " + keywords.session.singular.fr
                        },

                        // Commons Users Model
                        'COMMONS-USERS-LOAD-FLASH-SUCCESS': {
                            'en': 'Users loaded',
                            'fr': "Utilisateurs chargés"
                        },
                        'COMMONS-USERS-FULL-LOAD-FLASH-SUCCESS': {
                            'en': 'Full profile loaded',
                            'fr': "Utilisateurs chargés"
                        },
                        'COMMONS-USERS-LOAD-FLASH-ERROR': {
                            'en': 'Unable to load user information.',
                            'fr': "Impossible de charger les informations de l'utilisateur"
                        },
                        'COMMONS-USERS-FIND-FLASH-SUCCESS': {
                            'en': "Users found",
                            'fr': "Utilisateurs trouvés"
                        },
                        'COMMONS-USERS-FIND-FLASH-ERROR': {
                            'en': "Error while loading users",
                            'fr': "Une erreur est survenue durant le chargement des utilisateurs"
                        },
                        'COMMONS-USERS-GET-FLASH-SUCCESS': {
                            'en': "User found",
                            'fr': "Utilisateur trouvé"
                        },
                        'COMMONS-USERS-GET-FLASH-ERROR': {
                            'en': "No user found",
                            'fr': "Aucun utilisateur trouvé"
                        },
                        'COMMONS-USERS-UPDATE-FLASH-SUCCESS': {
                            'en': "User updated",
                            'fr': "Données utilisateur mises à jour"
                        },
                        "COMMONS-USERS-UPDATE-PASSWORD-FLASH-ERROR": {
                            'en': "Error while updating user password",
                            'fr': "La confirmation du mot de passe n'est pas identique au mot de passe"
                        },
                        'COMMONS-USERS-UPDATE-FLASH-ERROR': {
                            'en': "Error while updating user",
                            'fr': "Une erreur est survenue durant la mise à jour des données de l'utilisateur"
                        },
                        'COMMONS-USERS-UPDATE-PASSWORD-FLASH-SUCCESS': {
                            'en': "Passwords do not match",
                            'fr': "Les mots de passes ne sont pas identiques"
                        },
                        'COMMONS-USERS-DELETE-FLASH-SUCCESS': {
                            'en': "User deleted",
                            'fr': "Utilisateur supprimé"
                        },
                        'COMMONS-USERS-DELETE-FLASH-ERROR': {
                            'en': "Error while deleting users",
                            'fr': "Une erreur est survenue durant la suppression de l'utilisateur"
                        },

                        // Commons Groups Model
                        'COMMONS-GROUPS-FIND-FLASH-SUCCESS': {
                            'en': "Groups found",
                            'fr': "Groupes trouvés"
                        },
                        'COMMONS-GROUPS-FIND-FLASH-ERROR': {
                            'en': "Error while loading groups",
                            'fr': "Une erreur est survenue durant le chargement des groupes"
                        },
                        'COMMONS-GROUPS-GET-FLASH-SUCCESS': {
                            'en': "Group found",
                            'fr': "Groupe trouvé"
                        },
                        'COMMONS-GROUPS-GET-FLASH-ERROR': {
                            'en': "No group found",
                            'fr': "Aucun groupe trouvé"
                        },
                        'COMMONS-GROUPS-CREATE-FLASH-SUCCESS': {
                            'en': "Group created",
                            'fr': "Groupe créé"
                        },
                        'COMMONS-GROUPS-CREATE-FLASH-ERROR': {
                            'en': "Error while creating group",
                            'fr': "Une erreur est survenue durant la création du groupe"
                        },
                        'COMMONS-GROUPS-CREATE-EMPTY-NAME-FLASH-ERROR': {
                            'en': "You need to specify a group name",
                            'fr': "Vous devez spécifier un nom de groupe"
                        },
                        'COMMONS-GROUPS-UPDATE-FLASH-SUCCESS': {
                            'en': "Group updated",
                            'fr': "Groupe mis à jour"
                        },
                        'COMMONS-GROUPS-UPDATE-FLASH-ERROR': {
                            'en': "Error while updating group",
                            'fr': "Une erreur est survenue durant la mise à jour du groupe"
                        },
                        'COMMONS-GROUPS-DELETE-FLASH-SUCCESS': {
                            'en': "Group deleted",
                            'fr': "Groupe supprimé"
                        },
                        'COMMONS-GROUPS-DELETE-FLASH-ERROR': {
                            'en': "Error while deleting group",
                            'fr': "Une erreur est survenue durant la suppression du groupe"
                        },

                        // Commons Permissions Model
                        'COMMONS-PERMISSIONS-SESSIONS-CREATE-FLASH-SUCCESS': {
                            'en': startSentence(keywords.trainer.singular.en) + " added",
                            'fr': startSentence(keywords.trainer.singular.fr) + " ajouté"
                        },
                        'COMMONS-PERMISSIONS-SESSIONS-CREATE-FLASH-ERROR': {
                            'en': "Error while adding " + keywords.trainer.singular.en,
                            'fr': "Une erreur est survenue durant l'ajout de l'" + keywords.trainer.singular.fr
                        },
                        'COMMONS-PERMISSIONS-SESSIONS-ALREADY-CREATE-FLASH-INFO': {
                            'en': "This user is already a " + keywords.trainer.singular.en + " for this " +
                                keywords.session.singular.en,
                            'fr': "Cet utilisateur est déjà un " + keywords.trainer.singular.fr + " pour cette " +
                                keywords.session.singular.fr
                        },
                        'COMMONS-PERMISSIONS-SESSIONS-DELETE-FLASH-SUCCESS': {
                            'en': startSentence(keywords.trainer.singular.en) + " removed",
                            'fr': "Droits de l'" + keywords.trainer.singular.fr + " enlevés"
                        },
                        'COMMONS-PERMISSIONS-SESSIONS-DELETE-FLASH-ERROR': {
                            'en': "Error while removing " + keywords.trainer.singular.en,
                            'fr': "Une erreur est survenue durant la suppression des droits de l'" +
                                keywords.trainer.singular.fr
                        },

                        'COMMONS-PERMISSIONS-SCENARIOS-FIND-FLASH-SUCCESS': {
                            'en': "Permissions loaded",
                            'fr': "Permissions chargées"
                        },
                        'COMMONS-PERMISSIONS-SCENARIOS-FIND-FLASH-ERROR': {
                            'en': "Error while loading permissions",
                            'fr': "Une erreur est survenue durant le chargement des permissions"
                        },
                        'COMMONS-PERMISSIONS-SCENARIOS-UPDATE-FLASH-SUCCESS': {
                            'en': "Permissions updated",
                            'fr': "Permissions mises à jour"
                        },
                        'COMMONS-PERMISSIONS-SCENARIOS-UPDATE-FLASH-ERROR': {
                            'en': "Error while updating permissions",
                            'fr': "Une erreur est survenue durant l'édition de permissions"
                        },

                        'COMMONS-PERMISSIONS-SCENARIOS-DELETE-FLASH-SUCCESS': {
                            'en': "Permissions removed",
                            'fr': "Permissions enlevées"
                        },
                        'COMMONS-PERMISSIONS-SCENARIOS-DELETE-FLASH-ERROR': {
                            'en': "Error while removing permissions",
                            'fr': "Une erreur est survenue durant l'édition des permissions"
                        },

                        // Private Commons
                        'PRIVATE-ARCHIVES-COUNT': {
                            'en': "Archive count",
                            'fr': "Nombre d'archives"
                        },
                        'PRIVATE-WS-TITLE-LABEL': {
                            'en': startSentence(keywords.workspace.singular.en) + " for ",
                            'fr': startSentence(keywords.workspace.singular.fr) + " pour "
                        },
                        'PRIVATE-WS-TITLE-NAME': {
                            'en': "{{workspace}}",
                            'fr': "{{workspace}}"
                        },
                        'PRIVATE-WS-PLAYER-BTN': {
                            'en': startSentence(keywords.player.singular.en),
                            'fr': startSentence(keywords.player.singular.fr)
                        },
                        'PRIVATE-WS-TRAINER-BTN': {
                            'en': startSentence(keywords.trainer.singular.en),
                            'fr': startSentence(keywords.trainer.singular.fr)
                        },
                        'PRIVATE-WS-SCENARIST-BTN': {
                            'en': startSentence(keywords.scenarist.singular.en),
                            'fr': startSentence(keywords.scenarist.singular.fr)
                        },
                        'PRIVATE-WS-MODELER-BTN': {
                            'en': startSentence(keywords.modeler.singular.en),
                            'fr': startSentence(keywords.modeler.singular.fr)
                        },
                        'PRIVATE-WS-ADMIN-BTN': {
                            'en': startSentence(keywords.admin.singular.en),
                            'fr': startSentence(keywords.admin.singular.fr)
                        },
                        'PRIVATE-WS-PROFILE-BTN': {
                            'en': "Edit profile",
                            'fr': "Editer mon profil"
                        },
                        'PRIVATE-WS-VERIFY-TOOLTIP': {
                            'en': "Click to verify your e-mail address",
                            'fr': "Cliquez pour vérifier votre adresse e-mail"
                        },
                        'PRIVATE-WS-VERIFY-BTN': {
                            'en': "Unverified e-mail",
                            'fr': "e-mail non-verifié"
                        },
                        'PRIVATE-WS-UNMODIFIABLE-PROFILE-BTN': {
                            'en': "Your user profile is not modifiable",
                            'fr': "Votre profil utilisateur n'est pas modifiable"
                        },
                        'PRIVATE-WS-ACCESS-KEY': {
                            'en': startSentence(keywords.token.singular.en),
                            'fr': startSentence(keywords.token.singular.fr)
                        },
                        'PRIVATE-WS-LOGOUT-BTN': {
                            'en': "Logout",
                            'fr': "Déconnexion"
                        },
                        'PRIVATE-AGREE-TITLE': {
                            'en': "Welcome to Wegas",
                            'fr': "Bienvenue sur Wegas"
                        },
                        'PRIVATE-AGREE-SUBTITLE': {
                            'en': "Please take note of our terms of use and click on the button \"Agree and continue\".",
                            'fr': "Veuillez prendre note de nos conditions d'utilisation et cliquer sur le bouton \"Accepter et continuer\"."
                        },
                        'PRIVATE-AGREE-BTN': {
                            'en': "Agree and continue",
                            'fr': "Accepter et continuer"
                        },
                        'PRIVATE-MODALE-SESSION-SETTINGS-BASED-ON': {
                            'en': startSentence(keywords.scenario.singular.en) + ": ",
                            'fr': startSentence(keywords.scenario.singular.fr) + ": "
                        },
                        'PRIVATE-MODALE-SESSION-NAME': {
                            'en': startSentence(keywords.session.singular.en),
                            'fr': startSentence(keywords.session.singular.fr)
                        },
                        'PRIVATE-MODALE-TABS-INFOS': {
                            'en': "Basic parameters",
                            'fr': "Paramètres de base"
                        },
                        'PRIVATE-MODALE-TABS-CUSTOMIZE': {
                            'en': "Icon",
                            'fr': "Icône"
                        },
                        'PRIVATE-MODALE-TABS-ADVANCED': {
                            'en': "Advanced",
                            'fr': "Réglages avancés"
                        },
                        'PRIVATE-MODALE-TABS-LANGUAGES': {
                            'en': "Languages",
                            'fr': "Langues"
                        },
                        'PRIVATE-MODALE-TABS-ACCESS-LINK-TITLE': {
                            'en': "Direct link as guest",
                            'fr': "Lien direct comme invité"
                        },
                        'PRIVATE-MODALE-TABS-INFOS-ACCESS-LINK': {
                            'en': "Guests or registered " + keywords.player.plural.en + " can access the " +
                                keywords.session.singular.en + " following the link below ",
                            'fr': "Des invités ou des " + keywords.player.plural.fr +
                                "  connectés peuvent avoir accès à la " + keywords.session.singular.fr +
                                " depuis le lien ci-dessous "
                        },
                        'PRIVATE-MODALE-TABS-INFOS-ACCESS-LINK-SELECT-TITLE': {
                            'en': "Click here to select the link",
                            'fr': "Cliquer ici pour sélectionner le lien"
                        },
                        'PRIVATE-MODALE-TABS-ADVANCED-WARNING': {
                            'en': "Warning! Update these values only if you know what you are doing",
                            'fr': "Attention! Ne modifier les paramètres avancés qu'en connaissance de cause"
                        },
                        'PRIVATE-MODALE-SETTINGS-NOT-SAVED-WARNING': {
                            'en': "Some changes were not saved",
                            'fr': "Des changements n'ont pas été sauvés"
                        },
                        'PRIVATE-MODALE-SETTINGS-DIFF-BTN': {
                            'en': "Diff as CSV",
                            'fr': "Diff en CSV"
                        },
                        'PRIVATE-MODALE-SETTINGS-CANCEL-BTN': {
                            'en': "Cancel",
                            'fr': "Annuler"
                        },
                        'PRIVATE-MODALE-SETTINGS-SAVE-BTN': {
                            'en': "Save",
                            'fr': "Sauver"
                        },
                        'PRIVATE-SESSIONS-NAME-LABEL-INPUT': {
                            'en': "Name",
                            'fr': "Nom"
                        },
                        'PRIVATE-SESSIONS-NAME-PLACEHOLDER-INPUT': {
                            'en': "Name is required",
                            'fr': "Le nom est obligatoire"
                        },
                        'PRIVATE-SESSIONS-ACCESS-KEY-LABEL-INPUT': {
                            'en': startSentence(keywords.token.singular.en),
                            'fr': startSentence(keywords.token.singular.fr)
                        },
                        'PRIVATE-SESSIONS-ACCESS-KEY-PLACEHOLDER-INPUT': {
                            'en': startSentence(keywords.token.singular.en) + " is required",
                            'fr': "La " + keywords.token.singular.fr + " est obligatoire"
                        },
                        'PRIVATE-SESSIONS-ACCESS-KEY-ERROR-INPUT': {
                            'en': "Syntax error: please don't use special characters !",
                            'fr': "Erreur de syntaxe : veuillez éviter les caractères spéciaux !"
                        },
                        'PRIVATE-SCENARIOS-NAME-LABEL-INPUT': {
                            'en': "Name",
                            'fr': "Nom"
                        },
                        'PRIVATE-SCENARIOS-NAME-PLACEHOLDER-INPUT': {
                            'en': "Name is required",
                            'fr': "Le nom est obligatoire"
                        },
                        'PRIVATE-SCENARIOS-COMMENTS-LABEL-INPUT': {
                            'en': "Comments",
                            'fr': "Commentaires"
                        },
                        'PRIVATE-SCENARIOS-COMMENTS-PLACEHOLDER-INPUT': {
                            'en': "Comments are optional",
                            'fr': "Les commentaires sont optionnels"
                        },
                        'PRIVATE-SCENARIOS-LANGUAGES-CHECKBOX': {
                            'en': "Active Languages",
                            'fr': "Langues Disponibles"
                        },
                        'PRIVATE-SCENARIOS-TYPE-LABEL-CHECKBOX': {
                            'en': "Game type",
                            'fr': "Type de jeu"
                        },
                        'PRIVATE-SCENARIOS-TYPE-INDIVIDUALLY-CHECKBOX': {
                            'en': "Individual",
                            'fr': "Individuel"
                        },
                        'PRIVATE-SCENARIOS-TYPE-IN-TEAM-CHECKBOX': {
                            'en': "In " + keywords.team.singular.en,
                            'fr': "En " + keywords.team.singular.fr
                        },
                        'PRIVATE-SCENARIOS-LOG-ID-LABEL-INPUT': {
                            'en': "Log ID",
                            'fr': "Log ID"
                        },
                        'PRIVATE-SCENARIOS-GUEST-ALLOWED-LABEL-CHECKBOX': {
                            'en': "Guests allowed",
                            'fr': "Invités autorisés"
                        },
                        'PRIVATE-SCENARIOS-SERVER-SCRIPT-LABEL-INPUT': {
                            'en': "Server script",
                            'fr': "Script serveur"
                        },
                        'PRIVATE-SCENARIOS-CLIENT-SCRIPT-LABEL-INPUT': {
                            'en': "Client script",
                            'fr': "Script client"
                        },
                        'PRIVATE-SCENARIOS-STYLESHEETS-LABEL-INPUT': {
                            'en': "Style sheets",
                            'fr': "Feuilles de styles"
                        },
                        'PRIVATE-SCENARIOS-PAGES-LABEL-INPUT': {
                            'en': "Pages",
                            'fr': "Pages"
                        },

                        // Private - Edit Profile
                        'PRIVATE-PROFILE-INPUT-LABEL-EMAIL': {
                            'en': "Email",
                            'fr': "Email"
                        },
                        'PRIVATE-PROFILE-INPUT-LABEL-PASSWORD': {
                            'en': "Password",
                            'fr': "Mot de passe"
                        },
                        'PRIVATE-PROFILE-INPUT-LABEL-PASSWORD-AGAIN': {
                            'en': "Password again",
                            'fr': "Confirmer le mot de passe"
                        },
                        'PRIVATE-PROFILE-INPUT-LABEL-USERNAME': {
                            'en': "Username",
                            'fr': "Nom d'utilisateur"
                        },
                        'PRIVATE-PROFILE-INPUT-LABEL-FIRSTNAME': {
                            'en': "First name",
                            'fr': "Prénom"
                        },
                        'PRIVATE-PROFILE-INPUT-LABEL-LASTNAME': {
                            'en': "Last name",
                            'fr': "Nom de famille"
                        },
                        'PRIVATE-PROFILE-INPUT-LABEL-COMMENT': {
                            'en': "Admin comments",
                            'fr': "Remarques administrateur"
                        },
                        'PRIVATE-PROFILE-INPUT-PLACEHOLDER-EMAIL': {
                            'en': "Please enter your email",
                            'fr': "Veuillez entrer votre email"
                        },
                        'PRIVATE-PROFILE-INPUT-PLACEHOLDER-PASSWORD': {
                            'en': "Password",
                            'fr': "Mot de passe"
                        },
                        'PRIVATE-PROFILE-INPUT-PLACEHOLDER-PASSWORD-AGAIN': {
                            'en': "Confirm password",
                            'fr': "Confirmer le mot de passe"
                        },
                        'PRIVATE-PROFILE-INPUT-PLACEHOLDER-USERNAME': {
                            'en': "Please enter a username (optional)",
                            'fr': "Veuillez entrer un nom d'utilisateur (facultatif)"
                        },
                        'PRIVATE-PROFILE-INPUT-PLACEHOLDER-FIRSTNAME': {
                            'en': "Please enter your first name",
                            'fr': "Veuillez entrer votre prénom"
                        },
                        'PRIVATE-PROFILE-INPUT-PLACEHOLDER-LASTNAME': {
                            'en': "Please enter your last name",
                            'fr': "Veuillez entrer votre nom de famille"
                        },
                        'PRIVATE-PROFILE-INPUT-PLACEHOLDER-COMMENT': {
                            'en': "Admin comments",
                            'fr': "Remarques administrateur"
                        },
                        'PRIVATE-PROFILE-SAVE-BTN': {
                            'en': "Save changes",
                            'fr': "Sauver les modifications"
                        },

                        // Private Player
                        'PLAYER-INDEX-ADD-TITLE': {
                            'en': "Join a " + keywords.session.singular.en,
                            'fr': "Rejoindre une " + keywords.session.singular.fr
                        },
                        'PLAYER-INDEX-JOIN-LINK': {
                            'en': "Join a " + keywords.session.singular.en,
                            'fr': "Rejoindre une " + keywords.session.singular.fr
                        },
                        'PLAYER-INDEX-JOIN-BTN': {
                            'en': "Join",
                            'fr': "Rejoindre"
                        },
                        'PLAYER-INDEX-LIST-TITLE': {
                            'en': "My " + keywords.session.plural.en,
                            'fr': "Mes " + keywords.session.plural.fr
                        },
                        'PLAYER-INDEX-NO-SESSION': {
                            'en': "You have joined no " + keywords.session.singular.en + " yet.",
                            'fr': "Vous n'avez encore rejoint aucune " + keywords.session.singular.fr + "."
                        },
                        'PLAYER-CARD-TEAM-TITLE': {
                            'en': startSentence(keywords.team.singular.en),
                            'fr': startSentence(keywords.team.singular.fr)
                        },
                        'PLAYER-CARD-TEAM-BTN': {
                            'en': "View " + keywords.team.singular.en,
                            'fr': "Voir l'" + keywords.team.singular.fr
                        },
                        'PLAYER-CARD-LEAVE-BTN': {
                            'en': "Leave " + keywords.session.singular.en,
                            'fr': "Quitter la " + keywords.session.singular.fr
                        },
                        'PLAYER-CARD-LEAVE-CONFIRM': {
                            'en': "Are you sure you want to leave the " + keywords.session.singular.en +
                                " ? This action is irreversible.",
                            'fr': "Êtes-vous sûr de vouloir quitter cette " + keywords.session.singular.fr +
                                " ? Cette action est irreversible."
                        },
                        'PLAYER-CARD-PLAY-BTN': {
                            'en': "Play " + keywords.session.singular.en,
                            'fr': "Jouer"
                        },
                        'PLAYER-MODALE-JOIN-TEAM-CREATE-INPUT': {
                            'en': startSentence(keywords.team.singular.en) + " name",
                            'fr': "Nom de l'" + keywords.team.singular.fr
                        },
                        'PLAYER-MODALE-JOIN-TEAM-CREATE-INPUT-MESSAGE': {
                            'en': "Please enter a valid " + keywords.team.singular.en + " name",
                            'fr': "Veuillez entrer un nom d'" + keywords.team.singular.fr + " valide"
                        },
                        'PLAYER-MODALE-JOIN-TEAM-CREATE-SIZE': {
                            'en': "Size",
                            'fr': "Taille"
                        },
                        'PLAYER-MODALE-JOIN-TEAM-CREATE-SIZE-TOOLTIP': {
                            'en': "Number of members",
                            'fr': "Nombre de membres"
                        },
                        'PLAYER-MODALE-JOIN-TEAM-CREATE-SIZE-MESSAGE': {
                            'en': "Please specify the size of your " + keywords.team.singular.en,
                            'fr': "Veuillez indiquer la taille de l'" + keywords.team.singular.fr
                        },
                        'PLAYER-MODALE-JOIN-TEAM-CREATE-BTN': {
                            'en': "Create " + keywords.team.singular.en,
                            'fr': "Créer une " + keywords.team.singular.fr
                        },
                        'PLAYER-MODALE-JOIN-TEAM-EXISTING-MESSAGE': {
                            'en': "Existing " + keywords.team.singular.en,
                            'fr': "L'" + keywords.team.singular.fr + " existe déjà"
                        },
                        'PLAYER-MODALE-JOIN-TEAM-NUMBER-PLAYER': {
                            'en': keywords.player.singular.en,
                            'fr': keywords.player.singular.fr
                        },
                        'PLAYER-MODALE-JOIN-TEAM-JOIN-BTN': {
                            'en': "Join " + keywords.team.singular.en,
                            'fr': "Rejoindre l'" + keywords.team.singular.fr
                        },
                        'PLAYER-MODALE-JOIN-TEAM-PLAYERS-LIST': {
                            'en': startSentence(keywords.player.plural.en) + " from " + keywords.team.singular.en,
                            'fr': startSentence(keywords.player.plural.fr) + " de l'" + keywords.team.singular.fr
                        },
                        'PLAYER-MODALE-JOIN-TEAM-HIDE-TOGGLE': {
                            'en': "{{toggle}} " + keywords.player.plural.en,
                            'fr': "{{toggle}} les " + keywords.player.plural.fr
                        },
                        'PLAYER-MODALE-JOIN-TEAM-JOIN-OR-CREATE-MESSAGE': {
                            'en': "Join an existing " + keywords.team.singular.en + " or create a new one",
                            'fr': "Vous pouvez rejoindre une " + keywords.team.singular.fr +
                                " existante ou en créer une nouvelle"
                        },
                        'PLAYER-MODALE-JOIN-TEAM-JOIN-MESSAGE': {
                            'en': "Join an existing " + keywords.team.singular.en,
                            'fr': "Vous pouvez rejoindre une " + keywords.team.singular.fr + " existante"
                        },
                        'PLAYER-MODALE-JOIN-TEAM-CREATE-MESSAGE': {
                            'en': "Create your " + keywords.team.singular.en,
                            'fr': "Créez votre " + keywords.team.singular.fr
                        },
                        'PLAYER-MODALE-TEAM-RELOAD-BTN': {
                            'en': "Reload " + keywords.team.singular.en,
                            'fr': "Recharger l'" + keywords.team.singular.fr
                        },
                        'PLAYER-MODALE-TEAM-RELOAD-OK-BTN': {
                            'en': keywords.team.singular.en + " reloaded",
                            'fr': keywords.team.singular.fr + " mise à jour"
                        },
                        'PLAYER-JOIN-TEAM-KEY-FLASH-ERROR': {
                            'en': "This is not a valid " + keywords.token.singular.en,
                            'fr': startSentence(keywords.token.singular.fr) + " invalide"
                        },

                        // Private Trainer
                        'TRAINER-INDEX-ADD-TITLE': {
                            'en': "Add " + keywords.session.singular.en,
                            'fr': "Créer une " + keywords.session.singular.fr
                        },
                        'TRAINER-INDEX-ME-FIRST-TITLE': {
                            'en': "List my " + keywords.session.plural.en + " first",
                            'fr': "Lister mes " + keywords.session.plural.fr + " en premier"
                        },
                        'TRAINER-INDEX-ME-FIRST-TOOLTIP': {
                            'en': startSentence(keywords.session.plural.en) + " are always ordered by creation date, optionally starting with my own",
                            'fr': "Les " + keywords.session.plural.fr + " sont ordonnées par date de création, en option avec les miennes en premier"
                        },
                        'TRAINER-INDEX-ADD-NAME-INPUT': {
                            'en': startSentence(keywords.session.singular.en) + " name",
                            'fr': "Nom de la " + keywords.session.singular.fr
                        },
                        'TRAINER-INDEX-ADD-SCENARIO-INPUT': {
                            'en': "Based on " + keywords.scenario.singular.en,
                            'fr': "Basé sur le " + keywords.scenario.singular.fr
                        },
                        'TRAINER-INDEX-ADD-SCENARIO-LOADING': {
                            'en': "Loading " + keywords.scenario.plural.en,
                            'fr': "Chargement des " + keywords.scenario.plural.fr
                        },
                        'TRAINER-INDEX-ADD-BTN': {
                            'en': "Create",
                            'fr': "Créer"
                        },
                        'TRAINER-INDEX-ARCHIVE-BTN': {
                            'en': "Archived " + keywords.session.singular.en,
                            'fr': startSentence(keywords.session.singular.fr) + " archivée"
                        },
                        'TRAINER-INDEX-ARCHIVES-BTN': {
                            'en': "archived " + keywords.session.plural.en,
                            'fr': keywords.session.plural.fr + " archivées"
                        },
                        'TRAINER-INDEX-LIST-TITLE': {
                            'en': "Current " + keywords.session.plural.en,
                            'fr': startSentence(keywords.session.plural.fr) + " en cours"
                        },
                        'TRAINER-INDEX-LIST-NO-SESSION': {
                            'en': "No current " + keywords.session.singular.en + " corresponds to your search string ",
                            'fr': "Aucune " + keywords.session.singular.fr + " en cours répondant à votre critère de recherche "
                        },
                        'TRAINER-CARD-DETAILS-SCENARIO': {
                            'en': startSentence(keywords.scenario.singular.en),
                            'fr': startSentence(keywords.scenario.singular.fr)
                        },
                        'TRAINER-CARD-DETAILS-CREATED-ON': {
                            'en': "Created on ",
                            'fr': "Créée le "
                        },
                        'TRAINER-CARD-DETAILS-CREATED-BY': {
                            'en': " by ",
                            'fr': " par "
                        },
                        'TRAINER-CARD-ACCESS-CLOSE': {
                            'en': "Closed to new " + keywords.player.plural.en,
                            'fr': "Fermé aux nouveaux " + keywords.player.plural.fr
                        },
                        'TRAINER-CARD-ACCESS-OPEN': {
                            'en': "Open to new " + keywords.player.plural.en,
                            'fr': "Ouvert aux nouveaux " + keywords.player.plural.fr
                        },
                        'TRAINER-CARD-KEY-ICON': {
                            'en': "Click to select the " + keywords.token.singular.en,
                            'fr': "Cliquer pour sélectionner la " + keywords.token.singular.fr
                        },
                        'TRAINER-CARD-SETTINGS-BTN': {
                            'en': "Settings",
                            'fr': "Paramètres"
                        },
                        'TRAINER-CARD-USERS-BTN': {
                            'en': "Manage users",
                            'fr': "Gérer les utilisateurs"
                        },
                        'TRAINER-CARD-MOVE-ARCHIVE-BTN': {
                            'en': "Move to archives",
                            'fr': "Déplacer vers les archives"
                        },
                        'TRAINER-CARD-MONITORING-BTN': {
                            'en': "Facilitate the " + keywords.session.singular.en,
                            'fr': "Animer la " + keywords.session.singular.fr
                        },
                        'TRAINER-CARD-VIEW-PLAYING-BTN': {
                            'en': "View playing " + keywords.session.singular.en,
                            'fr': "Voir la " + keywords.session.singular.fr
                        },
                        'TRAINER-MODALE-USERS-TAB-PLAYER': {
                            'en': startSentence(keywords.player.plural.en),
                            'fr': startSentence(keywords.player.plural.fr)
                        },
                        'TRAINER-MODALE-USERS-NO-PLAYERS': {
                            'en': "No players have joined yet",
                            'fr': "Aucun joueur n'a rejoint la partie"
                        },
                        'TRAINER-MODALE-USERS-TAB-TRAINER': {
                            'en': startSentence(keywords.trainer.plural.en),
                            'fr': startSentence(keywords.trainer.plural.fr)
                        },
                        'TRAINER-MODALE-USERS-RELOAD-BTN': {
                            'en': "Reload users",
                            'fr': "Recharger les utilisateurs"
                        },
                        'TRAINER-MODALE-USERS-RELOAD-OK-BTN': {
                            'en': "Users reloaded",
                            'fr': "Utilisateurs rechargés"
                        },
                        'TRAINER-MODALE-USERS-REMOVE-TRAINER-BTN': {
                            'en': "Remove access to " + keywords.trainer.singular.en,
                            'fr': "Supprimer les accès de l'" + keywords.trainer.singular.fr
                        },
                        'TRAINER-MODALE-USERS-ADD-TRAINER-INPUT': {
                            'en': "Add " + keywords.trainer.singular.en,
                            'fr': "Ajouter un " + keywords.trainer.singular.fr
                        },
                        'TRAINER-MODALE-USERS-REMOVE-PLAYER-BTN': {
                            'en': "Remove access to " + keywords.player.singular.en,
                            'fr': "Supprimer les accès du " + keywords.player.singular.fr
                        },
                        'TRAINER-MODALE-USERS-REMOVE-PLAYER-CONFIRM': {
                            'en': "Are you sure you want to remove this " + keywords.player.singular.en + " from the " +
                                keywords.session.singular.en + " ? This action is irreversible.",
                            'fr': "Êtes vous sûr de vouloir supprimer le " + keywords.player.singular.fr + " de la " +
                                keywords.session.singular.fr + " ? Cette action est irréversible."
                        },
                        'TRAINER-MODALE-USERS-REMOVE-TEAM-BTN': {
                            'en': "Remove " + keywords.team.singular.en,
                            'fr': "Supprimer l'" + keywords.team.singular.fr
                        },
                        'TRAINER-MODALE-USERS-REMOVE-TEAM-CONFIRM': {
                            'en': "Are you sure you want to remove this " + keywords.team.singular.en + " from the " +
                                keywords.session.singular.en + " ? This action is irreversible.",
                            'fr': "Êtes vous sûr de vouloir supprimer l'" + keywords.team.singular.fr + " de la " +
                                keywords.session.singular.fr + " ? Cette action est irréversible."
                        },
                        'TRAINER-MODALE-ARCHIVE-TITLE': {
                            'en': "Archived " + keywords.session.plural.en,
                            'fr': startSentence(keywords.session.plural.fr) + " archivées"
                        },
                        'TRAINER-MODALE-ARCHIVE-SEARCH-INPUT': {
                            'en': "Search " + keywords.session.singular.en,
                            'fr': "Rechercher une " + keywords.session.singular.fr
                        },
                        'TRAINER-MODALE-ARCHIVE-SETTINGS-BTN': {
                            'en': "Settings",
                            'fr': "Paramètres"
                        },
                        'TRAINER-MODALE-ARCHIVE-USERS-BTN': {
                            'en': "Manage users",
                            'fr': "Gérer les utilisateurs"
                        },
                        'TRAINER-MODALE-ARCHIVE-MOVE-CURRENT-BTN': {
                            'en': "Move to current " + keywords.session.plural.en,
                            'fr': "Déplacer dans les " + keywords.session.plural.fr + " en cours"
                        },
                        'TRAINER-MODALE-ARCHIVE-DELETE-BTN': {
                            'en': "Delete " + keywords.session.singular.en,
                            'fr': "Supprimer la " + keywords.session.singular.fr
                        },
                        'TRAINER-MODALE-ARCHIVE-DELETE-CONFIRM': {
                            'en': "Are you sure you want to delete this archived " + keywords.session.singular.en +
                                " ? This action is irreversible.",
                            'fr': "Êtes-vous sûr de vouloir supprimer cette " + keywords.session.singular.fr +
                                " ? Cette action est irréversible."
                        },
                        'TRAINER-MODALE-ARCHIVE-NO-SESSION': {
                            'en': "No archived " + keywords.session.singular.en + " corresponds to search string ",
                            'fr': "Aucune " + keywords.session.singular.fr + " archivée répondant au critère "
                        },
                        // Private Modeler
                        'MODELER-INDEX-ADD-TITLE': {
                            'en': "New " + keywords.model.singular.en,
                            'fr': "Nouveau " + keywords.model.singular.fr
                        },
                        'MODELER-INDEX-EXTRACT-TITLE': {
                            'en': "Extract " + keywords.model.singular.en,
                            'fr': "Extraire un " + keywords.model.singular.fr
                        },
                        'MODELER-INDEX-ME-FIRST-TITLE': {
                            'en': "List my " + keywords.model.plural.en + " first",
                            'fr': "Lister mes " + keywords.model.plural.fr + " en premier"
                        },
                        'MODELER-INDEX-ME-FIRST-TOOLTIP': {
                            'en': startSentence(keywords.model.plural.en) + " are always ordered by creation date, optionally starting with my own",
                            'fr': "Les " + keywords.model.plural.fr + " sont ordonnés par date de création, en option avec les miens en premier"
                        },
                        'MODELER-INDEX-ADD-NAME-INPUT': {
                            'en': startSentence(keywords.model.singular.en) + " name",
                            'fr': "Nom du " + keywords.model.singular.fr
                        },
                        'MODELER-INDEX-ADD-SCENARIO-INPUT': {
                            'en': "Based on " + keywords.model.singular.en,
                            'fr': "Basé sur le " + keywords.model.singular.fr
                        },
                        'MODELER-INDEX-ARCHIVE-BTN': {
                            'en': "Archived " + keywords.model.singular.en,
                            'fr': startSentence(keywords.model.singular.fr) + " archivé"
                        },
                        'MODELER-INDEX-ARCHIVES-BTN': {
                            'en': "archived " + keywords.model.plural.en,
                            'fr': keywords.model.plural.fr + " archivés"
                        },
                        'MODELER-INDEX-LIST-TITLE': {
                            'en': startSentence(keywords.model.plural.en),
                            'fr': startSentence(keywords.model.plural.fr)
                        },
                        'MODELER-INDEX-LIST-NO-MODEL': {
                            'en': "No current " + keywords.model.singular.en + " corresponds to your search string ",
                            'fr': "Aucun " + keywords.model.singular.fr + " en cours répondant à votre critère de recherche "
                        },
                        'MODELER-MODALE-ARCHIVE-TITLE': {
                            'en': "Archived " + keywords.model.plural.en,
                            'fr': startSentence(keywords.model.plural.fr) + " archivés"
                        },
                        'MODELER-MODALE-ARCHIVE-SEARCH-INPUT': {
                            'en': "Search " + keywords.model.singular.en,
                            'fr': "Rechercher un " + keywords.model.singular.fr
                        },
                        'MODELER-MODALE-ARCHIVE-MOVE-CURRENT-BTN': {
                            'en': "Move to current " + keywords.model.plural.en,
                            'fr': "Déplacer vers les " + keywords.model.plural.fr + " en cours"
                        },
                        'MODELER-MODALE-ARCHIVE-DELETE-BTN': {
                            'en': "Delete " + keywords.model.singular.en,
                            'fr': "Supprimer le " + keywords.model.singular.fr
                        },
                        'MODELER-MODALE-ARCHIVE-DELETE-CONFIRM': {
                            'en': "Are you sure you want to delete this archived " + keywords.model.singular.en +
                                " ? This action is irreversible.",
                            'fr': "Êtes-vous sûr de vouloir supprimer ce " + keywords.model.singular.fr +
                                " ? Cette action est irréversible."
                        },
                        'MODELER-MODALE-ARCHIVE-NO-SCENARIO': {
                            'en': "No archived " + keywords.model.singular.en + " corresponds to search string ",
                            'fr': "Aucun " + keywords.model.singular.fr + " archivé répondant au critère "
                        },
                        'MODELER-CARD-DUPLICATE-BTN': {
                            'en': "Duplicate this " + keywords.model.singular.en,
                            'fr': "Dupliquer ce " + keywords.model.singular.fr
                        },
                        'MODELER-CARD-TRANSLATE-BTN': {
                            'en': "Translate " + keywords.model.singular.en,
                            'fr': "Traduire le " + keywords.model.singular.fr
                        },
                        'MODELER-CARD-EDIT-BTN': {
                            'en': "Edit " + keywords.model.singular.en,
                            'fr': "Modifier le " + keywords.model.singular.fr
                        },
                        'MODELER-MODALE-USERS-TITLE': {
                            'en': "Co-" + keywords.modeler.plural.en,
                            'fr': "Co-" + keywords.modeler.plural.fr
                        },
                        'MODELER-MODALE-USERS-EDIT-CHECKBOX': {
                            'en': "Edit " + keywords.model.singular.en,
                            'fr': "Modifier le " + keywords.model.singular.fr
                        },
                        'MODELER-MODALE-USERS-DUPLICATE-CHECKBOX': {
                            'en': "Duplicate " + keywords.model.singular.en,
                            'fr': "Dupliquer le " + keywords.model.singular.fr
                        },
                        'MODELER-MODALE-VERSIONS-INTEGRATOR': {
                            'en': "Select a scenario to integrate",
                            'fr': "Sélectionnez un scénario à intégrer"
                        },
                        'MODELER-MODALE-VERSIONS-INTEGRATOR_BTN': {
                            'en': "Integrate",
                            'fr': "Intégrer"
                        },
                        'MODELER-MODALE-VERSIONS-AVAILABLE-VERSIONS': {
                            'en': "Scenarios based on this model",
                            'fr': "Scénario basé sur ce modèle"
                        },
                        'MODELER-MODALE-VERSIONS-NEW-TITLE-BTN': {
                            'en': "This action will store a new version of the " + keywords.model.singular.en +
                                ". The new version can later be restored as a new scenario.",
                            'fr': "Cette action va enregistrer une nouvelle version du " +
                                keywords.model.singular.fr + ". La nouvelle version peut être restaurée plus tard sous forme de nouveau scénario."
                        },
                        'MODELER-MODALE-VERSIONS-DUPLICATE-TITLE-BTN': {
                            'en': "This will generate a new " + keywords.model.singular.en + " based on this one.",
                            'fr': "Cette action génère un nouveau " + keywords.model.singular.fr +
                                " basé sur celui-ci"
                        },
                        'MODELER-MODALE-VERSIONS-NO-VERSION': {
                            'en': "No version available for this " + keywords.model.singular.en + ".",
                            'fr': "Ce " + keywords.model.singular.fr + " n'a pas encore de version."
                        },
                        'MODELER-MODALE-VERSIONS-CREATE-BTN': {
                            'en': "Create a new " + keywords.model.singular.en + " from this version",
                            'fr': "Créer un nouveau " + keywords.model.singular.fr + " depuis cette version"
                        },
                        'MODELER-INSTANCES-RELEASE-BTN': {
                            'en': "Release " + keywords.scenario.singular.en,
                            'fr': "Libérer le " + keywords.scenario.singular.fr
                        },
                        // Private Scenarist
                        'SCENARIST-INDEX-ADD-TITLE': {
                            'en': "New " + keywords.scenario.singular.en,
                            'fr': "Nouveau " + keywords.scenario.singular.fr
                        },
                        'SCENARIST-INDEX-ME-FIRST-TITLE': {
                            'en': "List my " + keywords.scenario.plural.en + " first",
                            'fr': "Lister mes " + keywords.scenario.plural.fr + " en premier"
                        },
                        'SCENARIST-INDEX-ME-FIRST-TOOLTIP': {
                            'en': startSentence(keywords.scenario.plural.en) + " are always ordered by creation date, optionally starting with my own",
                            'fr': "Les " + keywords.scenario.plural.fr + " sont ordonnés par date de création, en option avec les miens en premier"
                        },
                        'SCENARIST-INDEX-ADD-NAME-INPUT': {
                            'en': startSentence(keywords.scenario.singular.en) + " name",
                            'fr': "Nom du " + keywords.scenario.singular.fr
                        },
                        'SCENARIST-INDEX-ADD-SCENARIO-INPUT': {
                            'en': "Based on " + keywords.scenario.singular.en,
                            'fr': "Basé sur le " + keywords.scenario.singular.fr
                        },
                        'SCENARIST-INDEX-ADD-BTN': {
                            'en': "Create",
                            'fr': "Créer"
                        },
                        'SCENARIST-INDEX-ARCHIVE-BTN': {
                            'en': "Archived " + keywords.scenario.singular.en,
                            'fr': startSentence(keywords.scenario.singular.fr) + " archivé"
                        },
                        'SCENARIST-INDEX-ARCHIVES-BTN': {
                            'en': "archived " + keywords.scenario.plural.en,
                            'fr': keywords.scenario.plural.fr + " archivés"
                        },
                        'SCENARIST-INDEX-LIST-TITLE': {
                            'en': startSentence(keywords.scenario.plural.en),
                            'fr': startSentence(keywords.scenario.plural.fr)
                        },
                        'SCENARIST-INDEX-LIST-NO-SCENARIO': {
                            'en': "No current " + keywords.scenario.singular.en + " corresponds to your search string ",
                            'fr': "Aucun " + keywords.scenario.singular.fr + " en cours répondant à votre critère de recherche "
                        },
                        'SCENARIST-MODALE-ARCHIVE-TITLE': {
                            'en': "Archived " + keywords.scenario.plural.en,
                            'fr': startSentence(keywords.scenario.plural.fr) + " archivés"
                        },
                        'SCENARIST-MODALE-ARCHIVE-SEARCH-INPUT': {
                            'en': "Search " + keywords.scenario.singular.en,
                            'fr': "Rechercher un " + keywords.scenario.singular.fr
                        },
                        'SCENARIST-MODALE-ARCHIVE-MOVE-CURRENT-BTN': {
                            'en': "Move to current " + keywords.scenario.plural.en,
                            'fr': "Déplacer vers les " + keywords.scenario.plural.fr + " en cours"
                        },
                        'SCENARIST-MODALE-ARCHIVE-DELETE-BTN': {
                            'en': "Delete " + keywords.scenario.singular.en,
                            'fr': "Supprimer le " + keywords.scenario.singular.fr
                        },
                        'SCENARIST-MODALE-ARCHIVE-DELETE-CONFIRM': {
                            'en': "Are you sure you want to delete this archived " + keywords.scenario.singular.en +
                                " ? This action is irreversible.",
                            'fr': "Êtes-vous sûr de vouloir supprimer ce " + keywords.scenario.singular.fr +
                                " ? Cette action est irréversible."
                        },
                        'SCENARIST-MODALE-ARCHIVE-NO-SCENARIO': {
                            'en': "No archived " + keywords.scenario.singular.en + " corresponds to search string ",
                            'fr': "Aucun " + keywords.scenario.singular.fr + " archivé répondant au critère "
                        },
                        'SCENARIST-CARD-SETTINGS-BTN': {
                            'en': "Settings",
                            'fr': "Paramètres"
                        },
                        'SCENARIST-CARD-USERS-BTN': {
                            'en': "Manage users",
                            'fr': "Gérer les utilisateurs"
                        },
                        'SCENARIST-CARD-DUPLICATE-BTN': {
                            'en': "Duplicate this " + keywords.scenario.singular.en,
                            'fr': "Dupliquer ce " + keywords.scenario.singular.fr
                        },
                        'SCENARIST-CARD-VERSIONS-BTN': {
                            'en': "Manage versions",
                            'fr': "Gérer les versions"
                        },
                        'SCENARIST-CARD-MOVE-ARCHIVE-BTN': {
                            'en': "Move to archives",
                            'fr': "Déplacer vers les archives"
                        },
                        'SCENARIST-CARD-TRANSLATE-BTN': {
                            'en': "Translate " + keywords.scenario.singular.en,
                            'fr': "Traduire le " + keywords.scenario.singular.fr
                        },
                        'SCENARIST-CARD-EDIT-BTN': {
                            'en': "Edit " + keywords.scenario.singular.en,
                            'fr': "Modifier le " + keywords.scenario.singular.fr
                        },
                        'SCENARIST-CARD-DETAILS-MODEL': {
                            'en': startSentence(keywords.model.singular.en),
                            'fr': startSentence(keywords.model.singular.fr)
                        },
                        'SCENARIST-CARD-CREATED-ON': {
                            'en': "Created on ",
                            'fr': "Créé le "
                        },
                        'SCENARIST-CARD-CREATED-BY': {
                            'en': " by ",
                            'fr': " par "
                        },
                        'SCENARIST-MODALE-USERS-TITLE': {
                            'en': "Co-" + keywords.scenarist.plural.en,
                            'fr': "Co-" + keywords.scenarist.plural.fr
                        },
                        'SCENARIST-MODALE-USERS-SHARE-INPUT': {
                            'en': "Share with user",
                            'fr': "Partager avec un utilisateur"
                        },
                        'SCENARIST-MODALE-USERS-EDIT-CHECKBOX': {
                            'en': "Edit " + keywords.scenario.singular.en,
                            'fr': "Modifier le " + keywords.scenario.singular.fr
                        },
                        'SCENARIST-MODALE-USERS-DUPLICATE-CHECKBOX': {
                            'en': "Duplicate " + keywords.scenario.singular.en,
                            'fr': "Dupliquer le " + keywords.scenario.singular.fr
                        },
                        'SCENARIST-MODALE-USERS-CREATE-CHECKBOX': {
                            'en': "Create " + keywords.session.singular.en + " from " + keywords.scenario.singular.en,
                            'fr': "Créer une " + keywords.session.singular.fr + " depuis le " +
                                keywords.scenario.singular.fr
                        },
                        'SCENARIST-MODALE-USERS-TRANSLATE-CHECKBOX': {
                            'en': "Translate ",
                            'fr': "Traduire "
                        },
                        'SCENARIST-MODALE-USERS-REMOVE-BTN': {
                            'en': "Remove access for this user",
                            'fr': "Supprimer les accès pour cet utilisateur"
                        },
                        'SCENARIST-MODALE-VERSIONS-NEW-BTN': {
                            'en': "Create version",
                            'fr': "Créer version"
                        },
                        'SCENARIST-MODALE-VERSIONS-NEW-TITLE-BTN': {
                            'en': "This action will store a new version of the " + keywords.scenario.singular.en +
                                ". The new version can later be restored as a new scenario.",
                            'fr': "Cette action va enregistrer une nouvelle version du " +
                                keywords.scenario.singular.fr + ". La nouvelle version peut être restaurée plus tard sous forme de nouveau scénario."
                        },
                        'SCENARIST-MODALE-VERSIONS-DUPLICATE-BTN': {
                            'en': "Duplicate",
                            'fr': "Dupliquer"
                        },
                        'SCENARIST-MODALE-VERSIONS-DUPLICATE-TITLE-BTN': {
                            'en': "This will generate a new " + keywords.scenario.singular.en + " based on this one.",
                            'fr': "Cette action génère un nouveau " + keywords.scenario.singular.fr +
                                " basé sur celui-ci"
                        },
                        'SCENARIST-MODALE-VERSIONS-DIFF-BTN': {
                            'en': "Diff",
                            'fr': "Diff"
                        },
                        'SCENARIST-MODALE-VERSIONS-PATCH-BTN': {
                            'en': "Patch",
                            'fr': "Patch"
                        },
                        'SCENARIST-MODALE-VERSIONS-PDF-BTN': {
                            'en': "PDF",
                            'fr': "PDF"
                        },
                        'SCENARIST-MODALE-VERSIONS-JSON-BTN': {
                            'en': "JSON",
                            'fr': "JSON"
                        },
                        'SCENARIST-MODALE-VERSIONS-WGZ-BTN': {
                            'en': "Export",
                            'fr': "Export"
                        },
                        'SCENARIST-MODALE-VERSIONS-NO-VERSION': {
                            'en': "No version available for this " + keywords.scenario.singular.en + ".",
                            'fr': "Ce " + keywords.scenario.singular.fr + " n'a pas encore de version."
                        },
                        'SCENARIST-MODALE-VERSIONS-AVAILABLE-VERSIONS': {
                            'en': "Available versions",
                            'fr': "Versions disponibles"
                        },
                        'SCENARIST-MODALE-VERSIONS-CREATE-BTN': {
                            'en': "Create a new " + keywords.scenario.singular.en + " from this version",
                            'fr': "Créer un nouveau " + keywords.scenario.singular.fr + " depuis cette version"
                        },
                        'SCENARIST-MODALE-VERSIONS-DELETE-BTN': {
                            'en': "Delete version",
                            'fr': "Supprimer la version"
                        },
                        'SCENARIST-CARD-VERSION-TITLE': {
                            'en': "Version of {{dateVersion | date:'MM/dd/yyyy h:mm a'}}",
                            'fr': "Version du {{dateVersion | date:'dd.MM.yyyy H:mm'}}"
                        },
                        'SCENARIST-CARD-VERSION-AUTHOR': {
                            'en': "Created by {{author}}",
                            'fr': "Créée par {{author}}"
                        },
                        'ADMIN-INDEX-TITLE': {
                            'en': "Welcome to admin console",
                            'fr': "Bienvenue dans la console d'admin"
                        },
                        'ADMIN-INDEX-STATUS-TITLE': {
                            'en': "Status",
                            'fr': "Status"
                        },
                        'ADMIN-INDEX-STATUS-I18N-USAGE': {
                            'en': "Translation service usage:",
                            'fr': "Utilisation du service de traduction :"
                        },
                        'ADMIN-INDEX-ACTIONS-TITLE': {
                            'en': "Perform an action:",
                            'fr': "Effectuer une action:"
                        },
                        'ADMIN-INDEX-LOCKS-BTN': {
                            'en': "Locks",
                            'fr': "Verrous"
                        },
                        'ADMIN-INDEX-LOGGERS-BTN': {
                            'en': "Loggers",
                            'fr': "Loggers"
                        },
                        'ADMIN-INDEX-TRIGGER-POPULATING': {
                            'en': "Start Populating Team/Player",
                            'fr': "Déclancher la création des Team/Player"
                        },
                        'ADMIN-INDEX-CLEAR-EMCACHE': {
                            'en': "Clear JPA cache",
                            'fr': "Vider le cache JPA"
                        },
                        'ADMIN-INDEX-CREATE-EMPTY-MODEL': {
                            'en': "Create an empty model",
                            'fr': "Créer un nouveau modèle vide"
                        },
                        'ADMIN-INDEX-CLEAR-GAMES': {
                            'en': "Delete games which are candidates for final deletion",
                            'fr': "Supprimer définitivement les parties qui sont candidates pour une suppression définitive"
                        },
                        'ADMIN-INDEX-CLEAR-GAMEMODELS': {
                            'en': "Delete gameModels which are candidates for final deletion",
                            'fr': "Supprimer définitivement les gameModels qui sont candidats pour une suppression définitive"
                        },
                        'ADMIN-INDEX-USERS-BTN': {
                            'en': "Users",
                            'fr': "Utilisateurs"
                        },
                        'ADMIN-INDEX-WHO-BTN': {
                            'en': "Who",
                            'fr': "Qui"
                        },
                        'ADMIN-INDEX-ADMIN-BTN': {
                            'en': "Admin",
                            'fr': "Admin"
                        },
                        'ADMIN-USERS-LOADING': {
                            'en': "Loading " + keywords.user.plural.en,
                            'fr': "Chargement des " + keywords.user.plural.fr
                        },
                        'ADMIN-INDEX-GROUPS-BTN': {
                            'en': "Groups",
                            'fr': "Groupes"
                        },
                        'ADMIN-INDEX-SESSIONS-BTN': {
                            'en': keywords.session.plural.en,
                            'fr': keywords.session.plural.fr
                        },
                        'ADMIN-INDEX-UPLOAD-TITLE': {
                            'en': "Upload a " + keywords.scenario.singular.en,
                            'fr': "Télécharger un " + keywords.scenario.singular.fr
                        },
                        'ADMIN-WHO-SYNC-BTN': {
                            'en': "sync online user list",
                            'fr': "synchroniser la liste des utilisateurs connectés"
                        },
                        'ADMIN-WHO-REQUESTRELOAD-BTN': {
                            'en': "Request user to reload the page",
                            'fr': "Demxmander aux utilisateurs de recharger leur page"
                        },
                        'ADMIN-WHO-SINGULAR-TITLE': {
                            'en': "connected user",
                            'fr': "utilisateur connecté"
                        },
                        'ADMIN-WHO-PLURAL-TITLE': {
                            'en': "connected users",
                            'fr': "utilisateurs connectés"
                        },
                        'ADMIN-USERS-TITLE': {
                            'en': "Existing users",
                            'fr': "Utilisateurs existants"
                        },
                        'ADMIN-USERS-CARD-TITLE': {
                            'en': "User ",
                            'fr': "Utilisateur "
                        },
                        'ADMIN-USERS-UNVERIFIED-ID': {
                            'en': '✘ unverified identity',
                            'fr': '✘ identité non-vérifiée',
                        },
                        'ADMIN-USERS-VERIFIED-ID': {
                            'en': '✔ verified identity',
                            'fr': '✔ identité vérifiée',
                        },
                        'ADMIN-USERS-PROCESSING': {
                            'en': 'initialisation in progress',
                            'fr': 'en cours d\'initialisation',
                        },
                        'ADMIN-USERS-CARD-EDIT-BTN': {
                            'en': "Edit user",
                            'fr': "Modifier l'utilisateur"
                        },
                        'ADMIN-USERS-CARD-DELETE-BTN': {
                            'en': "Delete user",
                            'fr': "Supprimer l'utilisateur"
                        },
                        'ADMIN-USERS-CARD-DELETE-CONFIRM': {
                            'en': "Are you sure you want to delete this user ? This action is irreversible.",
                            'fr': "Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible."
                        },
                        'ADMIN-USERS-MODALE-EDIT-TITLE': {
                            'en': "Edit profile",
                            'fr': "Modifier le profil"
                        },
                        'ADMIN-USERS-NONLOCAL-TITLE': {
                            'en': "AAI account - Personal data is not editable",
                            'fr': "Compte AAI - Les données personnelles ne sont pas éditables"
                        },
                        'ADMIN-USERS-NONLOCAL-NAME': {
                            'en': "Name",
                            'fr': "Nom"
                        },
                        'ADMIN-USERS-NONLOCAL-EMAIL': {
                            'en': "E-mail",
                            'fr': "E-mail"
                        },
                        'ADMIN-USERS-NONLOCAL-HOMEORG': {
                            'en': "Affiliation",
                            'fr': "Etablissement"
                        },
                        'ADMIN-USERS-MODALE-AGREED': {
                            'en': "Agreed to terms of use",
                            'fr': "A accepté les conditions d'utilisation"
                        },
                        'ADMIN-USERS-MODALE-AGREED-NOTYET': {
                            'en': "Not yet",
                            'fr': "Pas encore"
                        },
                        'ADMIN-USERS-MODALE-GROUPS-TITLE': {
                            'en': "Manage user's groups",
                            'fr': "Gestion des groupes de l'utilisateur"
                        },
                        'ADMIN-USERS-MODALE-GROUPS-ADD-BTN': {
                            'en': "Add user to group",
                            'fr': "Ajouter l'utilisateur à un groupe"
                        },
                        'ADMIN-USERS-MODALE-GROUPS-REMOVE-BTN': {
                            'en': "Remove user from this group",
                            'fr': "Enlever l'utilisateur du groupe"
                        },
                        'ADMIN-USERS-MODALE-GROUPS-SELECT-INPUT': {
                            'en': "Please select a group",
                            'fr': "Choisir un groupe"
                        },
                        'ADMIN-GROUPS-TITLE': {
                            'en': "Groups",
                            'fr': "Groupes"
                        },
                        'ADMIN-GROUPS-NEW-INPUT': {
                            'en': "New group name",
                            'fr': "Nom du nouveau groupe"
                        },
                        'ADMIN-GROUPS-NEW-BTN': {
                            'en': "New group",
                            'fr': "Nouveau groupe"
                        },
                        'ADMIN-GROUPS-CARD-EDIT-BTN': {
                            'en': "Edit group",
                            'fr': "Modifier le groupe"
                        },
                        'ADMIN-GROUPS-CARD-MEMBER-BTN': {
                            'en': "Group members",
                            'fr': "Membres du groupe"
                        },
                        'ADMIN-GROUPS-CARD-TOGGLE-MEMBERS-BTN': {
                            'en': "Show/Hide group members",
                            'fr': "Afficher/Cacher les membres du groupe"
                        },
                        'ADMIN-GROUPS-NO-MEMBERS-ERROR': {
                            'en': "This group is empty!",
                            'fr': "Ce groupe est vide !"
                        },
                        'ADMIN-GROUPS-CARD-DELETE-BTN': {
                            'en': "Delete group",
                            'fr': "Supprimer le groupe"
                        },
                        'ADMIN-GROUPS-CARD-EMAILS-BTN': {
                            'en': "Get e-mail addresses",
                            'fr': "Obtenir les adresses e-mail"
                        },
                        'ADMIN-GROUPS-CARD-DELETE-CONFIRM': {
                            'en': "Are you sure you want to delete this group ? This action is irreversible.",
                            'fr': "Êtes-vous sûr de vouloir supprimer ce groupe ? Cette action est irréversible."
                        },
                        'ADMIN-GROUPS-MODALE-NAME-TITLE': {
                            'en': "Edit name",
                            'fr': "Modifier le nom"
                        },
                        'ADMIN-GROUPS-MODALE-NAME-INPUT': {
                            'en': "Group name",
                            'fr': "Nom du groupe"
                        },
                        'ADMIN-GROUPS-MODALE-SIZE-INPUT': {
                            'en': "Number of members",
                            'fr': "Nombre de membres"
                        },
                        'ADMIN-MODALE-PERMISSION-TITLE': {
                            'en': "Edit permissions",
                            'fr': "Modifier les permissions"
                        },
                        'ADMIN-MODALE-PERMISSION-ADD-BTN': {
                            'en': "Add permission",
                            'fr': "Ajouter une permission"
                        },
                        'ADMIN-MODALE-PERMISSION-REMOVE-BTN': {
                            'en': "Remove permission",
                            'fr': "Supprimer la permission"
                        },
                        'ADMIN-MODALE-PERMISSION-SAVE-BTN': {
                            'en': "Save changes",
                            'fr': "Sauver les changements"
                        },
                        'ADMIN-MODALE-PERMISSION-SAVE-CONFIRM': {
                            'en': "Are you sure you want to save your changes ? This action is irreversible.",
                            'fr': "Êtes-vous sûr de vouloir sauver vos changements ? Cette action est irréversible."
                        },
                        'ADMIN-MODALE-PERMISSION-INPUT': {
                            'en': "Permission chain",
                            'fr': "Expression de la permission"
                        },
                        /*
                         'UPGRADE-ACCOUNT': {
                         'en': "You can start the game now. But if you want to keep this " + keywords.session.singular.en +
                         ", you should first login or create a user account.",
                         'fr': "Vous pouvez commencer le jeu. Mais si vous voulez conserver cette " +
                         keywords.session.singular.fr + ", il faut d'abord vous connecter ou créer un compte."
                         },
                         */
                        // So Long, and Thanks for All the Fish
                        'END': {
                            'en': "This is the end",
                            'fr': "C'est la fin"
                        }
                    },
                    'workspaces': {
                        'PLAYER': {
                            'en': startSentence(keywords.player.singular.en),
                            'fr': startSentence(keywords.player.singular.fr)
                        },
                        'TRAINER': {
                            'en': startSentence(keywords.trainer.singular.en),
                            'fr': startSentence(keywords.trainer.singular.fr)
                        },
                        'SCENARIST': {
                            'en': startSentence(keywords.scenarist.singular.en),
                            'fr': startSentence(keywords.scenarist.singular.fr)
                        },
                        'MODELER': {
                            'en': startSentence(keywords.modeler.singular.en),
                            'fr': startSentence(keywords.modeler.singular.fr)
                        },
                        'ADMIN': {
                            'en': startSentence(keywords.admin.singular.en),
                            'fr': startSentence(keywords.admin.singular.fr)
                        }
                    },
                    'hideToggle': {
                        'HIDE': {
                            'en': "Hide",
                            'fr': "Masquer"
                        },
                        'SHOW': {
                            'en': "Show",
                            'fr': "Afficher"
                        }
                    },
                    'access': {
                        'OPEN': {
                            'en': "Open",
                            'fr': "ouverte"
                        },
                        'CLOSE': {
                            'en': "Closed",
                            'fr': "fermée"
                        }
                    }
                };
            }
        };
    })
    ;
