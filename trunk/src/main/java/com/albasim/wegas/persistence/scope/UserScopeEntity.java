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
@Table(uniqueConstraints =
@UniqueConstraint(columnNames = "name"))
@XmlType(name = "UserScope", propOrder = {"@class", "id", "name"})
public class UserScopeEntity extends ScopeEntity {

    private static final Logger logger = Logger.getLogger(UserScopeEntity.class.getName());
    
    
    
    //@EJB
    //@Transient
   // private WegasEntityManager wem;
    
    /*
    @ElementCollection(fetch=FetchType.EAGER)
    @MapKeyColumn(name = "id", insertable = false, updatable = false)
    @CollectionTable(
    //schema = "jpa",
    name = "varinst_map", 
    joinColumns = @JoinColumn(name = "id"))*/
    // @OneToMany(mappedBy = "scope", cascade = {CascadeType.PERSIST, CascadeType.REMOVE})
   /* @XmlTransient*/
    //@MapKey
    // @JsonDeserialize(keyUsing = UserDeserializer.class)
    //private Map<UserEntity, VariableInstanceEntity> variableInstances= new HashMap<UserEntity, VariableInstanceEntity>();
    //  private Map<Long, VariableInstanceEntity> variableInstances = new HashMap<Long, VariableInstanceEntity>();
    /*
    @ElementCollection(fetch=FetchType.EAGER)
    @MapKeyColumn(name = "language", insertable = false, updatable = false)
    @CollectionTable(schema = "jpa", name = "multilingual_string_map", 
    joinColumns = @JoinColumn(name = "string_id"))
    private Map<Long, VariableInstanceEntity> variableInstances = new HashMap<Long, VariableInstanceEntity>();*/
    /*
    @ElementCollection
    @MapKeyColumn(name="name")
    @Column(name="value")
    @CollectionTable(name="example_attributes", joinColumns=@JoinColumn(name="UserScopeEntity_id"))
    Map<String, String> attributes = new HashMap<String, String>();*/
    /**
     * @return the variableInstance
     */
    /*
     * FIXME Here we should use UserEntity reference and add a key deserializer module 
     */
  
    @OneToMany(mappedBy = "scope", cascade = { CascadeType.PERSIST, CascadeType.REMOVE})
    //@MapKey(name="id")
    @XmlTransient
    private Map<Long, VariableInstanceEntity> variableInstances = new HashMap<Long, VariableInstanceEntity>();
  
    @Override
    public Map<Long, VariableInstanceEntity> getVariableInstances() {
        return this.variableInstances;
    }

    @Override
    public void setVariableInstances(Long userId, VariableInstanceEntity v) {
        this.variableInstances.put(userId, v);
        v.setScope(this);
    }

    @PrePersist
    public void prePersist() {
        VariableDescriptorEntity vd = this.getVariableDescriptor();
        GameModelEntity gm = vd.getGameModel();
        for (TeamEntity t : gm.getTeams()) {
            for (UserEntity u : t.getUsers()) {
                VariableInstanceEntity vi = this.variableInstances.get(u.getId());
                if (vi == null) {
                    try {
                        VariableInstanceEntity newVi = (VariableInstanceEntity) vd.getDefaultVariableInstance().clone();
                        this.setVariableInstances(u.getId(), newVi);
                      //  wem.create(newVi);
                       // this.vari
                    } catch (CloneNotSupportedException ex) {
                        logger.log(Level.SEVERE, "Error cloning VariableInstanceEntity", ex);
                    }
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
