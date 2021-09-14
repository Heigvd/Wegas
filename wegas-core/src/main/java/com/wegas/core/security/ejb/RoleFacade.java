/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.ejb;

import com.wegas.core.ejb.BaseFacade;
import com.wegas.core.ejb.GameFacade;
import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.security.persistence.Permission;
import com.wegas.core.security.persistence.Role;
import com.wegas.core.security.persistence.User;
import com.wegas.core.security.util.Sudoer;
import java.util.ArrayList;
import java.util.List;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.inject.Inject;
import javax.persistence.NoResultException;
import javax.persistence.TypedQuery;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Stateless
@LocalBean
public class RoleFacade extends BaseFacade<Role> {

    @Inject
    private GameModelFacade gameModelFacade;

    @Inject
    private GameFacade gameFacade;

    @Inject
    private UserFacade userFacade;

    /**
     *
     */
    public RoleFacade() {
        super(Role.class);
    }

    @Override
    public void create(Role entity) {
        getEntityManager().persist(entity);
    }

    @Override
    public void remove(Role role) {
        // clone to avoid concurrent modification exception
        ArrayList<User> users = new ArrayList<>(role.getUsers());

        // Strike out all members from the role to avoid pkey violation
        for (User u : users) {
            u.removeRole(role);
        }
        getEntityManager().remove(role);
    }

    /**
     *
     * @param name
     *
     * @return role matching the given name
     *
     * @throws WegasNoResultException role not found
     */
    public Role findByName(String name) throws WegasNoResultException {
        try {
            final TypedQuery<Role> query = getEntityManager().createNamedQuery("Role.findByName", Role.class);
            query.setParameter("name", name);
            return query.getSingleResult();
        } catch (NoResultException ex) {
            throw new WegasNoResultException(ex);
        }
    }

    /**
     * Give a permission to the role identified by the given id
     *
     * @param roleId     id of the role
     * @param permission the permission
     *
     * @return the newly persisted permission
     */
    public Permission createPermission(Long roleId, Permission permission) {
        Role role = this.find(roleId);
        return this.createPermission(role, permission);
    }

    private Permission createPermission(Role role, Permission permission) {
        permission.setUser(null);
        permission.setRole(role);
        role.addPermission(permission);

        this.getEntityManager().persist(permission);

        return permission;
    }

    /**
     * Give a permission to the role identified by the given id
     *
     * @param roleId      id of the role
     * @param permissions permission to five
     * @param gameModelId id of the gameModel
     *
     * @return the permission
     */
    public Permission grantGameModelPermission(Long roleId, String permissions, Long gameModelId) {

        GameModel gm = gameModelFacade.find(gameModelId);
        requestManager.assertUpdateRight(gm);
        try ( Sudoer su = requestManager.sudoer()) {
            Role role = this.find(roleId);

            List<Permission> all = this.findPermissions(role, "GameModel:%:gm" + gameModelId);

            // make sure to have max one permission
            if (all.size() > 1) {
                Permission keep = all.remove(0);
                all.forEach(userFacade::deletePermission);
                all.add(keep);
            }

            if (!all.isEmpty()) {
                // alter existing permission
                Permission p = all.get(0);
                p.setValue("GameModel:" + permissions + ":gm" + gameModelId);
                return p;
            } else {
                // create new permission
                return this.createPermission(roleId, new Permission("GameModel:" + permissions + ":gm" + gameModelId));
            }
        }
    }

    /**
     * Remove all gamemodel permission from role
     *
     * @param roleId      id of the role
     * @param gameModelId id of the gameModel
     *
     * @return just deleted permissions
     */
    public List<Permission> revokeGameModelPermissions(Long roleId, Long gameModelId) {
        GameModel gm = gameModelFacade.find(gameModelId);
        requestManager.assertUpdateRight(gm);
        try ( Sudoer su = requestManager.sudoer()) {
            Role role = this.find(roleId);

            List<Permission> all = this.findPermissions(role, "GameModel:%:gm" + gameModelId);
            all.forEach(userFacade::deletePermission);
            return all;
        }
    }

    private List<Permission> findPermissions(Role role, String permission) {
        TypedQuery<Permission> query = getEntityManager()
            .createNamedQuery("Permission.findByPermissionAndRole", Permission.class);
        query.setParameter("userId", role.getId());
        query.setParameter("permission", permission);

        return query.getResultList();
    }

    /**
     * Give a permission to the role identified by the given id
     *
     * @param roleId      id of the role
     * @param gameId id of the game
     *
     * @return the permission
     */
    public Permission grantGamePermission(Long roleId, Long gameId) {

        Game gm = gameFacade.find(gameId);
        requestManager.assertUpdateRight(gm);
        try ( Sudoer su = requestManager.sudoer()) {
            Role role = this.find(roleId);

            List<Permission> all = this.findPermissions(role, "Game:%:g" + gameId);

            // make sure to have max one permission
            if (all.size() > 1) {
                Permission keep = all.remove(0);
                all.forEach(userFacade::deletePermission);
                all.add(keep);
            }

            if (!all.isEmpty()) {
                // alter existing permission
                Permission p = all.get(0);
                p.setValue("Game:View,Edit:g" + gameId);
                return p;
            } else {
                // create new permission
                return this.createPermission(roleId, new Permission("Game:View,Edit:g" + gameId));
            }
        }
    }

    /**
     * Remove all game permission from role
     *
     * @param roleId      id of the role
     * @param gameId id of the game
     *
     * @return just deleted permissions
     */
    public List<Permission> revokeGamePermissions(Long roleId, Long gameId) {
        Game gm = gameFacade.find(gameId);
        requestManager.assertUpdateRight(gm);
        try ( Sudoer su = requestManager.sudoer()) {
            Role role = this.find(roleId);

            List<Permission> all = this.findPermissions(role, "Game:%:g" + gameId);
            all.forEach(userFacade::deletePermission);
            return all;
        }
    }


}
