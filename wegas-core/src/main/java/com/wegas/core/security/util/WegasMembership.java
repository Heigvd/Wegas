/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.util;

import java.util.Collection;
import java.util.Objects;

/**
 *
 * @author maxence
 */
public class WegasMembership extends WegasPermission {

    private final String name;

    public WegasMembership(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }

    @Override
    public String toString() {
        return "MemberOf-" + getName();
    }

    @Override
    public int hashCode() {
        int hash = 7;
        hash = 53 * hash + Objects.hashCode(this.name);
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
        final WegasMembership other = (WegasMembership) obj;
        if (!Objects.equals(this.name, other.name)) {
            return false;
        }
        return true;
    }


    public static final Collection<WegasPermission> ADMIN = WegasPermission.getAsCollection(new WegasMembership("Administrator"));
    public static final Collection<WegasPermission> TRAINER = WegasPermission.getAsCollection(new WegasMembership("Trainer"), new WegasMembership("Scenarist"));
    public static final Collection<WegasPermission> SCENARIST = WegasPermission.getAsCollection(new WegasMembership("Scenarist"));
}
