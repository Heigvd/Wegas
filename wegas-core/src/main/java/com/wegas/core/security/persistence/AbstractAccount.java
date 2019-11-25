/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.persistence;

import ch.albasim.wegas.annotations.IMergeable;
import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasCallback;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import ch.albasim.wegas.annotations.WegasExtraProperty;
import com.fasterxml.jackson.annotation.*;
import com.wegas.core.Helper;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.persistence.variable.ModelScoped.Visibility;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.aai.AaiAccount;
import com.wegas.core.security.facebook.FacebookAccount;
import com.wegas.core.security.guest.GuestJpaAccount;
import com.wegas.core.security.util.WegasPermission;
import com.wegas.editor.ValueGenerators.EmptyString;
import com.wegas.editor.View.Hidden;
import com.wegas.editor.View.NumberView;
import java.util.*;
import javax.persistence.*;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
@Cacheable(true)
/*
 Those indexes must partial index (ie. with a WHERE clause).
 Tests will failed if not
 This is not possible with JPA, but with eclipselink

 @Table(indexes = {
 @Index(columnList = "username", unique = true),
 @Index(columnList = "email", unique = true)
 })*/
@NamedQuery(name = "AbstractAccount.findByUsername", query = "SELECT a FROM AbstractAccount a WHERE TYPE(a) != GuestJpaAccount AND a.username = :username")
@NamedQuery(name = "AbstractAccount.findByEmail", query = "SELECT a FROM AbstractAccount a WHERE TYPE(a) != GuestJpaAccount AND LOWER(a.details.email) LIKE LOWER(:email)")
@NamedQuery(name = "AbstractAccount.findByFullName", query = "SELECT a FROM AbstractAccount a WHERE TYPE(a) != GuestJpaAccount AND LOWER(a.firstname) LIKE LOWER(:firstname) AND LOWER(a.lastname) LIKE LOWER(:lastname)")
@NamedQuery(name = "AbstractAccount.findAllNonGuests", query = "SELECT a FROM AbstractAccount a WHERE TYPE(a) != GuestJpaAccount")
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "AaiAccount", value = AaiAccount.class),
    @JsonSubTypes.Type(name = "FacebookAccount", value = FacebookAccount.class),
    @JsonSubTypes.Type(name = "GuestJpaAccount", value = GuestJpaAccount.class),
    @JsonSubTypes.Type(name = "JpaAccount", value = com.wegas.core.security.jparealm.JpaAccount.class)
})
@JsonIgnoreProperties({"passwordConfirm"})
@Table(indexes = {
    @Index(columnList = "user_id"),
    @Index(columnList = "shadow_id"),
    @Index(columnList = "details_id")
})
public abstract class AbstractAccount extends AbstractEntity {

    private static final long serialVersionUID = 1L;

    /**
     *
     */
    @Id
    @GeneratedValue
    private Long id;
    /**
     *
     */
    @ManyToOne(cascade = {CascadeType.DETACH, CascadeType.MERGE, CascadeType.PERSIST, CascadeType.REFRESH}, optional = false)
    @JsonBackReference(value = "user-account")
    private User user;

    @JsonIgnore
    @OneToOne(cascade = {CascadeType.ALL}, fetch = FetchType.LAZY, optional = false)
    private Shadow shadow;

    @OneToOne(cascade = {CascadeType.ALL}, fetch = FetchType.LAZY, optional = false)
    @WegasEntityProperty(callback = CensorEmail.class, optional = false, nullable = false,
        view = @View(label = ""))
    @JsonManagedReference
    @JsonView(Views.Extended.class)
    private AccountDetails details;

    /**
     *
     */
    //@Basic(optional = false)
    @Column(length = 100)
    //@Pattern(regexp = "^\\w+$")
    @WegasEntityProperty(view = @View(label = "Username"), optional = false, nullable = false)
    private String username = "";

    /**
     *
     */
    @WegasEntityProperty(view = @View(label = "Firstname"), optional = false, nullable = false)
    private String firstname;

    /**
     *
     */
    @WegasEntityProperty(view = @View(label = "Lastname"), optional = false, nullable = false)
    private String lastname;

    private String censoredEmail;

    /**
     *
     */
    @Temporal(TemporalType.TIMESTAMP)
    @Column(columnDefinition = "timestamp with time zone")
    @JsonIgnore
    private Date createdTime = new Date();

    /**
     * When the terms of use have been agreed to by the user (usually at signup, except for guests and long time users)
     */
    @Temporal(TemporalType.TIMESTAMP)
    @Column(columnDefinition = "timestamp with time zone")
    @WegasEntityProperty(ignoreNull = true, optional = false, nullable = false,
        view = @View(label = "Agreed time", readOnly = true, value = NumberView.class))
    private Date agreedTime = null;

    /**
     * Optional remarks only visible to admins
     */
    @WegasEntityProperty(ignoreNull = true, optional = false, nullable = false,
        proposal = EmptyString.class, view = @View(label = "Comment"))
    private String comment = "";

    /**
     *
     */
    @JsonView(Views.ExtendedI.class)
    @Transient
    private Collection<Role> roles = new HashSet<>();

