/*
 * Wegas. 
 * http://www.albasim.com/wegas/
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2011 
 */
package com.albasim.wegas.ejb;

import com.albasim.wegas.exception.InvalidContent;
import com.albasim.wegas.exception.NotFound;
import com.albasim.wegas.persistence.GmEventListener;
import com.albasim.wegas.persistence.GmInstance;
import com.albasim.wegas.persistence.GmType;
import com.albasim.wegas.persistence.VariableDescriptorEntity;
import com.albasim.wegas.persistence.VariableInstanceEntity;
import com.albasim.wegas.persistence.instance.GmComplexInstance;
import com.albasim.wegas.persistence.instance.GmIntegerInstance;
import com.albasim.wegas.persistence.type.GmComplexType;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author maxence
 */
@Stateless
@LocalBean
public class GmInstanceManager {

    private static final Logger logger = Logger.getLogger("EJB_GM");


    @EJB
    private WegasEntityManager aem;


    @EJB
    private VariableInstanceManager vim;


    @EJB
    private GmEventListenerManager elm;


    @EJB
    private Dispatcher dispatcher;


    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;


    public void createInstance(String gmID, String vID, GmInstance newInstance) {
        VariableInstanceEntity vi = vim.getVariableInstance(gmID, vID);
/*        VariableDescriptorEntity vd = vi.getDescriptor();

        newInstance.setVariable(vi);

        GmType type = vd.getType();
        XmlType iXmlType = newInstance.getClass().getAnnotation(XmlType.class);

        // Does the cardinality allow to add instances ?
/*        if (vd.canAddInstance()) {
            // Check if the new instance has the correct type
            if (iXmlType.name().equals(type.getInstanceType())) {
                instancePrePersist(newInstance);
                aem.create(newInstance);
                return;
            }
            throw new InvalidContent("Instance type doesn't match ");
        }*/
        throw new InvalidContent("Cannot add instance to this variable !");
    }


    public void instancePrePersist(GmInstance i) {
       /* dispatcher.create(i);
        i.setInstanceOf(i.getVariable().getDescriptor().getType());

        if (i instanceof GmComplexInstance) {
            complexeInstancePrePersist((GmComplexInstance) i);
        }*/
    }


    private void complexeInstancePrePersist(GmComplexInstance ci) {

        // ARGH this is quite similar to GameModel::prePersist....
        if (ci.getListeners() != null) {
            for (GmEventListener el : ci.getListeners()) {
                el.setGmComplexInstance(ci);
                elm.eventListenerPrePersist(el);
            }
        }

        // Make sure the variable instance list exists
        if (ci.getVariableInstances() == null) {
            ci.setVariableInstances(new ArrayList<VariableInstanceEntity>());
        }

        GmComplexType theCType = (GmComplexType) ci.getInstanceOf();

        logger.log(Level.INFO, "ComplexInstance ComplexType: {0}", theCType);
        if (theCType == null) {
            throw new InvalidContent(ci.toString());
        }

        Collection<VariableDescriptorEntity> vds = theCType.getVariableDescriptors();

        // Check that all variable in the list are correct (i.e. the var name is defined by a descriptor)
        for (VariableInstanceEntity i : ci.getVariableInstances()) {
/*            VariableDescriptorEntity lookupDescriptor = theCType.lookupDescriptor(i.getStringName());
            if (lookupDescriptor == null) {
                throw new InvalidContent("The \"" + theCType.getName()
                        + "\"  doesn't contains any \""
                        + i.getName() + "\" variable descriptor");
            } else {
                // Instance exists, register descriptor and parent (this)
                i.setDescriptor(lookupDescriptor);
                i.setParentComplexInstance(ci);
                i.setParentGameModel(null);
                vim.variableInstancePrePersist(i);
            }*/
        }

        // Check that each descriptor has a variable; otherwise, propagateCreate the variable
        for (VariableDescriptorEntity vd : vds) {
            VariableInstanceEntity theVi = ci.lookupVariableInstance(vd.getName());
            if (theVi == null) {
                theVi = new VariableInstanceEntity();
//                theVi.setDescriptor(vd);
          //      theVi.setParentComplexInstance(ci);
                ci.getVariableInstances().add(theVi);
                vim.variableInstancePrePersist(theVi);
            }
        }
    }


    public GmInstance getInstance(String gmID, String vID, String iID) {
        logger.log(Level.INFO, "GetInstance: Terminal is : {0}");
        GmInstance find = em.find(GmInstance.class, Long.parseLong(iID));
        if (find != null) {
            VariableInstanceEntity vi = vim.getVariableInstance(gmID, vID);
            if (find.getVariable().equals(vi)) {
                return find;
            }
            throw new InvalidContent();
        }
        throw new NotFound();
    }


    /** 
     * juste the same as previous one but for ComplexInstance
     * For internal USE ONLY -> the returned object shall never been sent to user !
     * @param gmID
     * @param vID
     * @param iID
     * @return 
     */
    public GmComplexInstance getComplexInstance(String gmID, String vID,
                                                String iID) {
        GmComplexInstance find = em.find(GmComplexInstance.class, Long.parseLong(iID));
        if (find != null) {
            VariableInstanceEntity vi = vim.getVariableInstance(gmID, vID);
            if (find.getVariable().equals(vi)) {
                return find;
            }
            throw new InvalidContent();
        }
        throw new NotFound();
    }


