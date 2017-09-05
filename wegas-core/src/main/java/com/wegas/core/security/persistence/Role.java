/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.persistence;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wegas.core.exception.client.WegasIncompatibleType;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.ListUtils;
import com.wegas.core.merge.annotations.WegasEntityProperty;

import javax.persistence.*;
import java.util.*;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
@Table(name = "roles", uniqueConstraints = {
    @UniqueConstraint(columnNames = "name")
})
@Cacheable(true)
@NamedQueries({
    @NamedQuery(name = "Role.findByName", query = "SELECT a FROM Role a WHERE a.name = :name")})
public class Role extends AbstractEntity {

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
    @Basic(optional = false)
    @Column(length = 100)
    @WegasEntityProperty
    private String name;

    /**
     *
     */
    @Basic(optional = false)
    @Column(length = 255)
    @WegasEntityProperty
    private String description;

    /**
     *
     */
    //@ElementCollection(fetch = FetchType.EAGER)
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, mappedBy = "role")
    @WegasEntityProperty
    private List<Permission> permissions = new ArrayList<>();

    /**
     *
     */
    /*@JsonIgnore
     @ManyToMany(mappedBy = "roles")
     private Set<AbstractAccount> abstractAccounts = new HashSet<>();*/
    @JsonIgnore
    @ManyToMany(mappedBy = "roles")
    private Set<User> users = new HashSet<>();

    /**
     *
     */
    protected Role() {
    }

    /**
     * Create a role with the specified name
     *
     * @param name role name
     */
    public Role(String name) {
        this.name = name;
    }


    @Override
    public Long getId() {
        return id;
    }

    /**
     * @param id
     */
    public void setId(Long id) {
        this.id = id;
    }

    /**
     * Get the role name
     *
     * @return the role name
     */
    public String getName() {
        return name;
    }

    /**
     * @param name
     */
    public void setName(String name) {
        this.name = name;
    }

    /**
     * get role description
     *
     * @return the role description
     */
    public String getDescription() {
        return description;
    }

    /**
     * @param description
     */
    public void setDescription(String description) {
        this.description = description;
    }

    /**
     * @return all role permissions
     */
    public List<Permission> getPermissions() {
        return permissions;
    }

    /**
     * @param permissions
     */
    public void setPermissions(List<Permission> permissions) {
        this.permissions = permissions;
        for (Permission p : this.permissions) {
            p.setRole(this);
        }
    }

    /**
     * @param permission
     * @return true if the permission has successfully been added
     */
    public boolean addPermission(String permission) {
        return this.addPermission(new Permission(permission));
    }

    /**
     * @param permission
     * @return true if the permission has successfully been added
     */
    public boolean addPermission(Permission permission) {
        if (!this.permissions.contains(permission)) {
            permission.setRole(this);
            return this.permissions.add(permission);
        } else {
            return false;
        }
    }

    /**
     * @param permission
     * @return true if the permission has successfully been removed
     */
    public boolean removePermission(String permission) {
        return this.removePermission(new Permission(permission));
    }


    public boolean removePermission(Permission permission) {
        Permission currPerm;
        boolean returnVal = false;
        Iterator<Permission> it = this.permissions.iterator();
        while (it.hasNext()) {
            currPerm = it.next();
            if (currPerm.equals(permission)) {
                it.remove();
                returnVal = true;
            }
        }
        return returnVal;
    }

    /**
     * count the number of user with this role
     *
     * @return member's count
     */
    public int getNumberOfMember() {
        return users.size();
    }

    /**
     *
     * @param numberOfMember
     */
    public void setNumberOfMember(int numberOfMember) {
        // NoOp
    }

    /**
     * get role members
     *
     * @return all users which are member of this role
     */
    public Set<User> getUsers() {
        return users;
    }

    /**
     * set the role members
     *
     * @param users list of member
     */
    public void setUsers(Set<User> users) {
        this.users = users;
    }

    /**
     * register new user within the role
     *
     * @param user
     */
    public void addUser(User user) {
        this.users.add(user);
    }

    /**
     * strike out this account from the role
     *
     * @param user user to remove
     */
    public void removeUser(User user) {
        this.users.remove(user);
    }

    @Override
    public String toString() {
        return "Role(" + this.id + ", " + this.name + ")";
    }
}
