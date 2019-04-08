package com.wegas.editor;

import java.lang.annotation.ElementType;
import java.lang.annotation.Inherited;
import java.lang.annotation.Repeatable;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import com.wegas.editor.JSONSchema.JSONSchema;

@Retention(RetentionPolicy.RUNTIME)
@Target({ ElementType.TYPE })
@Inherited
@Repeatable(Schemas.class)
public @interface Schema {
    Class<? extends JSONSchema> value();

    String property();

    /**
     * Shallow merge, default true
     */
    boolean merge() default true;
}