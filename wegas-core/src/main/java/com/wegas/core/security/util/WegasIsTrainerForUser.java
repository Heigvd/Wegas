/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.util;

import java.util.Objects;

/**
 * Is the current user a trainer of a given user ?
 * @author maxence
 */
public class WegasIsTrainerForUser extends WegasPermission {

    private final Long userId;

    public WegasIsTrainerForUser(Long userId) {
        this.userId = userId;
    }

    @Override
    public String toString() {
        return "TrainerForUser-" + getUserId();
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
        final WegasIsTrainerForUser other = (WegasIsTrainerForUser) obj;
        if (!Objects.equals(this.userId, other.getUserId())) {
            return false;
        }
        return true;
    }
}
