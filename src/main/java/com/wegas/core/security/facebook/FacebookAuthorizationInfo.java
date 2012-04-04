/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.wegas.core.security.facebook;

import java.util.Collection;
import org.apache.shiro.authz.AuthorizationInfo;
import org.apache.shiro.authz.Permission;

/**
 *
 * @author fx
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
