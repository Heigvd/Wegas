/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.util;

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
