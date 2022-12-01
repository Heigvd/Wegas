/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, MEI
 * Licensed under the MIT License
 */
package ch.albasim.wegas.annotations;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 *
 * @author maxence
 */
@Target(ElementType.METHOD)
@Retention(value = RetentionPolicy.RUNTIME)
public @interface Scriptable {

    /**
     * empty string means generate the label from method name
     *
     * @return
     */
    String label() default "";

    /**
     * Should the annotated method be visible in the wysiwyg editor ? setting to false will hide the
     * method from the wysiwyg editor but autocompletion will be available when editing the script
     * source
     *
     * @return
     */
    boolean wysiwyg() default true;

    /**
     * Default auto value auto detect from effective method return type. VOID indicated the
     * effective return type must be ignored
     *
     * @return
     */
    ReturnType returnType() default ReturnType.AUTO;

    /**
     * May the annotated method returns null values?
     *
     * @return true if the annotated method may return null values
     */
    boolean nullable() default false;

    /**
     * State Machine Transition watch scope. Indicates the strategy to apply to get the variables on
     * which the return of the depicted getter depends on.
     *
     * @return
     */
    DependencyScope dependsOn();// default DependencyScope.SELF;

    enum ReturnType {
        /**
         * Getter or setter, depending on effective method return type
         */
        AUTO,
        /**
         * Force setter
         */
        VOID
    }
}
