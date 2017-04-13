package com.wegas.core.security.aai;

import com.wegas.core.security.aai.AaiAuthenticationInfo;
import org.apache.shiro.authc.AuthenticationInfo;
import org.apache.shiro.authc.AuthenticationToken;
import org.apache.shiro.authc.credential.CredentialsMatcher;

/**
 * Created by jarle.hulaas@heig-vd.ch on 10.03.2017.
 */
public class AaiCredentialsMatcher implements CredentialsMatcher {

    /**
     * Just confirms that token is the right type - credentials checking is done
     * by an AAI IdP
     */
    @Override
    public boolean doCredentialsMatch(AuthenticationToken token, AuthenticationInfo info) {
        return info instanceof AaiAuthenticationInfo;
    }
}

