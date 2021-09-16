import * as React from 'react';
import { ComponentType } from '../../../Components/PageComponents/tools/componentFactory';
import { defaultMarginRight } from '../../../css/classes';
import { IconComp } from '../Views/FontAwesome';
import { themeVar } from '../../../Components/Theme/ThemeVars';
import { css } from '@emotion/css';

/** Import of all svgs for compos icons */

import AbsoluteLayoutIcon from '../../../pictures/componentsIcons/absoluteLayout.svg';
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
import InboxIcon from '../../../pictures/componentsIcons/inbox.svg';
import LinearLayoutIcon from '../../../pictures/componentsIcons/linearLayout.svg';
import MenuIcon from '../../../pictures/componentsIcons/menu.svg';
import ModalIcon from '../../../pictures/componentsIcons/modal.svg';
import NumberIcon from '../../../pictures/componentsIcons/number.svg';
import NumberSliderIcon from '../../../pictures/componentsIcons/numberSlider.svg';
import PageLoaderIcon from '../../../pictures/componentsIcons/pageLoader.svg';
import PhasesIcon from '../../../pictures/componentsIcons/phases.svg';
import PRTreeIcon from '../../../pictures/componentsIcons/PRTreeView.svg';
import PRVariableIcon from '../../../pictures/componentsIcons/PRVariableEditor.svg';
import QuestionIcon from '../../../pictures/componentsIcons/question.svg';
import QuestionListIcon from '../../../pictures/componentsIcons/questionList.svg';
import SelectInputIcon from '../../../pictures/componentsIcons/selectInput.svg';
import StateIcon from '../../../pictures/componentsIcons/state.svg';
import StateMachineIcon from '../../../pictures/componentsIcons/stateMachine.svg';
import StringInputIcon from '../../../pictures/componentsIcons/stringInput.svg';
import TextIcon from '../../../pictures/componentsIcons/text.svg';
import textInputIcon from '../../../pictures/componentsIcons/textInput.svg';
import VariableTreeIcon from '../../../pictures/componentsIcons/variableTree.svg';
import { SVGProps } from 'react';

const iconComponents = {
  absoluteLayout: AbsoluteLayoutIcon,
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
  inbox: InboxIcon,
  linearLayout: LinearLayoutIcon,
  menu: MenuIcon,
  modal: ModalIcon,
  number: NumberIcon,
  numberSlider: NumberSliderIcon,
  pageLoader: PageLoaderIcon,
  phases: PhasesIcon,
  PRTreeView: PRTreeIcon,
  PRVariableEditor: PRVariableIcon,
  question: QuestionIcon,
  questionList: QuestionListIcon,
  selectInput: SelectInputIcon,
  state: StateIcon,
  stateMachine: StateMachineIcon,
  stringInput: StringInputIcon,
  text: TextIcon,
  textInput: textInputIcon,
  variableTree: VariableTreeIcon,
};

export type IconComponentType = keyof typeof iconComponents;

const componentIconStyle = css({
  fill: themeVar.colors.PrimaryColor,
  width: '60px',
});

interface ComponentTypeIconProps {
  /**
   * componentName - the name of the component
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
    }
  }
  return (
    <IconComp icon={typeIcon(componentType)} className={defaultMarginRight} />
  );
}

interface ComponentIconProps extends SVGProps<SVGSVGElement> {
  /**
   * componentName - the name of the component
   */
  componentIllu: IconComponentType;
}

export function ComponentIcon({ componentIllu, ...props }: ComponentIconProps) {
  const IconComponent = iconComponents[
    componentIllu
  ] as React.FunctionComponent<SVGProps<SVGSVGElement>>;
  return <IconComponent {...props} className={componentIconStyle} />;
}
