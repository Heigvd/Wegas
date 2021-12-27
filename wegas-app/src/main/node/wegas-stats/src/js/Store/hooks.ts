import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { AppDispatch, StatState } from '../init';

export { shallowEqual } from 'react-redux';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = (): AppDispatch => useDispatch<AppDispatch>();

export const useAppSelector: TypedUseSelectorHook<StatState> = useSelector;