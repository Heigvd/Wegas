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
                                'en':"Teams found",
                                'fr':"Equipes trouvées"
                            },
                            'COMMONS-TEAMS-GET-FLASH-SUCCESS':{
                                'en':"Team found",
                                'fr':"Equipe trouvée"
                            },
                            'COMMONS-TEAMS-GET-FLASH-ERROR':{
                                'en':"No team found",
                                'fr':"Aucune équipe trouvée"
                            },
                            'COMMONS-TEAMS-JOIN-FLASH-SUCCESS':{
                                'en':"You have joined the team",
                                'fr':"Vous avez rejoint l'équipe"
                            },
                            'COMMONS-TEAMS-JOIN-FLASH-ERROR':{
                                'en':"Error while joining team",
                                'fr':"Erreur durant la tentative de rejoindre l'équipe "
                            },
                            'COMMONS-TEAMS-JOIN-INDIVIDUALLY-FLASH-SUCCESS':{
                                'en':"You have joined the session",
                                'fr':"Vous avez rejoint la partie"
                            },
                            'COMMONS-TEAMS-JOIN-INDIVIDUALLY-FLASH-ERROR':{
                                'en':"Error while joining session",
                                'fr':"Erreur durant la tentative de rejoindre la partie "
                            },
                            'COMMONS-TEAMS-ALREADY-JOIN-FLASH-INFO': {
                                'en':"You have already join this session",
                                'fr':"Vous avez déjà rejoint cette partie"
                            },
                            'COMMONS-TEAMS-LEAVE-FLASH-SUCCESS':{
                                'en':"You have leaved the session",
                                'fr':"Vous avez rejoint la partie"
                            },
                            'COMMONS-TEAMS-LEAVE-FLASH-ERROR':{
                                'en':"Error while leaving session",
                                'fr':"Erreur durant la tentative de quitter la partie "
                            },
                            'COMMONS-TEAMS-NO-TEAM-FLASH-ERROR':{
                                'en':"No team found",
                                'fr':"Aucune équipe trouvée"
                            },
                            'COMMONS-TEAMS-NO-PLAYER-FLASH-ERROR':{
                                'en':"No player found in the team",
                                'fr':"Aucun joueur dans cette équipe"
                            },
                            'COMMONS-TEAMS-RELOAD-FLASH-SUCCESS': {
                                'en':"Team reloaded",
                                'fr':"Equipe rechargée"
                            },
                            'COMMONS-TEAMS-RELOAD-FLASH-ERROR': {
                                'en':"Error while reloading team",
                                'fr':"Erreur durant le rechargement de l'équipe"
                            },
                            'COMMONS-TEAMS-CREATE-FLASH-SUCCESS': {
                                'en':"Team created",
                                'fr':"Equipe Créée"
                            },
                            'COMMONS-TEAMS-CREATE-FLASH-ERROR': {
                                'en':"Error while creating team",
                                'fr':"Erreur durant la création de l'équipe"
                            },
                            // Commons Sessions model
                            'COMMONS-SESSIONS-CLOSE-FLASH-ERROR': {
                                'en':"Closed Session",
                                'fr':"Partie fermée"
                            },
                            // Private Commons
                            'PRIVATE-WS-TITLE':{
                                'en':"{{workspace}} workspace",
                                'fr':"Espace de travail - {{workspace}}"
                            },
                            'PRIVATE-WS-PLAYER-BTN':{
                                'en':"Player",
                                'fr':"Joueur"
                            },
                            'PRIVATE-WS-TRAINER-BTN':{
                                'en':"Trainer",
                                'fr':"Animateur"
                            },
                            'PRIVATE-WS-SCENARIST-BTN':{
                                'en':"Scenarist",
                                'fr':"Scénariste"
                            },
                            'PRIVATE-WS-ADMIN-BTN':{
                                'en':"Administrator",
                                'fr':"Administrateur"
                            },
                            'PRIVATE-WS-PROFILE-BTN':{
                                'en':"Edit profile",
                                'fr':"Editer mon profile"
                            },
                            'PRIVATE-WS-ACCESS-KEY':{
                                'en':"Access key",
                                'fr':"Clé d'accès"
                            },
                            'PRIVATE-WS-LOGOUT-BTN':{
                                'en':"Logout",
                                'fr':"Déconnexion"
                            },
                            // Private Player
                            'PLAYER-INDEX-ADD-TITLE':{
                                'en':"Join a session",
                                'fr':"Rejoindre une partie"
                            },
                            'PLAYER-INDEX-JOIN-BTN':{
                                'en':"Join",
                                'fr':"Rejoindre"
                            },
                            'PLAYER-INDEX-LIST-TITLE':{
                                'en':"My sessions",
                                'fr':"Mes parties"
                            },
                            'PLAYER-INDEX-NO-SESSION':{
                                'en':"No session",
                                'fr':"Pas de partie"
                            },
                            'PLAYER-CARD-TEAM-TITLE':{
                                'en':"Team",
                                'fr':"Equipe"
                            },
                            'PLAYER-CARD-TEAM-BTN':{
                                'en':"View team",
                                'fr':"Voir l'équipe"
                            },
                            'PLAYER-CARD-LEAVE-BTN':{
                                'en':"Leave sesion",
                                'fr':"Quitter la session"
                            },
                            'PLAYER-CARD-LEAVE-CONFIRM':{
                                'en':"Are you sure you want to leave the session ? This action is irreversible.",
                                'fr':"Êtes-vous sûre de vouloir quitter cette partie ? Cette action est irreversible."
                            },
                            'PLAYER-CARD-PLAY-BTN':{
                                'en':"Play session",
                                'fr':"Jouer"
                            },
                            'PLAYER-MODALE-JOIN-TEAM-CREATE-INPUT':{
                                'en':"Team name",
                                'fr':"Nom de l'équipe"
                            },
                            'PLAYER-MODALE-JOIN-TEAM-CREATE-BTN':{
                                'en':"Create team",
                                'fr':"Créer une équipe"
                            },
                            'PLAYER-MODALE-JOIN-TEAM-EXISTING-MESSAGE':{
                                'en':"Existing team",
                                'fr':"L'équipe existe déjà"
                            },
                            'PLAYER-MODALE-JOIN-TEAM-NUMBER-PLAYER':{
                                'en':"player(s)",
                                'fr':"joueur(s)"
                            },
                            'PLAYER-MODALE-JOIN-TEAM-JOIN-BTN':{
                                'en':"Join team",
                                'fr':"Rejoindre la partie"
                            },
                            'PLAYER-MODALE-JOIN-TEAM-PLAYERS-LIST':{
                                'en':"Players from team",
                                'fr':"Joueurs de l'équipe"
                            },
                            'PLAYER-MODALE-JOIN-TEAM-HIDE-TOGGLE':{
                                'en':"{{toggle}} players",
                                'fr':"{{toggle}} les joueurs"
                            },
                            'PLAYER-MODALE-JOIN-TEAM-JOIN-OR-CREATE-MESSAGE':{
                                'en':"Join an existing team or create a new team",
                                'fr':"Vous pouvez rejoindre une équipe existante ou créer une nouvelle équipe"
                            },
                            'PLAYER-MODALE-JOIN-TEAM-JOIN-MESSAGE':{
                                'en':"Join an existing team",
                                'fr':"Vous pouvez rejoindre une équipe existante"
                            },
                            'PLAYER-MODALE-JOIN-TEAM-CREATE-MESSAGE':{
                                'en':"Create your team",
                                'fr':"Créez votre équipe"
                            },
                            'PLAYER-MODALE-TEAM-RELOAD-BTN':{
                                'en':"Reload team",
                                'fr':"Recharger l'équipe"
                            },
                            'PLAYER-JOIN-TEAM-KEY-FLASH-ERROR': {
                                'en':"This is not a valid access key",
                                'fr':"Clé invalide"
                            }
                        },
                        workspaces : {
                            'PLAYER':{
                                'en':"Player",
                                'fr':"Joueur"
                            },
                            'TRAINER':{
                                'en':"Trainer",
                                'fr':"Animateur"
                            },
                            'SCENARIST':{
                                'en':"Scenarist",
                                'fr':"Scénariste"
                            },
                            'ADMIN':{
                                'en':"Administrator",
                                'fr':"Administrateur"
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