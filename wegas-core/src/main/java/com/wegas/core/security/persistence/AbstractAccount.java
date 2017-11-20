/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.persistence;

import com.fasterxml.jackson.annotation.*;
import com.wegas.core.Helper;
import com.wegas.core.exception.client.WegasIncompatibleType;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.ListUtils;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.aai.AaiAccount;
import com.wegas.core.security.facebook.FacebookAccount;
import com.wegas.core.security.guest.GuestJpaAccount;
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
@NamedQueries({
    @NamedQuery(name = "AbstractAccount.findByUsername", query = "SELECT a FROM AbstractAccount a WHERE TYPE(a) != GuestJpaAccount AND a.username = :username"),
    @NamedQuery(name = "AbstractAccount.findByEmail", query = "SELECT a FROM AbstractAccount a WHERE TYPE(a) != GuestJpaAccount AND LOWER(a.email) LIKE LOWER(:email)"),
    @NamedQuery(name = "AbstractAccount.findByFullName", query = "SELECT a FROM AbstractAccount a WHERE TYPE(a) != GuestJpaAccount AND LOWER(a.firstname) LIKE LOWER(:firstname) AND LOWER(a.lastname) LIKE LOWER(:lastname)"),
    @NamedQuery(name = "AbstractAccount.findAllNonGuests", query = "SELECT a FROM AbstractAccount a WHERE TYPE(a) != GuestJpaAccount")
})
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "AaiAccount", value = AaiAccount.class),
    @JsonSubTypes.Type(name = "FacebookAccount", value = FacebookAccount.class),
    @JsonSubTypes.Type(name = "GuestJpaAccount", value = GuestJpaAccount.class),
    @JsonSubTypes.Type(name = "JpaAccount", value = com.wegas.core.security.jparealm.JpaAccount.class)
})
@JsonIgnoreProperties({"passwordConfirm"})
@Table(indexes = {
    @Index(columnList = "user_id")
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

    /**
     *
     */
    //@Basic(optional = false)
    @Column(length = 100)
    //@Pattern(regexp = "^\\w+$")
    private String username = "";

    /**
     *
     */
    private String firstname;

    /**
     *
     */
    private String lastname;

    /**
     *
     */
    private String email = "";

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
    private Date agreedTime = null;

    /**
     *
     */
    //@ElementCollection(fetch = FetchType.EAGER)
    // Backward Compatibility
    @JsonView(Views.ExtendedI.class)
    @Transient
    private List<Permission> permissions = new ArrayList<>();

    /**
     *
     */
    @JsonView(Views.ExtendedI.class)
    @Transient
    private Set<Role> roles = new HashSet<>();

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

    @Override
    public void merge(AbstractEntity other) {
        if (other instanceof AbstractAccount) {
            AbstractAccount a = (AbstractAccount) other;
            this.setFirstname(a.getFirstname());
            this.setLastname(a.getLastname());
            this.setUsername(a.getUsername());
            this.setEmail(a.getEmail());
            if (a.getAgreedTime()!=null) {
                // Never reset this attribute:
                this.setAgreedTime(a.getAgreedTime());
            }
            if (a.getDeserializedPermissions() != null && !a.getDeserializedPermissions().isEmpty()) {
                // Pass through setter to update user
                this.getUser().setPermissions(ListUtils.mergeLists(this.getUser().getPermissions(), a.getDeserializedPermissions()));
            }
        } else {
            throw new WegasIncompatibleType(this.getClass().getSimpleName() + ".merge (" + other.getClass().getSimpleName() + ") is not possible");
        }
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
     * @return the roles
     */
    public Set<Role> getRoles() {
        return user.getRoles();
    }

    @JsonIgnore
    public Set<Role> getDeserialisedRoles() {
        return roles;
    }

    /**
     * @param roles the roles to set
     */
    public void setRoles(Set<Role> roles) {
        this.roles = roles;
    }

    /**
     * @return the permissions
     */
    public List<Permission> getPermissions() {
        return this.user.getPermissions();
    }

    @JsonIgnore
    public List<Permission> getDeserializedPermissions() {
        return this.permissions;
    }

    /**
     * @param permissions the permissions to set
     */
    public void setPermissions(List<Permission> permissions) {
        this.permissions = permissions;
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

    /**
     *
     * @return the email
     */
    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
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

    public Date getAgreedTime() {
        return agreedTime != null ? new Date(agreedTime.getTime()) : null;
    }

    public void setAgreedTime(Date agreedTime) {
        this.agreedTime = agreedTime != null ? new Date(agreedTime.getTime()) : null;
    }

}
