/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.editor.view;

import ch.albasim.wegas.annotations.CommonView;

/**
 * @author maxence
 */
public class NumberView extends CommonView {

    @Override
    public String getType() {
        return "number";
    }

    public static class WithInfinityPlaceholder extends NumberView {

        public String getPlaceholder() {
            return "∞";
        }
    }

    public static class WithNegInfinityPlaceholder extends NumberView {

        public String getPlaceholder() {
            return "-∞";
        }
    }

    public static class WithOnePlaceholder extends NumberView {

        public String getPlaceholder() {
            return "1";
        }
    }
}
