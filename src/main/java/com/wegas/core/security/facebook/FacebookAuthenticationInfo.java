/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.wegas.core.security.facebook;

import java.util.ArrayList;
import java.util.Collection;

import org.apache.shiro.authc.AuthenticationInfo;
import org.apache.shiro.subject.PrincipalCollection;
import org.apache.shiro.subject.SimplePrincipalCollection;

public class FacebookAuthenticationInfo implements AuthenticationInfo {

    private static final long serialVersionUID = 1L;
    private PrincipalCollection principalCollection;

    public FacebookAuthenticationInfo(FacebookUserDetails facebookUserDetails, String realmName) {
        Collection<String> principals = new ArrayList<String>();
        principals.add(facebookUserDetails.getId());
        principals.add(facebookUserDetails.getFirstName() + " " + facebookUserDetails.getLastName()); // Is this appropriate is the name not really a Principal ?
        this.principalCollection = new SimplePrincipalCollection(principals, realmName);
    }

    @Override
    public PrincipalCollection getPrincipals() {
        return principalCollection;
    }

    @Override
    public Object getCredentials() {
        return null;// no credentials required
    }
}
