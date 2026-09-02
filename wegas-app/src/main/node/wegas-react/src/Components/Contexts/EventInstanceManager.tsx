import { IEventInboxInstance } from "wegas-ts-api";
import { useStore } from "../../data/Stores/store";
import { deepDifferent } from "../Hooks/storeHookFactory";
import { getEvents } from "../../data/Reducer/VariableInstanceReducer";
import * as React from "react";
import { dispatch } from '../../store/store';


/**
 * Makes sure that all EventBoxeInstances are up to date
 */
export default function EventInstanceManager({
  children,
}: React.PropsWithChildren<UnknownValuesObject>) {

  const outdatedEventBoxes = useStore(s => {
    return Object.entries(s.variableInstances?.events || {}).filter(([_,v]) => v.status === 'UPDATE_REQUIRED')
    .map(([k]) => s.variableInstances.instances[k])
  }, deepDifferent);

  React.useEffect(() => {
    outdatedEventBoxes.forEach((e) => {
      if(e){
        dispatch(getEvents(e as IEventInboxInstance))
      }
    });
  }, [outdatedEventBoxes]);

  return (
    <>
      {children}
    </>
  );
}
