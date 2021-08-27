angular.module('private.admin.users', [
    'wegas.behaviours.repeat.autoload',
    'private.admin.users.edit'
])
    .config(function($stateProvider) {
        "use strict";
        $stateProvider
            .state('wegas.private.admin.users', {
                url: '/users',
                views: {
                    'admin-container': {
                        controller: 'AdminUsersCtrl as adminUsersCtrl',
                        templateUrl: 'app/private/admin/users/users.tmpl.html'
                    }
                }
            });
    })
    .controller('AdminUsersCtrl', function AdminUsersCtrl($state, $rootScope, $scope, Auth, UsersModel, GroupsModel, $http, $timeout, $filter, Flash, $translate, $q, $window) {
        "use strict";
        var ctrl = this,
            rawGroups = [],
            allUsers = [],
            filtered = [],
            isFiltering = false,
            prevFilter = "",
            prevSource = null,
            winheight = null,
            maxItemsDisplayed = null;

        var MENU_HEIGHT = 50,
            ADMIN_MENU_HEIGHT = 94,
            SEARCH_FIELD_HEIGHT = 72,
            CARD_HEIGHT = 80, // including margins
            ITEMS_PER_PAGE,
            ITEMS_IN_FIRST_BATCH,
            ITEMS_IN_NEXT_BATCHES;

        ctrl.handlers = {};

        ctrl.groups = [];           // Display buffer
        ctrl.groupTransient = [];   // Filtering-related group information. Indexed by group id.
        ctrl.search = "";
        ctrl.loading = false;

        // Adjusts layout constants to the current window size.
        function checkWindowSize() {
            if (winheight !== $window.innerHeight) {
                // Make a quick but safe computation that does not require the page to be rendered beforehand.
                winheight = $window.innerHeight;
                ITEMS_PER_PAGE = Math.ceil((winheight - SEARCH_FIELD_HEIGHT - MENU_HEIGHT - ADMIN_MENU_HEIGHT) / CARD_HEIGHT);
                ITEMS_IN_FIRST_BATCH = nbFixedItems(rawGroups) + ITEMS_PER_PAGE;
                ITEMS_IN_NEXT_BATCHES = ITEMS_PER_PAGE * 2;
            }
        }

        // Returns the number of items/cards in the fixed size part (groups + users with roles, i.e. excluding the users of the "Players" group).
        function nbFixedItems(list) {
            var count = list.length;
            for (var i = 0; i < list.length -1; i++) { // Exclude users of the "Players" group
                count += list[i].users.length;
            }
            return count;
        }

        // Returns the number of groups + users of the given list.
        function nbItems(list){
            var count = list.length;
            for (var i = 0; i < list.length; i++) {
                count += list[i].users.length;
            }
            return count;
        }

        function initMaxItemsDisplayed() {
            checkWindowSize();
            var len = nbItems(currentList());
            if (len === 0 || len > ITEMS_IN_FIRST_BATCH) {
                maxItemsDisplayed = ITEMS_IN_FIRST_BATCH;
                } else {
                // The number of users (and groups) is low enough to display them entirely:
                maxItemsDisplayed = len;
            }
        }

        // Updates the display buffer (ctrl.groups) if needed.
        function updateDisplay(source) {
            if (source.length !== 0 && maxItemsDisplayed != null &&
                (prevSource !== source || maxItemsDisplayed !== nbItems(ctrl.groups))) {
                var nbGroups = source.length,
                    playerGroup = nbGroups - 1;
                // First we copy all groups except Players:
                ctrl.groups = source.slice(0, playerGroup);
                var remaining = maxItemsDisplayed - nbFixedItems(source);
                if (remaining < 0){
                    remaining = source[playerGroup].users.length;
                }
                // Copy a number of users in the Players group:
                var srcPlayers = source[playerGroup],
                    newPlayers = {
                        id: srcPlayers.id,
                        name: srcPlayers.name,
                        users: srcPlayers.users.slice(0, remaining)
                    };
                ctrl.groups.push(newPlayers);
                prevSource = source;
            }
        }

        // Adds some sessions to the bottom of the display.
        function extendDisplayedItems() {
            var list = currentList();
            if (maxItemsDisplayed === null) {
                initMaxItemsDisplayed();
            } else {
                maxItemsDisplayed = Math.min(maxItemsDisplayed + ITEMS_IN_NEXT_BATCHES, nbItems(list));
                }
            // if (console.log) console.log("maxItemsDisplayed: " + maxItemsDisplayed + " / " + nbItems(list));
            updateDisplay(list);
            }

        ctrl.updateGroups = function(extendDisplay){
            var hideScrollbarDuringInitialRender = (rawGroups.length === 0);
            if (hideScrollbarDuringInitialRender) {
                $('#admin-index-list').css('overflow-y', 'hidden');
            }
            ctrl.loading = true;
            GroupsModel.getGroups().then(function(response){
                if (response.isErroneous()) {
                    response.flash();
                    return;
                }
                rawGroups = $filter('orderBy')(response.data, 'id') || [];
                var promises = [],
                    maxId = 0;
                for (var g = 0; g < rawGroups.length; g++) {
                    var group = rawGroups[g];
                    promises.push(updateGroupMembers(group));
                    if (maxId < group.id) {
                        maxId = group.id;
                    }
                }
            UsersModel.getUsers().then(function(response) {
                if (response.isErroneous()) {
                    response.flash();
                } else {
                        allUsers = $filter('orderBy')(response.data, 'name') || [];
                        // Manually create the "Player" (all users) pseudo-group at last position:
                        rawGroups.push({
                            id: maxId+1, // Give this pseudo-group an unused id.
                            name: "Player",
                            numberOfMember: allUsers.length,
                            users: allUsers
                        });
                        ctrl.groupTransient[maxId+1] = {
                            realSize: allUsers.length,
                            isExpanded: false
                        }
                    }
                    $q.all(promises).then(function() {
                        // ===================
                        // At this point, the search variable is not necessarily updated by Angular to reflect the input field:
                        var searchField = document.getElementById('searchField');
                        if (searchField) {
                            ctrl.search = searchField.getElementsByClassName('tool__input')[0].value;
                    }
                        ctrl.filterUsers(ctrl.search);
                        if (extendDisplay) {
                            extendDisplayedItems();
                }
                if (hideScrollbarDuringInitialRender) {
                    $timeout(function() {
                        $('#admin-index-list').css('overflow-y', 'auto');
                            }, 5000);
                        }
                        // Keep the "loading" indicator on screen as long as possible:
                        ctrl.loading = false;
                    });
                });
            });
        };

        function updateGroupMembers(group){
            return GroupsModel.getMembers(group.id).then(function(data) {
                group.users = $filter('orderBy')(data, 'name') || [];
                ctrl.groupTransient[group.id] = {
                    realSize: group.users.length,
                    isExpanded: false
                }
            });
        }

        // Returns the session list to be displayed now.
        function currentList() {
            return isFiltering ? filtered : rawGroups;
        }

        // Returns an array containing the occurrences of 'needle' in rawGroups:
        function doSearch(needle){
            var glen = rawGroups.length,
                gres = [];
            for (var i = 0; i < glen; i++) {
                var group = rawGroups[i],
                    ures = [];
                if (group.users && group.users.length !== 0) {
                    var ulen = group.users.length;
                    for (var j = 0; j < ulen; j++) {
                        var user = group.users[j],
                            acct = user.account;

                        if ((user.name && user.name.toLowerCase().indexOf(needle) >= 0) ||
                            (acct.email && acct.email.toLowerCase().indexOf(needle) >= 0) ||
                            (acct.username && acct.username.toLowerCase().indexOf(needle) >= 0) ||
                            // If searching for a number, the id has to start with the given pattern:
                            user.id.toString().indexOf(needle) === 0 ||
                            acct.id.toString().indexOf(needle) === 0) {
                            ures.push(user);
                        }
                    }
                }
                gres[i] = {
                    id: group.id,
                    name: group.name,
                    users: ures,
                };
                ctrl.groupTransient[group.id] = {
                    // Expand automatically only if resulting items <= 3:
                    isExpanded: ures.length <= 3,
                    realSize: ures.length + " / " + group.users.length
                };
            }
            return gres;
        }

        /*
         ** Filters rawGroups according to the given search string and puts the result in ctrl.groups and ctrl.groupTransient.
         ** Hypotheses on input array rawGroups:
         ** 1. It's already ordered according to the 'name' attribute,
         **    so that the output automatically follows the same ordering.
         */
        ctrl.filterUsers = function(search){
            if (!search || search.length === 0){
                if (isFiltering){
                    isFiltering = false;
                    for (var i = 0; i < rawGroups.length; i++){
                        var id = rawGroups[i].id;
                        ctrl.groupTransient[id].isExpanded = false;
                        ctrl.groupTransient[id].realSize = rawGroups[i].users.length;
                    }
                    initMaxItemsDisplayed(); // Reset since we are changing between searching and not searching
                }
                updateDisplay(rawGroups);
                return;
            } else { // There is a search going on:
                var needle = search.toLowerCase();
                if (!isFiltering || prevFilter !== needle) {
                    isFiltering = true;
                    prevFilter = needle;
                    initMaxItemsDisplayed(); // Reset since we are changing between searching and not searching or between different searches
                } else {
                    isFiltering = true;
                }
                filtered = doSearch(needle);
                updateDisplay(filtered);
                if (ctrl.search != search) {
                    ctrl.search = search;
                }
                }
        };

        ctrl.toggleExpansion = function(group) {
            if (group.users && group.users.length > 0) {
                // First impact the display buffer (ctrl.groups):
                ctrl.groupTransient[group.id].isExpanded = !ctrl.groupTransient[group.id].isExpanded;
                // Then the real list:
                //var realGroup = currentList()[findGroup(group.id)];
                //realGroup.isExpanded = group.isExpanded;
            } else {
                $translate('ADMIN-GROUPS-NO-MEMBERS-ERROR').then(function (message) {
                    Flash.danger(message);
            });

            }
        };

        ctrl.deleteUser = function(id) {
            UsersModel.getUser(id).then(function(response) {
                if (!response.isErroneous()) {
                    var user = response.data;
                    UsersModel.deleteUser(user).then(function(response) {
                        response.flash();
                        ctrl.updateGroups(true);
                    });
                }
            });
        };

        ctrl.beByAccountId = function(accountId, name) {
            if (!window.confirm("Reload to pretend to be \"" + name + "\"?")) {
                return;
            }
            $http.post("rest/User/Be/" + accountId).success(function(result) {
                window.location.reload();
            });
        };
        ctrl.be = function(user) {
            var accID = user.accounts[0].id;
            if (!window.confirm("Reload to pretend to be \"" + user.name + "\"?")) {
                return;
            }
            $http.post("rest/User/Be/" + accID).success(function(result) {
                window.location.reload();
            });
        };

        ctrl.displayGroupEmails = function(group) {
            var g = findGroup(group.id);
            if (g < 0) {
                alert("Internal error: could not find group with Id " + groupId);
                return;
            }
            // Choose the filtered list when appropriate:
            var users = currentList()[g].users,
                emailsArray = [],
                invalid = 0;
            for (var u = 0; u < users.length; u++) {
                var email = users[u].account.email;
                if (email && email.length > 0 && email.indexOf('@') > -1) {
                    emailsArray.push(email);
                } else {
                    invalid++;
                }
            }
            displayEmails(group.name, emailsArray, invalid);
        };

        // @param emailsArray: emails as an array of strings.
        function displayEmails(groupName, emailsArray, nbInvalid){
            var newTab = window.open("", "_blank");

            var nbValidEmails = 0,
                mailtoHref = "mailto:",
                mailtoText = "";

            emailsArray.forEach(function (email) {
                if (++nbValidEmails === 1) {
                    mailtoHref += email;
                    mailtoText += email;
                } else {
                    mailtoHref += ',' + email;
                    mailtoText += ', ' + email;
                }
            });

            newTab.document.write('<html><head><title>Group ' + groupName + '</title></head><body style="font-size:13px;">');
            newTab.document.write('<div style="font-size:120%; font-weight: bold; margin-bottom: 1em;">' + nbValidEmails + ' emails of group "' + groupName + '" </div>');
            if (ctrl.search != '') {
                newTab.document.write('<div style="margin-bottom: 1em;">Subset corresponding to search string "' + ctrl.search + '"</div>');
            }
            if (nbInvalid > 0) {
                newTab.document.write('<div style="font-weight: bold; color: red; margin-bottom: 1em;">NB: ' + nbInvalid + ' empty or invalid email(s) not displayed here.</div>');
            }
            if (nbValidEmails > 0) {
                if (nbValidEmails > 1) {
                    newTab.document.write('<b>Standard syntax:</b><br/>');
                }
                newTab.document.write('<a href="' + mailtoHref + '?subject=Wegas"><pre>' + mailtoText + "</pre></a>");
                if (nbValidEmails > 1) {
                    newTab.document.write('<br/>&nbsp;<br/>');
                    mailtoHref = mailtoHref.replace(/,/g, ";");
                    mailtoText = mailtoText.replace(/,/g, ";");
                    newTab.document.write('<b>Microsoft Outlook syntax:</b><br/>');
                    newTab.document.write('<a href="' + mailtoHref + '?subject=Wegas"><pre>' + mailtoText + "</pre></a>");
                }
            } else {
                newTab.document.write('No user in this group<br/>&nbsp;');
            }
            newTab.document.close();
        };

        // Returns the index of group with given Id. Returns -1 if not found.
        function findGroup(groupId) {
            for (var g = 0; g < ctrl.groups.length; g++) {
                if (ctrl.groups[g].id === groupId)
                    return g;
            }
            return -1;
        }

        // Listen for updates to individual users or to the list of users:
        ctrl.handlers.changeUsers = $rootScope.$on('changeUsers', function(e) {
            if (e.currentScope.currentRole === "ADMIN") {
                ctrl.updateGroups(true);
            }
        });

        // Listen for scroll down events and extend the set of visible items without rebuilding the whole list:
        ctrl.handlers.changeLimit = $rootScope.$on('changeLimit', function(e, hasNewData) {
            if (e.currentScope.currentRole === "ADMIN") {
                var list = ctrl.groups;
                if (list && list.length > 0 && // It seems that ctrl.groups is not always accessible from here.
                    ctrl.groupTransient[list[list.length-1].id].isExpanded) { // No need to extend if the "Players" group is not expanded.
                    extendDisplayedItems();
                    if ( ! $rootScope.$$phase) {
                        $scope.$apply();
                    }
                }
            }
        });

        $scope.$on("$destroy", function() {
            for (var key in ctrl.handlers) {
                ctrl.handlers[key]();
            }
        });

        // This is jQuery code for detecting window resizing:
        $(window).on("resize.doResize", _.debounce(function (){
            $scope.$apply(function(){
                initMaxItemsDisplayed();
                updateDisplay(currentList());
            });
        },100));

        // Do first data download:
        ctrl.updateGroups(true);
    })
    ;
