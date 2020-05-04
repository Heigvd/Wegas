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
    private final Object payload;

    public WegasEntityPermission(Long id, Level level, EntityType type) {
        this.id = id;
        this.level = level;
        this.type = type;
        this.payload = null;
    }

    public WegasEntityPermission(Long id, Level level, EntityType type, Object payload) {
        this.id = id;
        this.level = level;
        this.type = type;
        this.payload = payload;
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

    public Object getPayload() {
        return payload;
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
        hash = 29 * hash + Objects.hashCode(this.payload);
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
        if (!Objects.equals(this.payload, other.payload)){
            return false;
        }
        return true;
    }

    public enum Level {
        READ,
        WRITE,
        TRANSLATE
    };

    public enum EntityType {
        GAMEMODEL,
        GAME,
        TEAM,
        PLAYER,
        USER
    };
}
