
/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.persistence;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wegas.core.Helper;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.persistence.variable.ModelScoped.Visibility;
import com.wegas.core.security.util.HashMethod;
import com.wegas.core.security.util.WegasPermission;
import java.util.Collection;
import javax.persistence.Basic;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.OneToOne;
import javax.persistence.PrePersist;

/**
 * Shadow storage for sensitive information linked to AbstractAccounts. It means: <ul>
 * <li>password hash </li>
 * <li>salt</li>
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

    @OneToOne(fetch = FetchType.LAZY, mappedBy = "shadow")
    private AbstractAccount account;

    @Column(length = 24, columnDefinition = "character varying(24)")
    @Enumerated(value = EnumType.STRING)
    private HashMethod hashMethod = HashMethod.SHA_256;

    @Column(length = 24, columnDefinition = "character varying(24)")
    @Enumerated(value = EnumType.STRING)
    private HashMethod nextHashMethod;

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

    public void generateNewSalt() {
        this.setSalt(Helper.generateSalt());
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

    public HashMethod getHashMethod() {
        return hashMethod;
    }

    public void setHashMethod(HashMethod hashMethod) {
        this.hashMethod = hashMethod;
    }

    public HashMethod getNextHashMethod() {
        return nextHashMethod;
    }

    public void setNextHashMethod(HashMethod nextHashMethod) {
        this.nextHashMethod = nextHashMethod;
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
