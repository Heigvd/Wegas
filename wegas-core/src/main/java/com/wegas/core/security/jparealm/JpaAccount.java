/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.jparealm;

import com.wegas.core.Helper;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.security.persistence.AbstractAccount;
import org.apache.shiro.crypto.RandomNumberGenerator;
import org.apache.shiro.crypto.SecureRandomNumberGenerator;
import org.apache.shiro.crypto.hash.Sha256Hash;
import org.apache.shiro.util.SimpleByteSource;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.wegas.core.exception.client.WegasIncompatibleType;

import javax.persistence.*;

/**
 * Simple class that represents any User domain entity in any application.
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
/*@Table(uniqueConstraints = {
        @UniqueConstraint(columnNames = "email")
})*/
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "GameAccount", value = com.wegas.core.security.jparealm.GameAccount.class)
})
@NamedQueries({
    @NamedQuery(name = "JpaAccount.findExactClass", query = "SELECT a FROM JpaAccount a WHERE TYPE(a) = :accountClass"),
    @NamedQuery(name = "JpaAccount.findByEmail", query = "SELECT a FROM JpaAccount a WHERE LOWER(a.email) LIKE LOWER(:email)"),
    @NamedQuery(name = "JpaAccount.findByFullName", query = "SELECT a FROM JpaAccount a WHERE LOWER(a.firstname) LIKE LOWER(:firstname) AND  LOWER(a.lastname) LIKE LOWER(:lastname)")
})
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
public class JpaAccount extends AbstractAccount {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    private String email;
    /**
     *
     */
    @Transient
    private String password;
    /**
     *
     */
    @Basic(optional = false)
    @Column(length = 255)
    @JsonIgnore
    private String passwordHex;
    /**
     *
     */
    @JsonIgnore
    private String salt;

    @Override
    public void merge(AbstractEntity other) {
        if (other instanceof JpaAccount) {
            super.merge(other);
            JpaAccount a = (JpaAccount) other;
            this.setEmail(a.getEmail());
            if (a.getPassword() != null && !a.getPassword().isEmpty()) {                                          // Only update the password if it is set
                this.setPassword(a.getPassword());
                this.setPasswordHex(null);                                          // Force jpa update
            }
        } else {
            throw new WegasIncompatibleType(this.getClass().getSimpleName() + ".merge (" + other.getClass().getSimpleName() + ") is not possible");
        }
    }

    /**
     *
     */
    @PrePersist
    public void prePersist() {
        RandomNumberGenerator rng = new SecureRandomNumberGenerator();
        this.setSalt(rng.nextBytes().toHex());
        if (this.password == null || this.password.isEmpty()) {
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
            this.passwordHex = new Sha256Hash(this.password,
                    (new SimpleByteSource(this.getSalt())).getBytes()).toHex();
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
    }

    /**
     * @return the passwordHex
     */
    public String getPasswordHex() {
        return passwordHex;
    }

    /**
     * @param passwordHex the passwordHex to set
     */
    public void setPasswordHex(String passwordHex) {
        this.passwordHex = passwordHex;
    }

    /**
     * @return the salt
     */
    public String getSalt() {
        return salt;
    }

    /**
     * @param salt the salt to set
     */
    public void setSalt(String salt) {
        this.salt = salt;
    }

    /**
     * @return the email
     */
    public String getEmail() {
        return email;
    }

    /**
     * @return md5 address hash
     */
    public String getHash() {
        if (email != null) {
            return Helper.md5Hex(email);

        } else {
            return Helper.md5Hex("default");
        }
    }

    /**
     * @param email the email to set
     */
    public void setEmail(String email) {
        this.email = email;
    }
}
