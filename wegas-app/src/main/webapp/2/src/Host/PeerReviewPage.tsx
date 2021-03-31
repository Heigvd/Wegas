import { css, cx } from 'emotion';
import { set } from 'lodash';
import * as React from 'react';
import { IPeerReviewDescriptor } from 'wegas-ts-api';
import { VariableDescriptorAPI } from '../API/variableDescriptor.api';
import { languagesCTX } from '../Components/Contexts/LanguagesProvider';
import { useOnClickOutside } from '../Components/Hooks/useOnClickOutside';
import { Button } from '../Components/Inputs/Buttons/Button';
import { themeVar } from '../Components/Style/ThemeVars';
import { Toolbar } from '../Components/Toolbar';
import {
  expandWidth,
  flex,
  flexColumn,
  flexDistribute,
  flexRow,
} from '../css/classes';
import { instantiate } from '../data/scriptable';
import { GameModel, Player } from '../data/selectors';
import { useStore } from '../data/Stores/store';
import { translate } from '../Editor/Components/FormView/translatable';
import { createScript } from '../Helper/wegasEntites';
import { wlog } from '../Helper/wegaslog';
import { InfoOverlay } from './InfoOverlay';

const prStateStyle = css({
  borderRadius: '10px',
  backgroundColor: themeVar.Common.colors.PrimaryColor,
  color: themeVar.Common.colors.SecondaryBackgroundColor,
  boxShadow: '1px 2px 6px rgba(0, 0, 0, 0.2)',
  padding: '10px',
  minWidth: '200px',
  minHeight: '120px',
  textAlign: 'center',
});

const prActiveStateStyle = css({
  backgroundColor: themeVar.Common.colors.ActiveColor,
  color: themeVar.Common.colors.LightTextColor,
});

interface PeerReviewPageProps {
  peerReview: IPeerReviewDescriptor;
}

interface OverviewItem {
  id: string;
  label: string;
  formatter: string;
  nodeFormatter?: string;
  allowHTML?: boolean;
}

interface PeerReviewData {
  structure: {
    overview: {
      title: string;
      items: OverviewItem[];
    }[];
    reviews: { id: string; title: string; items: OverviewItem[] }[];
    comments: { id: string; title: string; items: OverviewItem[] }[];
  };
  data: {
    [id: string]: {
      overview: {
        done: string;
        done_color: string;
        commented: string;
        comments_color?: string;
        color: string;
        internal_status: string;
        status: string;
      };
      reviews: {};
      comments: {};
    };
  };
  extra: {
    [id: string]: {
      numberOfValues: number;
      mean?: number | null;
      min?: number | null;
      max?: number | null;
      median?: number | null;
      sd?: number | null;
      histogram?:
        | {
            min: number;
            max: number;
            maxValue: number | null;
            minValue: number | null;
            count: number;
          }[]
        | {
            [label: string]: number;
          };
      type: string;
      id: number;
      name: string;
      label: string;
      data: [];
      averageNumberOfWords?: number;
      averageNumberOfCharacters?: number;
    };
  };
  variable: any;
}

