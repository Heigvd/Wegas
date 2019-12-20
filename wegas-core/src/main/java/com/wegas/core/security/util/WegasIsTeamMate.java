/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.util;

import java.util.Objects;

/**
 * Is the current user a teammate of a given user ?
 * @author maxence
 */
public class WegasIsTeamMate extends WegasPermission {

    private final Long userId;

    public WegasIsTeamMate(Long userId) {
        this.userId = userId;
    }

    @Override
    public String toString() {
        return "TeamMateOfUser-" + getUserId();
    }

    public Long getUserId() {
        return userId;
    }

    @Override
    public int hashCode() {
        int hash = 7;
        hash = 53 * hash + Objects.hashCode(this.userId);
        return hash;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }
        if (obj == null) {
            return false;
        }
        if (getClass() != obj.getClass()) {
            return false;
        }
        final WegasIsTeamMate other = (WegasIsTeamMate) obj;
        if (!Objects.equals(this.userId, other.getUserId())) {
            return false;
        }
        return true;
    }
}
