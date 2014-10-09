/*
 * Wegas
 * http://wegas.albasim.ch
  
 * Copyright (c) 2014 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
public interface Searchable {

    /**
     *
     * @param criteria value to search for
     * @return if this specific object contains criteria
     */
    public Boolean contains(String criteria);
}
