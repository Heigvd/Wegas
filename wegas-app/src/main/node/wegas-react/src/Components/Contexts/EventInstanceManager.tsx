import { IEventInboxInstance } from "wegas-ts-api";
import { editingStore } from "../../data/Stores/editingStore";
import { useStore } from "../../data/Stores/store";
import { deepDifferent } from "../Hooks/storeHookFactory";
import { getEvents } from "../../data/Reducer/VariableInstanceReducer";
import * as React from "react";


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
        editingStore.dispatch(getEvents(e as IEventInboxInstance))
      }
    });
  }, [outdatedEventBoxes]);

  return (
    <>
      {children}
    </>
  );
}
