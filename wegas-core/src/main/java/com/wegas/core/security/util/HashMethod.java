
/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.util;

import org.apache.shiro.crypto.hash.Sha256Hash;
import org.apache.shiro.crypto.hash.Sha512Hash;

/**
 * Hash method supported by Wegas
 *
 * @author maxence
 */
public enum HashMethod {

    PLAIN {

        /**
         * {@inheritDoc }
         */
        @Override
        public String hash(Object oValue, Object salt) {
            Object value = oValue;
            if (value instanceof char[] cs){
                value = new String(cs);
            }
            if (salt == null) {
                return value.toString();
            } else {
                return salt.toString() + value;
            }
        }
    },
    SHA_256 {

        /**
         * {@inheritDoc }
         */
        @Override
        public String hash(Object value, Object salt) {
            return new Sha256Hash(value, salt).toHex();
        }
    },
    SHA_512 {

        /**
         * {@inheritDoc }
         */
        @Override
        public String hash(Object value, Object salt) {
            return new Sha512Hash(value, salt).toHex();
        }
    };

    /**
     * compute digest from value. If given, the value is prefixed with the salt.
     *
     * @param value the value to hash
     * @param salt  optional salt
     *
     * @return digested salted value
     */
    public abstract String hash(Object value, Object salt);
}
