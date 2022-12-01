import { css } from '@emotion/css';
import * as React from 'react';
import { SVGProps } from 'react';
import { ComponentType } from '../../../Components/PageComponents/tools/componentFactory';
import { themeVar } from '../../../Components/Theme/ThemeVars';
import { defaultMarginRight } from '../../../css/classes';
/** Import of all svgs for compos icons */
import AbsoluteLayoutIcon from '../../../pictures/componentsIcons/absoluteLayout.svg';
import AchievementExhibition from '../../../pictures/componentsIcons/achievementExhibitions.svg';
import BooleanIcon from '../../../pictures/componentsIcons/boolean.svg';
import BoxesIcon from '../../../pictures/componentsIcons/boxes.svg';
import ButtonIcon from '../../../pictures/componentsIcons/button.svg';
import DialogueIcon from '../../../pictures/componentsIcons/dialogue.svg';
import FileBrowserIcon from '../../../pictures/componentsIcons/fileBrowser.svg';
import FileInputIcon from '../../../pictures/componentsIcons/fileInput.svg';
import FileListIcon from '../../../pictures/componentsIcons/fileList.svg';
import FlexListIcon from '../../../pictures/componentsIcons/flexList.svg';
import FlowChartIcon from '../../../pictures/componentsIcons/flowChart.svg';
import ForEachIcon from '../../../pictures/componentsIcons/forEach.svg';
import GaugeIcon from '../../../pictures/componentsIcons/gauge.svg';
import GridIcon from '../../../pictures/componentsIcons/grid.svg';
import IconIcon from '../../../pictures/componentsIcons/icon.svg';
import IfElseIcon from '../../../pictures/componentsIcons/ifElse.svg';
import ImageIcon from '../../../pictures/componentsIcons/image.svg';
import ImageLayer from '../../../pictures/componentsIcons/imageLayer.svg'
import InboxIcon from '../../../pictures/componentsIcons/inbox.svg';
import LinearLayoutIcon from '../../../pictures/componentsIcons/linearLayout.svg';
import Map from '../../../pictures/componentsIcons/map.svg';
import MenuIcon from '../../../pictures/componentsIcons/menu.svg';
import ModalIcon from '../../../pictures/componentsIcons/modal.svg';
import NumberIcon from '../../../pictures/componentsIcons/number.svg';
import NumberSliderIcon from '../../../pictures/componentsIcons/numberSlider.svg';
import Overlay from '../../../pictures/componentsIcons/overlay.svg';
import Overlays from '../../../pictures/componentsIcons/overlays.svg';
import PageLoaderIcon from '../../../pictures/componentsIcons/pageLoader.svg';
import PhasesIcon from '../../../pictures/componentsIcons/phases.svg';
import PRTreeIcon from '../../../pictures/componentsIcons/PRTreeView.svg';
import PRVariableIcon from '../../../pictures/componentsIcons/PRVariableEditor.svg';
import QRCode from '../../../pictures/componentsIcons/qrCode.svg';
import QRScanner from '../../../pictures/componentsIcons/qrScanner.svg';
import QuestionIcon from '../../../pictures/componentsIcons/question.svg';
import QuestionListIcon from '../../../pictures/componentsIcons/questionList.svg';
import QuestProgressBar from '../../../pictures/componentsIcons/questProgressBar.svg';
import ScatterIcon from '../../../pictures/componentsIcons/scatter.svg';
import SelectInputIcon from '../../../pictures/componentsIcons/selectInput.svg';
import StateIcon from '../../../pictures/componentsIcons/state.svg';
import StateMachineIcon from '../../../pictures/componentsIcons/stateMachine.svg';
import StringInputIcon from '../../../pictures/componentsIcons/stringInput.svg';
import TextIcon from '../../../pictures/componentsIcons/text.svg';
import TileLayer from '../../../pictures/componentsIcons/tileLayer.svg';
import textInputIcon from '../../../pictures/componentsIcons/textInput.svg';
import VariableTreeIcon from '../../../pictures/componentsIcons/variableTree.svg';
import VectorLayer from '../../../pictures/componentsIcons/vectorLayer.svg';
import { IconComp } from '../Views/FontAwesome';

/**
 * To import new or updated Icon:
 * - Use Figma template for size and style. Export in SVG.
 * - IMPORTANT Import in Wegas, open file. Delete width + height + fill attributes in tags.
 * - Add the import above, use it in the list below.
 */
const iconComponents = {
  absoluteLayout: AbsoluteLayoutIcon,
  achievementExhibition: AchievementExhibition,
  boolean: BooleanIcon,
  boxes: BoxesIcon,
  button: ButtonIcon,
  dialogue: DialogueIcon,
  fileBrowser: FileBrowserIcon,
  fileInput: FileInputIcon,
  fileList: FileListIcon,
  flexList: FlexListIcon,
  flowChart: FlowChartIcon,
  forEach: ForEachIcon,
  gauge: GaugeIcon,
  grid: GridIcon,
  icon: IconIcon,
  ifElse: IfElseIcon,
  image: ImageIcon,
  imageLayer: ImageLayer,
  inbox: InboxIcon,
  linearLayout: LinearLayoutIcon,
  map: Map,
  menu: MenuIcon,
  modal: ModalIcon,
  number: NumberIcon,
  numberSlider: NumberSliderIcon,
  overlay: Overlay,
  overlays: Overlays,
  pageLoader: PageLoaderIcon,
  phases: PhasesIcon,
  PRTreeView: PRTreeIcon,
  PRVariableEditor: PRVariableIcon,
  qrCode: QRCode,
  qrScanner: QRScanner,
  question: QuestionIcon,
  questionList: QuestionListIcon,
  questProgressBar: QuestProgressBar,
  scatter: ScatterIcon,
  selectInput: SelectInputIcon,
  state: StateIcon,
  stateMachine: StateMachineIcon,
  stringInput: StringInputIcon,
  text: TextIcon,
  textInput: textInputIcon,
  tileLayer: TileLayer,
  variableTree: VariableTreeIcon,
  vectorLayer: VectorLayer,
};

export type IconComponentType = keyof typeof iconComponents;

const componentIconStyle = css({
  fill: themeVar.colors.PrimaryColor,
  width: '60px',
});

interface ComponentTypeIconProps {
  /**
   * componentType - the type of the component
   */
  componentType: ComponentType;
}
export function ComponentTypeIcon({ componentType }: ComponentTypeIconProps) {
  function typeIcon(componentType: ComponentType) {
    switch (componentType) {
      case 'Layout':
        return 'table';
      case 'Input':
        return 'edit';
      case 'Output':
        return 'icons';
      case 'Advanced':
        return 'atom';
      case 'Programmatic':
        return 'code';
      case 'Maps':
        return 'map';
    }
  }
  return (
    <IconComp icon={typeIcon(componentType)} className={defaultMarginRight} />
  );
}

interface ComponentIconProps extends SVGProps<SVGSVGElement> {
  /**
   * componentIllu - the illustration of the component
   */
  componentIllu: IconComponentType;
}

export function ComponentIcon({ componentIllu, ...props }: ComponentIconProps) {
  const IconComponent = iconComponents[
    componentIllu
  ] as React.FunctionComponent<SVGProps<SVGSVGElement>>;
  return <IconComponent {...props} className={componentIconStyle} />;
}
