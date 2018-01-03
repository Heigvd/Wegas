/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public abstract class NamedEntity extends AbstractEntity {

    private static final long serialVersionUID = -5419544250248220709L;

    /**
     * Get the entity internal name
     *
     * @return the entity name
     */
    public abstract String getName();

    /**
     *
     * @param name
     */
    public abstract void setName(String name);

    /**
     *
     * @return class simple name, id and name
     */
    @Override
    public String toString() {
        return this.getClass().getSimpleName() + "( " + getId() + ", " + getName() + ")";
    }
}
