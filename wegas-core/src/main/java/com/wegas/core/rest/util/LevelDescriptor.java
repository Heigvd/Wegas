/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

package com.wegas.core.rest.util;

import ch.qos.logback.classic.Logger;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

/**
 * Describe the current level of a logger
 *
 * @author maxence
 */
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
public class LevelDescriptor {

    /**
     * Explicit level of this logger. May be null.
     */
    private String level;

    /**
     * Effective level of this logger
     */
    private String effectiveLevel;

    /**
     * Get the value of effectiveLevel
     *
     * @return the value of effectiveLevel
     */
    public String getEffectiveLevel() {
        return effectiveLevel;
    }

    /**
     * Set the value of effectiveLevel
     *
     * @param effectiveLevel new value of effectiveLevel
     */
    public void setEffectiveLevel(String effectiveLevel) {
        this.effectiveLevel = effectiveLevel;
    }

    /**
     * Get the value of level
     *
     * @return the value of level
     */
    public String getLevel() {
        return level;
    }

    /**
     * Set the value of level
     *
     * @param level new value of level
     */
    public void setLevel(String level) {
        this.level = level;
    }

    /**
     * Extract level descriptor from a logger
     *
     * @param logger the logger
     *
     * @return the logger LevelDescriptor
     */
    public static LevelDescriptor build(Logger logger) {
        LevelDescriptor ld = new LevelDescriptor();

        String level = logger.getLevel() != null ? logger.getLevel().levelStr : null;

        ld.setEffectiveLevel(logger.getEffectiveLevel().levelStr);
        ld.setLevel(level);

        return ld;
    }

}
