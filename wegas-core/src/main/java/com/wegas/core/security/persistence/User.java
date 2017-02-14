/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.persistence;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.rest.util.Views;

import javax.persistence.*;
import java.util.*;

////import javax.xml.bind.annotation.XmlTransient;
/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
@Table(name = "users")

@NamedQueries({
    @NamedQuery(name = "User.findUserPermissions", query = "SELECT DISTINCT users FROM User users JOIN users.permissions p WHERE p.value LIKE :instance")
    ,
    @NamedQuery(name = "User.findUsersWithRole", query = "SELECT DISTINCT users FROM User users JOIN users.roles r WHERE r.id = :role_id")
    ,
    @NamedQuery(name = "User.findUserWithPermission", query = "SELECT DISTINCT users FROM User users JOIN users.permissions p WHERE p.value LIKE :permission AND p.user.id =:userId")
})
public class User extends AbstractEntity implements Comparable<User> {

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
    @OneToMany(mappedBy = "user", cascade = {CascadeType.DETACH, CascadeType.MERGE, CascadeType.PERSIST, CascadeType.REFRESH} /*, orphanRemoval = true */)
    @JsonManagedReference(value = "player-user")
    private List<Player> players = new ArrayList<>();

    /**
     *
     */
    @OneToMany(mappedBy = "user", cascade = {CascadeType.ALL}, orphanRemoval = true)
    @JsonManagedReference(value = "user-account")
    private List<AbstractAccount> accounts = new ArrayList<>();

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, mappedBy = "user")
    @JsonIgnore
    private List<Permission> permissions = new ArrayList<>();

    @ManyToMany
    @JsonView(Views.ExtendedI.class)
    @JoinTable(name = "users_roles",
            joinColumns = {
                @JoinColumn(name = "users_id", referencedColumnName = "id")},
            inverseJoinColumns = {
                @JoinColumn(name = "roles_id", referencedColumnName = "id")})
    private Set<Role> roles = new HashSet<>();

    /**
     *
     */
    public User() {
    }

    /**
     * @param acc
     */
    public User(AbstractAccount acc) {
        this.addAccount(acc);
    }

    @Override
    public Long getId() {
        return id;
    }

    @Override
    public void merge(AbstractEntity a) {
        throw new UnsupportedOperationException("Not supported yet.");
    }

    /**
     * @return all user's players
     */
    //@XmlTransient
    @JsonIgnore
    @JsonManagedReference(value = "player-user")
    public List<Player> getPlayers() {
        return players;
    }

    /**
     * @param players the players to set
     */
    @JsonManagedReference(value = "player-user")
    public void setPlayers(List<Player> players) {
        this.players = players;
    }

    /**
     * @return the accounts
     */
    public List<AbstractAccount> getAccounts() {
        return accounts;
    }

    /**
     * @param accounts the accounts to set
     */
    public void setAccounts(List<AbstractAccount> accounts) {
        this.accounts = accounts;
    }

    /**
     * @param account
     */
    public final void addAccount(AbstractAccount account) {
        this.accounts.add(account);
        account.setUser(this);
    }

    /**
     * @return first user account
     */
    //@XmlTransient
    @JsonIgnore
    public final AbstractAccount getMainAccount() {
        if (!this.accounts.isEmpty()) {
            return this.accounts.get(0);
        } else {
            return null;
        }
    }

    /**
     * Shortcut for getMainAccount().getName();
     *
     * @return main account name or unnamed if user doesn't have any account
     */
    public String getName() {
        if (this.getMainAccount() != null) {
            return this.getMainAccount().getName();
        } else {
            return "unnamed";
        }
    }

    /**
     * @return the permissions
     */
    public List<Permission> getPermissions() {
        return this.permissions;
    }

    /**
     * @param permissions the permissions to set
     */
    public void setPermissions(List<Permission> permissions) {
        this.permissions = permissions;
        for (Permission p : this.permissions) {
            p.setUser(this);
        }
    }

    public boolean removePermission(Permission permission) {
        return this.permissions.remove(permission);
    }

    /**
     * @param permission
     * @return true id the permission has successfully been added
     */
    public boolean addPermission(Permission permission) {
        if (!this.permissions.contains(permission)) {
            permission.setUser(this);
            return this.permissions.add(permission);
        } else {
            return false;
        }
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

    @Override
    public int compareTo(User o) {
        return this.getName().toLowerCase(Locale.ENGLISH).compareTo(o.getName().toLowerCase(Locale.ENGLISH));
    }
}
