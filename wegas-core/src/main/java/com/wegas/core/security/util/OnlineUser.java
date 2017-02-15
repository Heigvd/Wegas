/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.util;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wegas.core.security.guest.GuestJpaAccount;
import com.wegas.core.security.persistence.Role;
import com.wegas.core.security.persistence.User;
import java.util.Collection;
import java.util.Date;
import java.util.Iterator;

/**
 *
 * @author Maxence Laurent (maxence laurent gmail.com)
 */
public class OnlineUser {

    @JsonIgnore
    private final User user;

    private final String fullname;
    private final String email;
    private final String username;
    private final Date connectionDate;
    private final Long userId;
    private final Long mainAccountId;

    public OnlineUser(User user) {
        this.user = user;
        this.fullname = user.getName();
        this.username = user.getMainAccount().getUsername();
        this.email = user.getMainAccount().getEmail();
        this.connectionDate = new Date();
        this.userId = user.getId();
        this.mainAccountId = user.getMainAccount().getId();
    }

    public String getFullname() {
        return fullname;
    }

    public String getEmail() {
        return email;
    }

    public String getUsername() {
        return username;
    }

    public Date getConnectionDate() {
        return connectionDate;
    }

    public Long getUserId() {
        return userId;
    }

    public Long getMainAccountId() {
        return mainAccountId;
    }

    /**
     * @param user
     * @param compareRoles
     * @return true if user is member of at least on of the listed roles
     */
    private static boolean hasAnyRoles(User user, String... compareRoles) {
        Collection<Role> roles = user.getRoles();
        Iterator<Role> rIt = roles.iterator();
        while (rIt.hasNext()) {
            Role role = rIt.next();
            for (String r : compareRoles) {
                if (role.getName().toUpperCase().equals(r.toUpperCase())) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * 0 means Admin, 1 Scenarist or Trainer, 2 Player and 3, Guest;
     *
     * @return
     */
    public int getHighestRole() {
        if (OnlineUser.hasAnyRoles(user, "Administrator")) {
            return 0;
        } else if (OnlineUser.hasAnyRoles(user, "Scenarist", "Trainer")) {
            return 1;
        } else {
            // Registeered Player or guest ?
            if (user.getMainAccount() instanceof GuestJpaAccount) {
                return 3;
            } else {
                return 2;
            }
        }
    }
}
