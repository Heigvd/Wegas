
/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.persistence;

import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import ch.albasim.wegas.annotations.WegasExtraProperty;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.Helper;
import com.wegas.core.ejb.RequestManager.RequestContext;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.persistence.variable.ModelScoped.Visibility;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.aai.AaiAccount;
import com.wegas.core.security.guest.GuestJpaAccount;
import com.wegas.core.security.jparealm.JpaAccount;
import com.wegas.core.security.persistence.token.Token;
import com.wegas.core.security.util.AuthenticationMethod;
import com.wegas.core.security.util.WegasMembership;
import com.wegas.core.security.util.WegasPermission;
import com.wegas.editor.ValueGenerators.EmptyString;
import com.wegas.editor.view.NumberView;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import javax.persistence.Cacheable;
import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.Index;
import javax.persistence.ManyToOne;
import javax.persistence.NamedQuery;
import javax.persistence.OneToMany;
import javax.persistence.OneToOne;
import javax.persistence.Table;
import javax.persistence.Temporal;
import javax.persistence.TemporalType;
import javax.persistence.Transient;

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
@NamedQuery(name = "AbstractAccount.findByEmailOrUserName",
    query = "SELECT a FROM AbstractAccount a WHERE TYPE(a) != GuestJpaAccount AND LOWER(a.details.email) LIKE LOWER(:name) OR LOWER(a.username) LIKE LOWER(:name)")
@NamedQuery(name = "AbstractAccount.findByEmail", query = "SELECT a FROM AbstractAccount a WHERE TYPE(a) != GuestJpaAccount AND LOWER(a.details.email) LIKE LOWER(:email)")
@NamedQuery(name = "AbstractAccount.findByFullName", query = "SELECT a FROM AbstractAccount a WHERE TYPE(a) != GuestJpaAccount AND LOWER(a.firstname) LIKE LOWER(:firstname) AND LOWER(a.lastname) LIKE LOWER(:lastname)")
@NamedQuery(name = "AbstractAccount.findAllNonGuests", query = "SELECT a FROM AbstractAccount a WHERE TYPE(a) != GuestJpaAccount")
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "AaiAccount", value = AaiAccount.class),
    @JsonSubTypes.Type(name = "GuestJpaAccount", value = GuestJpaAccount.class),
    @JsonSubTypes.Type(name = "JpaAccount", value = JpaAccount.class)
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

    @JsonIgnore
    @OneToOne(cascade = {CascadeType.ALL}, fetch = FetchType.LAZY, optional = false)
    private AccountDetails details;

    @JsonIgnore
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, mappedBy = "account")
    private List<Token> tokens = new ArrayList<>();

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

    /**
     *
     */
    @Transient
    @WegasEntityProperty(optional = false, nullable = false,
        view = @View(label = "E-mail"))
    private String email;

    /**
     *
     */
    @Temporal(TemporalType.TIMESTAMP)
    @Column(columnDefinition = "timestamp with time zone")
    @JsonIgnore
    private Date createdTime = new Date();

    /**
     * When the terms of use have been agreed to by the user (usually at signup, except for guests
     * and long time users)
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

    private String emailDomain;

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
        // bad design as name is a computed property
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
        // TODO clean backward compat scoriae
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

    public void shadowEmail() {
        if (this.email != null && !this.email.isEmpty() && !this.email.equals(this.getDetails().getEmail())) {
            this.getDetails().setEmail(this.email);
            this.setEmailDomain(Helper.getDomainFromEmailAddress(email));
            if (this instanceof JpaAccount) {
                ((JpaAccount) this).setVerified(false);
            }
        }
        this.email = null;
    }

    @JsonView({Views.ShadowI.class, Views.EditorI.class})
    public String getEmail() {
        if (this.email != null) {
            return this.email;
        } else if (this.getDetails() != null) {
            return getDetails().getEmail();
        } else {
            return null;
        }
    }

    /**
     *
     * @return the email
     */
    @JsonIgnore
    public String getDeserialisedEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    @WegasExtraProperty(view = @View(label = "Domain"))
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    public String getEmailDomain() {
        return emailDomain;
    }

    public void setEmailDomain(String emailDomain) {
        this.emailDomain = emailDomain;
    }

    public abstract Boolean isVerified();

    /**
     * @return md5 address hash
     */
    @JsonView(Views.ExtendedI.class)
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

    public List<Token> getTokens() {
        return tokens;
    }

    public void setTokens(List<Token> tokens) {
        this.tokens = tokens;
        if (this.tokens != null) {
            for (Token t : tokens) {
                t.setAccount(this);
            }
        }
    }

    /**
     * " To keep the JPA cache up to date
     *
     * @param token token to add
     */
    public void addToken(Token token) {
        if (token != null) {
            token.setAccount(this);
            this.tokens.add(token);
        }
    }

    /**
     * Remove the token from account token list. This method does not destroy the given token. It's
     * used to keep the JPA cache up to date
     *
     * @param token token to remove
     */
    public void removeToken(Token token) {
        this.tokens.remove(token);
    }

    @JsonIgnore
    public abstract AuthenticationMethod getAuthenticationMethod();

    @Override
    public Collection<WegasPermission> getRequieredCreatePermission(RequestContext context) {
        return null;
    }

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission(RequestContext context) {
        // nobody but the user itset can edit its account
        Collection<WegasPermission> p = WegasPermission.getAsCollection(
            this.getUser().getAssociatedWritePermission()
        );
        return p;
    }

    @Override
    public Collection<WegasPermission> getRequieredReadPermission(RequestContext context) {
        Collection<WegasPermission> p = this.getRequieredUpdatePermission(context);

        /**
         * In order to share gameModels and games with others trainer/scenarist a trainer/scenario
         * must be able to read basic info about others trainer/scenarist
         */
        if (this.getUser().isMemberOf("Trainer")
            || this.getUser().isMemberOf("Scenarist")
            || this.getUser().isMemberOf("Administrator")) {
            p.addAll(WegasMembership.TRAINER);
        }

        /**
         * Members of the same team known each other
         */
        p.addAll(this.getUser().getPlayersTeamsRelatedPermissions());

        /**
         * Trainers of game in which the user plays known the players
         */
        p.addAll(this.getUser().getPlayerGameRelatedPermissions());

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
