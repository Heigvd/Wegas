/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.jparealm;

import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.wegas.core.Helper;
import com.wegas.core.security.persistence.AbstractAccount;
import com.wegas.core.security.persistence.Shadow;
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
    @PrePersist
    public void prePersist() {

        if (this.getShadow() == null) {
            this.setShadow(new Shadow());
        }
        if (this.password == null || this.password.isEmpty()) {
            RandomNumberGenerator rng = new SecureRandomNumberGenerator();
            this.password = rng.nextBytes().toString().substring(0, 7);
        }
        this.preUpdate();
    }

    /**
     *
     */
    @PreUpdate
    public void preUpdate() {
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
            this.getShadow().setPasswordHex(null); //force JPA update (password is JPA transient)
        }
    }

    @Override
    public Boolean isVerified() {
        return verified;
    }

    public void setVerified(Boolean verified) {
        this.verified = verified;
    }
}
