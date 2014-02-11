/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.jparealm;

import com.wegas.core.Helper;
import com.wegas.core.security.persistence.AbstractAccount;
import com.wegas.core.persistence.AbstractEntity;
import javax.persistence.*;
import org.apache.shiro.crypto.RandomNumberGenerator;
import org.apache.shiro.crypto.SecureRandomNumberGenerator;
import org.apache.shiro.crypto.hash.Sha256Hash;
import org.apache.shiro.util.SimpleByteSource;
import org.codehaus.jackson.annotate.JsonIgnore;

/**
 * Simple class that represents any User domain entity in any application.
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@Table(uniqueConstraints = {
    @UniqueConstraint(columnNames = "email")
})
public class JpaAccount extends AbstractAccount {

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
        super.merge(other);
        JpaAccount a = (JpaAccount) other;
        this.setEmail(a.getEmail());
        if (a.getPassword() != null && !a.getPassword().isEmpty()) {                                          // Only update the password if it is set
            this.setPassword(a.getPassword());
            this.setPasswordHex(null);                                          // Force jpa update
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
     *
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
