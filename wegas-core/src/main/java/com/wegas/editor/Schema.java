package com.wegas.editor;

import ch.albasim.wegas.annotations.JSONSchema;
import ch.albasim.wegas.annotations.View;
import java.lang.annotation.ElementType;
import java.lang.annotation.Inherited;
import java.lang.annotation.Repeatable;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Retention(RetentionPolicy.RUNTIME)
@Target({ ElementType.TYPE })
@Inherited
@Repeatable(Schemas.class)
public @interface Schema {
    Class<? extends JSONSchema> value();

    String property();

    View view();

    /**
     * Shallow merge, default true
     */
    boolean merge() default true;
}