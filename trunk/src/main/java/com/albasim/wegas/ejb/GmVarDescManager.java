/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.albasim.wegas.ejb;

import com.albasim.wegas.comet.Terminal;
import com.albasim.wegas.exception.InvalidContent;
import com.albasim.wegas.exception.NotFound;
import com.albasim.wegas.persistance.GameModel;
import com.albasim.wegas.persistance.GmInstance;
import com.albasim.wegas.persistance.GmType;
import com.albasim.wegas.persistance.GmVariableDescriptor;
import com.albasim.wegas.persistance.GmVariableInstance;
import com.albasim.wegas.persistance.cardinality.GmEnumCardinality;
import com.albasim.wegas.persistance.cardinality.GmEqualCardinality;
import com.albasim.wegas.persistance.instance.GmComplexInstance;
import com.albasim.wegas.persistance.type.GmComplexType;
import com.albasim.wegas.persistance.type.GmEnumType;
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
 * @author maxence
 */
@Stateless
@LocalBean
public class GmVarDescManager {

    private static final Logger logger = Logger.getLogger("EJB_GM");


    @EJB
    private AlbaEntityManager aem;


    @EJB
    private GameModelManager gmm;


    @EJB
    private GmTypeManager tm;


    @EJB
    private GmVarInstManager vim;


    @EJB
    private Dispatcher dispatcher;


    @PersistenceContext(unitName = "metaPU")
    private EntityManager em;


    public GmVariableDescriptor getVariableDescriptor(String gID, String vdID,
                                                      Terminal terminal) {
        GameModel gm = gmm.getGameModel(gID, null);
        GmVariableDescriptor vDesc = em.find(GmVariableDescriptor.class, Long.parseLong(vdID));

        if (vDesc != null && gm != null) {
            if (vDesc.getGameModel().equals(gm)) {
                dispatcher.registerObject(vDesc, terminal);
                return vDesc;
            }
            throw new InvalidContent();
        }
        throw new NotFound();
    }


    public void createVarDesc(GmVariableDescriptor theVarDesc,
                              Terminal terminal) {
        dispatcher.begin(terminal);

        GameModel gameModel = theVarDesc.getGameModel();
        GmType theType = tm.resolveTypeName(gameModel, theVarDesc.getRealStringType());
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

        varDescPrePersist(theVarDesc);

        aem.create(theVarDesc, terminal);
    }


    public void varDescPrePersist(GmVariableDescriptor vDesc) {
        dispatcher.create(vDesc);

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
            for (GmVariableInstance v : vDesc.getGmVariableInstances()) {
                v.setDescriptor(vDesc);
                vim.variableInstancePrePersist(v);
            }
        }

        if (vDesc.getCardinality() != null) {
            vDesc.getCardinality().setVarDesc(vDesc);

            if (vDesc.getCardinality() instanceof GmEqualCardinality) {
                GmEqualCardinality eqC = (GmEqualCardinality) vDesc.getCardinality();
                equalCardinalityPrePersist(eqC);
            } else if (vDesc.getCardinality() instanceof GmEnumCardinality) {
                GmEnumCardinality enC = (GmEnumCardinality) vDesc.getCardinality();
                enumCardinalityPrePersist(enC);
            }
        }

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


    public void destroyVariableDescriptor(String gmID, String vdID,
                                          Terminal terminal) {
        GmVariableDescriptor variableDescriptor = getVariableDescriptor(gmID, vdID, null);

        // TODO ! -> dispatcher  has to know which instances to remove ! -> PreDestroy

        dispatcher.begin(terminal);
        varDescPreDestroy(variableDescriptor);
        aem.destroy(variableDescriptor, terminal);
    }


    public void varDescPreDestroy(GmVariableDescriptor vd) {

        for (GmVariableInstance vi : vd.getGmVariableInstances()) {
            vim.variableInstancePreDestroy(vi);
        }

        dispatcher.remove(vd);
    }


    void detachAll(GameModel gameModel, Terminal terminal) {
        for (GmVariableDescriptor vd : gameModel.getVariableDescriptors()) {
            detach(vd, terminal);
        }
    }


    void detach(GmVariableDescriptor vd, Terminal terminal) {
        dispatcher.detach(vd, terminal);
    }


    void detachAll(GmComplexType ct, Terminal terminal) {
        for (GmVariableDescriptor vd : ct.getVariableDescriptors()) {
            detach(vd, terminal);
        }
    }


}
