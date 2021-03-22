package ch.albasim.wegas.annotations;

import ch.albasim.wegas.annotations.CommonView.FEATURE_LEVEL;
import ch.albasim.wegas.annotations.CommonView.LAYOUT;
import java.lang.annotation.ElementType;
import java.lang.annotation.Inherited;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;


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
     * most sens being declared in the view.
     */
    int index() default 0;
}
