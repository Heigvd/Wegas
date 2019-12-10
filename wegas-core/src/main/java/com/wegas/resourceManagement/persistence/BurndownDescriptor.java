/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.resourceManagement.persistence;

import com.wegas.core.persistence.variable.VariableDescriptor;
import javax.persistence.Entity;

/**
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
@Entity
public class BurndownDescriptor extends VariableDescriptor<BurndownInstance> {

    private static final long serialVersionUID = 1L;
}
