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
                            // Communs
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
                                'en':"Error during account creation",
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
                                'en':"Error when logout",
                                'fr':"Erreur durant la déconnexion"
                            },
                            'COMMONS-AUTH-GUEST-FLASH-SUCCESS':{
                                'en':"Connected as guest",
                                'fr':"Connecté en tant qu'invité"
                            },
                            'COMMONS-AUTH-GUEST-FLASH-ERROR':{
                                'en':"Error during connection",
                                'fr':"Erreur durant la connexion"
                            },
                            // Private
                            'PRIVATE-WS-TITLE':{
                                'en':"{{workspace}} workspace",
                                'fr':"Espace de travail - {{workspace}}"
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
                        }
                        
                    };
                }
            };
        })
;