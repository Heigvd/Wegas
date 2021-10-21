import * as React from 'react';

interface FullscreenContext {
  fullscreen: boolean;
  setFullscreen: (fullscreen: boolean) => void;
}

export const fullscreenCTX = React.createContext<FullscreenContext>({
  fullscreen: false,
  setFullscreen: () => {},
});

export function FullscreenProvider({ children }: React.PropsWithChildren<{}>) {
  const [fullscreen, setFullscreen] = React.useState(false);
  return (
    <fullscreenCTX.Provider value={{ fullscreen, setFullscreen }}>
      {children}
    </fullscreenCTX.Provider>
  );
}
