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
package com.albasim.wegas.persistance.type;

import com.albasim.wegas.helper.MethodDescriptor;
import com.albasim.wegas.persistance.GmType;
import com.albasim.wegas.conf.DocumentType;
import com.albasim.wegas.persistance.GmEnumItem;
import com.albasim.wegas.persistance.GmVariableInstance;
import com.albasim.wegas.persistance.instance.GmMediaInstance;
import java.util.List;
import java.util.logging.Logger;
import javax.persistence.Entity;
import javax.validation.constraints.NotNull;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author maxence
 */
@Entity
@XmlType(name="MediaT", propOrder={"id", "name", "mediaType"})
public class GmMediaType extends GmType {
        
    static final Logger logger = Logger.getLogger("MediaTypeEntity");

    @NotNull
    private DocumentType mediaType;

    public DocumentType getMediaType() {
        return mediaType;
    }

    public void setMediaType(String mediaType) {
        this.mediaType = DocumentType.valueOf(mediaType.toUpperCase());
    }

    @Override
    public List<MethodDescriptor> getPrototypes(){
        List<MethodDescriptor> md = super.getPrototypes();

        MethodDescriptor getUrl = new MethodDescriptor("getUrl", "DMSEntry");
        md.add(getUrl);

        MethodDescriptor setUrl = new MethodDescriptor("setUrl", null);
        setUrl.addParam("url", "DMSEntry"); // TODO HOWTO ????
        md.add(getUrl);
        
        return md;
    }

    @Override
    public GmMediaInstance createInstance(String name, GmVariableInstance vi, GmEnumItem item) {
        GmMediaInstance mi = new GmMediaInstance();

        mi.setInstanceOf(this);
        mi.setName(name);

        mi.setVariable(vi);
        mi.setEnumItem(item);

        mi.setV(null);

        return mi;
    }


}
