/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.jcr.content;

import java.io.Serializable;
import java.util.Comparator;

/**
 * Sort Content
 *
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
public class ContentComparator implements Comparator<AbstractContentDescriptor>, Serializable {

    private static final long serialVersionUID = 1L;

    @Override
    public int compare(AbstractContentDescriptor t, AbstractContentDescriptor t1) {
        if (t instanceof FileDescriptor && t1 instanceof DirectoryDescriptor) {
            return 1;
        } else if (t1 instanceof FileDescriptor && t instanceof DirectoryDescriptor) {
            return -1;
        } else if (t != null && t1 != null) {
            return t.getName().compareTo(t1.getName());
        } else if (t != null) {
            return 1;
        } else {
            return -1;
        }
    }
}
