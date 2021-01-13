/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.util;

/**
 *
 * Internal account to authenticate with credentials.
 * <p>
 * This method request the client to send a password using the mandatoryMethod. If an optionalMethod
 * is provided, the client should also send its password using this very method. It will cause the
 * rotation of the methods.
 *
 * @author maxence
 */
public class JpaAuthentication extends AuthenticationMethod {

    /**
     * Hash method used to authenticate
     */
    private HashMethod mandatoryMethod;

    /**
     * Salt used to prefix the password before hashing it with mandatory method
     */
    private String salt;

    /**
     * optional method. Use to migrate to a new method or to change the salt
     */
    private HashMethod optionalMethod;

    /**
     * Salt used to prefix the password before hashing it with optional method
     */
    private String newSalt;

    public JpaAuthentication() {
        // ensure there is a default constructor
    }

    public JpaAuthentication(
        HashMethod mandatoryMethod, HashMethod optioanlMethod,
        String salt, String newSalt
    ) {
        this.mandatoryMethod = mandatoryMethod;
        this.optionalMethod = optioanlMethod;
        this.salt = salt;
        this.newSalt = newSalt;
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

    public String getSalt() {
        return salt;
    }

    public void setSalt(String salt) {
        this.salt = salt;
    }

    public String getNewSalt() {
        return newSalt;
    }

    public void setNewSalt(String newSalt) {
        this.newSalt = newSalt;
    }
}
