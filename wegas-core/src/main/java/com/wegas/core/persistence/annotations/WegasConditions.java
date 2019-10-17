/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2019 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.annotations;

import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.persistence.Mergeable;
import com.wegas.core.persistence.annotations.WegasRefs.Ref;
import java.util.Collection;
import java.util.Objects;
import org.apache.commons.lang3.Validate;

/**
 * Some conditional statements to be included within {@link Errored} and {@link Validate} annotations.
 */
public final class WegasConditions {

    /**
     * Abstract condition.
     * To rule them all
     */
    public static abstract class Condition {

        public abstract boolean eval(Object self, Mergeable object);
    }

    /**
     * AND condition
     */
    public static class And extends Condition {

        private Condition[] conditions;

        public And(Condition... conditions) {
            this.conditions = conditions;
        }

        public Condition[] getAnd() {
            return conditions;
        }

        @Override
        public boolean eval(Object self, Mergeable object) {
            for (Condition c : conditions) {
                if (!c.eval(self, object)) {
                    return false;
                }
            }
            return true;
        }
    }

    /**
     * OR condition
     */
    public static class Or extends Condition {

        private Condition[] conditions;

        public Or(Condition... conditions) {
            this.conditions = conditions;
        }

        public Condition[] getOr() {
            return conditions;
        }

        @Override
        public boolean eval(Object self, Mergeable object) {
            for (Condition c : conditions) {
                if (c.eval(self, object)) {
                    return true;
                }
            }
            return false;
        }
    }

    /**
     * NOT
     */
    public static class Not extends Condition {

        private final Condition condition;

        public Not(Condition condition) {
            this.condition = condition;
        }

        public Condition getNot() {
            return condition;
        }

        @Override
        public boolean eval(Object self, Mergeable object) {
            return !condition.eval(self, object);
        }
    }

    /**
     * Does the two given ref resolved to equal objects?
     */
    public static class Equals extends Condition {

        private final Ref a;
        private final Ref b;

        public Equals(Ref a, Ref b) {
            this.a = a;
            this.b = b;
        }

        public Ref[] getEq() {
            return new Ref[]{a, b};
        }

        @Override
        public boolean eval(Object self, Mergeable object) {
            return Objects.equals(a.resolve(self, object), b.resolve(self, object));
        }
    }

    /**
     * Does the two given ref resolved to not equal objects?
     */
    public static class NotEquals extends Condition {

        private final Ref a;
        private final Ref b;

        public NotEquals(Ref a, Ref b) {
            this.a = a;
            this.b = b;
        }

        public Ref[] getNeq() {
            return new Ref[]{a, b};
        }

        @Override
        public boolean eval(Object self, Mergeable object) {
            return !Objects.equals(a.resolve(self, object), b.resolve(self, object));
        }
    }

    /**
     * true if the refs is resolvable and if the resolved object is not null.
     */
    public static class IsDefined extends Condition {

        private final Ref a;

        public IsDefined(Ref a) {
            this.a = a;
        }

        public Ref getIsDefined() {
            return a;
        }

        @Override
        public boolean eval(Object self, Mergeable object) {
            try {
                Object resolve = a.resolve(self, object);
                return resolve != null;
            } catch (Exception ex) {
                return false;
            }
        }
    }

    /**
     * true if the refs is resolvable to a collection and if this collection is empty
     */
    public static class IsEmpty extends Condition {

        private final Ref a;

        public IsEmpty(Ref a) {
            this.a = a;
        }

        public Ref getIsEmpty() {
            return a;
        }

        @Override
        public boolean eval(Object self, Mergeable object) {
            try {
                Collection resolve = a.resolveAsCollection(self, object);
                return resolve != null && resolve.isEmpty();
            } catch (Exception ex) {
                return false;
            }
        }
    }

    /**
     * Is the resolved boolean true?
     * Throw error is ref is not resolved to a boolean.
     */
    public static class IsTrue extends Condition {

