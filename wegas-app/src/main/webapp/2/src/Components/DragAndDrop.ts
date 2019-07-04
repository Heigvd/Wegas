import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

export const defaultContextManager = DragDropContext(HTML5Backend);
