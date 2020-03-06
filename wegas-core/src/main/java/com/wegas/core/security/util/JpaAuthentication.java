/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.util;

/**
 *
 * Internal account to authenticate with credentials.
 * <p>
 * This method request the client to send a password using the mandatoryMethod. If an optionalMethod
 * is provided, the client should also send its password using this very method.
 *
 * @author maxence
 */
public class JpaAuthentication extends AuthenticationMethod {

    public static enum HashMethod {
        PLAIN,
        SHA_512
    }

    private HashMethod mandatoryMethod;

    private HashMethod optioanlMethod;

    public JpaAuthentication() {
    }

    public JpaAuthentication(HashMethod mandatoryMethod, HashMethod optioanlMethod) {
        this.mandatoryMethod = mandatoryMethod;
        this.optioanlMethod = optioanlMethod;
    }

    public HashMethod getMandatoryMethod() {
        return mandatoryMethod;
    }

    public void setMandatoryMethod(HashMethod mandatoryMethod) {
        this.mandatoryMethod = mandatoryMethod;
    }

    public HashMethod getOptioanlMethod() {
        return optioanlMethod;
    }

    public void setOptioanlMethod(HashMethod optioanlMethod) {
        this.optioanlMethod = optioanlMethod;
    }
}
