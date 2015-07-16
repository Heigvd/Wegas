angular.module('wegas.service.wegasTranslations', [])
        .provider('WegasTranslations', function($translateProvider) {
            return {
                getTranslations : function(language){
                    var translations = this.$get().translations,
                        translationsToReturn = {};
                        for(var label in translations){ translationsToReturn[label] = translations[label][language]; }
                    return translationsToReturn;
                },
                default: function(){
                    if(localStorage.getObject("wegas-config@public")){
                        $translateProvider.preferredLanguage(localStorage.getObject("wegas-config@public").language);
                    }else{
                        localStorage.setObject("wegas-config@public", {
                            'language':'en'
                        });
                        $translateProvider.preferredLanguage('en');
                    } 
                },
                $get : function() {
                    var keywords = {
                        player: { singular:{ en:"player", fr:"joueur"}, plural:{ en:"players", fr:"joueurs"}},
                        trainer: {singular:{ en:"trainer", fr:"animateur"}, plural:{ en:"trainers", fr:"animateurs"}},
                        scenarist: { singular:{ en:"scenarist", fr:"scénariste"}, plural:{ en:"scenarists", fr:"scénaristes"}},
                        admin: { singular:{ en:"administrator", fr:"administrateur"}, plural:{ en:"administrators", fr:"administrateurs"}},
                        team: { singular:{ en:"team", fr:"équipe"}, plural:{ en:"teams", fr:"équipes"}},
                        session: { singular:{ en:"session", fr:"partie"}, plural:{ en:"sessions", fr:"parties"}},
                        scenario: { singular:{ en:"scenario", fr:"scenario"}, plural:{ en:"scenarios", fr:"scenarios"}},
                        token: { singular:{ en:"access key", fr:"clé d'accès"}, plural:{ en:"access keys", fr:"clés d'accès"}},
                        workspace: { singular:{ en:"workspace", fr:"espace de travail"}, plural:{ en:"workspaces", fr:"espaces de travail"}},
                    },
                    startSentence = function(word){
                        return word.charAt(0).toUpperCase() + word.slice(1);
                    };
                    return { 
                        translations : {
                            // Commons
                            'LANGUAGE-FRENCH-NAME': {
                                'en':"French",
                                'fr':"Français"
                            },
                            'LANGUAGE-ENGLISH-NAME': {
                                'en':"English",
                                'fr':"Anglais"
                            },
                            'LOADING':{
                                'en':"Loading",
                                'fr':"Chargement"
                            },
                            // Public
                            'WEGAS-SLOGAN': {
                                'en':"The \"learning by doing\" solution from AlbaSim",
                                'fr':"La solution \"learning by doing\" développée par AlbaSim"
                            },
                            'LOGIN-BTN': {
                                'en':"Login",
                                'fr':"Connexion"
                            },
                            'LOGIN-INPUT-EMAIL': {
                                'en':"email or username",
                                'fr':"email ou nom d'utilisateur"
                            },
                            'LOGIN-INPUT-PASSWORD': {
                                'en':"password",
                                'fr':"mot de passe"
                            },
                            'LOGIN-FLASH-EMPTY': {
                                'en':"username/password cannot be empty",
                                'fr':"Veuillez renseigner l'email et le mot de passe"
                            },
                            'CREATE-ACCOUNT-LABEL':{
                                'en':"Haven't yet a Wegas account ?",
                                'fr':"Pas encore de compte Wegas ?"
                            },
                            'CREATE-ACCOUNT-BTN': {
                                'en':"Create account",
                                'fr':"Créer un compte"
                            },
                            'CREATE-ACCOUNT-TITLE':{
                                'en':"Create account",
                                'fr':"Créer un compte"
                            },
                            'CREATE-ACCOUNT-INPUT-EMAIL':{
                                'en':"email",
                                'fr':"email"
                            },
                            'CREATE-ACCOUNT-INPUT-PASSWORD': {
                                'en':"password",
                                'fr':"mot de passe"
                            },
                            'CREATE-ACCOUNT-INPUT-PASSWORD-AGAIN':{
                                'en':"password again",
                                'fr':"Pas encore de compte Wegas ?"
                            },
                            'CREATE-ACCOUNT-INPUT-USERNAME': {
                                'en':"username",
                                'fr':"nom d'utilisateur"
                            },
                            'CREATE-ACCOUNT-INPUT-FIRSTNAME': {
                                'en':"firstname",
                                'fr':"prénom"
                            },
                            'CREATE-ACCOUNT-INPUT-LASTNAME': {
                                'en':"lastname",
                                'fr':"nom de famille"
                            },
                            'CREATE-ACCOUNT-SEND-BTN': {
                                'en':"Create account",
                                'fr':"Créer un compte"
                            },
                            'CREATE-ACCOUNT-FLASH-WRONG-NAME' : {
                                'en':"Firstname and lastname are required",
                                'fr':"Vous devez renseigner votre prénom et nom de famille"
                            },
                            'CREATE-ACCOUNT-FLASH-WRONG-PASS' : {
                                'en':"Your password should contains at least 3 characters",
                                'fr':"Le mot de passe doit contenire au moins 3 caractères"
                            },
                            'CREATE-ACCOUNT-FLASH-WRONG-PASS2' : {
                                'en':"Passwords are different",
                                'fr':"Les champs liés au mot de passe sont differents"
                            },
                            'PASSWORD-BTN': {
                                'en':"Password forgotten",
                                'fr':"Mot de passe oublié"
                            },
                            'PASSWORD-INPUT-EMAIL': {
                                'en':"type your email",
                                'fr':"entrez votre email"
                            },
                            'PASSWORD-TITLE': {
                                'en':"Password forgotten",
                                'fr':"Mot de passe oublié"
                            },
                            'PASSWORD-SEND-BTN': {
                                'en':'Send me a new password',
                                'fr':"Envoyez moi un nouveau mot de passe"
                            },
                            'PASSWORD-FLASH-EMPTY': {
                                'en':"Please, enter your email",
                                'fr':"Merci d'entrer votre email"
                            },
                            // Commons Auth service
                            'COMMONS-AUTH-PASSWORD-FLASH-SUCCESS':{
                                'en':"A new password has been send",
                                'fr':"Un nouveau mot de passe a été envoyé"
                            },
                            'COMMONS-AUTH-PASSWORD-FLASH-ERROR':{
                                'en':"Error during password generation",
                                'fr':"Erreur durant la génération du mot de passe"
                            },
                            'COMMONS-AUTH-CREATE-ACCOUNT-FLASH-SUCCESS':{
                                'en':"Account created",
                                'fr':"Compte créé"
                            },
                            'COMMONS-AUTH-CREATE-ACCOUNT-FLASH-ERROR':{
                                'en':"Error while creating account",
                                'fr':"Erreur durant la création du compte"
                            },
                            'COMMONS-AUTH-LOGIN-FLASH-SUCCESS':{
                                'en':"You are logged",
                                'fr':"Vous êtes connecté"
                            },
                            'COMMONS-AUTH-LOGIN-FLASH-ERROR-CLIENT':{
                                'en':"Login or password is wrong",
                                'fr':"Login ou mot de passe incorrecte"
                            },
                            'COMMONS-AUTH-LOGIN-FLASH-ERROR-SERVER':{
                                'en':"Server error during connection",
                                'fr':"Erreur serveur durant la connexion"
                            },
                            'COMMONS-AUTH-LOGOUT-FLASH-SUCCESS':{
                                'en':"You are deconnected",
                                'fr':"Vous êtes déconnecté"
                            },
                            'COMMONS-AUTH-LOGOUT-FLASH-ERROR':{
                                'en':"Error while logout",
                                'fr':"Erreur durant la déconnexion"
                            },
                            'COMMONS-AUTH-CURRENT-FLASH-ERROR':{
                                'en':"You need to be logged",
                                'fr':"Connexion nécessaire"
                            },
                            'COMMONS-AUTH-GUEST-FLASH-SUCCESS':{
                                'en':"Connected as guest",
                                'fr':"Connecté en tant qu'invité"
                            },
                            'COMMONS-AUTH-GUEST-FLASH-ERROR':{
                                'en':"Error while connection",
                                'fr':"Erreur durant la connexion"
                            },
                            // Commons Teams model
                            'COMMONS-TEAMS-FIND-FLASH-SUCCESS':{
                                'en':startSentence(keywords.team.plural.en)+ " found",
                                'fr':startSentence(keywords.team.plural.fr)+ " trouvées"
                            },
                            'COMMONS-TEAMS-GET-FLASH-SUCCESS':{
                                'en':startSentence(keywords.team.singular.en)+" found",
                                'fr':startSentence(keywords.team.singular.fr)+" trouvée"
                            },
                            'COMMONS-TEAMS-GET-FLASH-ERROR':{
                                'en':"No "+keywords.team.singular.en+" found",
                                'fr':"Aucune "+keywords.team.singular.fr+" trouvée"
                            },
                            'COMMONS-TEAMS-JOIN-FLASH-SUCCESS':{
                                'en':"You have joined the " + keywords.team.singular.en,
                                'fr':"Vous avez rejoint l'"+ keywords.team.singular.fr
                            },
                            'COMMONS-TEAMS-JOIN-FLASH-ERROR':{
                                'en':"Error while joining " + keywords.team.singular.en,
                                'fr':"Erreur durant la tentative de rejoindre l'"+ keywords.team.singular.fr
                            },
                            'COMMONS-TEAMS-JOIN-INDIVIDUALLY-FLASH-SUCCESS':{
                                'en':"You have joined the " + keywords.session.singular.en,
                                'fr':"Vous avez rejoint la " + keywords.session.singular.fr
                            },
                            'COMMONS-TEAMS-JOIN-INDIVIDUALLY-FLASH-ERROR':{
                                'en':"Error while joining " + keywords.session.singular.en,
                                'fr':"Erreur durant la tentative de rejoindre la " + keywords.session.singular.fr
                            },
                            'COMMONS-TEAMS-ALREADY-JOIN-FLASH-INFO': {
                                'en':"You have already join this " + keywords.session.singular.en,
                                'fr':"Vous avez déjà rejoint cette "+ keywords.session.singular.fr
                            },
                            'COMMONS-TEAMS-LEAVE-FLASH-SUCCESS':{
                                'en':"You have leaved the "+ keywords.session.singular.en,
                                'fr':"Vous avez rejoint la "+ keywords.session.singular.fr
                            },
                            'COMMONS-TEAMS-LEAVE-FLASH-ERROR':{
                                'en':"Error while leaving "+ keywords.session.singular.en,
                                'fr':"Erreur durant la tentative de quitter la "+ keywords.session.singular.fr
                            },
                            'COMMONS-TEAMS-NO-TEAM-FLASH-ERROR':{
                                'en':"No "+ keywords.team.singular.en +" found",
                                'fr':"Aucune "+ keywords.team.singular.fr +" trouvée"
                            },
                            'COMMONS-TEAMS-NO-PLAYER-FLASH-ERROR':{
                                'en':"No "+ keywords.player.singular.en +" found in the "+ keywords.team.singular.en,
                                'fr':"Aucun "+ keywords.player.singular.fr +" dans cette "+ keywords.team.singular.fr
                            },
                            'COMMONS-TEAMS-RELOAD-FLASH-SUCCESS': {
                                'en':startSentence(keywords.team.singular.en)+ " reloaded",
                                'fr':startSentence(keywords.team.singular.fr) + " rechargée"
                            },
                            'COMMONS-TEAMS-RELOAD-FLASH-ERROR': {
                                'en':"Error while reloading "+ keywords.team.singular.en,
                                'fr':"Erreur durant le rechargement de l'"+ keywords.team.singular.fr
                            },
                            'COMMONS-TEAMS-CREATE-FLASH-SUCCESS': {
                                'en':startSentence(keywords.team.singular.en) + " created",
                                'fr':startSentence(keywords.team.singular.fr) + " créée"
                            },
                            'COMMONS-TEAMS-CREATE-FLASH-ERROR': {
                                'en':"Error while creating "+ keywords.team.singular.en,
                                'fr':"Erreur durant la création de l'"+ keywords.team.singular.fr
                            },
                            // Commons Sessions model
                            'COMMONS-SESSIONS-CLOSE-FLASH-ERROR': {
                                'en': "Closed " + keywords.session.singular.en,
                                'fr': startSentence(keywords.session.singular.fr) + " fermée"
                            },
                            // Private Commons
                            'PRIVATE-WS-TITLE':{
                                'en':"{{workspace}} " + keywords.workspace.singular.en,
                                'fr':startSentence(keywords.workspace.singular.fr) + " - {{workspace}}"
                            },
                            'PRIVATE-WS-PLAYER-BTN':{
                                'en':startSentence(keywords.player.singular.en),
                                'fr':startSentence(keywords.player.singular.fr)
                            },
                            'PRIVATE-WS-TRAINER-BTN':{
                                'en':startSentence(keywords.trainer.singular.en),
                                'fr':startSentence(keywords.trainer.singular.fr)
                            },
                            'PRIVATE-WS-SCENARIST-BTN':{
                                'en':startSentence(keywords.scenarist.singular.en),
                                'fr':startSentence(keywords.scenarist.singular.fr)
                            },
                            'PRIVATE-WS-ADMIN-BTN':{
                                'en':startSentence(keywords.admin.singular.en),
                                'fr':startSentence(keywords.admin.singular.fr)
                            },
                            'PRIVATE-WS-PROFILE-BTN':{
                                'en':"Edit profile",
                                'fr':"Editer mon profile"
                            },
                            'PRIVATE-WS-ACCESS-KEY':{
                                'en':startSentence(keywords.token.singular.en),
                                'fr':startSentence(keywords.token.singular.fr)
                            },
                            'PRIVATE-WS-LOGOUT-BTN':{
                                'en':"Logout",
                                'fr':"Déconnexion"
                            },
                            'PRIVATE-MODALE-TABS-INFOS':{
                                'en':"Infos",
                                'fr':"Infos"
                            },
                            'PRIVATE-MODALE-TABS-CUSTOMIZE':{
                                'en':"Icons and colors",
                                'fr':"Icones et couleurs"
                            },
                            'PRIVATE-MODALE-TABS-ADVANCED':{
                                'en':"Advanced",
                                'fr':"Paramètres avancés"
                            },
                            'PRIVATE-MODALE-TABS-INFOS-ACCESS-LINK':{
                                'en':"guests or registered " +keywords.player.plural.en+ " can access the "+keywords.session.singular.en+" following the link below.",
                                'fr':"Des invités ou des "+keywords.player.plural.fr+"  connectés peuvent avoir accès à la "+keywords.session.singular.fr+" depuis le lien ci-dessous"
                            },
                            'PRIVATE-MODALE-TABS-INFOS-ACCESS-LINK-SELECT-TITLE':{
                                'en':"select the link",
                                'fr':"sélectionner le lien"
                            },
                            'PRIVATE-MODALE-TABS-INFOS-BASED-ON':{
                                'en':"Session based on "+keywords.scenario.singular.en+" : ",
                                'fr':"Partie basée sur le "+keywords.scenario.singular.fr+" : "
                            },
                            'PRIVATE-MODALE-TABS-ADVANCED-WARNING':{
                                'en':"Warning! Update this values only if you know what you do",
                                'fr':"Attention! Modifiez les paramètres avancés seulement si vous connaissez leur impact"
                            },
                            'PRIVATE-MODALE-SETTINGS-NOT-SAVED-WARNING':{
                                'en':"Some changes aren't saved",
                                'fr':"Des changements n'ont pas été sauvé"
                            },
                            'PRIVATE-MODALE-SETTINGS-CANCEL-BTN':{
                                'en':"Cancel",
                                'fr':"Annuler"
                            },
                            'PRIVATE-MODALE-SETTINGS-SAVE-BTN':{
                                'en':"Save",
                                'fr':"Sauver"
                            },
                            'PRIVATE-SESSIONS-NAME-LABEL-INPUT':{
                                'en':"Name",
                                'fr':"Nom"
                            },
                            'PRIVATE-SESSIONS-NAME-PLACEHOLDER-INPUT':{
                                'en':"Name is required",
                                'fr':"Le nom est obligatoire"
                            },
                            'PRIVATE-SESSIONS-ACCESS-KEY-LABEL-INPUT':{
                                'en':startSentence(keywords.token.singular.en),
                                'fr':startSentence(keywords.token.singular.fr)
                            },
                            'PRIVATE-SESSIONS-ACCESS-KEY-PLACEHOLDER-INPUT':{
                                'en':startSentence(keywords.token.singular.en) + " is required",
                                'fr':"La " + keywords.token.singular.fr + " est obligatoire"
                            },
                            'PRIVATE-SCENARIOS-COMMENTS-LABEL-INPUT':{
                                'en':"Comments",
                                'fr':"Commentaires"
                            },
                            'PRIVATE-SCENARIOS-COMMENTS-PLACEHOLDER-INPUT':{
                                'en':"Comments are optionnal",
                                'fr':"Les commentaires sont optionnels"
                            },
                            'PRIVATE-SCENARIOS-TYPE-LABEL-CHECKBOX':{
                                'en':"Type",
                                'fr':"Type"
                            },
                            'PRIVATE-SCENARIOS-TYPE-INDIVIDUALLY-CHECKBOX':{
                                'en':"Individually",
                                'fr':"Individuel"
                            },
                            'PRIVATE-SCENARIOS-TYPE-IN-TEAM-CHECKBOX':{
                                'en':"In " + keywords.team.singular.en,
                                'fr':"En " + keywords.team.singular.fr
                            },
                            'PRIVATE-SCENARIOS-LOG-ID-LABEL-INPUT':{
                                'en':"Log ID",
                                'fr':"Log ID"
                            },
                            'PRIVATE-SCENARIOS-SERVER-SCRIPT-LABEL-INPUT':{
                                'en':"Server script",
                                'fr':"Script serveur"
                            },
                            'PRIVATE-SCENARIOS-CLIENT-SCRIPT-LABEL-INPUT':{
                                'en':"Client script",
                                'fr':"Script client"
                            },
                            'PRIVATE-SCENARIOS-STYLESHEETS-LABEL-INPUT':{
                                'en':"Stylesheets",
                                'fr':"Feuilles de styles"
                            },
                            'PRIVATE-SCENARIOS-PAGES-LABEL-INPUT':{
                                'en':"Pages",
                                'fr':"Pages"
                            },
                            // Private Player
                            'PLAYER-INDEX-ADD-TITLE':{
                                'en':"Join a " + keywords.session.singular.en,
                                'fr':"Rejoindre une "+ keywords.session.singular.fr
                            },
                            'PLAYER-INDEX-JOIN-BTN':{
                                'en':"Join",
                                'fr':"Rejoindre"
                            },
                            'PLAYER-INDEX-LIST-TITLE':{
                                'en':"My " + keywords.session.plural.en,
                                'fr':"Mes " + keywords.session.plural.fr
                            },
                            'PLAYER-INDEX-NO-SESSION':{
                                'en':"No "+ keywords.session.singular.en,
                                'fr':"Pas de "+ keywords.session.singular.fr
                            },
                            'PLAYER-CARD-TEAM-TITLE':{
                                'en':startSentence(keywords.team.singular.en),
                                'fr':startSentence(keywords.team.singular.fr)
                            },
                            'PLAYER-CARD-TEAM-BTN':{
                                'en':"View "+ keywords.team.singular.en,
                                'fr':"Voir l'" + keywords.team.singular.fr
                            },
                            'PLAYER-CARD-LEAVE-BTN':{
                                'en':"Leave " + keywords.session.singular.en,
                                'fr':"Quitter la "+ keywords.session.singular.fr
                            },
                            'PLAYER-CARD-LEAVE-CONFIRM':{
                                'en':"Are you sure you want to leave the "+ keywords.session.singular.en +" ? This action is irreversible.",
                                'fr':"Êtes-vous sûre de vouloir quitter cette "+ keywords.session.singular.fr +" ? Cette action est irreversible."
                            },
                            'PLAYER-CARD-PLAY-BTN':{
                                'en':"Play " + keywords.session.singular.en,
                                'fr':"Jouer"
                            },
                            'PLAYER-MODALE-JOIN-TEAM-CREATE-INPUT':{
                                'en':startSentence(keywords.team.singular.en) + " name",
                                'fr':"Nom de l'" + keywords.team.singular.fr
                            },
                            'PLAYER-MODALE-JOIN-TEAM-CREATE-BTN':{
                                'en':"Create "+ keywords.team.singular.en,
                                'fr':"Créer une "+ keywords.team.singular.fr
                            },
                            'PLAYER-MODALE-JOIN-TEAM-EXISTING-MESSAGE':{
                                'en':"Existing " + keywords.team.singular.en,
                                'fr':"L'"+keywords.team.singular.fr+" existe déjà"
                            },
                            'PLAYER-MODALE-JOIN-TEAM-NUMBER-PLAYER':{
                                'en':keywords.player.singular.en + "(s)",
                                'fr':keywords.player.singular.fr + "(s)"
                            },
                            'PLAYER-MODALE-JOIN-TEAM-JOIN-BTN':{
                                'en':"Join " + keywords.team.singular.en,
                                'fr':"Rejoindre la "+ keywords.team.singular.fr
                            },
                            'PLAYER-MODALE-JOIN-TEAM-PLAYERS-LIST':{
                                'en':startSentence(keywords.player.plural.en) +" from "+ keywords.team.singular.en,
                                'fr':startSentence(keywords.player.plural.fr) +" de l'"+ keywords.team.singular.fr
                            },
                            'PLAYER-MODALE-JOIN-TEAM-HIDE-TOGGLE':{
                                'en':"{{toggle}} "+ keywords.player.plural.en,
                                'fr':"{{toggle}} les "+ keywords.player.plural.fr
                            },
                            'PLAYER-MODALE-JOIN-TEAM-JOIN-OR-CREATE-MESSAGE':{
                                'en':"Join an existing "+ keywords.team.singular.en +" or create a new one",
                                'fr':"Vous pouvez rejoindre une " + keywords.team.singular.fr + " existante ou en créer une nouvelle"
                            },
                            'PLAYER-MODALE-JOIN-TEAM-JOIN-MESSAGE':{
                                'en':"Join an existing " + keywords.team.singular.en,
                                'fr':"Vous pouvez rejoindre une "+ keywords.team.singular.fr +" existante"
                            },
                            'PLAYER-MODALE-JOIN-TEAM-CREATE-MESSAGE':{
                                'en':"Create your " + keywords.team.singular.en,
                                'fr':"Créez votre "+ keywords.team.singular.fr
                            },
                            'PLAYER-MODALE-TEAM-RELOAD-BTN':{
                                'en':"Reload " + keywords.team.singular.en,
                                'fr':"Recharger l'" + keywords.team.singular.fr
                            },
                            'PLAYER-JOIN-TEAM-KEY-FLASH-ERROR': {
                                'en':"This is not a valid " + keywords.token.singular.en,
                                'fr':startSentence(keywords.token.singular.fr) + " invalide"
                            },
                            // Private Trainer
                            'TRAINER-INDEX-ADD-TITLE':{
                                'en':"Add " + keywords.session.singular.en,
                                'fr':"Créer une " + keywords.session.singular.fr
                            },
                            'TRAINER-INDEX-ADD-NAME-INPUT':{
                                'en':startSentence(keywords.session.singular.en) + " name",
                                'fr':"Nom de la " + keywords.session.singular.fr 
                            },
                            'TRAINER-INDEX-ADD-SCENARIO-INPUT':{
                                'en':"Based on " + keywords.scenario.singular.en,
                                'fr':"Basé sur le " + keywords.scenario.singular.fr
                            },
                            'TRAINER-INDEX-ADD-BTN':{
                                'en':"Create " + keywords.session.singular.en,
                                'fr':"Créer la " + keywords.session.singular.fr
                            },
                            'TRAINER-INDEX-LIST-TITLE':{
                                'en':"Current " + keywords.session.plural.en,
                                'fr':startSentence(keywords.session.plural.fr) + " en cours"
                            },
                            'TRAINER-CARD-ACCESS-TITLE':{
                                'en':"Access to new " + keywords.player.plural.en,
                                'fr':"Accès pour nouveaux " + keywords.player.plural.fr
                            },
                            'TRAINER-CARD-ACCESS-CLOSE':{
                                'en':"No other "+ keywords.player.singular.en +" can join",
                                'fr':keywords.token.singular.fr +" désactivée"
                            },
                            'TRAINER-CARD-ACCESS-OPEN':{
                                'en':keywords.player.plural.en + " can join with key :",
                                'fr':"Accessible avec la clé :"
                            },
                            'TRAINER-CARD-SETTINGS-BTN':{
                                'en':"Settings",
                                'fr':"Paramètres"
                            },
                            'TRAINER-CARD-USERS-BTN':{
                                'en':"Manage users",
                                'fr':"Gérer les utilisateurs"
                            },
                            'TRAINER-CARD-MOVE-ARCHIVE-BTN':{
                                'en':"Move to archives",
                                'fr':"Déplacer dans les archives"
                            },
                            'TRAINER-CARD-MONITORING-BTN':{
                                'en':"Monitoring " + keywords.session.singular.en,
                                'fr':"Gérer la " + keywords.session.singular.fr
                            },
                            'TRAINER-MODALE-USERS-TAB-PLAYER':{
                                'en':startSentence(keywords.player.plural.en),
                                'fr':startSentence(keywords.player.plural.fr)
                            },
                            'TRAINER-MODALE-USERS-TAB-TRAINER':{
                                'en':startSentence(keywords.trainer.plural.en),
                                'fr':startSentence(keywords.trainer.plural.fr)
                            },
                            'TRAINER-MODALE-USERS-RELOAD-BTN':{
                                'en':"Reload users",
                                'fr':"Recharger les utilisateurs"
                            },
                            'TRAINER-MODALE-USERS-REMOVE-TRAINER-BTN':{
                                'en':"Remove access to " + keywords.trainer.singular.en,
                                'fr':"Supprimer les accès de l'" + keywords.trainer.singular.fr
                            },
                            'TRAINER-MODALE-USERS-ADD-TRAINER-INPUT':{
                                'en':"Add " + keywords.trainer.singular.en,
                                'fr':"Ajouter un " + keywords.trainer.singular.fr
                            },
                            'TRAINER-MODALE-USERS-REMOVE-PLAYER-BTN':{
                                'en':"Remove access to " + keywords.player.singular.en,
                                'fr':"Supprimer les accès du " + keywords.player.singular.fr
                            },
                            'TRAINER-MODALE-USERS-REMOVE-PLAYER-CONFIRM':{
                                'en':"Are you sure you want to remove this "+ keywords.player.singular.en +" from the "+ keywords.session.singular.en +" ? This action is irreversible.",
                                'fr':"Êtes vous sûre de vouloir supprimer le "+ keywords.player.singular.fr +" de la "+ keywords.session.singular.en +" ? Cette action est irréversible."
                            },
                            'TRAINER-MODALE-USERS-REMOVE-TEAM-BTN':{
                                'en':"Remove " + keywords.team.singular.en,
                                'fr':"Supprimer l'" + keywords.team.singular.fr
                            },
                            'TRAINER-MODALE-USERS-REMOVE-TEAM-CONFIRM':{
                                'en':"Are you sure you want to remove this "+ keywords.team.singular.en +" from the "+ keywords.session.singular.en +" ? This action is irreversible.",
                                'fr':"Êtes vous sûre de vouloir supprimer l'"+ keywords.team.singular.fr +" de la "+ keywords.session.singular.en +" ? Cette action est irréversible."
                            }
                        },
                        workspaces : {
                            'PLAYER':{
                                'en':startSentence(keywords.player.singular.en),
                                'fr':startSentence(keywords.player.singular.fr)
                            },
                            'TRAINER':{
                                'en':startSentence(keywords.trainer.singular.en),
                                'fr':startSentence(keywords.trainer.singular.fr)
                            },
                            'SCENARIST':{
                                'en':startSentence(keywords.scenarist.singular.en),
                                'fr':startSentence(keywords.scenarist.singular.fr)
                            },
                            'ADMIN':{
                                'en':startSentence(keywords.admin.singular.en),
                                'fr':startSentence(keywords.admin.singular.fr)
                            }                                    
                        },
                        hideToggle : {
                            'HIDE':{
                                'en':"Hide",
                                'fr':"Masquer"
                            },
                            'SHOW':{
                                'en':"Show",
                                'fr':"Afficher"
                            } 
                        }
                    };
                }
            };
        })
;