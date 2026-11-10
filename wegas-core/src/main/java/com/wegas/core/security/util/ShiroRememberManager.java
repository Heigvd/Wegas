/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.util;

import com.hazelcast.core.HazelcastInstance;
import com.hazelcast.map.IMap;
import com.wegas.core.Helper;
import javax.naming.NamingException;
import org.apache.shiro.codec.Hex;
import org.apache.shiro.crypto.AesCipherService;
import org.apache.shiro.crypto.CryptoException;
import org.apache.shiro.web.mgt.CookieRememberMeManager;
import org.apache.shiro.web.servlet.Cookie;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * RememberMe manager whose cookie is encrypted with the AES key given by the shiro.cipherKey
 * property.
 * <p>
 * If this property is missing or invalid, a random key is generated and shared through Hazelcast
 * so that all cluster nodes use the same key.
 *
 * @author maxence
 */
public final class ShiroRememberManager extends CookieRememberMeManager {

    private static final Logger logger = LoggerFactory.getLogger(ShiroRememberManager.class);

    private static final String CIPHER_KEY_PROPERTY = "shiro.cipherKey";

    /**
     * Hazelcast map holding the cluster-wide generated key
     */
    private static final String CLUSTER_KEY_MAP = "hz_shiro_rememberMe";

    private static final String CLUSTER_KEY_ENTRY = "cipherKey";

    /**
     * Size of the generated key, in bits, when none is configured
     */
    private static final int GENERATED_KEY_SIZE = 256;

    /**
     * true if a valid key is set in shiro.cipherKey; false means the key is shared through Hazelcast
     */
    private final boolean useConfiguredKey;

    public ShiroRememberManager() {
        super();
        boolean secureFlag = "true".equals(Helper.getWegasProperty("shiro.secureFlag", "false"));
        this.getCookie().setSecure(secureFlag);
        this.getCookie().setSameSite(Cookie.SameSiteOptions.LAX);
        this.getCookie().setMaxAge(Integer.parseInt(Helper.getWegasProperty("shiro.rememberMeDuration", "3600")));

        byte[] configuredKey = readConfiguredKey();
        if (configuredKey != null) {
            this.useConfiguredKey = true;
            setCipherKey(configuredKey);
        } else {
            this.useConfiguredKey = false;
            // Fail now rather than on each login. Shiro sessions also rely on Hazelcast,
            // so Wegas would not work without it anyway.
            getClusterKeyMap();
        }
    }

    @Override
    public byte[] getEncryptionCipherKey() {
        return useConfiguredKey ? super.getEncryptionCipherKey() : getClusterKey();
    }

    @Override
    public byte[] getDecryptionCipherKey() {
        return useConfiguredKey ? super.getDecryptionCipherKey() : getClusterKey();
    }

    /**
     * Read the AES key from the shiro.cipherKey property.
     * <p>
     * The key must be hex-encoded and 16, 24 or 32 bytes long (AES-128/192/256).
     *
     * @return the key, or null if it's missing or invalid
     */
    private static byte[] readConfiguredKey() {
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

        logger.warn("{} {}: using a random {}-bit key shared through Hazelcast. RememberMe cookies"
            + " will be invalidated when the whole cluster restarts. Set the same key on every node"
            + " (e.g. generate it with `openssl rand -hex 32`).",
            CIPHER_KEY_PROPERTY, problem, GENERATED_KEY_SIZE);
        return null;
    }

    /**
     * Get the cluster-wide key, generating it if no node did it yet.
     * <p>
     * The key is read from Hazelcast every time rather than kept in memory: if two nodes start
     * simultaneously and each generates a key before they find each other, Hazelcast keeps only
     * one when the clusters merge, and every node must switch to that one.
     *
     * @return the key shared by all cluster nodes
     */
    private static byte[] getClusterKey() {
        IMap<String, byte[]> map = getClusterKeyMap();
        byte[] key = map.get(CLUSTER_KEY_ENTRY);
        if (key == null) {
            byte[] newKey = new AesCipherService().generateNewKey(GENERATED_KEY_SIZE).getEncoded();
            key = map.putIfAbsent(CLUSTER_KEY_ENTRY, newKey);
            if (key == null) {
                logger.info("Generated a new cluster-wide rememberMe cipher key");
                key = newKey;
            }
        }
        return key;
    }

    private static IMap<String, byte[]> getClusterKeyMap() {
        try {
            HazelcastInstance hz = Helper.jndiLookup(Helper.getWegasProperty("hazelcast.jndi_name"), HazelcastInstance.class);
            return hz.getMap(CLUSTER_KEY_MAP);
        } catch (NamingException ex) {
            throw new CryptoException("Unable to get the Hazelcast instance holding the rememberMe cipher key", ex);
        }
    }
}
