/*
 * Wegas
 * http://wegas.albasim.ch
  
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable;

import java.util.ArrayList;
import java.util.List;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
public interface Searchable {

    /**
     * @param criteria value to search for
     * @return if this specific object contains criteria
     */
    default Boolean contains(String criteria) {
        return containsAll(new ArrayList<String>() {{
            add(criteria);
        }});
    }

    /**
     * @param criterias List of criteria to search for
     * @return if this specific object contains all criteria
     */
    Boolean containsAll(List<String> criterias);
}
