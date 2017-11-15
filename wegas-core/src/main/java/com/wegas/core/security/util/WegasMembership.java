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
public class WegasMembership extends WegasPermission {

    private final GroupName name;

    public WegasMembership(GroupName name) {
        this.name = name;
    }

    public GroupName getName() {
        return name;
    }

    public static enum GroupName {
        ADMINISTRATOR,
        TRAINER,
        SCENARIST
    }
}
