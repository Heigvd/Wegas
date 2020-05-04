/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.jparealm;

import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wegas.core.Helper;
import com.wegas.core.security.persistence.AbstractAccount;
import com.wegas.core.security.persistence.Shadow;
import com.wegas.core.security.util.AuthenticationMethod;
import com.wegas.core.security.util.HashMethod;
import com.wegas.core.security.util.JpaAuthentication;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.Inheritance;
import javax.persistence.InheritanceType;
import javax.persistence.NamedQuery;
import javax.persistence.PrePersist;
import javax.persistence.Transient;
import org.apache.shiro.crypto.RandomNumberGenerator;
import org.apache.shiro.crypto.SecureRandomNumberGenerator;

/**
 * Simple class that represents any User domain entity in any application.
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
@NamedQuery(name = "JpaAccount.findExactClass", query = "SELECT a FROM JpaAccount a WHERE TYPE(a) = JpaAccount")
@NamedQuery(name = "JpaAccount.findByEmail", query = "SELECT a FROM JpaAccount a WHERE TYPE(a) = JpaAccount AND LOWER(a.details.email) LIKE LOWER(:email)")
@NamedQuery(name = "JpaAccount.findByUsername", query = "SELECT a FROM AbstractAccount a WHERE TYPE(a) = JpaAccount AND a.username = :username")
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
public class JpaAccount extends AbstractAccount {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @Transient
    @WegasEntityProperty(ignoreNull = true)
    private String password;

    /**
     * Salt used by the client to hash its password. This is not the salt used to store the password
     * in the database. The client hash its salted password using the
     * {@link  #currentAuth mandatory hash method}. Then, this hash is salted and hashed again by
     * {@link Shadow}
     */
    @WegasEntityProperty(ignoreNull = true, initOnly = true)
    private String salt;

    /**
     * if defined, this salt must be used to salt the password hashed with
     * {@link #nextAuth optional hash method}
     */
    @WegasEntityProperty(ignoreNull = true, initOnly = true)
    private String newSalt;

    @Column(columnDefinition = "boolean default false")
    private Boolean verified = false;

    /**
     *
     */
    @Column(length = 24)
    @Enumerated(value = EnumType.STRING)
    private HashMethod currentAuth;

    /**
     *
     */
    @Column(length = 24)
    @Enumerated(value = EnumType.STRING)
    private HashMethod nextAuth;

    /**
     *
     */
    @PrePersist
    public void prePersist() {

        if (this.getShadow() == null) {
            this.setShadow(new Shadow());
        }
        if (this.password == null || this.password.isEmpty()) {
            RandomNumberGenerator rng = new SecureRandomNumberGenerator();
            this.password = rng.nextBytes().toString().substring(0, 7);
        }
    }

    /**
     *
     */
    public void shadowPasword() {
        if (!Helper.isNullOrEmpty(this.password)) {
            Shadow shadow = this.getShadow();

            HashMethod hashMethod = shadow.getHashMethod();
            HashMethod nextHashMethod = shadow.getNextHashMethod();

            if (nextHashMethod != null) {
                hashMethod = nextHashMethod;
                shadow.setNextHashMethod(null);
                shadow.setHashMethod(hashMethod);
            }

            if (hashMethod == null) {
                hashMethod = HashMethod.SHA_256;
                shadow.setHashMethod(HashMethod.SHA_256);
            }

            String hash = hashMethod.hash(this.password, this.getShadow().getSalt());
            this.password = null;
            this.getShadow().setPasswordHex(hash);
        }
    }

    /**
     * Returns the password for this user.
     *
     * @return this user's password
     */
    public String getPassword() {
        return password;
    }

    /**
     * @param password
     */
    public void setPassword(String password) {
        this.password = password;
        if (!Helper.isNullOrEmpty(password) && this.getShadow() != null) {
            this.shadowPasword();
        }
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

    @Override
    public Boolean isVerified() {
        return verified != null && verified;
    }

    public void setVerified(Boolean verified) {
        this.verified = verified;
    }

    @JsonIgnore
    public HashMethod getCurrentAuth() {
        return currentAuth;
    }

    public void setCurrentAuth(HashMethod currentAuth) {
        this.currentAuth = currentAuth;
    }

    @JsonIgnore
    public HashMethod getNextAuth() {
        return nextAuth;
    }

    public void setNextAuth(HashMethod nextAuth) {
        this.nextAuth = nextAuth;
    }

    @Override
    public AuthenticationMethod getAuthenticationMethod() {
        return new JpaAuthentication(this.currentAuth,
            this.nextAuth, this.salt, this.newSalt);
    }

    public void migrateToNextAuthMethod() {
        if (this.nextAuth != null) {
            this.setCurrentAuth(nextAuth);
            this.setNextAuth(null);

            if (!Helper.isNullOrEmpty(newSalt)) {
                this.salt = this.newSalt;
                this.newSalt = null;
            }
        }
    }
}
