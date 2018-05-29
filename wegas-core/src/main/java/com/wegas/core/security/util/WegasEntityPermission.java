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
 *
 * @author maxence
 */
public class WegasEntityPermission extends WegasPermission {

    private final Long id;
    private final Level level;
    private final EntityType type;

    public WegasEntityPermission(Long id, Level level, EntityType type) {
        this.id = id;
        this.level = level;
        this.type = type;
    }

    public Long getId() {
        return id;
    }

    public EntityType getType() {
        return type;
    }

    public Level getLevel() {
        return level;
    }

    @Override
    public String toString() {
        return getType() + "-" + getLevel() + "-" + getId();
    }

    @Override
    public int hashCode() {
        int hash = 7;
        hash = 29 * hash + Objects.hashCode(this.id);
        hash = 29 * hash + Objects.hashCode(this.level);
        hash = 29 * hash + Objects.hashCode(this.type);
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
        final WegasEntityPermission other = (WegasEntityPermission) obj;
        if (!Objects.equals(this.id, other.id)) {
            return false;
        }
        if (this.level != other.level) {
            return false;
        }
        if (this.type != other.type) {
            return false;
        }
        return true;
    }

    public static enum Level {
        READ,
        WRITE
    };

    public static enum EntityType {
        GAMEMODEL,
        GAME,
        TEAM,
        PLAYER,
        USER
    };
}
