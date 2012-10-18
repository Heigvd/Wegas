/*
 * Wegas.
 *
 * http://www.albasim.com/wegas/  *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.security.jparealm;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.security.persistence.AbstractAccount;
import javax.persistence.*;
import javax.xml.bind.annotation.XmlType;
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
@XmlType(name = "JpaAccount")
public class JpaAccount extends AbstractAccount {

    /**
     *
     */
    @Transient
    private String password;
    /**
     *
     */
    @Basic(optional = false)
    @JsonIgnore
    @Column(length = 255)
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
        if (a.getPassword() != null) {                                          // Only update the password if it is set
            this.setPassword(a.getPassword());
            this.setPasswordHex(null);                                          // Force jpa update
        }
    }

    @PrePersist
    public void prePersist() {
        RandomNumberGenerator rng = new SecureRandomNumberGenerator();
        this.setSalt(rng.nextBytes().toHex());

        this.preUpdate();
    }

    @PreUpdate
    public void preUpdate() {
        if (this.password != null) {
            this.passwordHex = new Sha256Hash(this.password,
                    ( new SimpleByteSource(this.getSalt()) ).getBytes()).toHex();
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
}
