/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.event.client;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import java.io.Serializable;
import javax.xml.bind.annotation.XmlRootElement;

/**
 *
 * @author Yannick Lagger <lagger.yannick at gmail.com>
 */
@XmlRootElement
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
//@JsonSubTypes()
abstract public class ClientEvent implements Serializable {
}
