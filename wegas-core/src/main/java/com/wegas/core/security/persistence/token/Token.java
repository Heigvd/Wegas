/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

package com.wegas.core.security.persistence.token;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.persistence.variable.Beanjection;
import com.wegas.core.persistence.variable.ModelScoped.Visibility;
import com.wegas.core.security.ejb.AccountFacade;
import com.wegas.core.security.persistence.AbstractAccount;
import com.wegas.core.security.util.WegasMembership;
import com.wegas.core.security.util.WegasPermission;
import java.util.Collection;
import java.util.Date;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.Index;
import javax.persistence.ManyToOne;
import javax.persistence.NamedQuery;
import javax.persistence.Table;
import javax.persistence.Temporal;
import javax.persistence.TemporalType;
import javax.servlet.http.HttpServletRequest;

/**
 * A token is sent by e-mail to users for many purposes. It may be used to:
 * <ul>
 * <li>reset JPAAccount password</li>
 * <li>validate JPAAccount email address</li>
 * <li>invite user to participate in a survey</li>
 * </ul>
 * <p>
 * In the future, they may also be used to:<ul>
 * <li>invite not yet registered user to join a team</li>
 * </ul>
 *
 * @author maxence
 */
@Entity
@Table(indexes = {
    @Index(columnList = "account_id"),
    @Index(columnList = "game_id"),
    @Index(columnList = "team_id")
})
@NamedQuery(name = "Token.findByToken", query = "SELECT t FROM Token t WHERE t.token = :token")
@NamedQuery(name = "Token.findOutdatedTokens", query = "SELECT t FROM Token t WHERE t.remainingUses = 0 OR t.expiryDate < :now")
public abstract class Token extends AbstractEntity {

    /**
     *
     */
    @Id
    @GeneratedValue
    private Long id;

    /**
     * The token itself
     */
    @JsonIgnore
    private String token;

    /**
     * The account the token is linked to. May be null. In this case, a guest will be created if
     * autologin = true, or the user can log in (or signin) with any account
     */
    @ManyToOne
    private AbstractAccount account;

    /**
     * does the token give ability to login automatically ? When true, login as account if any or
     * create a guest otherwise
     */
    boolean autoLogin;

    /**
     * Token will be valid before this expiry Data only
     */
    @Temporal(TemporalType.TIMESTAMP)
    @Column(columnDefinition = "timestamp with time zone")
    private Date expiryDate;

    /**
     * remaining number of uses. A value greater than zero means a limited number of uses. A value
     * of zero means the token is no longer usable and can be destroy. A null value means an
     * unlimited number of uses. Each time the token is consumed, this value is decremented.
     */
    private Long remainingUses;

    /**
     * get the id.
     *
     * @return the id
     */
    @Override
    public Long getId() {
        return id;
    }

    /**
     * Get the token. If linked to an account, the token has been salted and hashed with the account
     * hashMethod
     *
     * @return the token
     */
    public String getToken() {
        return token;
    }

    /**
     * Update the token. If linked to an account, please hash it
     *
     * @param token new token
     */
    public void setToken(String token) {
        this.token = token;
    }

    /**
     * Get account linked to this token, if any
     *
     * @return the account or null
     */
    public AbstractAccount getAccount() {
        return account;
    }

    public void setAccount(AbstractAccount account) {
        this.account = account;
    }

    public boolean isAutoLogin() {
        return autoLogin;
    }

    public void setAutoLogin(boolean autoLogin) {
        this.autoLogin = autoLogin;
    }

    /**
     * Get the expiryDate. null means infinity
     *
     * @return the epiry date or null
     */
    public Date getExpiryDate() {
        if (expiryDate != null) {
            return new Date(expiryDate.getTime());
        } else {
            return null;
        }
    }

    public void setExpiryDate(Date expiryDate) {
        if (expiryDate != null) {
            this.expiryDate = new Date(expiryDate.getTime());
        } else {
            this.expiryDate = null;
        }
    }

    /**
     * Get the number of remaining uses
     *
     * @return number of remaining number of uses or null if that number is unlimited
     */
    public Long getRemainingUses() {
        return remainingUses;
    }

    public void setRemainingUses(Long remainingUses) {
        this.remainingUses = remainingUses;
    }

    /**
     * Once consumed, redirect user to this location
     *
     * @return new client location
     */
    public abstract String getRedirectTo();

    /**
     * Check if the token is still valid. To be valid:
     * <ul>
     * <li>the expiry date (if any) must not have been reached</li>
     * <li>the number of remaining uses must be positive or null (unlimited)</li>
     * </ul>
     *
     * @return
     */
    @JsonIgnore
    public boolean isStillValid() {
        // check expiry date
        if (expiryDate != null) {
            Long now = (new Date()).getTime();
            if (now > expiryDate.getTime()) {
                return false;
            }
        }
        if (remainingUses != null && remainingUses <= 0) {
            return false;
        }
        return true;
    }

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission() {
        if (account != null) {
            return account.getRequieredUpdatePermission();
        } else {
            // admin only
            return WegasMembership.ADMIN;
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

    @Override
    public void updateCacheOnDelete(Beanjection beans) {
        if (this.account != null) {
            AccountFacade accountFacade = beans.getAccountFacade();

            AbstractAccount find = accountFacade.find(this.account.getId());
            if (find != null) {
                find.removeToken(this);
            }
        }

        super.updateCacheOnDelete(beans);
    }

    public abstract void process(AccountFacade accountFacade, HttpServletRequest request);
}