const test: PeerReviewData = {
  structure: {
    overview: [
      {
        title: 'Aperçu',
        items: [
          {
            id: 'status',
            label: 'Édition',
            formatter: 'null',
            nodeFormatter:
              'function colorize(o) {\n        o.cell.setHTML("<span>" + o.value + "</span>");\n        o.cell.addClass("status-" + o.data.color);\n    }',
            allowHTML: true,
          },
          {
            id: 'done',
            label: 'Feedbacks terminés',
            formatter: 'null',
            nodeFormatter:
              'function colorizeDone(o) {\n        o.cell.setHTML("<span>" + o.value + "</span>");\n        o.cell.addClass("status-" + o.data.done_color);\n    }',
            allowHTML: true,
          },
          {
            id: 'commented',
            label: 'Commentaires Terminés',
            formatter: 'null',
            nodeFormatter:
              'function colorizeComments(o) {\n        o.cell.setHTML("<span>" + o.value + "</span>");\n        o.cell.addClass("status-" + o.data.comments_color);\n    }',
            allowHTML: true,
          },
        ],
      },
    ],
    reviews: [
      {
        id: 'ev-19666595',
        title: "Justification de l'évaluation et recommandations",
        items: [
          {
            id: '19666595-wc',
            label: 'Nombre de mots',
            formatter:
              'function formatToFixed2(o) {\n        if (o.value !== undefined && o.value !== null) {\n            return o.value.toFixed(2);\n        }\n        return "N/A";\n    }',
          },
          {
            id: '19666595-cc',
            label: 'Nombre de signes',
            formatter:
              'function formatToFixed2(o) {\n        if (o.value !== undefined && o.value !== null) {\n            return o.value.toFixed(2);\n        }\n        return "N/A";\n    }',
          },
          {
            id: '19666595-data',
            label: 'Textes',
            formatter:
              '<span class="texteval-data"><i data-ref="19666595-data" class="fa fa-info-circle"></i></span>',
          },
        ],
      },
      {
        id: 'ev-19666598',
        title: 'Note fond',
        items: [
          {
            id: '19666598-mean',
            label: 'Moyenne',
            formatter:
              '<span class="gradeeval-data">{value} <i data-ref="19666598-data" class="fa fa-info-circle"></i></span>',
          },
          {
            id: '19666598-sd',
            label: 'écart-type',
            formatter:
              'function formatToFixed2(o) {\n        if (o.value !== undefined && o.value !== null) {\n            return o.value.toFixed(2);\n        }\n        return "N/A";\n    }',
          },
        ],
      },
      {
        id: 'ev-19666601',
        title: 'Note forme',
        items: [
          {
            id: '19666601-mean',
            label: 'Moyenne',
            formatter:
              '<span class="gradeeval-data">{value} <i data-ref="19666601-data" class="fa fa-info-circle"></i></span>',
          },
          {
            id: '19666601-sd',
            label: 'écart-type',
            formatter:
              'function formatToFixed2(o) {\n        if (o.value !== undefined && o.value !== null) {\n            return o.value.toFixed(2);\n        }\n        return "N/A";\n    }',
          },
        ],
      },
    ],
    comments: [
      {
        id: 'ev-19666575',
        title: 'Note',
        items: [
          {
            id: '19666575-mean',
            label: 'Moyenne',
            formatter:
              '<span class="gradeeval-data">{value} <i data-ref="19666575-data" class="fa fa-info-circle"></i></span>',
          },
          {
            id: '19666575-sd',
            label: 'écart-type',
            formatter:
              'function formatToFixed2(o) {\n        if (o.value !== undefined && o.value !== null) {\n            return o.value.toFixed(2);\n        }\n        return "N/A";\n    }',
          },
        ],
      },
      {
        id: 'ev-19666578',
        title: 'Justification',
        items: [
          {
            id: '19666578-wc',
            label: 'Nombre de mots',
            formatter:
              'function formatToFixed2(o) {\n        if (o.value !== undefined && o.value !== null) {\n            return o.value.toFixed(2);\n        }\n        return "N/A";\n    }',
          },
          {
            id: '19666578-cc',
            label: 'Nombre de signes',
            formatter:
              'function formatToFixed2(o) {\n        if (o.value !== undefined && o.value !== null) {\n            return o.value.toFixed(2);\n        }\n        return "N/A";\n    }',
          },
          {
            id: '19666578-data',
            label: 'Textes',
            formatter:
              '<span class="texteval-data"><i data-ref="19666578-data" class="fa fa-info-circle"></i></span>',
          },
        ],
      },
      {
        id: 'ev-19666581',
        title: "Pertinence de l'évaluation",
        items: [
          {
            id: '19666581-inutile',
            label: 'inutile',
            formatter: 'null',
          },
          {
            id: '19666581-peu utile',
            label: 'peu utile',
            formatter: 'null',
          },
          {
            id: '19666581-moyenne',
            label: 'moyenne',
            formatter: 'null',
          },
          {
            id: '19666581-utile',
            label: 'utile',
            formatter: 'null',
          },
          {
            id: '19666581-excellente',
            label: 'excellente',
            formatter: 'null',
          },
        ],
      },
    ],
  },
  data: {
    '19682476': {
      overview: {
        done: '3 / 3',
        done_color: 'green',
        commented: '3 / 3',
        comments_color: 'green',
        color: 'green',
        internal_status: 'completed',
        status: 'Terminé',
      },
      reviews: {
        '19666595-wc': 25.333333333333332,
        '19666595-cc': 158,
        '19666595-data': [
          '<p>Fond:</p>\n<p>- tr&egrave;s correcte</p>\n<p>- justifications simples et p&eacute;rtinentes</p>\n<p>&nbsp;</p>\n<p>Forme:</p>\n<p>- email correct</p>\n<p>- r&eacute;ponses aux questions claires</p>',
          "<p>L'email est tr&egrave;s bien structur&eacute;, les arguments sont compr&eacute;hensibles et justifi&eacute;. Il ne manque plus que les formules de salutaitons &agrave; la fin du mail.</p>",
          '<p>Yo, bonne organisation du texte qui permet de bien comprendre les r&eacute;ponses.<br /><br /></p>\n<p>Je pense que les r&eacute;ponse pourraient &ecirc;tre plus argument&eacute;es pour que le client puisse mieux comprendre pourquoi tel ou tel choix.</p>\n<p>&nbsp;</p>\n<p>&nbsp;</p>',
        ],
        '19666598-mean': '5.67',
        '19666598-sd': 0.4714045207910317,
        '19666598-data': [6, 6, 5],
        '19666601-mean': '5.67',
        '19666601-sd': 0.4714045207910317,
        '19666601-data': [6, 5, 6],
      },
      comments: {
        '19666575-mean': '4.00',
        '19666575-sd': 1,
        '19666575-data': [3, 5, null],
        '19666578-wc': 14.666666666666666,
        '19666578-cc': 84,
        '19666578-data': [
          '<p>Pq comparer aux autres?</p>',
          "<p>Un plaisir de voir un peu d'&eacute;l&eacute;gance dans ce monde sauvage. Merci pour votre retour qui est tr&egrave;s appr&eacute;ci&eacute;.</p>",
          '<p>Merci de votre retour, cependant mon travail m&eacute;rite largement la note de 6, je crains donc de devoir rejeter votre feedback</p>',
        ],
        '19666581-inutile': 0,
        '19666581-peu utile': 1,
        '19666581-moyenne': 1,
        '19666581-utile': 0,
        '19666581-excellente': 1,
      },
    },
    '19682483': {
      overview: {
        done: '3 / 3',
        done_color: 'green',
        commented: '3 / 3',
        comments_color: 'green',
        color: 'green',
        internal_status: 'completed',
        status: 'Terminé',
      },
      reviews: {
        '19666595-wc': 27,
        '19666595-cc': 164,
        '19666595-data': [
          "<p>il manque les comp&eacute;tences du chef de projet (et la question 3)</p>\n<p>&nbsp;</p>\n<p>mais sinon c'est top</p>",
          "<p>projet A: M&eacute;thode en cascade adapt&eacute;e aux modifications des besoins pour tous les d&eacute;partements ?</p>\n<p>projet B: Il s'agit ici de d&eacute;finir une m&eacute;thodologie pour le partage des connaissances &agrave; l'interne, une m&eacute;thode agile para&icirc;t donc peu adapt&eacute;e... Une fois le how to mis en place, il s'agit juste de le respecter pour conserver l'uniformit&eacute; des documentations.<br /><br /></p>",
          '<p>Un peu raclette raclette niveau fond. Tr&egrave;s minimaliste.</p>',
        ],
        '19666598-mean': '4.33',
        '19666598-sd': 1.247219128924647,
        '19666598-data': [6, 4, 3],
        '19666601-mean': '4.50',
        '19666601-sd': 0.5,
        '19666601-data': [5, 4, null],
      },
      comments: {
        '19666575-mean': '5.67',
        '19666575-sd': 0.4714045207910317,
        '19666575-data': [5, 6, 6],
        '19666578-wc': 0,
        '19666578-cc': 0,
        '19666578-data': [null, '', null],
        '19666581-inutile': 0,
        '19666581-peu utile': 0,
        '19666581-moyenne': 0,
        '19666581-utile': 3,
        '19666581-excellente': 0,
      },
    },
    '19682515': {
      overview: {
        done: '3 / 3',
        done_color: 'green',
        commented: '3 / 3',
        comments_color: 'green',
        color: 'green',
        internal_status: 'completed',
        status: 'Terminé',
      },
      reviews: {
        '19666595-wc': 27.666666666666668,
        '19666595-cc': 162.66666666666666,
        '19666595-data': [
          '<p>tr&eacute;s bien structur&eacute; pour chaque &eacute;l&eacute;ment , et le fond est est bien expliqu&eacute;&nbsp; selon son point de vue</p>',
          "<p>+ Forme d'email</p>\n<p>+ Niveau de complexit&eacute; tr&egrave;s bien expliqu&eacute;</p>\n<p>- manque de justifications &agrave; propos des m&eacute;thodes</p>\n<p>- fautes d'orthographes</p>",
          '<p>La forme est bonne mais attention aux fautes de fran&ccedil;ais et aux mots en anglais</p>\n<p>&nbsp;</p>\n<p>Concernant le fond, les propositions sont claires et bien expliqu&eacute;es,</p>\n<p>&agrave; part concernant la m&eacute;thode de d&eacute;veloppement du projet A. Quels &eacute;tapes seraient possible en m&eacute;thode agile ?</p>',
        ],
        '19666598-mean': '5.00',
        '19666598-sd': 0.816496580927726,
        '19666598-data': [5, 4, 6],
        '19666601-mean': '4.67',
        '19666601-sd': 0.4714045207910317,
        '19666601-data': [5, 4, 5],
      },
      comments: {
        '19666575-mean': '6.00',
        '19666575-sd': 0,
        '19666575-data': [6, 6, 6],
        '19666578-wc': 8.666666666666666,
        '19666578-cc': 54.333333333333336,
        '19666578-data': [
          '<p>Logique et pertinente&nbsp;</p>',
          "<p>je pense que c'est pertinant</p>",
          "<p>Merci pour le retour !</p>\n<p>Effectivement, je n'avais pas compris qu'il fallait r&eacute;pondre la r&eacute;ponse sous forme d'email</p>",
        ],
        '19666581-inutile': 0,
        '19666581-peu utile': 0,
        '19666581-moyenne': 0,
        '19666581-utile': 2,
        '19666581-excellente': 1,
      },
    },
    '19682553': {
      overview: {
        done: '3 / 3',
        done_color: 'green',
        commented: '3 / 3',
        comments_color: 'green',
        color: 'green',
        internal_status: 'completed',
        status: 'Terminé',
      },
      reviews: {
        '19666595-wc': 71.66666666666667,
        '19666595-cc': 416.6666666666667,
        '19666595-data': [
          "<p>Il manque les salutations d'usage dans un mail. Que veut dire \"pas termin&eacute;\"? Attention aux fautes de fran&ccedil;ais.</p>\n<p>De plus, on ne comprends pas de suite ce qu'est la 2e bullet point (comp&eacute;tences du chef).</p>\n<p>Utilisation d'un vocabulaire pr&eacute;cis pour la complexit&eacute; du projet B.</p>\n<p>&nbsp;</p>\n<p>Plus d'explications sur pourquoi cette m&eacute;thode de d&eacute;veloppement et pas une autre, pour chacun des projets, auraient &eacute;t&eacute; le bienvenu.</p>\n<p>Bonnes comp&eacute;tences du chef.</p>\n<p>Plus de d&eacute;tails sur la complexit&eacute; du projet B et &ccedil;a aurait &eacute;t&eacute; parfait :)</p>",
          "<ul>\n<li>Il n'y a pas de forme (Bonjour, Aurevoir, etc.)</li>\n<li>C'est pas termin&eacute; donc difficile de mettre un feedback, y a rien d'argument&eacute;</li>\n<li>\"Le projet n'est pas assez d&eacute;fini\", mais tu sais qu'il faut une m&eacute;thode Agile ?...</li>\n<li>Bien les listes &agrave; puces, &ccedil;a permet une meilleure lecture\n<ul>\n<li>on aurait pu mettre des titres aux puces, c'est pas clair si on a pas la demande sous les yeux</li>\n</ul>\n</li>\n<li>C'est cool les termes complexes (constructiviste) mais s'ils ne sont pas expliqu&eacute;s c'est compliqu&eacute; &agrave; comprendre pour quelqu'un de n&eacute;ophite</li>\n</ul>",
          "<p>Pour le projet A, j'aurais utilis&eacute; la m&eacute;thode waterfall car il n'y a pas besoin de revenir sur un point en particulier pour ce projet. Pour B, la m&eacute;thode utilis&eacute;e et la bonne. Pour les 2 projets, les comp&eacute;tences vont dans la bonne direction.&nbsp;</p>",
        ],
        '19666598-mean': '3.33',
        '19666598-sd': 1.247219128924647,
        '19666598-data': [5, 2, 3],
        '19666601-mean': '4.67',
        '19666601-sd': 0.4714045207910317,
        '19666601-data': [5, 4, 5],
      },
      comments: {
        '19666575-mean': '5.33',
        '19666575-sd': 0.9428090415820634,
        '19666575-data': [6, 4, 6],
        '19666578-wc': 12,
        '19666578-cc': 69.66666666666667,
        '19666578-data': [
          "<p>Merci pour le retour !</p>\n<p>Effectivement, je n'avais pas compris qu'il fallait r&eacute;pondre la r&eacute;ponse sous forme d'email</p>",
          '<p>trop dure un 4,</p>\n<p>methodes expliqu&eacute;</p>\n<p>fautes rien a dire</p>\n<p>&nbsp;</p>',
          "<p>je suis d'accord sur la globalit&eacute; des avis</p>",
        ],
        '19666581-inutile': 0,
        '19666581-peu utile': 0,
        '19666581-moyenne': 1,
        '19666581-utile': 2,
        '19666581-excellente': 0,
      },
    },
    '19683015': {
      overview: {
        done: '3 / 3',
        done_color: 'green',
        commented: '3 / 3',
        comments_color: 'green',
        color: 'green',
        internal_status: 'completed',
        status: 'Terminé',
      },
      reviews: {
        '19666595-wc': 22,
        '19666595-cc': 142.33333333333334,
        '19666595-data': [
          '<p>les arguments sont bons peut-&ecirc;tre que rappler les questions auxquelles nous r&eacute;pondons est plus facile pour le lecteur.</p>',
          "<p>Je pense que ton analyse manque d'explications pour que le client puisse bien comprendre pourquoi une solution par rapport &agrave; une autre.</p>\n<p>&nbsp;</p>\n<p>Le texte est bien organis&eacute; en fonction des questions mais rien ne l'indique. Rependre les questions ou faire des s&eacute;partions plus claires permettrait une meilleure lecture.</p>",
          null,
        ],
        '19666598-mean': '4.33',
        '19666598-sd': 0.4714045207910317,
        '19666598-data': [4, 4, 5],
        '19666601-mean': '5.00',
        '19666601-sd': 0.816496580927726,
        '19666601-data': [5, 4, 6],
      },
      comments: {
        '19666575-mean': '5.00',
        '19666575-sd': 0,
        '19666575-data': [null, 5],
        '19666578-wc': 38,
        '19666578-cc': 215.5,
        '19666578-data': [
          '<p>"Quelle partie r&eacute;pond &agrave; quelle question?" C\'est &eacute;crit en gras <strong>Partie A</strong> et <strong>Partie B</strong> et ensuite je fais un paragraphe par question avec &agrave; chaque fois un rappel de la question alors ach&egrave;te toi des lunettes.</p>\n<p>&nbsp;</p>\n<p>"Ce n\'ESt pAS un EmaIL" ba non tu vas pas d&eacute;crocher le job non plus, d&eacute;sol&eacute; de te l\'apprendre mais c\'est un exercice</p>\n<p>&nbsp;</p>\n<p>Bonne continuation</p>',
          '<p>certaines autres personnes on plus chipot&eacute;&nbsp;<br />nottement sur les salutations en fin de mail&nbsp;</p>',
        ],
        '19666581-inutile': 1,
        '19666581-peu utile': 1,
        '19666581-moyenne': 0,
        '19666581-utile': 0,
        '19666581-excellente': 0,
      },
    },
    '19683017': {
      overview: {
        done: '3 / 3',
        done_color: 'green',
        commented: '3 / 3',
        comments_color: 'green',
        color: 'green',
        internal_status: 'completed',
        status: 'Terminé',
      },
      reviews: {
        '19666595-wc': 26.333333333333332,
        '19666595-cc': 168,
        '19666595-data': [
          '<p>R&eacute;ponse bien structur&eacute;es et bien expliqu&eacute;es</p>',
          '<p>C\'est top et <span class="ver" title="Normalement, les nouvelles phrases commencent par une lettre majuscule.">d&eacute;taill&eacute;.</span></p>\n<p>&nbsp;</p>\n<p>il faudrait seulement ajouter une ligne pour expliquer le projet mixte ; il peut prendre plusieurs formes</p>',
          "<p>Projet A, je pense que c'est le genre de projet o&ugrave; le client ( plus particuli&egrave;rement les diff&eacute;rents d&eacute;partements) peuvent se rendre compte qu'une ou plusieurs fonctionnalit&eacute;s seraient agr&eacute;able &agrave; l'usage -&gt; pouquoi pas agile ?<br />Projet B, tr&egrave;s bonne vision selon moi, les workshops pour d&eacute;finir les objectifs sont ,en effet, capitaux.&nbsp;</p>",
        ],
        '19666598-mean': '6.00',
        '19666598-sd': 0,
        '19666598-data': [6, 6, null],
        '19666601-mean': '5.67',
        '19666601-sd': 0.4714045207910317,
        '19666601-data': [6, 6, 5],
      },
      comments: {
        '19666575-mean': '5.00',
        '19666575-sd': 0.816496580927726,
        '19666575-data': [4, 5, 6],
        '19666578-wc': 1,
        '19666578-cc': 4.333333333333333,
        '19666578-data': ["<p>n'as pas tord</p>", null, null],
        '19666581-inutile': 0,
        '19666581-peu utile': 0,
        '19666581-moyenne': 0,
        '19666581-utile': 2,
        '19666581-excellente': 1,
      },
    },
    '19683019': {
      overview: {
        done: '3 / 3',
        done_color: 'green',
        commented: '3 / 3',
        comments_color: 'green',
        color: 'green',
        internal_status: 'completed',
        status: 'Terminé',
      },
      reviews: {
        '19666595-wc': 24.333333333333332,
        '19666595-cc': 129.33333333333334,
        '19666595-data': [
          "<ul>\n<li>manque l'ent&ecirc;te de la mail et aussi la conclusion</li>\n<li>manque un peu de mise en forme pour la lisibilit&eacute;</li>\n<li>contenus pertinentes</li>\n<li>bonnes propositions</li>\n</ul>",
          "<p>La mise en forme n'est pas tr&egrave;s e-mail mais le contenu il y est . les points sont bien expliqu&eacute; on sent que&nbsp; vision&nbsp; est claire sur le mandat</p>",
          "<p>+ Tr&egrave;s en accord avec le point 3</p>\n<p>+ Les m&eacute;thodes me semblent justifi&eacute;es</p>\n<p>- Ce n'est pas vraiment un e-mail.</p>",
        ],
        '19666598-mean': '5.33',
        '19666598-sd': 0.4714045207910317,
        '19666598-data': [5, 6, 5],
        '19666601-mean': '4.00',
        '19666601-sd': 0,
        '19666601-data': [4, 4, 4],
      },
      comments: {
        '19666575-mean': '5.67',
        '19666575-sd': 0.4714045207910317,
        '19666575-data': [6, 5, 6],
        '19666578-wc': 3,
        '19666578-cc': 17.666666666666668,
        '19666578-data': [
          '<p>Oui</p>',
          '<p>Logique et pertinente&nbsp;</p>',
          "<p>je pense que c'est pertinant</p>",
        ],
        '19666581-inutile': 0,
        '19666581-peu utile': 1,
        '19666581-moyenne': 0,
        '19666581-utile': 2,
        '19666581-excellente': 0,
      },
    },
    '19683021': {
      overview: {
        done: '3 / 3',
        done_color: 'green',
        commented: '3 / 3',
        comments_color: 'green',
        color: 'green',
        internal_status: 'completed',
        status: 'Terminé',
      },
      reviews: {
        '19666595-wc': 45.666666666666664,
        '19666595-cc': 264.6666666666667,
        '19666595-data': [
          '<p>Pertinent, autant sur le fond que sur la forme.&nbsp;</p>\n<p>Beaucoup de n&eacute;gations, ou de termes qui peuvent faire peur au client tel que "non ma&icirc;tris&eacute;" : id&eacute;alement transformer ces phrases de mani&egrave;re positive ou approche plus sobre, pour plus d\'impact et de professionnalisme envers le/la client.e.</p>\n<p>Des salutations peuvent &ecirc;tre ajout&eacute;es &agrave; la fin du message, pour plus de politesse</p>',
          "<ul>\n<li>j'aurais structur&eacute; la r&eacute;ponse avec des bullet-points</li>\n<li>les motivation sont pertinentes</li>\n<li>la conclusion de le mail manque</li>\n</ul>",
          "<p>Un choix tr&egrave;s pertinent que ce soit pour le projet A et B . Je n'avais pas forcement penser dans la globalit&eacute; comme &ccedil;a et c'est coherent<br /><br />Concernant la forme il &agrave; un bonjour au debut c'est bien present&eacute; et s&eacute;par&eacute; par themes mais il a pas les termes de politesse &agrave; la fin , mais dans la globalit&eacute; c'est potable</p>",
        ],
        '19666598-mean': '5.33',
        '19666598-sd': 0.4714045207910317,
        '19666598-data': [5, 5, 6],
        '19666601-mean': '5.00',
        '19666601-sd': 0,
        '19666601-data': [5, 5, 5],
      },
      comments: {
        '19666575-mean': '4.67',
        '19666575-sd': 1.247219128924647,
        '19666575-data': [6, 3, 5],
        '19666578-wc': 2.3333333333333335,
        '19666578-cc': 14.666666666666666,
        '19666578-data': [
          '<p>merci beaucoup</p>',
          '<p>Oui effectivement</p>',
          '<p>Un peu courte</p>',
        ],
        '19666581-inutile': 0,
        '19666581-peu utile': 0,
        '19666581-moyenne': 0,
        '19666581-utile': 2,
        '19666581-excellente': 1,
      },
    },
    '19683039': {
      overview: {
        done: '3 / 3',
        done_color: 'green',
        commented: '3 / 3',
        comments_color: 'green',
        color: 'green',
        internal_status: 'completed',
        status: 'Terminé',
      },
      reviews: {
        '19666595-wc': 37.666666666666664,
        '19666595-cc': 215.66666666666666,
        '19666595-data': [
          "<ul>\n<li>Pas de formes de politesses (Bonjour, Aurevoir, etc)</li>\n<li>Aucune entr&eacute;e en mati&egrave;re</li>\n<li>Pas d'argumentation sur pourquoi on choisit une m&eacute;thode et pas une autre</li>\n<li>Bonne argumentation &agrave; la fin</li>\n</ul>",
          '<p>Bon choix de m&eacute;thode pour chaque projet.</p>\n<p>&nbsp;</p>\n<p>Pour le A, je pense que le chef de projet doit aussi &ecirc;tre pr&eacute;voyant si il y a un bug lors du passage au nouveau syst&egrave;me.</p>\n<p>&nbsp;</p>\n<p>B a les bonnes comp&eacute;tences. Il faudrait n&eacute;anmoins qui ait la comp&eacute;tence de leadership</p>\n<p>&nbsp;</p>\n<p>Les niveaux de complexit&eacute; sont bien comprises</p>',
          '<p>pour les comp&eacute;tences, ajouter que c\'est les comp&eacute;tences du chef de projet</p>\n<p>&nbsp;</p>\n<p>pour moi le projet <span class="mod" title="Il faut probablement utiliser un participe pass&eacute;, par ex.: &lt;i&gt;j\'ai mang&lt;b&gt;&eacute;&lt;/b&gt;, il a fin&lt;b&gt;i&lt;/b&gt;, on a di&lt;b&gt;t&lt;/b&gt;&lt;/i&gt;, etc. Une autre possibilit&eacute; serait de modifier le premier mot, par ex.: &lt;i&gt;o&lt;b&gt;n&lt;/b&gt; peut venir&lt;/i&gt;.">A serait</span> en cascade et le B en it&eacute;ratif (ou mixte), mais c\'est personnel</p>',
        ],
        '19666598-mean': '5.33',
        '19666598-sd': 0.4714045207910317,
        '19666598-data': [5, 5, 6],
        '19666601-mean': '4.33',
        '19666601-sd': 1.247219128924647,
        '19666601-data': [4, 3, 6],
      },
      comments: {
        '19666575-mean': '5.67',
        '19666575-sd': 0.4714045207910317,
        '19666575-data': [6, 5, 6],
        '19666578-wc': 5.666666666666667,
        '19666578-cc': 39,
        '19666578-data': [
          "<p>parfait, gentil,utile pour l'avenir, pertinant.</p>",
          '<p>merci de ton retour et des notes positives</p>',
          '<p>Bon commentaire instructif !</p>',
        ],
        '19666581-inutile': 0,
        '19666581-peu utile': 0,
        '19666581-moyenne': 0,
        '19666581-utile': 1,
        '19666581-excellente': 2,
      },
    },
    '19683041': {
      overview: {
        done: '3 / 3',
        done_color: 'green',
        commented: '3 / 3',
        comments_color: 'green',
        color: 'green',
        internal_status: 'completed',
        status: 'Terminé',
      },
      reviews: {
        '19666595-wc': 27.666666666666668,
        '19666595-cc': 161,
        '19666595-data': [
          '<p>Explications claires et br&egrave;ves</p>\n<p>&nbsp;</p>\n<p>Orthographe sur la fin (stress car manque de temps?)</p>',
          '<p>Pas convaincu par le fond mais qui suis-je pour juger? La forme laisse &agrave; desirer... Au moins un petit bonjour.&nbsp;</p>',
          "<p>Fond:</p>\n<p>- Selon moi il y a pas tant de d&eacute;partements impliqu&eacute;s pour le projet A.</p>\n<p>- Le projet B va bien plus loin qu'un solution informatique, il faut d&eacute;velopper tout le concept. Comment va-t-on r&eacute;unir les connaissances? Sous quelle forme?</p>\n<p>&nbsp;</p>\n<p>Forme:</p>\n<p>- Bien hi&eacute;rarchis&eacute; mais tu sais pas &eacute;crire</p>",
        ],
        '19666598-mean': '3.67',
        '19666598-sd': 0.4714045207910317,
        '19666598-data': [4, 4, 3],
        '19666601-mean': '3.67',
        '19666601-sd': 1.247219128924647,
        '19666601-data': [4, 2, 5],
      },
      comments: {
        '19666575-mean': '4.50',
        '19666575-sd': 1.5,
        '19666575-data': [6, 3],
        '19666578-wc': 7.5,
        '19666578-cc': 38.5,
        '19666578-data': [
          "<p>oui j'avous que c'est court</p>\n<p>&nbsp;</p>\n<p>merci pour ton retour !</p>",
          '<p>Un peu dur quand m&ecirc;me...</p>',
        ],
        '19666581-inutile': 0,
        '19666581-peu utile': 0,
        '19666581-moyenne': 1,
        '19666581-utile': 0,
        '19666581-excellente': 1,
      },
    },
    '19683043': {
      overview: {
        done: '3 / 3',
        done_color: 'green',
        commented: '3 / 3',
        comments_color: 'green',
        color: 'green',
        internal_status: 'completed',
        status: 'Terminé',
      },
      reviews: {
        '19666595-wc': 50,
        '19666595-cc': 299,
        '19666595-data': [
          '<p>+ bonne introduction</p>\n<p>+ bonnes m&eacute;thodes</p>\n<p>- on ne conna&icirc;t pas les comp&eacute;tences du deuxi&egrave;me chef de projet</p>\n<p>- ne jamais mettre des etc...</p>\n<p>- mail pas termin&eacute;</p>\n<p>- Pas tr&egrave;s convaincu de la complexit&eacute; des projets</p>',
          "<p>Il manque les salutations de clot&ucirc;re et attention aux fautes de fran&ccedil;ais et de syntaxe.</p>\n<p>&nbsp;</p>\n<p>Concernant le fond, l'explication de la m&eacute;thode semi-agile est appr&eacute;ciable mais &ccedil;a aurait &eacute;t&eacute; bien d'avoir une explication de pourquoi cette m&eacute;thode et pas une autre.</p>\n<p>Les comp&eacute;tences des chefs de projet ne sont pas tr&egrave;s claires.</p>\n<p>L'explication de la complexit&eacute; est acceptable.</p>\n<p>&nbsp;</p>",
          '<ul>\n<li>Fautes de majuscules / minuscules</li>\n<li>Tournures de phrases pas professionnelles</li>\n<li>"Ce mandat" &ccedil;a fait pas pro... quel mandat exactement ?</li>\n<li>On aurait pu mettre des listes &agrave; puces, des &eacute;l&eacute;ments en gras... pour faciliter la lecture</li>\n<li>Il aurait fallu des exemples, le texte n\'est pas argument&eacute;, et c\'est dommage parce que le fond para&icirc;t bien</li>\n</ul>',
        ],
        '19666598-mean': '4.33',
        '19666598-sd': 0.4714045207910317,
        '19666598-data': [4, 5, 4],
        '19666601-mean': '3.67',
        '19666601-sd': 1.247219128924647,
        '19666601-data': [4, 5, 2],
      },
      comments: {
        '19666575-mean': '5.67',
        '19666575-sd': 0.4714045207910317,
        '19666575-data': [6, 6, 5],
        '19666578-wc': 13.333333333333334,
        '19666578-cc': 80.33333333333333,
        '19666578-data': [
          "<p>je pense que c'est pertinant</p>",
          "<p>Merci pour le retour !</p>\n<p>Effectivement, je n'avais pas compris qu'il fallait r&eacute;pondre la r&eacute;ponse sous forme d'email</p>",
          "<p>merci, peut etre que j'aurais aim&eacute; avoir des point d'amilleuration pour la prochaine foir mais ok ;)</p>",
        ],
        '19666581-inutile': 1,
        '19666581-peu utile': 0,
        '19666581-moyenne': 0,
        '19666581-utile': 1,
        '19666581-excellente': 0,
      },
    },
    '19683442': {
      overview: {
        done: '0 / 3',
        done_color: 'grey',
        commented: '0 / 0',
        color: 'red',
        internal_status: 'evicted',
        status: 'Évincé',
      },
      reviews: {},
      comments: {},
    },
    '19683460': {
      overview: {
        done: '3 / 3',
        done_color: 'green',
        commented: '0 / 3',
        comments_color: 'orange',
        color: 'green',
        internal_status: 'commenting',
        status: 'Terminé',
      },
      reviews: {
        '19666595-wc': 39.666666666666664,
        '19666595-cc': 250.33333333333334,
        '19666595-data': [
          '<p>Synthese expliquant le projet 1 top, le 2 moins.. manque de temps?</p>\n<p>&nbsp;</p>\n<p>&nbsp;</p>\n<p>Ne r&eacute;ponds pas aux comp&eacute;tences des chefs de projet, ni au degr&eacute; de complexit&eacute; juste lequel est le plus complexe</p>\n<p>&nbsp;</p>\n<p>Bcp de blabla mais finalement, ne r&eacute;pond pas aux questions directement..</p>\n<p>&nbsp;</p>\n<p>&nbsp;</p>\n<p>Bonne forme du mail</p>',
          "<p>Forme tr&egrave;s professionnelle. La d&eacute;scription des projets me parait pertinente, cependant il est difficile de trouver rapidement la r&eacute;ponse &agrave; toutes les questions pos&eacute;es. De plus, certaines de ces questions n'ont pas s&eacute;t&eacute; r&eacute;pondues directement (Type de chef de projet ou complexit&eacute; de projets?).&nbsp;</p>",
          "<p>Tr&egrave;s belle argumentation, &eacute;poustouflant. En effet vous avancez des arguments plus t&ocirc;t convaincants. Je vais glisser votre dossier &agrave; mon chef afin qu'il le prenne sous la loupe. </p>",
        ],
        '19666598-mean': '4.67',
        '19666598-sd': 0.4714045207910317,
        '19666598-data': [5, 4, 5],
        '19666601-mean': '5.67',
        '19666601-sd': 0.4714045207910317,
        '19666601-data': [6, 6, 5],
      },
      comments: {
        '19666575-mean': '4.50',
        '19666575-sd': 0.5,
        '19666575-data': [5, 4],
        '19666578-wc': 8.5,
        '19666578-cc': 47,
        '19666578-data': [
          '<p>Merci pour ton retour</p>',
          "<p>Il manque l'&eacute;valuation du fond, mais &agrave; part &ccedil;a merci du feedback d&eacute;taill&eacute;</p>",
        ],
        '19666581-inutile': 0,
        '19666581-peu utile': 0,
        '19666581-moyenne': 0,
        '19666581-utile': 2,
        '19666581-excellente': 0,
      },
    },
    '19683510': {
      overview: {
        done: '3 / 3',
        done_color: 'green',
        commented: '3 / 3',
        comments_color: 'green',
        color: 'green',
        internal_status: 'completed',
        status: 'Terminé',
      },
      reviews: {
        '19666595-wc': 56,
        '19666595-cc': 340.3333333333333,
        '19666595-data': [
          "<p>Les r&eacute;ponses sont sens&eacute;es mais la forme laisse &agrave; desirer.. C'est dommage.&nbsp;&nbsp;</p>",
          "<p>Fond: Le r&eacute;sonnement est bon mais pas forc&eacute;ment bien expliqu&eacute;</p>\n<p>&nbsp;</p>\n<p>Forme: Il aurait fallu faire une liste ordonn&eacute;e plut&ocirc;t qu'une liste &agrave; puce. On sait pas toujours de quel projet on parle.</p>",
          "<p>D'abord bonjour,&nbsp;<br />merci d'avoir pris le temps de repondre a nos questions.&nbsp;<br /><br />en comparant vos r&eacute;ponse &agrave; nos autres experts nous avons remarquer,&nbsp;<br />l'un d'entre eux propose la m&eacute;thode agile et l'autre cascade pour le premier projet donc nous pensons partir sur un methode mixe&nbsp;<br /><br />pour le deuxime les deux autres ont recomand&eacute; un projet agile. Pouvez vous argumenter sur pourquoi un projet mixe alors que votre d&eacute;finition nous parle d'agile ?&nbsp;<br /><br />vous avez les m&ecirc;me competence que vos coll&egrave;gues &agrave; un d&eacute;tail pr&egrave;s pourquoi faudrait-il que notre cheff de projet soit amicale, il n'est pas focement en contact avec les utilisateurs ?&nbsp;<br /><br />selon un des experts d&eacute;termin&eacute;s les ficher fr&eacute;quents est relativement simple pourquoi pens&eacute; vous que c'est complexe ?&nbsp;<br /><br /><br />mes meilleures salutations&nbsp;</p>",
        ],
        '19666598-mean': '4.67',
        '19666598-sd': 0.4714045207910317,
        '19666598-data': [5, 4, 5],
        '19666601-mean': '3.33',
        '19666601-sd': 0.9428090415820634,
        '19666601-data': [2, 4, 4],
      },
      comments: {
        '19666575-mean': '4.00',
        '19666575-sd': 1,
        '19666575-data': [3, 5],
        '19666578-wc': 19.5,
        '19666578-cc': 104,
        '19666578-data': [
          '<p>Dur &agrave; encaisser une telle critique mais je le prends avec la t&ecirc;te haute.</p>',
          "<p>Evaluation courte, simple et efficace.&nbsp;</p>\n<p>&nbsp;</p>\n<p>En effet, j'ai eu peu de temps sur la fin et la plupart de touches de mon clavier son cass&eacute;es.</p>",
        ],
        '19666581-inutile': 0,
        '19666581-peu utile': 1,
        '19666581-moyenne': 0,
        '19666581-utile': 1,
        '19666581-excellente': 0,
      },
    },
    '19683568': {
      overview: {
        done: '3 / 3',
        done_color: 'green',
        commented: '3 / 3',
        comments_color: 'green',
        color: 'green',
        internal_status: 'completed',
        status: 'Terminé',
      },
      reviews: {
        '19666595-wc': 22.333333333333332,
        '19666595-cc': 131.66666666666666,
        '19666595-data': [
          "<p>merci de votre r&eacute;ponse&nbsp;<br /><br /><br />un de vos confr&egrave;re a soulever la complxit&eacute; du projet B viens de l'entreprise externe&nbsp; &nbsp;<br /><br />c'&eacute;tait quoi mes question je ne me souviens plus&nbsp;</p>",
          "<p>Fond:</p>\n<p>- correcte</p>\n<p>&nbsp;</p>\n<p>Forme:</p>\n<p>- ce n'est pas un email</p>\n<p>- pas de phrases compl&egrave;tes</p>\n<p>- quelle partie repond &agrave; quelle question</p>",
          '<p>Le texte est tr&egrave;s brute, mais compr&eacute;hensible, peut-&ecirc;tre rajouter une axplication &agrave; la m&eacute;thode de d&eacute;veloppement choisie.</p>',
        ],
        '19666598-mean': '5.33',
        '19666598-sd': 0.4714045207910317,
        '19666598-data': [6, 5, 5],
        '19666601-mean': '3.00',
        '19666601-sd': 0.816496580927726,
        '19666601-data': [3, 2, 4],
      },
      comments: {
        '19666575-mean': '5.00',
        '19666575-sd': 0,
        '19666575-data': [null, 5, null],
        '19666578-wc': 15.666666666666666,
        '19666578-cc': 77.33333333333333,
        '19666578-data': [
          '<p>Sur le fond il/elle explique bien les points qui ne sont pas covainquants. Sur la forme il/elle a mis 5, mais mis &agrave; part que "je ne sais pas &eacute;crire", il n\'y a pas grand chose.&nbsp;</p>',
          null,
          '<p>Je ne sais pas qui vous &ecirc;tes mais soignez votre langage.</p>',
        ],
        '19666581-inutile': 1,
        '19666581-peu utile': 0,
        '19666581-moyenne': 1,
        '19666581-utile': 0,
        '19666581-excellente': 0,
      },
    },
    '19683585': {
      overview: {
        done: '3 / 3',
        done_color: 'green',
        commented: '3 / 3',
        comments_color: 'green',
        color: 'green',
        internal_status: 'completed',
        status: 'Terminé',
      },
      reviews: {
        '19666595-wc': 28,
        '19666595-cc': 163.66666666666666,
        '19666595-data': [
          '<p>Un mail touchant, par sa simplicit&eacute; et son courage.<br />Bravo</p>',
          '<p>Mail tr&egrave;s pauvre..</p>\n<p>&nbsp;</p>\n<p>Pas vraiment d explications quant aux choix</p>\n<p>&nbsp;</p>\n<p>Une seule comp&eacute;tence n&eacute;c&eacute;ssaire? pour les 2 projets c est la m&ecirc;me?</p>\n<p>&nbsp;</p>\n<p>&nbsp;</p>',
          "<p><strong>Le fond&nbsp;</strong></p>\n<p>Les r&eacute;ponses sont tr&egrave;s vagues, il n'y a presque pas de justification. Les projets ne sont pas identifi&eacute;s, il est impossible de savoir de quel projet il/elle parle. Il n'y a presque aucune information&nbsp;</p>\n<p>&nbsp;</p>\n<p><strong>La forme&nbsp;</strong></p>\n<p>Forme de base. Il y a tr&egrave;s peu dinformation, donc il est difficile de juger&nbsp;</p>",
        ],
        '19666598-mean': '3.33',
        '19666598-sd': 1.8856180831641267,
        '19666598-data': [6, 2, 2],
        '19666601-mean': '4.00',
        '19666601-sd': 1.4142135623730951,
        '19666601-data': [6, 3, 3],
      },
      comments: {
        '19666575-mean': '4.00',
        '19666575-sd': 0,
        '19666575-data': [4],
        '19666578-wc': 7,
        '19666578-cc': 29,
        '19666578-data': ["<p>Pas eu le temps de finit ^^'&nbsp;</p>"],
        '19666581-inutile': 0,
        '19666581-peu utile': 0,
        '19666581-moyenne': 1,
        '19666581-utile': 0,
        '19666581-excellente': 0,
      },
    },
    '19683608': {
      overview: {
        done: '0 / 3',
        done_color: 'grey',
        commented: '0 / 0',
        color: 'red',
        internal_status: 'evicted',
        status: 'Évincé',
      },
      reviews: {},
      comments: {},
    },
    '19683626': {
      overview: {
        done: '3 / 3',
        done_color: 'green',
        commented: '3 / 3',
        comments_color: 'green',
        color: 'green',
        internal_status: 'completed',
        status: 'Terminé',
      },
      reviews: {
        '19666595-wc': 41,
        '19666595-cc': 251.33333333333334,
        '19666595-data': [
          "<p>Je pense qu'on peut &eacute;laborer un peu plus pour que le client comprenne mieux le pourquoi.</p>\n<p>&nbsp;</p>\n<p>Orde de r&eacute;ponse logique mais il y a moyen de faire plus organis&eacute;</p>",
          '<p>Pertinent, autant sur le fond que sur la forme (quelques fautes de frappe et d\'orthographe &eacute;vitables).&nbsp;</p>\n<p>Eviter peut-&ecirc;tre "mon avis", en formulant "en tant qu\'expert" ou autre formulation, pour plus de s&eacute;rieux</p>\n<p>&nbsp;</p>\n<p>Pour les arguments sur les chefs de projets, les deux personnes doivent pouvoir s\'adapter rapidement &agrave; la situation, donc argument pour le chef de projet B peut valable</p>',
          "<ul>\n<li>premi&egrave;re impressionne bonne (forme de la mail),</li>\n<li>je pense que les m&eacute;thodes sont corrects,</li>\n<li>aucune avis sur les caract&eacute;ristiques des chefs mais ca me resemble juste</li>\n<li>complexit&eacute;: je suis d'accord</li>\n<li>attentions a les erreurs&nbsp;</li>\n</ul>\n<p>&nbsp;</p>",
        ],
        '19666598-mean': '4.67',
        '19666598-sd': 0.4714045207910317,
        '19666598-data': [4, 5, 5],
        '19666601-mean': '4.67',
        '19666601-sd': 0.4714045207910317,
        '19666601-data': [4, 5, 5],
      },
      comments: {
        '19666575-mean': '3.67',
        '19666575-sd': 2.0548046676563256,
        '19666575-data': [1, 6, 4],
        '19666578-wc': 1.3333333333333333,
        '19666578-cc': 9.666666666666666,
        '19666578-data': [
          '<p>explication*</p>',
          '<p>merci beaucoup</p>',
          '<p>Oui</p>',
        ],
        '19666581-inutile': 1,
        '19666581-peu utile': 0,
        '19666581-moyenne': 0,
        '19666581-utile': 2,
        '19666581-excellente': 0,
      },
    },
    '19683660': {
      overview: {
        done: '3 / 3',
        done_color: 'green',
        commented: '1 / 3',
        comments_color: 'orange',
        color: 'green',
        internal_status: 'commenting',
        status: 'Terminé',
      },
      reviews: {
        '19666595-wc': 27,
        '19666595-cc': 166.33333333333334,
        '19666595-data': [
          "<p>Le fond me parait plut&ocirc;t juste. Les r&eacute;ponses sont justifi&eacute;es de mani&egrave;re courte mais c'est coh&eacute;rent&nbsp;</p>",
          "<p>Tr&egrave;s factuel et simple. Cependant un peu trop simpliste. Manque d'argumentation. Dossier pas retenu malheureusement.</p>\n<p>Au plaisir de vous revoir</p>",
          "<p>Je pense que le projet A est plus complexe car il demande plus d'it&eacute;rations, mets en relations plus de donn&eacute;es (avec des niveaux de complexit&eacute;s divers) et de personnes.<br /><br />Je suis d'accord avec le fait que le chef de projet doit avoit des bonnes connaissances IT</p>",
        ],
        '19666598-mean': '4.33',
        '19666598-sd': 0.9428090415820634,
        '19666598-data': [5, 3, 5],
        '19666601-mean': '3.67',
        '19666601-sd': 0.4714045207910317,
        '19666601-data': [3, 4, 4],
      },
      comments: {
        '19666575-mean': '5.00',
        '19666575-sd': 0.816496580927726,
        '19666575-data': [5, 4, 6],
        '19666578-wc': 5.333333333333333,
        '19666578-cc': 28.333333333333332,
        '19666578-data': [
          null,
          "<p>Je pense pas m&eacute;riter deux 6 et la justification ne m'aide pas &agrave; savoir o&ugrave; m'am&eacute;liorer</p>",
          null,
        ],
        '19666581-inutile': 0,
        '19666581-peu utile': 1,
        '19666581-moyenne': 0,
        '19666581-utile': 2,
        '19666581-excellente': 0,
      },
    },
    '19683710': {
      overview: {
        done: '3 / 3',
        done_color: 'green',
        commented: '2 / 3',
        comments_color: 'orange',
        color: 'green',
        internal_status: 'commenting',
        status: 'Terminé',
      },
      reviews: {
        '19666595-wc': 34,
        '19666595-cc': 193.66666666666666,
        '19666595-data': [
          "<p>Quel boloss, tu sais que c'est pour de faux hein, pas besoin de dire bonjour &agrave; Albasim.</p>\n<p>Sinon le raisonnement est bon mais jtm pas alors 1/6</p>",
          "<p>Bonjour, <br />monsieur cela fait plaisir d'avoir quelqu'un qui signe sont mail&nbsp;<br /><br />nous comprennons que vous &ecirc;tes un hommes occuper merci d'avoir pris le temps de r&eacute;pondre.&nbsp;<br /><br />un de vos confr&egrave;re recomande les un metode cascade pour le projet A</p>",
          '<p>Contenu:</p>\n<p>- Qu\'est ce que vous entendez par "Si vous avez l\'expertise pour d&eacute;velopper ces projets avec la methode Agile". Un peu vague comme r&eacute;ponse mais reste juste.</p>\n<p>- 2e reponse claire</p>\n<p>&nbsp;</p>\n<p>Forme:</p>\n<p>- tr&egrave;s correcte</p>',
        ],
        '19666598-mean': '5.00',
        '19666598-sd': 0,
        '19666598-data': [null, 5, 5],
        '19666601-mean': '5.50',
        '19666601-sd': 0.5,
        '19666601-data': [null, 5, 6],
      },
      comments: {
        '19666575-mean': '4.50',
        '19666575-sd': 1.5,
        '19666575-data': [6, 3, null],
        '19666578-wc': 18,
        '19666578-cc': 101.33333333333333,
        '19666578-data': [
          '<p>Feedback tr&egrave;s pertinent que je prends comme le&ccedil;on de vie.</p>\n<p>&nbsp;</p>\n<p>Au plaisir</p>',
          "<p>Il n'y a pas d'explications mis &agrave; part qu'il/elle n'est pas convaincu&middot;e par le fond. Du coup je ne peux r&eacute;elment pas savoir sur quoi je devrais m'am&eacute;liorer&nbsp;</p>",
          "<p>Pas capt&eacute; qu'il faillait faire un mail joli joli avec des cordialement et tout</p>",
        ],
        '19666581-inutile': 0,
        '19666581-peu utile': 0,
        '19666581-moyenne': 2,
        '19666581-utile': 0,
        '19666581-excellente': 1,
      },
    },
  },
  extra: {
    '19666575': {
      numberOfValues: 43,
      mean: 4.976744186046512,
      min: 1,
      max: 6,
      median: 3,
      sd: 1.1908248478597312,
      histogram: [
        {
          min: 1,
          max: 1.8333333333333335,
          maxValue: 1,
          minValue: 1,
          count: 1,
        },
        {
          min: 1.8333333333333335,
          max: 2.666666666666667,
          maxValue: null,
          minValue: null,
          count: 0,
        },
        {
          min: 2.666666666666667,
          max: 3.5000000000000004,
          maxValue: 3,
          minValue: 3,
          count: 5,
        },
        {
          min: 3.5,
          max: 4.333333333333333,
          maxValue: 4,
          minValue: 4,
          count: 6,
        },
        {
          min: 4.333333333333334,
          max: 5.166666666666667,
          maxValue: 5,
          minValue: 5,
          count: 12,
        },
        {
          min: 5.166666666666667,
          max: 6,
          maxValue: 6,
          minValue: 6,
          count: 19,
        },
      ],
      type: 'GradeSummary',
      id: 19666575,
      name: '1680640',
      label: 'Note',
      data: [],
    },
    '19666578': {
      type: 'TextSummary',
      name: '1680641',
      label: 'Justification',
      id: 19666578,
      numberOfValues: 48,
      averageNumberOfWords: 9.520833333333334,
      averageNumberOfCharacters: 53.770833333333336,
      data: [],
    },
    '19666581': {
      type: 'CategorizationSummary',
      name: '1680642',
      id: 19666581,
      label: "Pertinence de l'évaluation",
      numberOfValues: 46,
      histogram: {
        inutile: 4,
        'peu utile': 5,
        moyenne: 7,
        utile: 22,
        excellente: 8,
      },
      data: [],
    },
    '19666595': {
      type: 'TextSummary',
      name: '1680644',
      label: "Justification de l'évaluation et recommandations",
      id: 19666595,
      numberOfValues: 54,
      averageNumberOfWords: 35.18518518518518,
      averageNumberOfCharacters: 209.92592592592592,
      data: [],
    },
    '19666598': {
      numberOfValues: 52,
      mean: 4.673076923076923,
      min: 1,
      max: 6,
      median: 5.5,
      sd: 1.0691685095321262,
      histogram: [
        {
          min: 1,
          max: 1.8333333333333335,
          maxValue: null,
          minValue: null,
          count: 0,
        },
        {
          min: 1.8333333333333335,
          max: 2.666666666666667,
          maxValue: 2,
          minValue: 2,
          count: 3,
        },
        {
          min: 2.666666666666667,
          max: 3.5000000000000004,
          maxValue: 3,
          minValue: 3,
          count: 4,
        },
        {
          min: 3.5,
          max: 4.333333333333333,
          maxValue: 4,
          minValue: 4,
          count: 11,
        },
        {
          min: 4.333333333333334,
          max: 5.166666666666667,
          maxValue: 5,
          minValue: 5,
          count: 23,
        },
        {
          min: 5.166666666666667,
          max: 6,
          maxValue: 6,
          minValue: 6,
          count: 11,
        },
      ],
      type: 'GradeSummary',
      id: 19666598,
      name: '1680645',
      label: 'Note fond',
      data: [],
    },
    '19666601': {
      numberOfValues: 52,
      mean: 4.461538461538462,
      min: 1,
      max: 6,
      median: 6,
      sd: 1.1344524002886633,
      histogram: [
        {
          min: 1,
          max: 1.8333333333333335,
          maxValue: null,
          minValue: null,
          count: 0,
        },
        {
          min: 1.8333333333333335,
          max: 2.666666666666667,
          maxValue: 2,
          minValue: 2,
          count: 4,
        },
        {
          min: 2.666666666666667,
          max: 3.5000000000000004,
          maxValue: 3,
          minValue: 3,
          count: 5,
        },
        {
          min: 3.5,
          max: 4.333333333333333,
          maxValue: 4,
          minValue: 4,
          count: 16,
        },
        {
          min: 4.333333333333334,
          max: 5.166666666666667,
          maxValue: 5,
          minValue: 5,
          count: 17,
        },
        {
          min: 5.166666666666667,
          max: 6,
          maxValue: 6,
          minValue: 6,
          count: 10,
        },
      ],
      type: 'GradeSummary',
      id: 19666601,
      name: '1680646',
      label: 'Note forme',
      data: [],
    },
    maxNumberOfValue: 54,
  },
  variable: {
    '19682476':
      '<p>Bonjour&nbsp;<br /><br />d\'abord merci de votre solicitations.<br />ensuite concernant vos questions je vais y repondre dans l\'ordre.<br /><br /></p>\n<p><em><span id="yui_3_18_1_3_1604325970447_4466">Quelle m&eacute;thode de d&eacute;veloppement proposeriez-vous pour chacun de ces projets (it&eacute;ratif, cascade, mixte, autre), pour quelles raisons ?<br /></span></em><span id="yui_3_18_1_3_1604325970447_4466"><br /></span><span style="text-decoration: underline;"><span id="yui_3_18_1_3_1604325970447_4466">Projet A :</span></span></p>\n<p>&nbsp;</p>\n<p>je vous recommande un projet en cascade, avec un bonne pr&eacute;paration vos &eacute;quipe trouveront les meilleures salutions a se probl&egrave;me. <br /><br /><span style="text-decoration: underline;">Projet B :</span><br /><br />je vous recomande un projet mixte, c\'est ce qui vous coutera le moins ch&egrave;re en &eacute;tant le plus adapt&eacute; a vos besoins.&nbsp;<br /><br />un projet en cascade est vou&eacute; a ne pas repondre &agrave; vos attentes.&nbsp;<br /><br />un projet iteratif risque de s\'&eacute;terniser par manque de deadline et risque d\'&ecirc;tre bacl&eacute; dans son deploiment li&eacute; a des contrainte budg&eacute;taire.&nbsp;<br /><br /><br /></p>\n<p><em><span id="yui_3_18_1_3_1604325970447_7581">Quelles seraient les comp&eacute;tences n&eacute;cessaires&nbsp;pour le chef de projet A, pour le chef de projet B ?<br /><br /></span></em><span id="yui_3_18_1_3_1604325970447_7581"><span style="text-decoration: underline;"><span id="yui_3_18_1_3_1604325970447_4466">Projet A</span></span></span><span id="yui_3_18_1_3_1604325970447_7581"><span style="text-decoration: underline;"><span id="yui_3_18_1_3_1604325970447_4466"> :</span></span><span id="yui_3_18_1_3_1604325970447_4466"> M&eacute;thodologie, Esprit d\'analyse, capacit&eacute; organisationel<br />&nbsp;</span></span><em><span id="yui_3_18_1_3_1604325970447_7581"><br /></span></em></p>\n<p><span style="text-decoration: underline;">Projet B :</span> &eacute;coute, Esprit de synth&egrave;se, capacit&eacute; Adatation&nbsp;<br />&nbsp;<br /><br /></p>\n<p><em><span id="yui_3_18_1_3_1604325970447_9745">Nous pensons que ces deux projets n\'ont pas le m&ecirc;me niveau de complexit&eacute;. </span>Que pensez-vous du niveau de complexit&eacute; de ces deux projets ? Qu\'est-ce qui explique la diff&eacute;rence de niveau de complexit&eacute;&nbsp;?</em></p>\n<p>&nbsp;</p>\n<p>Le projet A est un relativement simple, on applique une methode et le projet devrait se terminer sans trop de probl&egrave;me.<br /><br />Le projet B quand a lui n\'a pas de r&eacute;ponse absolue et fait intervenir une entit&eacute; tier avec des enjeux qui lui sont propre. Le projet B a plus de facteur de risque il est donc plus complexe.&nbsp;</p>',
    '19682483':
      "<p>Bonjour,</p>\n<p>&nbsp;</p>\n<p>Suite &agrave; votre demande, nous vous rendons notre avis sur les points que vous avez mentionn&eacute;s.</p>\n<p>&nbsp;</p>\n<p>&nbsp;</p>\n<p><strong>M&eacute;thode de d&eacute;veloppement</strong></p>\n<p>&nbsp;</p>\n<p>Projet A : pour la gestion de projet, nous vous conseillons d'appliquer la m&eacute;thode \"en cascade\". Le fait est que le changement de syst&egrave;me de sauvegarde impacte indirectement les employ&eacute;s.&nbsp;</p>\n<p>Projet B : pour ce projet, nous vous recommandons d'effectuer la m&eacute;thode agile pour la gestion du projet. Cette m&eacute;thode s'effectue bien pour ce projet parce que il y a un impact direct avec les personnes concern&eacute;es.&nbsp;</p>\n<p>&nbsp;</p>\n<p>&nbsp;</p>",
    '19682515':
      "<p>Bonjour,</p>\n<p>voici mon avis pour les projets de Maxid:</p>\n<ul>\n<li><strong>Developpement pour les projets</strong>\n<ul>\n<li><strong>Projet A: </strong>m&eacute;thode&nbsp;mixte, choisi a cause de la complexit&eacute; technologique qui necessite de &eacute;tapes claire mais qui peuvent &ecirc;tre combin&eacute; a des phases en methode agile</li>\n<li><strong>Projet B:&nbsp;</strong>m&eacute;thode agile, choisi parce que c'est un projet plus cr&eacute;atif qui peut avoir plusierus sprint de recherche.</li>\n</ul>\n</li>\n<li><strong>Comp&eacute;tences chefs des projets</strong>\n<ul>\n<li><strong>Projet A: </strong>skills&nbsp;techniques et informatiques, gestion projet</li>\n<li><strong>Projet B: </strong>de partage, skills de comm, skills de cr&eacute;ation de contenus, savoir gerer un methode agile</li>\n</ul>\n</li>\n<li><strong>Niveau de complexit&eacute;</strong>\n<ul>\n<li><strong>Projet A: </strong>complexit&eacute; informatique</li>\n<li><strong>Projet B: </strong>complexit&eacute; de gestion</li>\n<li>Personnellement le niveau de complexit&eacute; est difficile a comprendre seulment avec les descriptions fournis, un autre recherche et un autre description seront n&eacute;cessaires.</li>\n</ul>\n</li>\n</ul>\n<p>Je reste a disposition en cas d'autre questions.</p>\n<p>Je vous sohaite une bonne journ&eacute;e,</p>",
    '19682553':
      "<p>Projet A :</p>\n<ul>\n<li>M&eacute;thode : Semi-agile. Cette m&eacute;thode fonctionne le mieux... (pas termin&eacute;)</li>\n<li>Communicatif, Pr&eacute;voyant, leadership</li>\n</ul>\n<p>Projet B :</p>\n<ul>\n<li>M&eacute;thode : Agile. Le projet n'est pas assez d&eacute;fini et il faudrait organis&eacute; des rdv afin de se fixer un nouvel objectif</li>\n<li>Prendre des d&eacute;cisions, communicatif&nbsp;</li>\n</ul>\n<p>Le projet B semble tr&egrave;s complexe. Il a un paradigme constructiviste, car il n'y a pas de solutions ad&eacute;quoites. Cependant, nous pouvons tenter une approche diff&eacute;rente. (pas termin&eacute;)</p>",
    '19683015':
      '<p>Bonjour,</p>\n<p>&nbsp;</p>\n<p>Premi&egrave;rement, en ce qui concerne les m&eacute;thodes de d&eacute;veloppement je vous conseillerais la m&eacute;thode en cascade pour le projet A et la m&eacute;thode agile pour le projet B. Le projet A etant beaucoup plus technique il serait necessaire de prevoir chaque &eacute;tape du projet au pr&eacute;alable et s\'y tenir.</p>\n<p>&nbsp;</p>\n<p>Les comp&eacute;tences n&eacute;cessaire pour le chef de projet A serait une tr&egrave;s bonne connaissance technique des technologies n&eacute;cessaires au projet et pour le projet B de tr&egrave;s bonnes connaissances de l\'entreprise de l\'ensemble des d&eacute;partements ainsi que des niveaux hierarchiques, plutot quelqu\'un de la RH.<span id="yui_3_18_1_3_1604326195588_7060" lang="fr-CH" style="font-family: arial, helvetica, sans-serif; font-size: 10pt;"></span></p>\n<p>&nbsp;</p>\n<p>Finalement, c\'est en effet deux projets dont le niveau de complexit&eacute; differt.</p>',
    '19683017':
      "<p>Bonjour,</p>\n<p>&nbsp;</p>\n<p>Suive &agrave; votre demande, vous trouverez ci-dessous mes recommandations pour les projets A et B :</p>\n<p>&nbsp;</p>\n<p><strong>Projet A</strong></p>\n<ul>\n<li>Choix d'une m&eacute;thode en cascade : la proc&eacute;dure doit se faire par &eacute;tapes clairement d&eacute;finies\n<ul>\n<li>tri des fichiers</li>\n<li>sauvegarde des fichiers</li>\n<li>migration des fichiers</li>\n<li>tests de d&eacute;ploiement</li>\n</ul>\n</li>\n<li>Comp&eacute;tences du&middot;de la chef&middot;fe de projet : tr&egrave;s bonnes connaissances informatiques</li>\n</ul>\n<p><strong>Projet B</strong></p>\n<ul>\n<li>Choix d'une m&eacute;thode mixte :\n<ul>\n<li>plusieurs ateliers de travail en parall&egrave;le pour d&eacute;finir les objectifs avec les diff&eacute;rents d&eacute;partements</li>\n<li>regroupement des r&eacute;sultats et choix des objectifs finaux</li>\n<li>recherche utilisateur&middot;rice sur plusieurs m&eacute;thodes d'utilisation possible</li>\n<li>d&eacute;veloppement MVP d'un premier concept</li>\n<li>test utilisateur&middot;rice&middot;s</li>\n<li>d&eacute;veloppement final</li>\n</ul>\n</li>\n<li>Comp&eacute;tences du&middot;de la chef&middot;fe de projet : empathie, &eacute;coute et communication</li>\n</ul>\n<p>&nbsp;</p>\n<p>Le Projet B est plus complexe que le Projet A car il vise une utilisation quotidienne de ses utilisateur&middot;rice&middot;s. A l'inverse, le Projet A n'impactera pas directement le travail des employ&eacute;&middot;e&middot;s, car il se d&eacute;roulera en back-end.</p>\n<p>&nbsp;</p>\n<p>Le Projet B n&eacute;cessite une &eacute;coute attentive des envies et des usages d'utilisation des diff&eacute;rents d&eacute;partements, au risque d'&ecirc;tre inutilis&eacute;.</p>\n<p>&nbsp;</p>\n<p>Je reste &agrave; votre disposition pour toutes questions,</p>\n<p>&nbsp;</p>\n<p>Meilleures salutations,</p>\n<p>&nbsp;</p>\n<p>Julie Greset</p>",
    '19683019':
      "<p>1) Projet A : mixte, car paradisgme positiviste, avec des probl&egrave;mes compliqu&eacute;s, mais identifiables dans un cadre donn&eacute;, avec quelques inconnues, qui sont sp&eacute;cifiques, car directements li&eacute;es au projet A</p>\n<p>Projet B : cascade ou it&eacute;ratif, afin d'adapter le travail selon les probl&egrave;mes complexes rencontr&eacute;s au fur et &agrave; mesure de l'impl&eacute;mentation de la solution &agrave; mettre en place</p>\n<p>&nbsp;</p>\n<p>2) Chef de projet A : capacit&eacute;s &agrave; valider les connaissances, syst&egrave;me de mesures et de v&eacute;rification, processus, objectivit&eacute; et technique</p>\n<p>Chef de projet B: capacit&eacute;s &agrave; analyser les aspects subjectifs, vue globale, contact humain, sociologie</p>\n<p>&nbsp;</p>\n<p>3) Les diff&eacute;rences se font surtout au niveau de la main mise des donn&eacute;es : le projet A s'effectue &agrave; l'interne, tandis que le second projet est externalis&eacute; et ne peut donc pas &ecirc;tre totalement suivi. Pouvoir discuter directement avec les employ&eacute;s qui ont travaill&eacute; sur la solution peut sembler moins contraignant que de devoir demander des informations, moyennant payement selon le contrat pass&eacute;, avec des personnes hors entreprise peut ressembler &agrave; une bo&icirc;te noire complexe non ma&icirc;stris&eacute;e et non ma&icirc;trisable</p>",
    '19683021':
      "<p>Bonjour,</p>\n<p>&nbsp;</p>\n<p>vous trouverez ci-dessous ma r&eacute;ponse concernant la mise en place du projet A et B.</p>\n<p>&nbsp;</p>\n<p><span style=\"text-decoration: underline;\">Projet A :</span></p>\n<p>Il est pertinant de choisir un chef de projet rigoureux avec de bonnes connaissances techniques pour pouvoir mener &agrave; bien le projet.</p>\n<p>La m&eacute;thode de d&eacute;veloppemnt en cascade semble &ecirc;tre la plus appropri&eacute;e afin de garantir qu'aucun &eacute;l&eacute;ment n'a &eacute;t&eacute; laiss&eacute; de c&ocirc;t&eacute; avant l'imprl&eacute;mentation de nouvelles fonctionnalit&eacute;s.</p>\n<p>&nbsp;</p>\n<p>&nbsp;</p>\n<p><span style=\"text-decoration: underline;\">Projet B :</span></p>\n<p>Ici, le mode de d&eacute;veloppement it&eacute;rative se veut plus fl&eacute;xible et permet de s'adapter en fonction de l'avancement du projet ce qui est souhaitable pour impl&eacute;menter un projet dans un environnement non maitris&eacute;.</p>\n<p>Le chef de projet devra se montrer felxible et &agrave; l'&eacute;coute.</p>\n<p>&nbsp;</p>\n<p>&nbsp;</p>\n<p>Les deux projets sont de complexit&eacute; diff&eacute;rente. Le permier probl&egrave;me demande de la rigueur et des connaissances techniques mais peu de gestion ou conaissances des ressources humaines alors que le projet B demande les deux. Le projet B se veut plus complexe car un r&eacute;sultat pr&eacute;cis ne peut &ecirc;tre garanti m&ecirc;me si des pr&eacute;visions peuvent &ecirc;tre &eacute;mises.&nbsp;</p>\n<p>&nbsp;</p>",
    '19683039':
      "<p>Projet A</p>\n<p>M&eacute;thode de d&eacute;veloppement: it&eacute;ratif</p>\n<p>Comp&eacute;tences: connaissances des syst&egrave;mes backup, des fichiers &agrave; traiter</p>\n<p>&nbsp;</p>\n<p>Projet B</p>\n<p>M&eacute;thode de d&eacute;veloppement: cascade</p>\n<p>Comp&eacute;tences: empathie, capacit&eacute; &agrave; travailler en groupe</p>\n<p>&nbsp;</p>\n<p>Niveau de complexit&eacute;:</p>\n<p>Le projet A implique seulement des machines qui permettra de faciliter la vie des travailleurs. Le projet B implique des humains, qui doivent s'organiser ensemble afin de mettre au point un syst&egrave;me de partage de connaissances. Le projet B est donc plus complexe, car il implique que chaque personne doit y mettre du sien et &agrave; communiquer avec les autres.</p>",
    '19683041':
      "<p>1.A : Pour ce projet j'aurais propos&eacute; une m&eacute;thode mixte, par exemple du agil et du waterfall du &agrave; l'implication de nombreaux d&eacute;partements dans ce projet.&nbsp;</p>\n<p>&nbsp;</p>\n<p>1.B: Pour ce projet&nbsp; j'aurais propos&eacute; une m&eacute;thode it&eacute;rative, comme du SCRUM (m&eacute;thode agile). En effet, les d&eacute;partements seront solicit&eacute;s &agrave; deux &eacute;tapes : la d&eacute;finition des objectifs et la phase de test.&nbsp;</p>\n<p>&nbsp;</p>\n<p>2. A : Quelqu'un avec de l'exp&eacute;rience en gestion de projets informatiques, m&eacute;thode agile et waterfall, un profil plutot technique</p>\n<p>&nbsp;</p>\n<p>2.B : Quelqu'un avec de l'exp&eacute;rience en gestion de projets informatiques, et gestion de projets avec une m&eacute;thode agile (scrum).&nbsp;</p>\n<p>&nbsp;</p>\n<p>3. En effet, ils nont pas le m&ecirc;me niveau de complexit&eacute;. D'une part, il s'agit de deux projets tr&egrave;s diff&eacute;rents m&ecirc;me si l'on parle de projets informatiques. De plus, le nombre de personnes impliqu&eacute;s varie. D'un autre c&ocirc;t&eacute;, nouss avons l'impression ue le premier projet se fait &agrave; l'internet et le deuxiu&egrave;me &agrave; l'esterne (exp&eacute;rtises et profils diff&eacute;rents)</p>",
    '19683043':
      "<p>Bonjour,&nbsp;<br /><br />Je vous ecris concernant ce mandat, afin d'amener une expertise en tant que chef de projet externe.&nbsp;<br /><br />Concernant la premiere question, li&eacute; &agrave; la methode de d&eacute;veloppement . Je proposerais une methode semi agile, o&ucirc; l'on suivraient un fil rouge des &eacute;tapes qui faut suivre une apres l'autre, tout&nbsp; en ayant une methodologie ou on fait des reunions chaque temps de temps pour adapter le planning selon les retards, etc...&nbsp;<br /><br />le premier chef de projet doit avoir la vision global et suivre tout le processus au meme temps , car tout doit avancer de maniere uniforme . Contrairement au deuxieme<br /><br />Le premier est vraiment un projet complexe et qui touche a tout les departement et que pas forcement tous les departements sont au meme niveau . Le deuxieme est plus flexible plus leger car il a pas besoin dune uniformit&eacute;e<br /><br /><br /></p>",
    '19683442': '',
    '19683460':
      '<p><span style="font-weight: 400;">Madame, Monsieur Bonjour,</span></p>\n<p>&nbsp;</p>\n<p><span style="font-weight: 400;">Votre cas nous est bien parvenu. Nous discuterons ici des deux projets.</span></p>\n<p>&nbsp;</p>\n<p><span style="font-weight: 400;">Dans le cadre du projet A)</span></p>\n<p>&nbsp;</p>\n<p><span style="font-weight: 400;">Compte tenu du fait que ce projet va toucher directement aux donn&eacute;es propres &agrave; l\'entreprise, celles-ci ne seront pas migr&eacute;es avant que le projet soit op&eacute;rationnel. Des donn&eacute;es de tests seront utilis&eacute;es pendant le d&eacute;veloppement du projet. Comme, il peut y avoir des sp&eacute;cificit&eacute;s &agrave; chaque service de l\'entreprise utilisant ces documents, nous proposons une m&eacute;thode de d&eacute;veloppement agile avec en premier lieu le d&eacute;veloppement d\'une solution standard de backup automatique (&agrave; intervalle diff&eacute;rent selon l\'usage.) Puis il sera aussi possible de g&eacute;rer des droits utilisateurs en fonction des documents (sensibles, confidentiels, ...) pour garantir la s&eacute;curit&eacute; de ces informations. Il sera aussi possible de modifier les intervalles de sauvegarde selon les besoins des diff&eacute;rents services. Si cela est n&eacute;cessaire il est envisageable de rajouter, lorsque l\'on en constatera la n&eacute;cessit&eacute;, de rajouter des modules permettant par exemple le travail collaboratif ou encore un syst&egrave;me de classement, d\'urgence, d\'importance, etc..</span></p>\n<p>&nbsp;</p>\n<p><span style="font-weight: 400;">Dans le cadre du projet B)</span></p>\n<p>&nbsp;</p>\n<p><span style="font-weight: 400;">Ici il s\'agit plut&ocirc;t de mettre en commun les diff&eacute;rents savoirs des membres de l\'entreprise. Outre une d&eacute;marche de structuration de l\'information pr&eacute;alable &agrave; la mise en place du syst&egrave;me- Comprenez un "How to" d&eacute;crivant les tenants et les aboutissants des documents informatifs quant &agrave; la forme que ceux-ci doivent prendre - ce projet est d\'une nature moins complexe. Il sera ici n&eacute;cessaire de bien comprendre quel d&eacute;partement a besoin de quelles informations et sous quelle forme pour faciliter l\'&eacute;change d\'informations.</span></p>\n<p>&nbsp;</p>\n<p><span style="font-weight: 400;">Nous nous r&eacute;jouissons de cette collaboration, et attendons de vos nouvelles pour un entretien prochain pour discuter plus en d&eacute;tail de ces deux projets.</span></p>\n<p>&nbsp;</p>\n<p><span style="font-weight: 400;">Cordialement</span></p>\n<p>&nbsp;</p>\n<p><span style="font-weight: 400;">Johnny Cadillac</span></p>\n<p><br /><br /></p>',
    '19683510':
      "<ul>\n<li>M&eacute;thode de d&eacute;veloppement:\n<ul>\n<li>M&eacute;thode mixte, garder des &eacute;tape mais fonctionner en mode agile entre chaque &eacute;tape. Car comme c'est plusieurs d&eacute;partements, faire un d&eacute;partement apr&egrave;s l'autre.</li>\n<li>Pareil. Pour moi il faut faire par &eacute;tape. En demandant aux d&eacute;partement et hierarchie un &agrave; un et redefinir &agrave; chaque fois les objectifs et am&eacute;liorer et affiner le r&eacute;sultat &agrave; chauqe fois.</li>\n</ul>\n</li>\n<li>Comp&eacute;tences chef&middot;fe de projet\n<ul>\n<li>IT,Logique, Programmation, Organisation</li>\n<li>Empathie, Ecoute, Organisation, Amicale, Interpersonelles</li>\n</ul>\n</li>\n<li>Niveau de complexit&eacute;\n<ul>\n<li>Moyen, la complexit&eacute; est de d&eacute;terminent les fichiers qui sont fr&eacute;quemment utilis&eacute;s des autres, le reste est juste un classement selont ses attributs.</li>\n<li>Haut: Il faut d&eacute;terminer&nbsp; quelles comp&eacute;tences sont b&eacute;n&eacute;fiques par rapports &agrave; d autres, les avis sont subjectifs</li>\n<li>Difference: Le cas un c'est des &eacute;l&eacute;ments objectis, tout le monde pense la meme chose,c est logique. Le cas 2 c est plus des notions subjectives qui dependent de chaque personne, chaque pens&eacute;e,...</li>\n</ul>\n</li>\n</ul>",
    '19683568':
      "<p><strong>Projet A</strong></p>\n<p>&nbsp;</p>\n<p>Ce projet n&eacute;cessite de bonnes comp&eacute;tences techniques. N&eacute;anmoins, rien n'a besoin d'&ecirc;tre invent&eacute;. Ce n'est que de l'impl&eacute;mentations de solutions qui existent.</p>\n<p>&nbsp;</p>\n<p>M&eacute;thode de d&eacute;veloppeent propos&eacute;e: Cascade</p>\n<p>Comp&eacute;tences requises pour le CP: Gestion de serveurs et de donn&eacute;es</p>\n<p>&nbsp;</p>\n<p><strong>Projet B</strong></p>\n<p>&nbsp;</p>\n<p>Il n'y a pas de solution donn&eacute;e pour ce projet complexe. De plus, le fait d'impliquer plusieurs personnes de plusieurs d&eacute;partements ajoute de la complexit&eacute; &agrave; g&eacute;rer ce projet. La solution &agrave; ce probl&egrave;me n'est pas que technique, il est n&eacute;cessaire de trouver un concept efficace.</p>\n<p>&nbsp;</p>\n<p>M&eacute;thode de d&eacute;veloppeent propos&eacute;e: mixte</p>\n<p>Comp&eacute;tences requises pour le CP: Bonne vue d'ensemble, recul, empathie</p>",
    '19683585':
      "<p>Bonjour,</p>\n<p>&nbsp;</p>\n<p>Je vous vous contacte suite &agrave; la lecture de vos deux projets mis en ligne.</p>\n<p>&nbsp;</p>\n<p>Je choisirais des d&eacute;veloppement en cascade car c'est le plus pratique.</p>\n<p>&nbsp;</p>\n<p>Les comp&eacute;tences n&eacute;cessaires seraient une bonne expertise en base de donn&eacute;es.</p>\n<p>&nbsp;</p>\n<p>Le premier projet est bien plus complexe car il s'agit de reprogrammer un syst&egrave;me complet.</p>\n<p>&nbsp;</p>\n<p>Au plaisir</p>",
    '19683608': '',
    '19683626':
      "<p>Bonjour Madame, Monsieur,</p>\n<p>&nbsp;</p>\n<p>je vous &eacute;cris suit &agrave; votre demande. Voici donc, mon avis sur les points que vous m'aviez soumis.</p>\n<p><br />Pour le projet A, la m&eacute;thode en cascade serait la plus optimale car la finalit&eacute; et le but recherch&eacute; du projet est connu. Tandis que pour le projet B, la m&eacute;thode agile serait la plus optimale car il est probable que des ajustements soient faits r&eacute;guli&egrave;rement.</p>\n<p><br />En ce qui concerne les chefs de projet, celui du projet A doit avoir une vision macro de la situation. Le chef de projet B quant &agrave; lui doit pouvoir s&rsquo;adapter rapidement &agrave; la situation.</p>\n<p><br />Enfin, le projet A et moins complexe que le projet B car la finalit&eacute; du projet A est connue. Le projet B demande une recherche plus constructiviste.</p>\n<p><br />J&rsquo;esp&egrave;re avoir pu vous r&eacute;pondre de la meilleure des fa&ccedil;ons &agrave; vos questions et je vous prie d&rsquo;agr&eacute;&eacute; Madame, Monsieur, mes sautions les meilleures.</p>\n<p>&nbsp;</p>",
    '19683660':
      "<p>question 1 - projet A</p>\n<p>&nbsp;</p>\n<p>je proposerais une m&eacute;thode en cascade</p>\n<p>&nbsp;</p>\n<p>question 2 - projet A</p>\n<p>&nbsp;</p>\n<p>les comp&eacute;tences du chef de projet doit &ecirc;tre principalement technique, notament en architecture informatique</p>\n<p>&nbsp;</p>\n<p>question 1 - projet B</p>\n<p>&nbsp;</p>\n<p>je proposerais de faire un d&eacute;veloppement mixte, des blocks en cascade et chaque block en l'it&eacute;ratif (contexte, design, dev...)</p>\n<p>&nbsp;</p>\n<p>question 2 - projet B</p>\n<p>&nbsp;</p>\n<p>le chef de projet doit avoir l'&eacute;xp&eacute;rience, un connaitre surtout l'organisation d'entreprise, la nature humaine, le design</p>\n<p>&nbsp;</p>\n<p>question 3</p>\n<p>&nbsp;</p>\n<p>non, le projet B est plus complexe</p>\n<p>&nbsp;</p>",
    '19683710':
      '<p>Bonjour,</p>\n<p>&nbsp;</p>\n<p>Tout d\'abord merci pour votre mail et vos questions. Je vais tenter de vous r&eacute;pondre de la fa&ccedil;on la plus clair possible mais n\'hesitez pas &agrave; me contacter par t&eacute;l&eacute;phone si un point n\'est pas clair.&nbsp;</p>\n<p>&nbsp;</p>\n<ul id="yui_3_18_1_3_1604326466058_4078">\n<li id="yui_3_18_1_3_1604326466058_4077" class="western"><span id="yui_3_18_1_3_1604326466058_4076">Quelle m&eacute;thode de d&eacute;veloppement proposeriez-vous pour chacun de ces projets (it&eacute;ratif, cascade, mixte, autre), pour quelles raisons ?</span>\n<ul id="yui_3_18_1_3_1604326466058_4078">\n<li class="western">Ma r&eacute;ponse peut varier selon les ressources que vous possedez au sein de votre entreprise. Si vous avez l\'expertise pour d&eacute;velopper ces projets avec la methode Agile (it&eacute;ratif), c\'est l\'id&eacute;al pour le <strong>projet A</strong>. Le <strong>projet B</strong> concerne tout les d&eacute;partements, se qui complique l\'utilisation d\'une methode it&eacute;rative claire. Je vous conseil donc une methode en cascade.&nbsp;</li>\n</ul>\n</li>\n<li id="yui_3_18_1_3_1604326466058_8548" class="western"><span id="yui_3_18_1_3_1604326466058_8547">Quelles seraient les comp&eacute;tences n&eacute;cessaires&nbsp;pour le chef de projet A, pour le chef de projet B ?</span>\n<ul id="yui_3_18_1_3_1604326466058_4078">\n<li>Le projet A n&eacute;c&eacute;ssite un chef de projet avec de bonne connaissance technique et de l\'&eacute;xperience dans des projets similaires. La sauvegarde de donn&eacute;e est un sujet sensible qui n&eacute;c&eacute;ssite une attention particuli&egrave;re.</li>\n<li>Le projet B quant &agrave; lui n&eacute;c&eacute;ssite des bonne capacit&eacute; de communication et un connaissance sans faille de l\'entreprise et de sa structure.&nbsp;</li>\n</ul>\n</li>\n<li>Pour la derni&egrave;re question je n\'ai plus de temps, d&eacute;sol&eacute;.&nbsp;</li>\n</ul>\n<p>D&eacute;sol&eacute; pour les fautes d\'orthographes..</p>\n<p>&agrave; bient&ocirc;t</p>\n<p>S.Ray</p>\n<p>&nbsp;</p>',
  },
};

