/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence;

/**
 *
 * Entity name human-readable unique identifier
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public interface NamedEntity {

    /**
     * Get the entity internal name
     *
     * @return the entity name
     */
    String getName();

    /**
     *
     * @param name
     */
    void setName(String name);
}
