/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.app.pdf.helper;

import java.io.IOException;
import java.io.InputStream;

/**
 *
 * @author maxence
 */
public class StringInputStream extends InputStream {

    int idx;
    String _str;

    public StringInputStream(String _str) {
        this._str = _str;
        this.idx = 0;
    }

    @Override
    public int available() throws IOException {
        return _str.length() - idx;
    }

    @Override
    public int read() throws IOException {
        if (available() > 0) {
            char charAt = _str.charAt(idx);
            idx++;
            return charAt;
        } else {
            return -1;
        }
    }

    @Override
    public int read(byte[] buf, int offset, int len) throws IOException {
        int available = available();
        if (available == 0) {
            return -1;
        }
        int count = Math.min(len, available);
        for (int i = 0; i < count; i++) {
            buf[i + offset] = (byte) read();
        }
        return count;
    }

    @Override
    public int read(byte[] buf) throws IOException {
        return read(buf, 0, buf.length);
    }
}
