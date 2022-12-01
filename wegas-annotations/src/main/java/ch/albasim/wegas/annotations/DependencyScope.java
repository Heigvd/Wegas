/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package ch.albasim.wegas.annotations;

/**
 * {@link Scriptable} parameter.
 *
 * @author maxence
 */
public enum DependencyScope {
    /**
     * no dependency on any variable
     */
    NONE,
    /**
     * Targeted variable only
     */
    SELF,
    /**
     * Targeted variable and all children (list items, question choices, ...)
     */
    CHILDREN,
    /**
     *
     */
    UNKNOWN
}
