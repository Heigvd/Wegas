package com.wegas.editor.View;

import com.wegas.editor.View.CommonView.FEATURE_LEVEL;
import java.lang.annotation.ElementType;
import java.lang.annotation.Inherited;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import com.wegas.editor.View.CommonView.LAYOUT;

@Retention(RetentionPolicy.RUNTIME)
@Target({ ElementType.FIELD })
@Inherited
public @interface View {
    Class<? extends CommonView> value() default CommonView.class;

    String label();

    String description() default "";

    boolean borderTop() default false;

    boolean readOnly() default false;

    LAYOUT layout() default LAYOUT.none;

    FEATURE_LEVEL featureLevel() default FEATURE_LEVEL.DEFAULT;

    /**
     * index (used to sort properties from an object)
     *
     * Technically this property ends into the schema and not the view. But makes
     * most sens beeing declared in the view.
     */
    int index() default 0;
}
