/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.api;

import com.wegas.core.persistence.variable.VariableInstance;

/**
 *
 * @author maxence
 */
public interface VariableInstanceFacadeI {

    /**
     * Retrieve a variableInstance by id
     *
     * @param id
     *
     * @return
     */
    public VariableInstance find(Long id);
}
