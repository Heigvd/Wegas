/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.Helper;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.persistence.User;
import com.wegas.core.security.util.SecurityHelper;
import java.util.Collection;
import java.util.HashSet;
import javax.enterprise.context.RequestScoped;
import javax.inject.Inject;
import javax.inject.Named;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.subject.Subject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author maxence
 */
@Named("SecurityFacade")
@RequestScoped
public class SecurityFacade {

    private static final Logger logger = LoggerFactory.getLogger(SecurityFacade.class);

    private Collection<String> grantedPermissions = new HashSet<>();

    @Inject
    private GameFacade gameFacade;

    @Inject
    private TeamFacade teamFacade;

    @Inject
    private PlayerFacade playerFacade;

    @Inject
    private UserFacade userFacade;

    private String[] split(String permissions) {
        return permissions.split(",");
    }

    public void clearPermissions() {
        this.grantedPermissions.clear();
    }

    /**
     * Check if current user has access to type/id entity
     *
     * @param type
     * @param id
     * @param currentPlayer
     * @return true if current user has access to
     */
    private boolean hasPermission(String type, String arg, boolean superPermission) {
        Subject subject = SecurityUtils.getSubject();

        if ("Role".equals(type)) {
            return subject.hasRole(arg);
        } else {
            Long id = Long.parseLong(arg);
            if ("GameModel".equals(type)) {

                if (superPermission) {
                    return subject.isPermitted("GameModel:Edit:gm" + id);
                } else {
                    if (this.hasPermission("Role-Trainer") && subject.isPermitted("GameModel:Instantiate:gm" + id)) {
                        //For trainer, instantiate means read
                        return true;
                    }
                    return subject.isPermitted("GameModel:View:gm" + id);
                }
            } else if ("Game".equals(type)) {
                Game game = gameFacade.find(id);
                if (superPermission) {
                    return game != null && SecurityHelper.isPermitted(game, "Edit");
                } else {
                    return game != null && SecurityHelper.isPermitted(game, "View");
                }
            } else if ("Team".equals(type)) {

                Team team = teamFacade.find(id);
                User user = userFacade.getCurrentUser();

                // Current logged User is linked to a player who's member of the team or current user has edit right one the game
                return team != null && (playerFacade.checkExistingPlayerInTeam(team.getId(), user.getId()) != null || SecurityHelper.isPermitted(team.getGame(), "Edit"));
            } else if ("Player".equals(type)) {
                User user = userFacade.getCurrentUser();
                Player player = playerFacade.find(id);

                // Current player belongs to current user || current user is the teacher or scenarist (test user)
                return player != null && ((user != null && user.equals(player.getUser())) || SecurityHelper.isPermitted(player.getGame(), "Edit"));
            } else if ("User".equals(type)) {
                User currentUser = userFacade.getCurrentUser();
                User find = userFacade.find(id);
                return currentUser != null && currentUser.equals(find);
            }
        }
        return false;
    }

    /**
     * can current user subscribe to given channel ?
     *
     * @param channel
     * @return true if access granted
     */
    public boolean hasPermission(String channel) {
        boolean perm = false;
        if (channel != null) {
            if (grantedPermissions.contains(channel)) {
                return true;
            } else {

                boolean superPermission = false;

                if (channel.startsWith("W-")) {
                    channel = channel.replaceFirst("W-", "");
                    superPermission = true;
                }

                String[] split = channel.split("-");

                if (split.length == 2) {
                    perm = hasPermission(split[0], split[1], superPermission);
                }
                if (perm) {
                    grantedPermissions.add(channel);
                }
                return perm;
            }
        } else {
            return true;
        }
    }

    private void assertUserHasPermission(String permissions, String type, AbstractEntity entity) {
        if (permissions != null) {
            String perms[] = this.split(permissions);
            boolean hasPermission = this.hasPermission("Role-Administrator");
            if (!hasPermission) {
                for (String perm : perms) {
                    if (this.hasPermission(perm)) {
                        hasPermission = true;
                        break;
                    }
                }
            }

            if (!hasPermission) {
                Helper.printWegasStackTrace(new Exception());
                String msg = type + " Permission Denied (" + permissions + ") for user " + userFacade.getCurrentUser() + " on entity " + entity;
                logger.error(msg);
                //throw WegasErrorMessage.error(msg);
            }
        }
    }

    public void assertCreateRight(AbstractEntity entity) {
        this.assertUserHasPermission(entity.getRequieredCreatePermission(), "Create", entity);
    }

    public void assertReadRight(AbstractEntity entity) {
        this.assertUserHasPermission(entity.getRequieredReadPermission(), "Read", entity);
    }

    public void assertUpdateRight(AbstractEntity entity) {
        this.assertUserHasPermission(entity.getRequieredUpdatePermission(), "Update", entity);
    }

    public void assertDeleteRight(AbstractEntity entity) {
        this.assertUserHasPermission(entity.getRequieredDeletePermission(), "Delete", entity);
    }
}
