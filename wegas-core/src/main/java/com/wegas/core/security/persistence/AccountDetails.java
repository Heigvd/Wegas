/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.persistence;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.persistence.variable.ModelScoped.Visibility;
import com.wegas.core.security.jparealm.JpaAccount;
import com.wegas.core.security.util.WegasPermission;
import java.util.Collection;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.OneToOne;

/**
 * Account details contains more sensitive information: <ul>
 * <li>plain email address</li>
 * </ul>
 *
 * @author Maxence
 */
@Entity
public class AccountDetails extends AbstractEntity {

    /**
     *
     */
    @Id
    @GeneratedValue
    private Long id;

    @JsonBackReference
    @OneToOne(fetch = FetchType.LAZY, mappedBy = "details")
    private AbstractAccount account;

    /**
     * required to build an unique index on email as only email linked to local account must be unique (ie. AaiAccount
     * and JPAAccount can use the same address, two Jpa account can not)
     */
    private boolean checkUniqueness;

    private String email;

    @Override
    public Long getId() {
        return this.id;
    }

    public AbstractAccount getAccount() {
        return account;
    }

    public void setAccount(AbstractAccount account) {
        this.account = account;
        this.checkUniqueness = account instanceof JpaAccount;
    }

    public boolean isCheckUniqueness() {
        return checkUniqueness;
    }

    public void setCheckUniqueness(boolean checkUniqueness) {
        this.checkUniqueness = checkUniqueness;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    @Override
    public Collection<WegasPermission> getRequieredCreatePermission() {
        // no permission required to create a new account
        return null;
    }

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission() {
        // Read/Write restricted to the user
        return WegasPermission.getAsCollection(
            account.getUser().getAssociatedWritePermission()
        );
    }

    @Override
    public Collection<WegasPermission> getRequieredReadPermission() {
        Collection<WegasPermission> p = getRequieredUpdatePermission(); // the user itself

        /*
         * Trainers of game in which the user plays can read details (email address)
         */
        p.addAll(account.getUser().getPlayerGameRelatedPermissions());

        return p;
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
