package com.wegas.leaderway.persistence;

import java.io.Serializable;
import java.util.Map;
import javax.persistence.Column;
import javax.persistence.ElementCollection;
import javax.persistence.Embeddable;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonTypeInfo;

/**
 *
 * @author Benjamin
 */
@Embeddable
@XmlRootElement
@XmlType(name = "")                                                             // This forces to use Class's short name as type
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
public class WRequirement implements Serializable {

    /**
     *
     */
    @Column(name = "wlimit")
    private Integer limit;
    /**
     *
     */
    @ElementCollection
    private Map<Long, Integer> skills;

    public WRequirement() {
    }

    /**
     * @return the skills
     */
    public Map<Long, Integer> getSkills() {
        return skills;
    }

    /**
     * @param skills the skills to set
     */
    public void setSkills(Map<Long, Integer> skills) {
        this.skills = skills;
    }

    /**
     * @return the limit
     */
    public Integer getLimit() {
        return limit;
    }

    /**
     * @param limit the limit to set
     */
    public void setLimit(Integer limit) {
        this.limit = limit;
    }
}