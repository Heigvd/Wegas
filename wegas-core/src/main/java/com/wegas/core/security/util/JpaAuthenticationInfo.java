/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.util;

import java.util.Objects;
import org.apache.shiro.authc.SimpleAuthenticationInfo;
import org.apache.shiro.util.ByteSource;

/**
 *
 * @author maxence
 */
public class JpaAuthenticationInfo extends SimpleAuthenticationInfo {

    private HashMethod hashMethod;

    public JpaAuthenticationInfo(Object principal, Object hashedCredentials,
        ByteSource credentialsSalt, String realmName,
        HashMethod hashMethod
    ) {
        super(principal, hashedCredentials, credentialsSalt, realmName);
        this.hashMethod = hashMethod;
    }

    public HashMethod getHashMethod() {
        return hashMethod;
    }

    public void setHashMethod(HashMethod hashMethod) {
        this.hashMethod = hashMethod;
    }

    @Override
    public int hashCode() {
        int hash = super.hashCode();
        hash = 59 * hash + Objects.hashCode(this.hashMethod);
        return hash;
    }

    @Override
    public boolean equals(Object obj) {
        return super.equals(obj) && ((JpaAuthenticationInfo) obj).getHashMethod() == this.hashMethod;
    }
}
