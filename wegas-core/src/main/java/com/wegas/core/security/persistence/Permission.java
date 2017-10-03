/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.persistence;

import com.wegas.core.persistence.AbstractEntity;
import javax.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wegas.core.ejb.GameFacade;
import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.exception.client.WegasIncompatibleType;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import java.util.Objects;
import org.eclipse.persistence.config.CacheUsage;
import org.eclipse.persistence.config.QueryHints;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
@NamedQueries({
    @NamedQuery(name = "Permission.findByPermission", query = "SELECT p FROM Permission p WHERE p.value LIKE :permission"),
    @NamedQuery(name = "Permission.findByPermissionAndUser", query = "SELECT p FROM Permission p WHERE p.value LIKE :permission AND p.user.id = :userId"),
    @NamedQuery(name = "Permission.findByRole", query = "SELECT p FROM Permission p WHERE p.role.id = :roleId",
            hints = {
                @QueryHint(name = QueryHints.CACHE_USAGE, value = CacheUsage.DoNotCheckCache)
            }),
    @NamedQuery(name = "Permission.findByUser", query = "SELECT p FROM Permission p WHERE p.user.id = :userId",
            hints = {
                @QueryHint(name = QueryHints.CACHE_USAGE, value = CacheUsage.DoNotCheckCache)
            })
})
@Table(
        indexes = {
            @Index(columnList = "role_id"),
            @Index(columnList = "user_id")
        }
)
public class Permission extends AbstractEntity {

    private static final long serialVersionUID = 1L;

    public static final Logger logger = LoggerFactory.getLogger(Permission.class);
    
    /**
     *
     */
    @Basic
    @Column(name = "permissions")
    private String value;
    /**
     *
     */
    @Basic
    //private String inducedPermission;
    /**
     *
     */
    @Id
    @GeneratedValue
    private Long id;
    /**
     *
     */
    /*@ManyToOne
     private AbstractAccount account;*/
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
    }

    /**
     *
     * @param value
     */
    public Permission(String value) {
        this.value = value;
    }

    @Override
    public void merge(AbstractEntity other) {
        if (other instanceof Permission) {
            Permission o = (Permission) other;
            this.setValue(o.getValue());
            //this.setInducedPermission(o.getInducedPermission());
        } else {
            throw new WegasIncompatibleType(this.getClass().getSimpleName() + ".merge (" + other.getClass().getSimpleName() + ") is not possible");
        }
    }

    /**
     * @return the inducedPermission
     *         public String getInducedPermission() {
     *         return inducedPermission;
     *         }
     */
    /**
     * @param inducedPermission the inducedPermission to set
     */
    /*
    public void setInducedPermission(String inducedPermission) {
        this.inducedPermission = inducedPermission;
    }
     */
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

    private boolean isPermId(String id) {
        return id.matches("(g|gm)\\d+");
    }

    @Override
    public String getRequieredUpdatePermission() {
        String[] split = this.getValue().split(":");

        if (split.length == 3) {
            String perm = split[2];
            switch (split[0]) {
                case "GameModel":
                    if (isPermId(perm)) {
                        GameModel gameModel = GameModelFacade.lookup().find(Long.parseLong(perm.replaceFirst("gm", "")));
                        if (gameModel != null) {
                            return gameModel.getRequieredUpdatePermission();
                        }
                    }
                case "Game":
                    if (isPermId(perm)) {
                        Game game = GameFacade.lookup().find(Long.parseLong(perm.replaceFirst("g", "")));
                        if (game != null) {
                            if (game.isPersisted()) {
                                return "W-" + game.getChannel();
                            } else {
                                return null;
                            }
                        }
                    }
            }
        }
        return Role.ADMIN_PERM;
    }

    @Override
    public String getRequieredReadPermission() {
        return null;
    }
}
