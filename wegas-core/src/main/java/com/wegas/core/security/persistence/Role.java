/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.persistence;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wegas.core.exception.client.WegasIncompatibleType;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.ListUtils;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Set;
import javax.persistence.*;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
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
    private String name;
    /**
     *
     */
    @Basic(optional = false)
    @Column(length = 255)
    private String description;
    /**
     *
     */
    //@ElementCollection(fetch = FetchType.EAGER)
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, mappedBy = "role")
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
     *
     * @param name
     */
    public Role(String name) {
        this.name = name;
    }

    @Override
    public void merge(AbstractEntity other) {
        if (other instanceof Role) {
            Role r = (Role) other;
            this.setName(r.getName());
            this.setDescription(r.getDescription());
            ListUtils.mergeLists(this.permissions, r.getPermissions());
        } else {
            throw new WegasIncompatibleType(this.getClass().getSimpleName() + ".merge (" + other.getClass().getSimpleName() + ") is not possible");
        }
    }

    /**
     *
     * @return
     */
    @Override
    public Long getId() {
        return id;
    }

    /**
     *
     * @param id
     */
    public void setId(Long id) {
        this.id = id;
    }

    /**
     *
     * @return
     */
    public String getName() {
        return name;
    }

    /**
     *
     * @param name
     */
    public void setName(String name) {
        this.name = name;
    }

    /**
     *
     * @return
     */
    public String getDescription() {
        return description;
    }

    /**
     *
     * @param description
     */
    public void setDescription(String description) {
        this.description = description;
    }

    /**
     *
     * @return
     */
    public List<Permission> getPermissions() {
        return permissions;
    }

    /**
     *
     * @param permissions
     */
    public void setPermissions(List<Permission> permissions) {
        this.permissions = permissions;
        for (Permission p : this.permissions) {
            p.setRole(this);
        }
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
            permission.setRole(this);
            return this.permissions.add(permission);
        } else {
            return false;
        }
    }

    /**
     *
     * @param permission
     * @return
     */
    public boolean removePermission(String permission) {
        Permission perm = new Permission(permission);
        Permission currPerm;
        boolean returnVal = false;
        Iterator<Permission> it = this.permissions.iterator();
        while (it.hasNext()) {
            currPerm = it.next();
            if (currPerm.equals(perm)) {
                it.remove();
                returnVal = true;
            }
        }
        return returnVal;
    }

    public int getNumberOfMember() {
        return users.size();
        //return abstractAccounts.size();
    }

    public void setNumberOfMember(int numberOfMember) {
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
     * @param role
     */
    public void addUser(User user) {
        this.users.add(user);
    }

    /**
     * strike out this account from the role
     *
     * @param role
     */
    public void removeUser(User user) {
        this.users.remove(user);
    }



    @Override
    public String toString() {
        return "Role(" + this.id + ", " + this.name + ")";
    }
}
