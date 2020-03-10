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

    private HashMethod mandatoryMethod;

    private HashMethod optionalMethod;

    public JpaAuthentication() {
    }

    public JpaAuthentication(HashMethod mandatoryMethod, HashMethod optioanlMethod) {
        this.mandatoryMethod = mandatoryMethod;
        this.optionalMethod = optioanlMethod;
    }

    public HashMethod getMandatoryMethod() {
        return mandatoryMethod;
    }

    public void setMandatoryMethod(HashMethod mandatoryMethod) {
        this.mandatoryMethod = mandatoryMethod;
    }

    public HashMethod getOptionalMethod() {
        return optionalMethod;
    }

    public void setOptionalMethod(HashMethod optionalMethod) {
        this.optionalMethod = optionalMethod;
    }
}
