/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.persistence;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.persistence.variable.ModelScoped.Visibility;
import com.wegas.core.security.util.WegasPermission;
import java.util.Collection;
import javax.persistence.*;
import org.apache.shiro.crypto.RandomNumberGenerator;
import org.apache.shiro.crypto.SecureRandomNumberGenerator;

/**
 * Shadow storage for sensitive information linked to AbstractAccounts. It means: <ul>
 * <li>password hash </li>
 * <li>salt</li>
 * <li>reset password token</li>
 * </ul>
 *
 * @author Maxence
 */
@Entity
public class Shadow extends AbstractEntity {

    /**
     *
     */
    @Id
    @GeneratedValue
    private Long id;
    /**
     *
     */
    @Basic(optional = false)
    @Column(length = 255)
    @JsonIgnore
    private String passwordHex;

    @JsonIgnore
    private String token;

    @OneToOne(fetch = FetchType.LAZY, mappedBy = "shadow")
    private AbstractAccount account;

    @JsonIgnore
    private String email;

    /**
     * 
     */
    @JsonIgnore
    private boolean assertEmailUniqueness;

    /**
     *
     */
    @JsonIgnore
    private String salt;

    /**
     * @return the passwordHex
     */
    public String getPasswordHex() {
        return passwordHex;
    }

    @Override
    public Long getId() {
        return this.id;
    }

    public AbstractAccount getAccount() {
        return account;
    }

    public void setAccount(AbstractAccount account) {
        this.account = account;
    }

    private void generateNewSalt() {
        RandomNumberGenerator rng = new SecureRandomNumberGenerator();
        this.setSalt(rng.nextBytes().toHex());
    }

    /**
     * @param passwordHex the passwordHex to set
     */
    public void setPasswordHex(String passwordHex) {
        this.passwordHex = passwordHex;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public boolean isAssertEmailUniqueness() {
        return assertEmailUniqueness;
    }

    public void setAssertEmailUniqueness(boolean assertEmailUniqueness) {
        this.assertEmailUniqueness = assertEmailUniqueness;
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

    @Override
    public Collection<WegasPermission> getRequieredCreatePermission() {
        // no permission required to create a new account
        return null;
    }

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission() {
        // Read/Write restriceted to the user
        return WegasPermission.getAsCollection(
            account.getUser().getAssociatedWritePermission()
        );
    }

    /**
     *
     */
    @PrePersist
    public void setSaltOnPrePersist() {
        if (salt == null) {
            generateNewSalt();
        }
    }

    @Override
    public WithPermission getMergeableParent() {
        return null;
    }

    @Override
    public boolean belongsToProtectedGameModel() {
        return false;
    }

    @Override
    public Visibility getInheritedVisibility() {
        return Visibility.INHERITED;
    }
}
