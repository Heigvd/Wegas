import { IEventInboxInstance } from "wegas-ts-api";
import { editingStore } from "../../data/Stores/editingStore";
import { getEvents } from "../../store/slices/variableInstances";
import { shallowEqual, useAppSelector } from "../../store/hooks";
import * as React from "react";


/**
 * Makes sure that all EventBoxeInstances are up to date
 */
export default function EventInstanceManager({
  children,
}: React.PropsWithChildren<UnknownValuesObject>) {

  const outdatedEventBoxes = useAppSelector(s => {
    return Object.entries(s.variableInstances.events).filter(([_,v]) => v.status === 'UPDATE_REQUIRED')
    .map(([k]) => s.variableInstances.instances[k])
  }, shallowEqual);

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
