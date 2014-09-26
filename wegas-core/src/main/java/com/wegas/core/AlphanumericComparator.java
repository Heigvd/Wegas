/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core;

import java.io.Serializable;
import java.util.Comparator;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 * @param <T>
 */
public class AlphanumericComparator<T extends CharSequence> implements Comparator<T>, Serializable {

    private static final long serialVersionUID = 1L;

    /**
     *
     * @param left
     * @param right
     * @return
     */
    @Override
    public int compare(T left, T right) {
        StringBuilder numLeft, numRight;
        char leftChar, rightChar;
        int lengthLeft = left.length(), lengthRight = right.length(), leftPos = 0, rightPos = 0;
        int diff;
        int tmp;
        while (leftPos < lengthLeft && rightPos < lengthRight) {
            leftChar = left.charAt(leftPos);
            rightChar = right.charAt(rightPos);
            diff = Character.compare(leftChar, rightChar);
            if (diff == 0) {
                leftPos += 1;
                rightPos += 1;
            } else if (Character.isDigit(leftChar) && Character.isDigit(rightChar)) {
                numLeft = new StringBuilder("0");
                numRight = new StringBuilder("0");
                while (leftPos < lengthLeft && Character.isDigit(left.charAt(leftPos))) {
                    numLeft.append(left.charAt(leftPos));
                    leftPos += 1;
                }
                while (rightPos < lengthRight && Character.isDigit(right.charAt(rightPos))) {
                    numRight.append(right.charAt(rightPos));
                    rightPos += 1;
                }
                tmp = Integer.valueOf(numLeft.toString()).compareTo(Integer.valueOf(numRight.toString()));
                if (tmp != 0) {
                    return tmp;
                }
                if (numLeft.length() == 1) {
                    leftPos += 1;
                    rightPos += 1;
                }
            } else {
                return diff;
            }
        }
        return lengthLeft - lengthRight;
    }
}
