/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2019 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.util;

import org.apache.shiro.crypto.hash.Sha256Hash;
import org.apache.shiro.crypto.hash.Sha512Hash;
import org.apache.shiro.util.SimpleByteSource;

/**
 *
 * @author maxence
 */
public enum HashMethod {

    PLAIN {
        @Override
        public String hash(String value, String salt) {
            return value;
        }
    },
    SHA_256 {
        @Override
        public String hash(String value, String salt) {
            return new Sha256Hash(value, new SimpleByteSource(salt).getBytes()).toHex();
        }
    },
    SHA_512 {
        @Override
        public String hash(String value, String salt) {
            return new Sha512Hash(value, new SimpleByteSource(salt).getBytes()).toHex();
        }
    };

    public abstract String hash(String value, String salt);
}
