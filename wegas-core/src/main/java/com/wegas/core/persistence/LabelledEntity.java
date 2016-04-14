/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence;

/**
 * Displayed entity name 
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
public interface LabelledEntity {

    /**
     * 
     * @return 
     */
    String getLabel();

    /**
     * 
     * @param newLabel
     */
    void setLabel(String newLabel);
}
