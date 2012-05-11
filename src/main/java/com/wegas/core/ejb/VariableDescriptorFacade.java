/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.ejb;

import com.wegas.core.persistence.variable.VariableDescriptorEntity;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public interface VariableDescriptorFacade extends AbstractFacade<VariableDescriptorEntity> {

    public com.wegas.core.persistence.variable.VariableDescriptorEntity findByName(java.lang.String name);

    public java.util.List<com.wegas.core.persistence.variable.VariableDescriptorEntity> findByRootGameModelId(java.lang.Long gameModelId);

    public java.util.List<com.wegas.core.persistence.variable.VariableDescriptorEntity> findByClassAndGameModelId(java.lang.Class variableDescriptorClass, java.lang.Long gameModelId);

    public void create(java.lang.Long gameModelId, com.wegas.core.persistence.variable.VariableDescriptorEntity variableDescriptorEntity);
 }
