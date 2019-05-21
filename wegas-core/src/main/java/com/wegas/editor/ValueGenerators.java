/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.editor;

import com.wegas.core.persistence.variable.statemachine.Coordinate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 *
 * @author maxence
 */
public class ValueGenerators {

    public static interface ValueGenerator {

        public Object getValue();
    }

    public static class Undefined implements ValueGenerator {

        @Override
        public Object getValue() {
            return null;
        }
    }

    public static class Zero implements ValueGenerator {

        @Override
        public Integer getValue() {
            return 0;
        }
    }

    public static class One implements ValueGenerator {

        @Override
        public Integer getValue() {
            return 1;
        }
    }

    public static class Three implements ValueGenerator {

        @Override
        public Integer getValue() {
            return 3;
        }
    }

    public static class Twenty implements ValueGenerator {

        @Override
        public Integer getValue() {
            return 20;
        }
    }

    public static class True implements ValueGenerator {

        public Boolean getValue() {
            return Boolean.TRUE;
        }
    }

    public static class False implements ValueGenerator {

        public Boolean getValue() {
            return Boolean.FALSE;
        }
    }

    public static class EmptyMap implements ValueGenerator {

        public Map getValue() {
            return new HashMap();
        }
    }

    public static class EmptyArray implements ValueGenerator {

        public List<Object> getValue() {
            return new ArrayList<>();
        }
    }

    public static class EmptyString implements ValueGenerator {

        public String getValue() {
            return "";
        }
    }

    public static class TeamScopeVal implements ValueGenerator {

        public String getValue() {
            return "TeamScope";
        }
    }

    public static class Origin implements ValueGenerator {

        public Coordinate getValue() {
            Coordinate o = new Coordinate();
            o.setX(0);
            o.setY(0);
            return o;
        }
    }
}
