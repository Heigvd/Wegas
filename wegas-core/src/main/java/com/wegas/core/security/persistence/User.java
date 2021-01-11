/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.persistence;

import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasExtraProperty;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.ModelScoped.Visibility;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.util.WegasEntityPermission;
import com.wegas.core.security.util.WegasIsTeamMate;
import com.wegas.core.security.util.WegasIsTrainerForUser;
import com.wegas.core.security.util.WegasMembership;
import com.wegas.core.security.util.WegasPermission;
import com.wegas.editor.view.StringView;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.JoinTable;
import javax.persistence.ManyToMany;
import javax.persistence.NamedQuery;
import javax.persistence.OneToMany;
import javax.persistence.Table;
import javax.persistence.Temporal;
import javax.persistence.TemporalType;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
@Table(name = "users")
@NamedQuery(name = "User.findUserPermissions", query = "SELECT DISTINCT users FROM User users JOIN users.permissions p WHERE p.value LIKE :instance")
@NamedQuery(name = "User.findUsersWithRole", query = "SELECT DISTINCT users FROM User users JOIN users.roles r WHERE r.id = :role_id")
@NamedQuery(name = "User.findUserWithPermission", query = "SELECT DISTINCT users FROM User users JOIN users.permissions p WHERE p.value LIKE :permission AND p.user.id =:userId")
public class User extends AbstractEntity implements Comparable<User>, PermissionOwner {

    private static final long serialVersionUID = 1L;

    /**
     *
     */
    @Id
    @GeneratedValue
    private Long id;

    /**
     * last activity date
     */
    @Temporal(TemporalType.TIMESTAMP)
    @Column(columnDefinition = "timestamp with time zone")
    @JsonIgnore
    private Date lastSeenAt = null;

    /**
     *
     */
    @OneToMany(mappedBy = "user", cascade = {
        CascadeType.DETACH,
        CascadeType.MERGE,
        CascadeType.PERSIST,
        CascadeType.REFRESH
    } /*, orphanRemoval = true */)
    //@JsonManagedReference(value = "player-user")
    @JsonIgnore
    private List<Player> players = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "createdBy", cascade = {
        CascadeType.DETACH,
        CascadeType.MERGE,
        CascadeType.PERSIST,
        CascadeType.REFRESH
    } /*, orphanRemoval = true */)
    private List<Team> teams = new ArrayList<>();

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
            @JoinColumn(name = "user_id", referencedColumnName = "id")},
        inverseJoinColumns = {
            @JoinColumn(name = "role_id", referencedColumnName = "id")})
    private Collection<Role> roles = new ArrayList<>();

    /**
     *
     */
    public User() {
        // ensure there is a default constructor
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

    public Date getLastSeenAt() {
        return lastSeenAt != null ? new Date(lastSeenAt.getTime()) : null;
    }

    public void setLastSeenAt(Date lastSeenAt) {
        this.lastSeenAt = lastSeenAt != null ? new Date(lastSeenAt.getTime()) : null;
    }

    /**
     * @return all user's players
     */
    //@JsonIgnore
    //@JsonManagedReference(value = "player-user")
    public List<Player> getPlayers() {
        return players;
    }

    /**
     * @param players the players to set
     */
    //@JsonManagedReference(value = "player-user")
    public void setPlayers(List<Player> players) {
        this.players = players;
    }

    public List<Team> getTeams() {
        return teams;
    }

    public void setTeams(List<Team> teams) {
        this.teams = teams;
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
    @WegasExtraProperty(optional = false, nullable = true, view = @View(
        label = "Name",
        readOnly = true,
        value = StringView.class
    ))
    public String getName() {
        if (this.getMainAccount() != null) {
            return this.getMainAccount().getName();
        } else {
            return "unnamed";
        }
    }

    public void setName(String name) {
        // hardcoded name
    }

    /**
     * {@inheritDoc }
     */
    @Override
    public List<Permission> getPermissions() {
        return this.permissions;
    }

    /**
     * {@inheritDoc }
     */
    @Override
    public void setPermissions(List<Permission> permissions) {
        this.permissions = permissions;
        for (Permission p : this.permissions) {
            p.setUser(this);
        }
    }

    /**
     * {@inheritDoc }
     */
    @Override
    public boolean addPermission(Permission permission) {
        if (!this.hasPermission(permission)) {
            permission.setUser(this);
            return this.permissions.add(permission);
        }
        return false;
    }

    public boolean isMemberOf(String roleName) {
        for (Role r : roles) {
            if (r.getName().equals(roleName)) {
                return true;
            }
        }
        return false;
    }

    /**
     * @return the roles
     */
    public Collection<Role> getRoles() {
        return roles;
    }

    /**
     * @param roles the roles to set
     */
    public void setRoles(Collection<Role> roles) {
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

    @JsonIgnore
    public WegasPermission getAssociatedReadPermission() {
        return new WegasEntityPermission(this.getId(), WegasEntityPermission.Level.READ, WegasEntityPermission.EntityType.USER);
    }

    @JsonIgnore
    public WegasPermission getAssociatedWritePermission() {
        return new WegasEntityPermission(this.getId(), WegasEntityPermission.Level.WRITE, WegasEntityPermission.EntityType.USER);
    }

    /**
     * Return all Team write permission which the use is member of (i.e user team-mate)
     *
     * @return
     */
    @JsonIgnore
    public Collection<WegasPermission> getPlayersTeamsRelatedPermissions() {
        return WegasPermission.getAsCollection(
            new WegasIsTeamMate(id)
        );
    }

    /**
     * Return all game write permission which the use is member of (as player)
     *
     * @return
     */
    @JsonIgnore
    public Collection<WegasPermission> getPlayerGameRelatedPermissions() {
        return WegasPermission.getAsCollection(
            new WegasIsTrainerForUser(id)
        );
    }

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission() {
        Collection<WegasPermission> p = WegasPermission.getAsCollection(
            this.getAssociatedWritePermission()
        );
        p.addAll(WegasMembership.TRAINER); // why ? maybe to share game/gameModel (ie add permission)
        return p;
    }

    @Override
    public Collection<WegasPermission> getRequieredReadPermission() {
        return null;
    }

    @Override
    public Collection<WegasPermission> getRequieredCreatePermission() {
        //Sign-Up
        return null;
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
