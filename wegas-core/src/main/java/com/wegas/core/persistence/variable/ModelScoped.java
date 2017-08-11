/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable;

/**
 *
 * @author maxence
 */
public interface ModelScoped {

    public static enum Visibility {
        /**
         * propagated: true
         * designer: write
         * scenarist: read only
         */
        INTERNAL,
        /**
         * propagated: true
         * designer: write
         * scenarist: read only, but write for default instance and items
         */
        PROTECTED,
        /**
         * propagated: true
         * designer: write
         * scenarist: write
         */
        INHERITED,
        /**
         * propagated: false (when updating but true when creating ???)
         * designer: n/a
         * scenarist: write
         */
        PRIVATE
    }

    Visibility getVisibility();

    void setVisibility(Visibility visibility);
}
