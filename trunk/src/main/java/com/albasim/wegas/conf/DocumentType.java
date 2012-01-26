/*
 * MetAlbasim is super koool. http://www.albasim.com
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2010, 2011 
 *
 * MetAlbasim is distributed under the ??? license
 *
 */
package com.albasim.wegas.conf;

import javax.xml.bind.annotation.XmlRootElement;

/**
 *
 * 
 */
@XmlRootElement
public enum DocumentType {
    /**
     * 
     */
    VIDEO,
    /**
     * 
     */
    SOUND,
    /**
     * 
     */
    DOCUMENT;
}
