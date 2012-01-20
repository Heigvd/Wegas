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
import com.albasim.wegas.persistence.GameModel;
import com.albasim.wegas.persistence.GmInstance;
import com.albasim.wegas.persistence.GmType;
import com.albasim.wegas.persistence.VariableDescriptorEntity;
import com.albasim.wegas.persistence.VariableInstanceEntity;
import com.albasim.wegas.persistence.cardinality.GmEnumCardinality;
import com.albasim.wegas.persistence.cardinality.GmEqualCardinality;
import com.albasim.wegas.persistence.instance.GmComplexInstance;
import com.albasim.wegas.persistence.type.GmComplexType;
import com.albasim.wegas.persistence.type.GmEnumType;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@LocalBean
public class VariableDescriptorManager {

    private static final Logger logger = Logger.getLogger("EJB_GM");

    @EJB
    private WegasEntityManager aem;

    @EJB
    private VariableInstanceManager vim;

    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;


    public VariableDescriptorEntity getVariableDescriptor(Long variableDescriptorId) {
        VariableDescriptorEntity vDesc = em.find(VariableDescriptorEntity.class, variableDescriptorId);

        return vDesc;
        /*
        if (vDesc != null && gm != null) {
            if (vDesc.getGameModel().equals(gm)) {
            //    dispatcher.registerObject(vDesc);
                return vDesc;
            }
            throw new InvalidContent();
        }
        throw new NotFound();*/
    }


    public void createVarDesc(VariableDescriptorEntity theVarDesc) {

        GameModel gameModel = theVarDesc.getGameModel();
/*        GmType theType = tm.resolveTypeName(gameModel, theVarDesc.getRealStringType());
        theVarDesc.setType(theType);

        if (theVarDesc.getParentGameModel() != null) {
            GmVariableInstance vInst = new GmVariableInstance();
            vInst.setParentGameModel(gameModel);
            vInst.setDescriptor(theVarDesc);
            gameModel.getVariableInstances().add(vInst);
        } else {
            // Go through each instance of the complex type and add variable instance
            GmComplexType complexType = theVarDesc.getParentComplexType();
            for (GmInstance instance : complexType.getGmInstances()) {
                GmComplexInstance cInst = (GmComplexInstance) instance;
                List<GmVariableInstance> variableInstances = cInst.getVariableInstances();

                GmVariableInstance vInst = new GmVariableInstance();
                vInst.setParentComplexInstance(cInst);
                vInst.setDescriptor(theVarDesc);
                variableInstances.add(vInst);
            }
        }

        varDescPrePersist(theVarDesc);*/
        
        aem.create(theVarDesc);
    }


    public void varDescPrePersist(VariableDescriptorEntity vDesc) {
//        dispatcher.create(vDesc);

        // ensure the descriptor has one and only one parent
        if (vDesc.getParentComplexType() == null && vDesc.getParentGameModel() == null) {
            throw new InvalidContent("Orphan Variable Descriptor \"" + this.toString() + "\"");
        }
        if (vDesc.getParentComplexType() != null && vDesc.getParentGameModel() != null) {
            throw new InvalidContent("Variable Descriptor as two parent \"" + this.toString() + "\"!");
        }

        // Link the descriptor to the variable type
        GameModel gameModel = vDesc.getGameModel();
        GmType lookupType = gameModel.lookupType(vDesc.getRealStringType(), null);
        vDesc.setType(lookupType);

        if (vDesc.getGmVariableInstances() != null) {
            for (VariableInstanceEntity v : vDesc.getGmVariableInstances()) {
//                v.setDescriptor(vDesc);
                vim.variableInstancePrePersist(v);
            }
        }

/*        if (vDesc.getCardinality() != null) {
            vDesc.getCardinality().setVarDesc(vDesc);

            if (vDesc.getCardinality() instanceof GmEqualCardinality) {
                GmEqualCardinality eqC = (GmEqualCardinality) vDesc.getCardinality();
                equalCardinalityPrePersist(eqC);
            } else if (vDesc.getCardinality() instanceof GmEnumCardinality) {
                GmEnumCardinality enC = (GmEnumCardinality) vDesc.getCardinality();
                enumCardinalityPrePersist(enC);
            }
        }
*/
    }


    private void enumCardinalityPrePersist(GmEnumCardinality enC) {
        // Cardinality are so closely bound to their variable descriptor that 
        // they don't need to be included in the dispatcher

        GameModel gm = enC.getVarDesc().getGameModel();
        GmEnumType lookupType = (GmEnumType) gm.lookupType(enC.getStringEnumName(), GmEnumType.class);
        enC.setEnumeration(lookupType);
    }


    private void equalCardinalityPrePersist(GmEqualCardinality eqC) {
        // Cardinality are so closely bound to their variable descriptor that 
        // they don't need to be included in the dispatcher

        // Could be either a literal either a ref to a int variable
        // ref to int var is resolve as :
        //  - A path starting from the main (i.e. game model variable)
        //  - a path starting from the type which contains this cardinality (through var desc...)
        String value = eqC.getV();

        if (value == null || value.isEmpty()) {
            throw new InvalidContent("Equal Cardinality refers to no integer instace !");
        } else {
            try {
                // Is the int a literal ? 
                long parseLong = Long.parseLong(value);
                if (parseLong <= 0) {
                    throw new InvalidContent("EqualCardinality shall be greater than 0");
                }
            } catch (NumberFormatException ex) {
                logger.log(Level.INFO, " Value is a soft-ref: {0}", value);
                GameModel gm = eqC.getVarDesc().getGameModel();
                if (!gm.isReferencingAnInt(value, eqC.getVarDesc().getParentComplexType())) {
                    throw new InvalidContent("Unable to resolve : " + value);
                }

            }
        }
    }


    public void destroyVariableDescriptor(String gmID, String vdID) {
        VariableDescriptorEntity variableDescriptor = getVariableDescriptor(Long.parseLong(vdID));

        // TODO ! -> dispatcher  has to know which instances to remove ! -> PreDestroy

        varDescPreDestroy(variableDescriptor);
        aem.destroy(variableDescriptor);
    }


    public void varDescPreDestroy(VariableDescriptorEntity vd) {

        for (VariableInstanceEntity vi : vd.getGmVariableInstances()) {
            vim.variableInstancePreDestroy(vi);
        }

//        dispatcher.remove(vd);
    }


    void detachAll(GameModel gameModel) {
        for (VariableDescriptorEntity vd : gameModel.getVariableDescriptors()) {
            detach(vd);
        }
    }


    void detach(VariableDescriptorEntity vd) {
      //  dispatcher.detach(vd);
    }


    void detachAll(GmComplexType ct) {
        for (VariableDescriptorEntity vd : ct.getVariableDescriptors()) {
            detach(vd);
        }
    }


}
