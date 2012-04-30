/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.persistence.game;

import com.wegas.core.persistence.AbstractEntity;
import java.util.Objects;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public abstract class NamedEntity extends AbstractEntity {

    /**
     *
     * @param n
     */
    @Override
    public void merge(AbstractEntity n) {
        this.setName(( (NamedEntity) n ).getName());
    }

    /**
     *
     * @return
     */
    public abstract String getName();

    /**
     *
     * @param name
     */
    public abstract void setName(String name);

    /**
     *
     * @return
     */
    @Override
    public String toString() {
        return this.getClass().getName().toString() + " [" + getName() + ", " + getId() + " ]";
    }


    @Override
    public int hashCode() {
        int hash = 7;
        hash = 37 * hash + Objects.hashCode(this.getName());
        hash = 37 * hash + Objects.hashCode(this.getId());
        return hash;
    }

}
