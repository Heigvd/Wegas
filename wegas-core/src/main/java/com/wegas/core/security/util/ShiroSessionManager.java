
/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.util;

import com.wegas.core.Helper;
import org.apache.shiro.web.servlet.Cookie;
import org.apache.shiro.web.session.mgt.DefaultWebSessionManager;

/**
 *
 * @author maxence
 */
public final class ShiroSessionManager extends DefaultWebSessionManager {

    public ShiroSessionManager() {
        super();
        boolean secureFlag = "true".equals(Helper.getWegasProperty("shiro.secureFlag", "false"));
        if (secureFlag) {
            this.getSessionIdCookie().setSameSite(Cookie.SameSiteOptions.LAX);
            this.getSessionIdCookie().setSecure(true);
        }
    }
}