    /**
     * Update an instance 
     * 
     * In the case the instance is an integer one that drives others 
     * variables instances through an EqualCardinality. The links instances are also
     * propagateUpdate (creation, destruction) to match the new value !
     * 
     * @param gmID game model ID the instance belongs to
     * @param vID variable id the instance belongs to
     * @param iID instance id to propagateUpdate
     * @param theInstance the user-provided instance which embed modifications
     * 
     * @return the propagateUpdate instance
     */
    public GmInstance updateInstance(String gmID, String vID, String iID,
                                     GmInstance theInstance) {
        GmInstance instance = getInstance(gmID, vID, iID);

        // First, does, the user-provided instance match the one specified folowing IDs ? 
        if (instance.equals(theInstance)) {
            // Set association in the user-provided instance
            // The type
            theInstance.setInstanceOf(instance.getInstanceOf());
            // The variable which define this variable
            theInstance.setVariable(instance.getVariable());

            // default behaviour is name is only editable with Unbounded cardinality 
/*            if (!instance.getVariable().getDescriptor().canChangeInstanceName()) {
                //revert the name if its modification is not allowed
                theInstance.setName(instance.getName());
            }*/

            if (theInstance instanceof GmIntegerInstance) {
                // Special case : IntegerInstance may drive EqualCardinalized variables

                // The new int instance
                GmIntegerInstance iInst = (GmIntegerInstance) theInstance;
                // And the old one
                GmIntegerInstance iInstOri = (GmIntegerInstance) instance;

                // Get variable linked to the original instance
                List<VariableInstanceEntity> gmVariableInstances = iInstOri.getGmVariableInstances();

                // Is there linked variables ? 
                if (gmVariableInstances != null && !gmVariableInstances.isEmpty()) {

                    Integer newValue = iInst.getV();
                    Integer oldValue = iInstOri.getV();

                    int nv = (newValue == null ? 0 : newValue.intValue());
                    int ov = (oldValue == null ? 0 : oldValue.intValue());

                    logger.log(Level.INFO, "VALUES (eqCard) {0} -> {1}", new Object[]{nv, ov});

                    if (nv < 0) {
                        // TOOD ?? Why not ... it shall be possible 
                        throw new InvalidContent("Negative value are forbidden when value is used by an EqualCardinality");
                    }

                    // be careful : the logic will become invalid if negative value are made valid !
                    if (nv < ov) {
                        // Case a) remove instance
                        for (VariableInstanceEntity vInst : iInstOri.getGmVariableInstances()) {
/*                            for (GmInstance inst : vInst.getInstances()) {
                                int parseInt = Integer.parseInt(inst.getName());
                                if (parseInt > nv) {
                                    // Current instance index is grater than bound
                                    dispatcher.remove(inst);
                                    // DO NOT PROVIDE TERMINAL to avoid commiting now !
                                    aem.destroy(inst);
                                }
                            }*/
                        }
                    } else if (nv > ov) {
                        // Case b) propagateCreate instances
                        Integer i;
                        for (VariableInstanceEntity vInst : iInstOri.getGmVariableInstances()) {
                     /*       for (i = ov + 1; i <= nv; i++) {
                                GmInstance createInstance = vInst.getDescriptor().getType().createInstance(i.toString(), vInst, null);
                                dispatcher.create(createInstance);
                                // DO NOT PROVIDE TERMINAL to avoid commiting now !
                                aem.create(createInstance);
                            }*/
                        }
                    }
                }
            }
            GmInstance update = aem.update(theInstance);
            return update;
        }
        throw new InvalidContent();
    }


    /**
     * Destroy the instance
     * 
     * Note about EqualCardinality link to the instance to propagateDestroy:
     *   Since only one-cardinalized integer instance can be referenced by 
     *   equalCardinalites, the destruction of such an instance is forbidden
     *   In the future, if referencable variable is extended, special operation
     *   shall be included here
     * 
     */
    public void destroyInstance(String gmID, String vID, String iID) {
        GmInstance instance = getInstance(gmID, vID, iID);
        VariableInstanceEntity vi = instance.getVariable();
/*        VariableDescriptorEntity vd = vi.getDescriptor();

/*        if (vd.canRemoveInstance()) {
            instancePreDestroy(instance);
            aem.destroy(instance);
            return;
        }*/

        throw new InvalidContent("Cannot destroy variable");
    }


    public void instancePreDestroy(GmInstance i) {

        if (i instanceof GmComplexInstance){
            GmComplexInstance ci = (GmComplexInstance) i;

            for (GmEventListener el : ci.getListeners()){
                elm.eventListenerPreDestroy(el);
            }

            for (VariableInstanceEntity vi : ci.getVariableInstances()){
                vim.variableInstancePreDestroy(vi);
            }
        }
        
        dispatcher.remove(i);
    }


    void detachAll(VariableInstanceEntity vi) {
/*        for (GmInstance i : vi.getInstances()){
            detach(i);
        }*/
    }


    private void detach(GmInstance i) {
        if (i instanceof GmComplexInstance){
            vim.detachAll((GmComplexInstance)i);
            elm.detachAll((GmComplexInstance)i);
        }
       // dispatcher.detach(i);
    }




}
