package com.wegas.watson;

import com.wegas.core.persistence.game.GameModel;
import java.util.ArrayList;
import java.util.List;
import org.junit.Test;

/**
 *
 * @author Pierre-Adrien Ghiringhelli
 */


public class WatsonTest {
    
    @Test
    public void test(){
        System.out.println("debut du test");
        
        GameModel gm = new GameModel("testWatson");
        System.out.println("Game model créé");
        
        String intent1 = WatsonUtils.createIntent(gm, "Bonjour", "Description de bonjour");
        System.out.println("Intent : " + intent1 +" créé");
        WatsonUtils.createExample(gm, intent1, "Bonjour");
        WatsonUtils.createExample(gm, intent1, "Hello");
        WatsonUtils.createExample(gm, intent1, "Yo");
        WatsonUtils.createExample(gm, intent1, "Salut");
        WatsonUtils.createExample(gm, intent1, "Ciao");
        WatsonUtils.createExample(gm, intent1, "Tchô");
        WatsonUtils.createExample(gm, intent1, "Bonsoir");
        System.out.println("Exemples de l'intent : " + intent1 +" créés");
        
        String intent2 = WatsonUtils.createIntent(gm, "Aurevoir", "Description de Au revoir");
        System.out.println("Intent : " + intent2 +" créé");
        WatsonUtils.createExample(gm, intent2, "Au revoir");
        WatsonUtils.createExample(gm, intent2, "A bientôt");
        WatsonUtils.createExample(gm, intent2, "A plus");
        WatsonUtils.createExample(gm, intent2, "Salut");
        WatsonUtils.createExample(gm, intent2, "A la prochaine");
        WatsonUtils.createExample(gm, intent2, "Adieu");
        WatsonUtils.createExample(gm, intent2, "Bonne soirée");
        System.out.println("Exemples de l'intent : " + intent2 +" créés");
        
        String intent3 = WatsonUtils.createIntent(gm, "Fruit", "Description de Fruit");
        System.out.println("Intent : " + intent3 +" créé");
        WatsonUtils.createExample(gm, intent3, "Mangue");
        WatsonUtils.createExample(gm, intent3, "Pomme");
        WatsonUtils.createExample(gm, intent3, "Pêche");
        WatsonUtils.createExample(gm, intent3, "Abricot");
        WatsonUtils.createExample(gm, intent3, "Banane");
        WatsonUtils.createExample(gm, intent3, "Kiwi");
        WatsonUtils.createExample(gm, intent3, "Figue");
        System.out.println("Exemples de l'intent : " + intent3 +" créés");
        
        System.out.println(WatsonUtils.sendMessage(gm.getProperties().getWatsonWorkspaceId(), "Cerise"));
        
        WatsonUtils.deleteWorkspace(gm.getProperties().getWatsonWorkspaceId());
        System.out.println("workspace : " + gm.getProperties().getWatsonWorkspaceId() + " supprimé");
    }
}
