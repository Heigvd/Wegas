/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.aai;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import java.util.ArrayList;
import java.util.Collection;
import org.apache.shiro.authc.AuthenticationInfo;
import org.apache.shiro.subject.PrincipalCollection;
import org.apache.shiro.subject.SimplePrincipalCollection;

/**
 * @author jarle.hulaas@heig-vd.ch on 07.03.2017.
 */

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
public class AaiAuthenticationInfo implements AuthenticationInfo {

    private AaiUserDetails userDetails;
    private PrincipalCollection principalCollection;

    public AaiAuthenticationInfo(Long userid, AaiUserDetails details, String realmName){
        this.setUserDetails(details);
        Collection<Long> principals = new ArrayList<>();
        principals.add(userid);
        // @TODO: remove this and all user details
        //principals.add(details.getPersistentId());
        this.principalCollection = new SimplePrincipalCollection(principals, realmName);
    }

    @Override
    public Object getCredentials() {
        return null;// no credentials required
    }

    @Override
    public PrincipalCollection getPrincipals() {
        return principalCollection;
    }

    public AaiUserDetails getUserDetails() {
        return userDetails;
    }

    public void setUserDetails(AaiUserDetails userDetails) {
        this.userDetails = userDetails;
    }
}
