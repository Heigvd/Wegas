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

import com.wegas.core.persistence.user.UserEntity;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public interface UserFacade extends AbstractFacade<UserEntity> {

    public com.wegas.core.persistence.user.UserEntity getUserByPrincipal(java.lang.String principal) throws javax.persistence.NoResultException;
}