        private final Ref a;

        public IsTrue(Ref a) {
            this.a = a;
        }

        public Ref getIsTrue() {
            return a;
        }

        @Override
        public boolean eval(Object self, Mergeable object) {
            Object resolve = a.resolve(self, object);
            if (resolve instanceof Boolean) {
                return ((Boolean) resolve).booleanValue();
            }
            throw WegasErrorMessage.error("Not a boolean instance: " + resolve);
        }
    }

    /**
     * Is the resolved boolean false?
     * Throw error is ref is not resolved to a boolean.
     */
    public static class IsFalse extends Condition {

        private final Ref a;

        public IsFalse(Ref a) {
            this.a = a;
        }

        public Ref getIsFalse() {
            return a;
        }

        @Override
        public boolean eval(Object self, Mergeable object) {
            Object resolve = a.resolve(self, object);
            if (resolve instanceof Boolean) {
                return !((Boolean) resolve).booleanValue();
            }
            throw WegasErrorMessage.error("Not a boolean instance: " + resolve);
        }
    }

    /**
     * Is the first ref less than the second one ?
     * Throw WegasErrorMessage is any of the ref is not resolvable
     */
    public static class LessThan extends Condition {

        private final Ref a;
        private final Ref b;

        public LessThan(Ref a, Ref b) {
            this.a = a;
            this.b = b;
        }

        public Ref[] getLt() {
            return new Ref[]{a, b};
        }

        @Override
        public boolean eval(Object self, Mergeable object) {
            Double a = this.a.resolveAsDouble(self, object);
            Double b = this.b.resolveAsDouble(self, object);

            if ((a == null || b == null)) {
                throw WegasErrorMessage.error("LessThan operands can not be null");
            }

            return a < b;
        }
    }

    /**
     * Is the first ref less or equals than the second one ?
     * Throw WegasErrorMessage is any of the ref is not resolvable
     */
    public static class LessThanOrEquals extends Condition {

        private final Ref a;
        private final Ref b;

        public LessThanOrEquals(Ref a, Ref b) {
            this.a = a;
            this.b = b;
        }

        public Ref[] getLte() {
            return new Ref[]{a, b};
        }

        @Override
        public boolean eval(Object self, Mergeable object) {
            Double a = this.a.resolveAsDouble(self, object);
            Double b = this.b.resolveAsDouble(self, object);

            if ((a == null || b == null)) {
                throw WegasErrorMessage.error("LessThan operands can not be null");
            }

            return a <= b;
        }
    }

    /**
     */
    public static class GreaterThan extends Condition {

        private final Ref a;
        private final Ref b;

        public GreaterThan(Ref a, Ref b) {
            this.a = a;
            this.b = b;
        }

        public Ref[] getGt() {
            return new Ref[]{a, b};
        }

        @Override
        public boolean eval(Object self, Mergeable object) {
            Double a = this.a.resolveAsDouble(self, object);
            Double b = this.b.resolveAsDouble(self, object);

            if ((a == null || b == null)) {
                throw WegasErrorMessage.error("GreaterThan operands can not be null");
            }

            return a > b;
        }
    }

    /**
     * Is the first ref less or equals than the second one ?
     * Throw WegasErrorMessage is any of the ref is not resolvable
     */
    public static class GreaterThanOrEquals extends Condition {

        private final Ref a;
        private final Ref b;

        public GreaterThanOrEquals(Ref a, Ref b) {
            this.a = a;
            this.b = b;
        }

        public Ref[] getGte() {
            return new Ref[]{a, b};
        }

        @Override
        public boolean eval(Object self, Mergeable object) {
            Double a = this.a.resolveAsDouble(self, object);
            Double b = this.b.resolveAsDouble(self, object);

            if ((a == null || b == null)) {
                throw WegasErrorMessage.error("GreaterThan operands can not be null");
            }

            return a >= b;
        }
    }
}
