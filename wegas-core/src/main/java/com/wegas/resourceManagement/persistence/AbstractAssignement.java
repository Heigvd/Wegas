package com.wegas.resourceManagement.persistence;

import com.wegas.core.persistence.AbstractEntity;
import org.codehaus.jackson.annotate.JsonSubTypes;

/**
 *
 * @author Benjamin
 */
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "Occupation", value = Occupation.class),
    @JsonSubTypes.Type(name = "Activity", value = Activity.class),
    @JsonSubTypes.Type(name = "Assignment", value = Assignment.class)
})
public abstract class AbstractAssignement extends AbstractEntity {
}
