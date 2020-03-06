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
import com.wegas.core.security.util.JpaAuthentication;
import com.wegas.core.security.util.JpaAuthentication.HashMethod;
import javax.persistence.*;
import org.apache.shiro.crypto.RandomNumberGenerator;
import org.apache.shiro.crypto.SecureRandomNumberGenerator;
import org.apache.shiro.crypto.hash.Sha256Hash;
import org.apache.shiro.util.SimpleByteSource;

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

    @Column(columnDefinition = "boolean default false")
    private Boolean verified = false;

    /**
     *
     */
    @Column(length = 24, columnDefinition = "character varying(24) default 'PLAIN'::character varying")
    @Enumerated(value = EnumType.STRING)
    private HashMethod currentAuth;

    /**
     *
     */
    @Column(length = 24, columnDefinition = "character varying(24) default ''::character varying")
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
        if (this.password != null && !this.password.isEmpty()) {
            String hash = new Sha256Hash(this.password,
                (new SimpleByteSource(this.getShadow().getSalt())).getBytes()).toHex();
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

    @Override
    public Boolean isVerified() {
        return verified;
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
        return new JpaAuthentication(this.currentAuth, this.nextAuth);
    }
}
