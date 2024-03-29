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
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wegas.core.ejb.RequestManager.RequestContext;
import com.wegas.core.ejb.WebsocketFacade;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.persistence.variable.ModelScoped.Visibility;
import com.wegas.core.security.util.WegasMembership;
import com.wegas.core.security.util.WegasPermission;
import com.wegas.editor.ValueGenerators.EmptyArray;
import com.wegas.editor.view.Textarea;
import java.util.*;
import jakarta.persistence.Basic;
import jakarta.persistence.Cacheable;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.NamedNativeQuery;
import jakarta.persistence.NamedQuery;
import jakarta.persistence.OneToMany;
import jakarta.persistence.QueryHint;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import org.eclipse.persistence.config.CacheUsage;
import org.eclipse.persistence.config.QueryHints;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
@Table(name = "roles", uniqueConstraints = {
    @UniqueConstraint(columnNames = "name")
})
@Cacheable(true)
@NamedQuery(name = "Role.findByName", query = "SELECT a FROM Role a WHERE a.name = :name")
@NamedQuery(name = "Roles.findByUser", query = "SELECT r FROM Role r JOIN r.users u WHERE u.id = :userId",
    hints = {
        @QueryHint(name = QueryHints.CACHE_USAGE, value = CacheUsage.DoNotCheckCache)
    })
@NamedNativeQuery(name = "Roles.findByUser_native", query = "SELECT roles.name FROM roles JOIN users_roles on users_roles.roles_id = roles.id WHERE users_roles.users_id = ?1")
public class Role extends AbstractEntity implements PermissionOwner {

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
    @WegasEntityProperty(
        optional = false, nullable = false,
        view = @View(label = "Name"))
    private String name;

    /**
     *
     */
    @Basic(optional = false)
    @Column(length = 255)
    @WegasEntityProperty(
        optional = false, nullable = false,
        view = @View(label = "Description", value = Textarea.class))
    private String description;

    /**
     *
     */
    //@ElementCollection(fetch = FetchType.EAGER)
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, mappedBy = "role")
    @WegasEntityProperty(
        optional = false, nullable = false, proposal = EmptyArray.class,
        ignoreNull = true,
        view = @View(label = "Permissions"))
    private List<Permission> permissions = new ArrayList<>();

    /**
     *
     */
    /*@JsonIgnore
     @ManyToMany(mappedBy = "roles")
     private Set<AbstractAccount> abstractAccounts = new HashSet<>();*/
    @JsonIgnore
    @ManyToMany(mappedBy = "roles")
    private Collection<User> users = new HashSet<>();

    /**
     *
     */
    protected Role() {
        // ensure there is a default constructor
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
     * {@inheritDoc}
     */
    @Override
    public List<Permission> getPermissions() {
        return permissions;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void setPermissions(List<Permission> permissions) {
        this.permissions = permissions;
        for (Permission p : this.permissions) {
            p.setRole(this);
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public boolean addPermission(Permission permission) {
        if (!this.hasPermission(permission)) {
            permission.setRole(this);
            return this.permissions.add(permission);
        }
        return false;
    }

    /**
     * count the number of user with this role
     *
     * @return member's count
     */
    @WegasExtraProperty(nullable = false, optional = false)
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
    public Collection<User> getUsers() {
        return users;
    }

    /**
     * set the role members
     *
     * @param users list of member
     */
    public void setUsers(Collection<User> users) {
        this.users = new ArrayList<>();
        if (users != null) {
            for (User user : users) {
                this.addUser(user);
                user.addRole(this);
            }
        }
    }

    /**
     * register new user within the role
     *
     * @param user
     */
    public void addUser(User user) {
        if (!this.users.contains(id)) {
            this.users.add(user);
        }
    }

    /**
     * strike out this account from the role
     *
     * @param user user to remove
     */
    public void removeUser(User user) {
        if (this.users.contains(user)) {
            this.users.remove(user);
        }
    }

    @JsonIgnore
    public String getChannel() {
        return WebsocketFacade.ROLE_CHANNEL_PREFIX + this.name;
    }

    @Override
    public String toString() {
        return "Role(" + this.id + ", " + this.name + ")";
    }

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission(RequestContext context) {
        return WegasMembership.ADMIN;
    }

    @Override
    public Collection<WegasPermission> getRequieredReadPermission(RequestContext context) {
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
