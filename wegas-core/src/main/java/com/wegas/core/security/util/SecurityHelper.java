/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.util;

import com.wegas.core.persistence.game.DebugGame;
import com.wegas.core.persistence.game.Game;
import java.util.List;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authz.AuthorizationException;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public abstract class SecurityHelper {

    public static void checkPermission(final Game game, final String permission) throws AuthorizationException {
        if (!isPermitted(game, permission)) {
            throw new AuthorizationException("Not authorized to read this game");
        }
    }

    public static boolean isPermitted(final Game game, final String permission) {
        return SecurityUtils.getSubject().isPermitted("Game:" + permission + ":g" + game.getId())
                || (game instanceof DebugGame && SecurityUtils.getSubject().isPermitted("GameModel:" + permission + ":gm" + game.getGameModelId()));
    }

    public static void checkAnyPermission(final Game game, final List<String> permissions) throws AuthorizationException {
        if (!SecurityHelper.isAnyPermitted(game, permissions)) {
            throw new AuthorizationException("Not authorized to view this game");   // If no permission is valid, throw an error
        }
    }

    public static Boolean isAnyPermitted(final Game game, final List<String> permissions) throws AuthorizationException {
        for (String p : permissions) {
            if (SecurityHelper.isPermitted(game, p)) {
                return true;
            }
        }
        return false;
    }
}
