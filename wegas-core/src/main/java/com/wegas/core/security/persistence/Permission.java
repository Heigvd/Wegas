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
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wegas.core.ejb.RequestManager.RequestContext;
import com.wegas.core.ejb.WebsocketFacade;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.Broadcastable;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.variable.ModelScoped.Visibility;
import com.wegas.core.security.util.WegasMembership;
import com.wegas.core.security.util.WegasPermission;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.persistence.Basic;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.Index;
import javax.persistence.ManyToOne;
import javax.persistence.NamedNativeQuery;
import javax.persistence.NamedQuery;
import javax.persistence.QueryHint;
import javax.persistence.Table;
import org.eclipse.persistence.config.CacheUsage;
import org.eclipse.persistence.config.QueryHints;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
@NamedQuery(name = "Permission.findByPermission", query = "SELECT p FROM Permission p WHERE p.value LIKE :permission")
@NamedQuery(name = "Permission.findByPermissionAndUser", query = "SELECT p FROM Permission p WHERE p.value LIKE :permission AND p.user.id = :userId")
@NamedQuery(name = "Permission.findByPermissionAndRole", query = "SELECT p FROM Permission p WHERE p.value LIKE :permission AND p.role.id = :roleId")
@NamedQuery(name = "Permission.findByRole", query = "SELECT p FROM Permission p WHERE p.role.id = :roleId",
    hints = {
        @QueryHint(name = QueryHints.CACHE_USAGE, value = CacheUsage.DoNotCheckCache)
    })
@NamedQuery(name = "Permission.findByUser", query = "SELECT p FROM Permission p WHERE p.user.id = :userId",
    hints = {
        @QueryHint(name = QueryHints.CACHE_USAGE, value = CacheUsage.DoNotCheckCache)
    })
@NamedNativeQuery(name = "Permission.findByUser_native", query = "SELECT permissions FROM permission LEFT JOIN users_roles ON users_roles.roles_id = permission.role_id WHERE users_roles.users_id = ?1 OR permission.user_id = ?1")
@Table(
    indexes = {
        @Index(columnList = "role_id"),
        @Index(columnList = "user_id")
    }
)
public class Permission extends AbstractEntity implements Broadcastable {

    private static final long serialVersionUID = 1L;

    public static final Logger logger = LoggerFactory.getLogger(Permission.class);

    /**
     *
     */
    @Basic
    @Column(name = "permissions")
    @WegasEntityProperty(optional = false, nullable = false, view = @View(label = "Value"))
    private String value;
    /**
     *
     */
    @Id
    @GeneratedValue
    private Long id;
    /**
     *
     */
    /* @ManyToOne private AbstractAccount account; */
    @ManyToOne
    @JsonIgnore
    private User user;
    /**
     *
     */
    @ManyToOne
    @JsonIgnore
    private Role role;

    /**
     *
     */
    public Permission() {
        // ensure there is a default constructor
    }

    /**
     *
     * @param value
     */
    public Permission(String value) {
        this.value = value;
    }

    /**
     * @return the value
     */
    public String getValue() {
        return value;
    }

    /**
     * @param value the value to set
     */
    public void setValue(String value) {
        this.value = value;
    }

    @Override
    public String toString() {
        return "Permission(" + this.value + ")";
    }

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
     * get the user the permission is for
     *
     * @return the user or null whether the permission is for a Role
     */
    public User getUser() {
        return user;
    }

    /**
     * set the user the permission is for
     *
     * @param user the user
     */
    public void setUser(User user) {
        this.user = user;
    }

    /**
     * @return the role
     */
    public Role getRole() {
        return role;
    }

    /**
     * @param role the role to set
     */
    public void setRole(Role role) {
        this.role = role;
    }

    @Override
    public Map<String, List<AbstractEntity>> getEntities() {
        Map<String, List<AbstractEntity>> map = new HashMap<>();

        if (this.getUser() != null) {
            List.of(this);
            map.put(this.getUser().getChannel(), List.of(this));
        } else if (this.getRole() != null) {
            map.put(this.getRole().getChannel(), List.of(this));
        }

        map.put(WebsocketFacade.ADMIN_LOBBY_CHANNEL, List.of(this));

        return map;
    }

    private static boolean isPermId(String id) {
        return id.matches("(g|gm)\\d+");
    }

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission(RequestContext context) {
        String[] split = this.getValue().split(":");

        if (split.length == 3) {
            String perm = split[2];

            if (isPermId(perm)) {
                if ("GameModel".equals(split[0])) {
                    // One should have super right on the gameModel the permission give access to
                    return WegasPermission.getAsCollection(GameModel.getAssociatedWritePermission(Long.parseLong(perm.replaceFirst("gm", ""))));
                    /* GameModel gameModel =
                     * GameModelFacade.lookup().find(Long.parseLong(perm.replaceFirst("gm", "")));
                     * if (gameModel != null) { return gameModel.getRequieredUpdatePermission(); } */
                } else if ("Game".equals(split[0])) {
                    // One should have super right on the game the permission give access to
                    return WegasPermission.getAsCollection(Game.getAssociatedWritePermission(Long.parseLong(perm.replaceFirst("g", ""))));
                    /* Game game = GameFacade.lookup().find(Long.parseLong(perm.replaceFirst("g",
                     * ""))); if (game != null) { return game.getRequieredUpdatePermission(); } */
                }
            }
        }
        return WegasMembership.ADMIN;
    }

    @Override
    public Collection<WegasPermission> getRequieredReadPermission(RequestContext context) {
        return null;
    }

    @Override
    public WithPermission getMergeableParent() {
        if (this.user != null) {
            return this.user;
        } else {
            return this.role;
        }
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
