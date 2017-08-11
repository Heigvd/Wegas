/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence;

/**
 * Displayed entity name 
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
public interface LabelledEntity {

    /**
     * Get the entity label. Label is the name to be displayed to end-users
     * 
     * @return entity label
     */
    String getLabel();

    /**
     * Set entity label
     * @param newLabel the new label to set
     */
    void setLabel(String newLabel);
}
