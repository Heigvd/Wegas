/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.persistence;

import com.wegas.core.security.guest.GuestJpaAccount;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.security.facebook.FacebookAccount;
import java.util.HashSet;
import java.util.Set;
import javax.persistence.*;
import org.codehaus.jackson.annotate.JsonBackReference;
import org.codehaus.jackson.annotate.JsonIgnoreProperties;
import org.codehaus.jackson.annotate.JsonSubTypes;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@Cacheable(true)
@Table(uniqueConstraints = {
    @UniqueConstraint(columnNames = "email")
})
@NamedQueries({
    @NamedQuery(name = "findUserPermissions", query = "SELECT DISTINCT abstractaccount FROM AbstractAccount abstractaccount WHERE abstractaccount.permissions LIKE :gameId"),})
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "FacebookAccount", value = FacebookAccount.class),
    @JsonSubTypes.Type(name = "GuestJpaAccount", value = GuestJpaAccount.class),
    @JsonSubTypes.Type(name = "JpaAccount", value = com.wegas.core.security.jparealm.JpaAccount.class)
})
@JsonIgnoreProperties({"passwordConfirm"})
public class AbstractAccount extends AbstractEntity {

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
    //@Pattern(regexp = "^\\w+$")
    @Basic(optional = false)
    @Column(length = 100)
    private String username;
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
    private String email;
    /**
     *
     */
    @ElementCollection
    private Set<String> permissions = new HashSet<>();
    /**
     *
     */
    @ManyToMany
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
        this.setEmail(a.getEmail());
        this.setFirstname(a.getFirstname());
        this.setLastname(a.getLastname());
        this.setEmail(a.getEmail());
        this.setUsername(a.getUsername());
        this.setPermissions(a.getPermissions());
    }

    /**
     * @return the user
     */
    public User getUser() {
        return user;
    }

    /**
     * @param user the user to set
     */
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
        return this.getFirstname() + " " + this.getLastname();
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
     * @return the email
     */
    public String getEmail() {
        return email;
    }

    /**
     * @param email the email to set
     */
    public void setEmail(String email) {
        this.email = email;
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
     * @return the permissions
     */
    public Set<String> getPermissions() {
        return permissions;
    }

    /**
     * @param permissions the permissions to set
     */
    public void setPermissions(Set<String> permissions) {
        this.permissions = permissions;
    }

    /**
     *
     * @param permission
     */
    public void removePermission(String permission) {
        this.permissions.remove(permission);
    }

    /**
     *
     * @param permission
     */
    public void addPermission(String permission) {
        this.permissions.add(permission);
    }
}
