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
                            homeOrg: acct.homeOrg || ""
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
         * @returns {Promise} 
         */
        var digest = function(algorithm, data) {
            // encode as (utf-8) Uint8Array
            if (!algorithm) {
                return new Promise(function(resolve) {
                    resolve(null);
                });
            } else if (algorithm === 'PLAIN') {
                return new Promise(function(resolve) {
                    resolve(data);
                });
            } else {
                var msgUint8 =
                    (typeof (TextEncoder) !== 'undefined' ?
                        new TextEncoder().encode(data)
                        : strToUtf8Array(data));
                return crypto.subtle.digest(algorithm.replace(/_/g, "-"), msgUint8)
                    .then(function(hashBuffer) {
                        var hashArray = Array.from(new Uint8Array(hashBuffer));
                        return hashArray.map(function(b) {
                            return b.toString(16).padStart(2, '0');
                        }).join(''); // convert bytes to hex string
                    });
            }
        };

        var digestAll = function(data, methods) {
            return methods.map(function(method) {
                return digest(method, data);
            })
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
            $http.get(window.ServiceURL + "rest/User/AuthMethod/" + login).success(function(data) {
                var jpaAuths = data.filter(function(method) {
                    return method["@class"] === "JpaAuthentication"
                });
                if (jpaAuths.length) {
                    Promise.all(digestAll(password, [
                        jpaAuths[0].mandatoryMethod,
                        jpaAuths[0].optionalMethod
                    ])).then(
                        function(digestedPasswords) {
                            var extraHashes = {
                            };
                            extraHashes[jpaAuths[0].mandatoryMethod] = digestedPasswords[0];
                            if (jpaAuths[0].optionalMethod) {
                                extraHashes[jpaAuths[0].optionalMethod] = digestedPasswords[1];
                            }
                            $http.post(window.ServiceURL + url, {
                                "@class": "AuthenticationInformation",
                                "login": login,
                                "hashMethod": jpaAuths[0].mandatoryMethod,
                                "hashes": extraHashes,
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

        service.loginWithToken = function(email, token) {
            var deferred = $q.defer(),
                url = "rest/User/AuthenticateWithToken";
            $http.post(window.ServiceURL + url, {
                "@class": "AuthenticationInformation",
                "login": email,
                "hashMethod": "PLAIN",
                "hashes": {
                    "PLAIN": token
                },
                "remember": false,
                "agreed": false
            }).success(function() {
                service.getAuthenticatedUser();
                deferred.resolve();
            }).error(function(data) {
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

                    digest(hashMethod, password).then(function(digestedPassword) {
                        $http.post(window.ServiceURL + url, {
                            "@class": "JpaAccount",
                            "email": email,
                            "username": username,
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
                        "login": "",
                        "password": "",
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
