/* global TextEncoder, Promise */

angular.module('wegas.service.auth', [
    'wegas.models.sessions'
])
    .service('Auth', function($http, $q, $interval, $translate, Responses, $state) {
        "use strict";
        var service = this,
            authenticatedUser = null,
            rights = null,
            loading = false,
            stopWaiting = function(waitFunction) {
                $interval.cancel(waitFunction);
            },
            wait = function() {
                var deferred = $q.defer(),
                    waitSessions = $interval(function() {
                        if (!loading) {
                            stopWaiting(waitSessions);
                            deferred.resolve(true);
                        }
                    }, 500);
                return deferred.promise;
            },
            getCurrentUser = function() {
                var deferred = $q.defer();
                $http.get(window.ServiceURL + "rest/User/Current?view=Editor").success(function(data) {
                    if (data) {
                        var acct = data.accounts[0],
                            isLocal = (acct["@class"] === "JpaAccount");
                        // build a common name to be displayed
                        var commonName = ((acct.firstname || "") + " " + (acct.lastname || "")).trim();
                        if (commonName) {
                            // first or last name: append username if any
                            if (acct.username) {
                                commonName += " (" + acct.username + ")";
                            }
                        } else {
                            // no first nor last name: use username or email
                            commonName += acct.username || acct.email;
                        }

                        authenticatedUser = {
                            id: data.id,
                            accountId: acct.id,
                            email: acct.email,
                            username: acct.username,
                            firstname: acct.firstname,
                            lastname: acct.lastname,
                            isTrainer: false,
                            isScenarist: false,
                            isAdmin: false,
                            isGuest: !!_.find(data.accounts, {
                                "@class": "GuestJpaAccount"
                            }),
                            agreedTime: acct.agreedTime,
                            hasAgreed: !!acct.agreedTime,
                            isLocalAccount: isLocal,
                            isVerified: acct.verified,
                            homeOrg: acct.homeOrg || "",
                            commonName: commonName
                        };
                        if (authenticatedUser.isGuest) {
                            authenticatedUser.hasAgreed = true; // Don't ask guests to agree to our terms
                        }
                        rights = data.accounts[0].roles;
                        rights.forEach(function(elem) {
                            switch (elem.name) {
                                case "Trainer":
                                    authenticatedUser.isTrainer = true;
                                    break;
                                case "Scenarist":
                                    authenticatedUser.isScenarist = true;
                                    break;
                                case "Administrator":
                                    authenticatedUser.isAdmin = true;
                                    break;
                            }
                        });
                    } else {
                        authenticatedUser = null;
                    }
                    deferred.resolve(authenticatedUser);
                }).error(function(data) {
                    authenticatedUser = null;
                    deferred.resolve(authenticatedUser);
                });
                return deferred.promise;
            };
        /**
         *
         * @param {type} string
         * @returns {Array}
         */
        var utf16toCodePoints = function(string) {
            var s = String(string);
            var len = s.length;

            var cps = [];

            for (var i = 0; i < len; i++) {
                var c = s.charCodeAt(i);
                if (c < 0xD800 || c >= 0xE000) {
                    // those code point are stored as-is
                    cps.push(c);
                } else if (c < 0xDC00) {
                    // those codepoints are encoded on two chars (surrogate pair)
                    if (i < len) {
                        i++;
                        var c2 = s.charCodeAt(i);
                        cps.push(0x10000 | ((c & 0x3FF) << 10) | (c2 & 0x3FF))
                    } else {
                        // whoops there is no two chars left
                        cps.push(0xFFFD);
                    }
                } else if (c < 0xE000) {
                    // invalid as such a char should have been handled by the previous case.
                    cps.push(0xFFFD);
                }
            }
            return cps;
        };

        var strToUtf8Array = function(str) {
            var cp = utf16toCodePoints(str);
            var array = [];
            for (var i = 0; i < cp.length; i++) {
                var char = cp[i];
                // how many byte ?
                if (char < 0x7F) {
                    // 7bits on one byte
                    // 0xxxxxxx
                    array.push(char);
                } else if (char <= 0x7FF) {
                    // 11bits on two bytes
                    // 110x xxxx 10xx xxxx
                    array.push(0xC0 | (char >> 6));
                    array.push(0x80 | (char & 0x3F));
                } else if (char <= 0xFFFF) {
                    // 16bits on three bytes
                    // 1110xxxx 10xxxxxx 10xxxxxx
                    array.push(0xE0 | (char >> 12));
                    array.push(0x80 | (char >> 6 & 0x3F));
                    array.push(0x80 | (char & 0x3F));
                } else {
                    // 24bits on four bytes
                    // 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx
                    array.push(0xF0 | (char >> 18));
                    array.push(0x80 | (char >> 12 & 0x3F));
                    array.push(0x80 | (char >> 6 & 0x3F));
                    array.push(0x80 | (char & 0x3F));
                }
            }

            return new Uint8Array(array);
        };

        /**
         * digest the value with the given algorithm
         * @param {type} algorithm one of PLAIN (return the value as-is), SHA-256, SHA-384, SHA-512
         * @param {type} data the value to hash
         * @returns {Promise
         */
        service.digest = function(algorithm, data) {
            var deferred = $q.defer();

            // Check that the browser provides the necessary cryptographic functions.
            // This is also used to prevent using internet explorer
            if (typeof crypto === 'undefined') {
                $translate('DEPRECATED-BROWSER').then(function(message) {
                    deferred.reject(Responses.danger(message, false));
                });
            } else {
                // encode as (utf-8) Uint8Array
                if (!algorithm) {
                    deferred.resolve(null);
                } else if (algorithm === 'PLAIN') {
                    deferred.resolve(data);
                } else {
                    var msgUint8 =
                        (typeof (TextEncoder) !== 'undefined' ? // eg edge <= 44
                            new TextEncoder().encode(data)
                            : strToUtf8Array(data));
                    crypto.subtle.digest(algorithm.replace(/_/g, "-"), msgUint8)
                        .then(function(hashBuffer) {
                            var hashArray = Array.from(new Uint8Array(hashBuffer));
                            deferred.resolve(hashArray.map(function(b) {
                                return b.toString(16).padStart(2, '0');
                            }).join('')); // convert bytes to hex string
                        });
                }
            }
            return deferred.promise;
        };

        /**
         *
         * @param {Array} data  array of {data, method}
         * @returns {Promise[]}
         */
        var digestAll = function(data) {
            return data.map(function(item) {
                return service.digest(item.method, item.data);
            });
        }

        service.getLocalAuthenticatedUser = function() {
            return authenticatedUser;
        };

        service.getAuthenticatedUser = function() {
            var deferred = $q.defer();
            if (authenticatedUser !== null) {
                deferred.resolve(authenticatedUser);
            } else {
                if (loading) {
                    wait().then(function() {
                        deferred.resolve(authenticatedUser);
                    });
                } else {
                    loading = true;
                    getCurrentUser().then(function() {
                        deferred.resolve(authenticatedUser);
                        loading = false;
                    });
                }
            }
            return deferred.promise;
        };

        service.login = function(login, password, agreed) {
            var deferred = $q.defer(),
                url = "rest/User/Authenticate";
            // how to salt and hash ? ask the server
            $http.get(window.ServiceURL + "rest/User/AuthMethod/" + login).success(function(data) {
                var jpaAuths = data.filter(function(method) {
                    return method["@class"] === "JpaAuthentication"
                });
                if (jpaAuths.length) {
                    var ja = jpaAuths[0];

                    var salt = ja.salt || "";
                    var nextSalt = ja.newSalt || salt;

                    $q.all(digestAll([
                        {
                            // always use the current salt for the mandatory method
                            data: salt + password,
                            method: ja.mandatoryMethod
                        }, {
                            // use the next salt for the optional one (or current if no next is defined)
                            data: nextSalt + password,
                            method: ja.optionalMethod
                        }
                    ])).then(
                        function(digestedPasswords) {
                            $http.post(window.ServiceURL + url, {
                                "@class": "AuthenticationInformation",
                                "login": login,
                                "hashes": digestedPasswords,
                                "remember": true,
                                "agreed": agreed === true
                            }, {
                                "headers": {
                                    "managed-mode": "true"
                                }
                            }).success(function(data) {
                                if (data.events !== undefined && !data.events.length) {
                                    if (data.updatedEntities !== undefined &&
                                        data.updatedEntities[0].accounts !== undefined &&
                                        data.updatedEntities[0].accounts[0].agreedTime === null) {
                                        console.log("WEGAS LOBBY : User has not agreed to the terms of use");
                                        $translate('CREATE-ACCOUNT-FLASH-MUST-AGREE').then(function(message) {
                                            deferred.resolve(Responses.info(message, false, {agreed: false}));
                                        });
                                        service.logout();
                                    } else {
                                        authenticatedUser = null;
                                        $translate('COMMONS-AUTH-LOGIN-FLASH-SUCCESS').then(function(message) {
                                            deferred.resolve(Responses.success(message, true));
                                        });
                                        service.getAuthenticatedUser();
                                    }
                                } else if (data.events !== undefined) {
                                    console.log("WEGAS LOBBY : Error during login");
                                    console.log(data.events);
                                    $translate('COMMONS-AUTH-LOGIN-FLASH-ERROR-CLIENT').then(function(message) {
                                        deferred.resolve(Responses.danger(message, false));
                                    });
                                } else {
                                    $translate('COMMONS-AUTH-LOGIN-FLASH-ERROR-SERVER').then(function(message) {
                                        deferred.resolve(Responses.danger(message, false));
                                    });
                                }
                            }).error(function(data) {
                                if (data.events !== undefined && data.events.length > 0) {
                                    console.log("WEGAS LOBBY : Error during login");
                                    console.log(data.events);
                                    $translate('COMMONS-AUTH-LOGIN-FLASH-ERROR-CLIENT').then(function(message) {
                                        deferred.resolve(Responses.danger(message, false));
                                    });
                                } else {
                                    $translate('COMMONS-AUTH-LOGIN-FLASH-ERROR-SERVER').then(function(message) {
                                        deferred.resolve(Responses.danger(message, false));
                                    });
                                }
                            });
                        },
                        function(payload) {
                            deferred.resolve(payload);
                        });
                } else {
                    $translate('COMMONS-AUTH-LOGIN-FLASH-ERROR-CLIENT').then(function(message) {
                        deferred.resolve(Responses.danger(message, false));
                    });
                }
            }).error(function(data) {
                // no auth method
                $translate('COMMONS-AUTH-LOGIN-FLASH-ERROR-SERVER').then(function(message) {
                    deferred.resolve(Responses.danger(message, false));
                });
            });

            return deferred.promise;
        };

        /**
         * Returns AAI config for the login page.
         * @param {type} string
         * @returns {Array}
         */
        service.getAaiConfig = function() {
            var deferred = $q.defer();
            var url = "rest/Extended/User/Account/AaiConfig";
            $http.get(ServiceURL + url, null, {
                "headers": {
                    "managed-mode": "true"
                }
            }).success(function(data) {
                if (data !== undefined) {
                    return deferred.resolve(data);
                } else if (data.events !== undefined) {
                    console.log("WEGAS LOBBY : Could not obtain AAI config data");
                    console.log(data.events);
                }
                deferred.resolve();
                return;
            }).error(function(data) {
                if (data.events !== undefined) {
                    console.log("WEGAS LOBBY : Could not obtain AAI config data");
                    console.log(data.events);
                }
                deferred.resolve();
                return;
            });
            return deferred.promise;
        };


        /**
         * Fetch the full token from the token hash and accountId.
         * token + accountId have been sent by e-mail to the user.
         * 
         * @param {type} accountId id of account the token is for or 0 if there is no such account
         * @param {type} token token hash
         * @returns {promise} the full token
         */
        service.getToken = function(accountId, token) {
            var deferred = $q.defer(),
                url = "rest/Editor/User/Account/Token";
            $http.post(window.ServiceURL + url, {
                "@class": "TokenInfo",
                accountId: accountId,
                token: token
            }).success(function(data) {
                service.getAuthenticatedUser();
                deferred.resolve(data);
            }).error(function(data) {
                deferred.reject(data && data.message);
            });
            return deferred.promise;
        };

        /**
         * Uset the token to authenticate. It is only allowed for token which provide autologin and 
         * are linked to an account.
         *
         * @param {type} accountId accountId send by e-mail
         * @param {type} token token sent by e-mail
         *
         * @returns {promise} nothing if successful, error message otherwise
         */
        service.loginWithToken = function(accountId, token) {
            var deferred = $q.defer(),
                url = "rest/User/AuthenticateWithToken";
            $http.post(window.ServiceURL + url, {
                "@class": "TokenInfo",
                accountId: accountId,
                token: token
            }).success(function() {
                service.getAuthenticatedUser();
                deferred.resolve();
            }).error(function(data) {
                deferred.reject(data && data.message);
            });
            return deferred.promise;
        };

        /**
         * Process the token.
         *
         * @param {type} token full token as return by getToken
         * @returns {promise} maybe updated new token
         */
        service.processToken = function(token) {
            var deferred = $q.defer(),
                url = "rest/User/Account/ProcessToken/" + token.id;
            $http.put(window.ServiceURL + url)
                .success(function(token) {
                    deferred.resolve(token);
                })
                .error(function(data) {
                    deferred.reject(data && data.message);
                });

            return deferred.promise;
        };

        service.logout = function() {
            var deferred = $q.defer(),
                url = "rest/User/Logout";
            $http.get(window.ServiceURL + url).success(function(data) {
                authenticatedUser = null;
                $translate('COMMONS-AUTH-LOGOUT-FLASH-SUCCESS').then(function(message) {
                    deferred.resolve(Responses.success(message, true));
                });
            }).error(function(data) {
                $translate('COMMONS-AUTH-LOGOUT-FLASH-ERROR').then(function(message) {
                    deferred.resolve(Responses.danger(message, false));
                });
            });
            return deferred.promise;
        };

        service.signup = function(email, username, password, firstname, lastname, agreed) {
            var deferred = $q.defer(),
                url = "rest/User/Signup";

            $http.get(window.ServiceURL + "rest/User/DefaultAuthMethod")
                .success(function(authMethod) {
                    var hashMethod = authMethod.mandatoryMethod;
                    var salt = authMethod.salt || "";

                    service.digest(hashMethod, salt + password).then(function(digestedPassword) {
                        $http.post(window.ServiceURL + url, {
                            "@class": "JpaAccount",
                            "email": email,
                            "username": username,
                            "salt": salt,
                            "password": digestedPassword,
                            "firstname": firstname,
                            "lastname": lastname,
                            "agreedTime": agreed ? Date.now() : null
                        }).success(function(data) {
                            $translate('COMMONS-AUTH-CREATE-ACCOUNT-FLASH-SUCCESS').then(function(message) {
                                deferred.resolve(Responses.success(message, true));
                            });
                        }).error(function(WegasError) {
                            deferred.resolve(Responses.danger($translate.instant(WegasError.messageId), false, WegasError));
                        });
                    });
                }).error(function(WegasError) {
                deferred.resolve(Responses.danger($translate.instant(WegasError.messageId), false, WegasError));
            });


            return deferred.promise;
        };

        service.remindPassword = function(email) {
            var deferred = $q.defer(),
                url = "rest/User/SendNewPassword";
            $http.post(window.ServiceURL + url, {
                "@class": "AuthenticationInformation",
                "login": email
            }, {
                "headers": {
                    "managed-mode": "true"
                }
            })
                .success(function(data) {
                    $translate('COMMONS-AUTH-PASSWORD-FLASH-SUCCESS').then(function(message) {
                        deferred.resolve(Responses.success(message, true));
                    });
                })
                .error(function(data) {
                    $translate('COMMONS-AUTH-PASSWORD-FLASH-ERROR').then(function(message) {
                        deferred.resolve(Responses.danger(message, false));
                    });
                });
            return deferred.promise;
        };

        service.requestEmailValidation = function() {
            var deferred = $q.defer(),
                url = "rest/User/RequestEmailValidation";
            $http.get(window.ServiceURL + url, {
                "headers": {
                    "managed-mode": "true"
                }
            }).success(function() {
                $translate('COMMONS-AUTH-EMAIL-VERIFY-FLASH-SUCCESS').then(function(message) {
                    deferred.resolve(Responses.success(message, true));
                });
            }).error(function() {
                $translate('COMMONS-AUTH-EMAIL-VERIFY-FLASH-ERROR').then(function(message) {
                    deferred.reject(Responses.danger(message, false));
                });
            });
            return deferred.promise;
        };

        service.loginAsGuest = function() {
            var deferred = $q.defer(),
                url = "rest/User/GuestLogin/";

            service.getAuthenticatedUser().then(function(noUser) {
                if (noUser === null) {
                    $http.post(window.ServiceURL + url, {
                        "@class": "AuthenticationInformation",
//                        "login": "",
//                        "password": "",
                        "remember": true
                    }, {
                        "headers": {
                            "managed-mode": "true"
                        }
                    })
                        .success(function(data) {
                            service.getAuthenticatedUser().then(function(guest) {
                                $translate('COMMONS-AUTH-GUEST-FLASH-SUCCESS').then(function(message) {
                                    deferred.resolve(Responses.success(message, guest));
                                });
                            });
                        })
                        .error(function(data) {
                            $translate('COMMONS-AUTH-GUEST-FLASH-ERROR').then(function(message) {
                                deferred.resolve(Responses.danger(message, false));
                            });
                        });
                } else {
                    $translate('COMMONS-AUTH-GUEST-FLASH-ERROR').then(function(message) {
                        deferred.resolve(Responses.danger(message, false));
                    });
                }
            });
            return deferred.promise;
        };
    });