//add content in the State
interface LayoutState {
  show: boolean;
  content: string;
}

const defaultLayoutState: LayoutState = {
  show: false,
  content: "No content",
};

export default function PeerReviewPage({ peerReview }: PeerReviewPageProps) {
  const [layoutState, setLayoutState] = React.useState<LayoutState>(
    defaultLayoutState,
  );

  const { lang } = React.useContext(languagesCTX);
  const spr = useStore(() => instantiate(peerReview));
  const self = Player.self();
  const state = spr.getState(self) as
    | 'DISCARDED'
    | 'EVICTED'
    | 'NOT_STARTED'
    | 'SUBMITTED'
    | 'DISPATCHED'
    | 'NOTIFIED'
    | 'COMPLETED';


  React.useEffect(() => {
    let mounted = true;
    VariableDescriptorAPI.runScript(
      GameModel.selectCurrent().id!,
      Player.selectCurrent().id!,
      createScript(`ReviewHelper.summarize("${peerReview.name}")`),
      undefined,
      true,
    ).then(res => {
      if (mounted) {
        wlog(res);
      }
    });
    return () => {
      mounted = false;
    };
  });

  return (
    <div className={expandWidth}>
      <Toolbar>
        <Toolbar.Header className={cx(flex, flexColumn)}>
          <h2>Peer Review Process for "{translate(spr.getLabel(), lang)}"</h2>
          <div className={cx(flex, flexRow, flexDistribute, expandWidth)}>
            <div
              className={cx(prStateStyle, {
                [prActiveStateStyle]: state === 'NOT_STARTED',
              })}
            >
              <h3>Edition</h3>
              <p>The authors are editing what will be reviewed</p>
              <p style={{ fontStyle: 'italic' }}>
                The process has not begun yet
              </p>
            </div>
            <Button icon="arrow-right" disabled={state !== 'NOT_STARTED'} />
            <div className={prStateStyle}>
              <h3>Reviewing</h3>
              <p>The authors are reviewing their peers</p>
              <p style={{ fontStyle: 'italic' }}>
                This is the first step of the process
              </p>
            </div>
            <Button icon="arrow-right" />
            <div className={prStateStyle}>
              <h3>Commenting</h3>
              <p>The authors acquaint themselves with peer reviews</p>
              <p style={{ fontStyle: 'italic' }}>
                They comment on those reviews
              </p>
            </div>
            <Button icon="arrow-right" />
            <div className={prStateStyle}>
              <h3>Completed</h3>
              <p>The reviewing process has been completed</p>
              <p style={{ fontStyle: 'italic' }}>
                The authors take acquaintance of comments on reviews they've
                done
              </p>
            </div>
          </div>
        </Toolbar.Header>
        <Toolbar.Content>
            <Button icon="undo" onClick={(e)=>{
              e.stopPropagation();
              setLayoutState(oldState => ({...oldState, show: true}));
              }}>INFO OVERLAY TESTER</Button>
        </Toolbar.Content>
      </Toolbar>
      <div>{JSON.stringify(peerReview)}</div>
      {layoutState.show !== false && (
          <InfoOverlay
            content = {'<div><h3>HOLAAAAAA</h3><p> This is the content of the Info overlay (no worry, just for test)!!!!</p></div>'}
            onExit={() => {
              setLayoutState(oldState => ({...oldState, show: false}));
            }}
          />
        )}
    </div>
  );
}
