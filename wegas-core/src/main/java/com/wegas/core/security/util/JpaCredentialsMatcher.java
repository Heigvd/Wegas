/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2019 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.util;

import org.apache.shiro.authc.AuthenticationInfo;
import org.apache.shiro.authc.AuthenticationToken;
import org.apache.shiro.authc.credential.SimpleCredentialsMatcher;
import org.apache.shiro.util.ByteSource;

/**
 * Custom credentials matcher for JPA account. This matcher only works with
 * {@link JpaAuthenticationInfo}. It allows to use a specific hash methods per account. Thus, it
 * allows silent hash method migration.
 *
 * @author maxence
 */
public class JpaCredentialsMatcher extends SimpleCredentialsMatcher {

    public boolean doCredentialsMatch(AuthenticationToken token, AuthenticationInfo info) {
        if (info instanceof JpaAuthenticationInfo) {
            JpaAuthenticationInfo jpaInfo = (JpaAuthenticationInfo) info;

            char[] tokenCredentials = (char[]) getCredentials(token);

            HashMethod hashMethod = jpaInfo.getHashMethod();
            ByteSource salt = jpaInfo.getCredentialsSalt();

            String hash = hashMethod.hash(tokenCredentials, salt);

            Object accountCredentials = getCredentials(info);

            return equals(hash, accountCredentials);
        } else {
            return false;
        }
    }
}
