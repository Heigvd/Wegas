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

    /**
     * INTERNAL -> TO BE RENAMED
     * PROTECTED
     * INHERITED
     * PRIVATE
     */
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

    /**
     * protection against scenario writes
     */
    public static enum ProtectionLevel {
        /**
         * Fetch from parent
         */
        CASCADED,
        /**
         * standard level for everything but default instances
         * INTERNAL and PROTECTED are readonly for scenarist
         */
        PROTECTED,
        /**
         * open protected world to scenarist
         */
        INTERNAL,
        /**
         * Only PRIVATE is writable
         */
        INHERITED,
        /**
         * Always protected
         */
        ALL
    }

    Visibility getVisibility();

    void setVisibility(Visibility visibility);
}
