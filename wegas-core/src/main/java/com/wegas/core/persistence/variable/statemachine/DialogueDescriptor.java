/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.statemachine;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonTypeName;
import javax.persistence.Entity;

/*
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
@JsonIgnoreProperties(value = {"content"})
@JsonTypeName("DialogueDescriptor")
public class DialogueDescriptor extends StateMachineDescriptor {

    private static final long serialVersionUID = 1L;
}
