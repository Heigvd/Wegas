/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
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
    VariableInstance find(Long id);
}
