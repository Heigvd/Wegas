/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2019 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package ch.albasim.wegas.annotations;

/**
 *
 * @author maxence
 */
public interface ValueGenerator {

    public static class Undefined implements ValueGenerator {

        @Override
        public Object getValue() {
            return null;
        }
    }

    public Object getValue();

}
