/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.resourceManagement.persistence;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.wegas.core.persistence.variable.VariableDescriptor;
import jakarta.persistence.Entity;

/**
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
@Entity
@JsonIgnoreProperties({"description"})
public class BurndownDescriptor extends VariableDescriptor<BurndownInstance> {

    private static final long serialVersionUID = 1L;
}
