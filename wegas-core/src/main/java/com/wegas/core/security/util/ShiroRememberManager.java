
/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.util;

import com.wegas.core.Helper;
import org.apache.shiro.codec.Hex;
import org.apache.shiro.web.mgt.CookieRememberMeManager;
import org.apache.shiro.web.servlet.Cookie;

/**
 *
 * @author maxence
 */
public final class ShiroRememberManager extends CookieRememberMeManager {

    public ShiroRememberManager() {
        super();
        boolean secureFlag = "true".equals(Helper.getWegasProperty("shiro.secureFlag", "false"));
        this.getCookie().setSecure(secureFlag);
        this.getCookie().setSameSite(Cookie.SameSiteOptions.LAX);

        setCipherKey(Hex.decode(Helper.getWegasProperty("shiro.cipherKey", "09876543212345678965423456787654")));
    }
}
