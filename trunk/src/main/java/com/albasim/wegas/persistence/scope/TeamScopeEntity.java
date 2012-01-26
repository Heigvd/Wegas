/*
 * Wegas. 
 * http://www.albasim.com/wegas/
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2011 
 */
package com.albasim.wegas.persistence.scope;

import com.albasim.wegas.persistence.GameModelEntity;
import com.albasim.wegas.persistence.TeamEntity;
import com.albasim.wegas.persistence.users.UserEntity;
import com.albasim.wegas.persistence.variabledescriptor.VariableDescriptorEntity;
import com.albasim.wegas.persistence.variableinstance.VariableInstanceEntity;
import java.util.HashMap;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.OneToMany;
import javax.persistence.PostUpdate;
import javax.persistence.PrePersist;
import javax.persistence.Table;
import javax.persistence.UniqueConstraint;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@XmlType(name = "TeamScope", propOrder = {"@class", "id", "name"})
public class TeamScopeEntity extends ScopeEntity {

    private static final Logger logger = Logger.getLogger(TeamScopeEntity.class.getName());
    /*
     * FIXME Here we should use TeamEntity reference and add a key deserializer module 
     */
    @OneToMany(mappedBy = "teamScope", cascade = {CascadeType.PERSIST, CascadeType.REMOVE})
    //@MapKey(name="id")
    @XmlTransient
    private Map<Long, VariableInstanceEntity> teamVariableInstances = new HashMap<Long, VariableInstanceEntity>();

    /**
     * 
     * @return
     */
    @Override
    public Map<Long, VariableInstanceEntity> getVariableInstances() {
        return this.teamVariableInstances;
    }

    /**
     * 
     * @param userId
     * @param v
     */
    @Override
    public void setVariableInstances(Long userId, VariableInstanceEntity v) {
        this.teamVariableInstances.put(userId, v);
        v.setTeamScope(this);
    }

    /**
     * 
     */
    @PrePersist
    public void prePersist() {
        VariableDescriptorEntity vd = this.getVariableDescriptor();
        GameModelEntity gm = vd.getGameModel();
        for (TeamEntity t : gm.getTeams()) {
            VariableInstanceEntity vi = this.teamVariableInstances.get(t.getId());
            if (vi == null) {
                try {
                    VariableInstanceEntity newVi = (VariableInstanceEntity) vd.getDefaultVariableInstance().clone();
                    this.setVariableInstances(t.getId(), newVi);
                    //  wem.create(newVi);
                    // this.vari
                } catch (CloneNotSupportedException ex) {
                    logger.log(Level.SEVERE, "Error cloning VariableInstanceEntity", ex);
                }
            }
        }

    }
}
/*
public class UuidMapKeyDeserializerModule extends Module {

@Override
public String getModuleName() {
return getClass().getName();
}

@Override
public Version version() {
return Version.unknownVersion();
}

@Override
public void setupModule(SetupContext context) {
context.addKeyDeserializers(new KeyDeserializers() {
@Override
public KeyDeserializer findKeyDeserializer(JavaType type, DeserializationConfig config, BeanDescription beanDesc, BeanProperty property) throws JsonMappingException {
if (type.getRawClass().equals(UUID.class)) {
return new UuidDeserializer();
}
return null;
}
});
}

private static class UuidDeserializer extends KeyDeserializer {
@Override
public UUID deserializeKey(String key, DeserializationContext ctxt) throws IOException {
return UUID.fromString(key);
}
}
}
class UserDeserializer extends StdKeyDeserializer {

protected UserDeserializer(Class<UserEntity> cls) {
super(cls);
}

@Override
protected Object _parse(String key, DeserializationContext ctxt) throws Exception {
ObjectMapper mapper = new ObjectMapper();
return mapper.readValue(key, UserEntity.class);
}
}*/
