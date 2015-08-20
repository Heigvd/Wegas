/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.persistence;

import com.wegas.core.security.guest.GuestJpaAccount;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.ListUtils;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.facebook.FacebookAccount;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import javax.persistence.*;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonView;
//////import javax.xml.bind.annotation.XmlTransient;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@Cacheable(true)
@Table(indexes = {
    @Index(columnList = "username", unique = true),
    @Index(columnList = "email", unique = true)
})
@NamedQueries({
    @NamedQuery(name = "findUserPermissions", query = "SELECT DISTINCT accounts FROM AbstractAccount accounts JOIN accounts.permissions p WHERE p.value LIKE :instance"),
    @NamedQuery(name = "AbstractAccount.findByUsername", query = "SELECT a FROM AbstractAccount a WHERE a.username = :username")
})
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "FacebookAccount", value = FacebookAccount.class),
    @JsonSubTypes.Type(name = "GuestJpaAccount", value = GuestJpaAccount.class),
    @JsonSubTypes.Type(name = "JpaAccount", value = com.wegas.core.security.jparealm.JpaAccount.class),
    @JsonSubTypes.Type(name = "GameAccount", value = com.wegas.core.security.jparealm.GameAccount.class)
})
@JsonIgnoreProperties({"passwordConfirm"})
public class AbstractAccount extends AbstractEntity {

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
    @ManyToOne(cascade = {CascadeType.ALL}, optional = false)
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
    @Temporal(TemporalType.TIMESTAMP)
    @JsonIgnore
    private Date createdTime = new Date();
    /**
     *
     */
    //@ElementCollection(fetch = FetchType.EAGER)
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, mappedBy = "account")
    @JsonView(Views.ExtendedI.class)
    private List<Permission> permissions = new ArrayList<>();
    /**
     *
     */
    @ManyToMany
    @JsonView(Views.ExtendedI.class)
    @JoinTable(name = "abstractaccount_roles",
            joinColumns = {
                @JoinColumn(name = "abstractaccount_id", referencedColumnName = "id")},
            inverseJoinColumns = {
                @JoinColumn(name = "roles_id", referencedColumnName = "id")})
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
        AbstractAccount a = (AbstractAccount) other;
        this.setFirstname(a.getFirstname());
        this.setLastname(a.getLastname());
        this.setUsername(a.getUsername());
        ListUtils.mergeLists(this.permissions, a.getPermissions());
    }

    /**
     * @return the user
     */
    //@XmlTransient
    @JsonIgnore
    public User getUser() {
        return user;
    }

    /**
     * @param user the user to set
     */
    //@XmlTransient
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
        return roles;
    }

    /**
     * @param roles the roles to set
     */
    public void setRoles(Set<Role> roles) {
        this.roles = roles;
    }

    /**
     *
     * @param role
     */
    public void addRole(Role role) {
        this.roles.add(role);
    }

    /**
     * strike out this account from the role
     *
     * @param role
     */
    public void removeRole(Role role) {
        this.roles.remove(role);
    }

    /**
     * @return the permissions
     */
    public List<Permission> getPermissions() {
        return permissions;
    }

    /**
     * @param permissions the permissions to set
     */
    public void setPermissions(List<Permission> permissions) {
        this.permissions = permissions;
        for (Permission p : this.permissions) {
            p.setAccount(this);
        }
    }

    /**
     *
     * @param permission
     */
    public void removePermission(String permission) {
        this.permissions.remove(new Permission(permission));
    }

    /**
     *
     * @param permission
     * @param inducedPermission
     * @return
     */
    public boolean addPermission(String permission, String inducedPermission) {
        return this.addPermission(new Permission(permission, inducedPermission));
    }

    /**
     *
     * @param permission
     * @return
     */
    public boolean addPermission(String permission) {
        return this.addPermission(new Permission(permission));
    }

    /**
     *
     * @param permission
     * @return
     */
    public boolean addPermission(Permission permission) {
        if (!this.permissions.contains(permission)) {
            permission.setAccount(this);
            return this.permissions.add(permission);
        } else {
            return false;
        }
    }

    /**
     * @return the createdTime
     */
    public Date getCreatedTime() {
        return createdTime;
    }

    /**
     * @param createdTime the createdTime to set
     */
    public void setCreatedTime(Date createdTime) {
        this.createdTime = createdTime;
    }
}