    /**
     * @return the id
     */
    @Override
    public Long getId() {
        return id;
    }

    /**
     * @param id the id to set
     */
    public void setId(Long id) {
        this.id = id;
    }

    /**
     * @return the user
     */
    @JsonIgnore
    public User getUser() {
        return user;
    }

    /**
     * @param user the user to set
     */
    @JsonIgnore
    public void setUser(User user) {
        this.user = user;
    }

    public Shadow getShadow() {
        return shadow;
    }

    public void setShadow(Shadow shadow) {
        this.shadow = shadow;
        if (shadow != null) {
            this.shadow.setAccount(this);
            this.shadow.setSaltOnPrePersist();
        }
    }

    public AccountDetails getDetails() {
        return details;
    }

    public void setDetails(AccountDetails details) {
        this.details = details;
        if (this.details != null) {
            this.details.setAccount(this);
        }
    }

    /**
     * @return the username
     */
    public String getUsername() {
        return username;
    }

    /**
     * @param username the username to set
     */
    public void setUsername(String username) {
        this.username = username;
    }

    /**
     * @return the name
     */
    public String getName() {
        if (this.getFirstname() != null && this.getLastname() != null) {
            return this.getFirstname() + " " + this.getLastname();
        } else if (this.getLastname() != null) {
            return this.getLastname();
        } else if (this.getFirstname() != null) {
            return this.getFirstname();
        } else if (this.getUsername() != null) {
            return this.getUsername();
        } else {
            return "";
        }
    }

    public void setName(String name) {
    }

    /**
     * @return the first name
     */
    public String getFirstname() {
        return firstname;
    }

    /**
     * @param firstname the firstname to set
     */
    public void setFirstname(String firstname) {
        this.firstname = firstname;
    }

    /**
     * @return the lastname
     */
    public String getLastname() {
        return lastname;
    }

    /**
     * @param lastname the lastname to set
     */
    public void setLastname(String lastname) {
        this.lastname = lastname;
    }

    /**
     * @return the comment
     */
    public String getComment() {
        return comment;
    }

    /**
     * @param comment the comment to set
     */
    public void setComment(String comment) {
        this.comment = comment;
    }

    /**
     * @return the roles
     */
    public Collection<Role> getRoles() {
        if (this.user != null) {
            return user.getRoles();
        } else {
            return null;
        }
    }

    @JsonIgnore
    public Collection<Role> getDeserialisedRoles() {
        return roles;
    }

    /**
     * @param roles the roles to set
     */
    public void setRoles(Collection<Role> roles) {
        this.roles = roles;
    }

    /**
     * @return the permissions
     */
    public List<Permission> getPermissions() {
        if (this.user != null) {
            return this.user.getPermissions();
        } else {
            return null;
        }
    }

    /**
     *
     * @param permissions
     */
    public void setPermissions(List<Permission> permissions) {
    }

    /**
     * @return the createdTime
     */
    public Date getCreatedTime() {
        return createdTime != null ? new Date(createdTime.getTime()) : null;
    }

    /**
     * @param createdTime the createdTime to set
     */
    public void setCreatedTime(Date createdTime) {
        this.createdTime = createdTime != null ? new Date(createdTime.getTime()) : null;
    }

    @WegasExtraProperty(view = @View(value = Hidden.class, label = ""))
    public String getCensoredEmail() {
        return censoredEmail;
    }

    public void setCensoredEmail(String censoredEmail) {
        this.censoredEmail = censoredEmail;
    }

    public void censorEmail() {
        String email = this.getDetails().getEmail();
        if (Helper.isNullOrEmpty(email)) {
            this.censoredEmail = Helper.anonymizeEmail(details.getEmail());
        } else {
            this.censoredEmail = "•••••@•••••";
        }
    }

    public abstract Boolean isVerified();

    /**
     * @return md5 address hash
     */
    public String getHash() {
        if (getDetails() != null && getDetails().getEmail() != null) {
            return Helper.md5Hex(getDetails().getEmail());

        } else {
            return Helper.md5Hex("default");
        }
    }

    public void setHash(String hash) {
        /* Jackson useless sugar */
    }

    public Date getAgreedTime() {
        return agreedTime != null ? new Date(agreedTime.getTime()) : null;
    }

    public void setAgreedTime(Date agreedTime) {
        this.agreedTime = agreedTime != null ? new Date(agreedTime.getTime()) : null;
    }

    @Override
    public Collection<WegasPermission> getRequieredCreatePermission() {
        return null;
    }

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission() {
        return this.getUser().getRequieredUpdatePermission();
    }

    @Override
    public Collection<WegasPermission> getRequieredReadPermission() {
        return this.getUser().getRequieredReadPermission();
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

    public static class CensorEmail implements WegasCallback {

        @Override
        public void postUpdate(IMergeable entity, Object ref, Object identifier) {
            if (entity instanceof AbstractAccount) {
                AbstractAccount account = (AbstractAccount) entity;
                if (account.getDetails().isEmailJustChanged()) {
                    account.censorEmail();
                }
            }
        }
    }
}
