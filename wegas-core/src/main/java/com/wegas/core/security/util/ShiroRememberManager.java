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
import org.apache.shiro.crypto.AesCipherService;
import org.apache.shiro.web.mgt.CookieRememberMeManager;
import org.apache.shiro.web.servlet.Cookie;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author maxence
 */
public final class ShiroRememberManager extends CookieRememberMeManager {

    private static final Logger logger = LoggerFactory.getLogger(ShiroRememberManager.class);

    private static final String CIPHER_KEY_PROPERTY = "shiro.cipherKey";

    /**
     * Size of the generated key, in bits, when none is configured
     */
    private static final int GENERATED_KEY_SIZE = 256;

    public ShiroRememberManager() {
        super();
        boolean secureFlag = "true".equals(Helper.getWegasProperty("shiro.secureFlag", "false"));
        this.getCookie().setSecure(secureFlag);
        this.getCookie().setSameSite(Cookie.SameSiteOptions.LAX);
        this.getCookie().setMaxAge(Integer.parseInt(Helper.getWegasProperty("shiro.rememberMeDuration", "3600")));

        setCipherKey(resolveCipherKey());
    }

    /**
     * Read the AES key used to encrypt the rememberMe cookie from the shiro.cipherKey property.
     * <p>
     * The key must be hex-encoded and 16, 24 or 32 bytes long (AES-128/192/256). If it's
     * missing or invalid, a random key is generated: rememberMe cookies then won't survive a
     * restart and won't be shared between cluster nodes.
     *
     * @return the AES key
     */
    private static byte[] resolveCipherKey() {
        String hexKey = Helper.getWegasProperty(CIPHER_KEY_PROPERTY, null);

        String problem;
        if (hexKey == null || hexKey.isBlank()) {
            problem = "is not set";
        } else {
            try {
                byte[] key = Hex.decode(hexKey.trim());
                if (key.length == 16 || key.length == 24 || key.length == 32) {
                    return key;
                }
                problem = "has an invalid length (" + key.length
                    + " bytes; expected 16, 24 or 32 bytes, i.e. 32, 48 or 64 hex characters)";
            } catch (IllegalArgumentException ex) {
                problem = "is not a valid hexadecimal string";
            }
        }

        logger.warn("{} {}: using a random {}-bit key. RememberMe cookies will be invalidated on restart"
            + " and not shared between cluster nodes. Generate a key with `openssl rand -hex 32`.",
            CIPHER_KEY_PROPERTY, problem, GENERATED_KEY_SIZE);

        return new AesCipherService().generateNewKey(GENERATED_KEY_SIZE).getEncoded();
    }
}
