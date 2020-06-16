/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.persistence;

import java.util.Iterator;
import java.util.List;

/**
 *
 * @author maxence
 */
public interface PermissionOwner {

    /**
     * @return all role permissions
     */
    List<Permission> getPermissions();

    /**
     * @param permissions
     */
    void setPermissions(List<Permission> permissions);

    /**
     * @param permission
     *
     * @return true if the permission has successfully been added
     */
    default boolean addPermission(String permission) {
        return this.addPermission(new Permission(permission));
    }

    /**
     * @param permission
     *
     * @return true if the permission has successfully been added
     */
    boolean addPermission(Permission permission);

    default boolean hasPermission(Permission permission) {
        if (permission != null) {
            for (Permission p : getPermissions()) {
                if (permission.getValue().equals(p.getValue())) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Remove all permissions matching the given string permission
     *
     * @param permission
     *
     * @return true if the permission has successfully been removed
     */
    default boolean removePermission(String permission) {
        boolean r = false;
        for (Iterator<Permission> it = getPermissions().iterator(); it.hasNext();) {
            Permission p = it.next();
            if (p.getValue().equals(permission)) {
                it.remove();
                r = true;
            }
        }
        return r;
    }

    /**
     * Remove all permissions which equals the given one (same ids !)
     *
     * @param permission
     *
     * @return true if the permission have been removed, false owner didn't even own the property
     */
    default boolean removePermission(Permission permission) {
        boolean r = false;
        if (permission != null) {
            for (Iterator<Permission> it = getPermissions().iterator(); it.hasNext();) {
                Permission p = it.next();
                if (permission.equals(p)) {
                    it.remove();
                    r = true;
                }
            }
        }
        return r;
    }

}
