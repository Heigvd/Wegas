/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.security.facebook;

import java.util.Collection;
import org.apache.shiro.authz.AuthorizationInfo;
import org.apache.shiro.authz.Permission;

/**
 *
* @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public class FacebookAuthorizationInfo implements AuthorizationInfo {

    @Override
    public Collection<String> getRoles() {
        throw new UnsupportedOperationException("Not supported yet.");
    }

    @Override
    public Collection<String> getStringPermissions() {
        throw new UnsupportedOperationException("Not supported yet.");
    }

    @Override
    public Collection<Permission> getObjectPermissions() {
        throw new UnsupportedOperationException("Not supported yet.");
    }

}
