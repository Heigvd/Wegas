import * as React from 'react';

import { css, cx } from '@emotion/css';
import {
  faArrowLeft,
  faArrowsAltH,
  faCamera,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { Html5Qrcode } from 'html5-qrcode';
import { CameraDevice } from 'html5-qrcode/core';
import { TumbleLoader } from '../../Loader';

const clickableStyle = css({
  cursor: 'pointer',
});

const containerStyle = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
});

const toolbarStyle = css({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'flex-end',
});

interface QRCodeScannerProps {
  onScan: (data: string) => void;
}

/**
 * Open user camera and allow to scan qrCode
 */
export default function QRCodeScanner({
  onScan,
}: QRCodeScannerProps): JSX.Element {
  const [devices, setDevices] = React.useState<CameraDevice[]>([]);
  const [selectedDevice, selectDevice] = React.useState<CameraDevice['id']>();

  const [reader, setReader] = React.useState<Html5Qrcode>();

  const [state, setState] = React.useState<'LOADING' | 'IDLE' | 'SCAN'>(
    'LOADING',
  );

  const cancelCb = React.useCallback(() => {
    setState('IDLE');
  }, []);

  const initScanCb = React.useCallback(() => {
    setState('SCAN');
  }, []);
  const switchCameraCb = React.useCallback(() => {
    if (reader) {
      const currentDeviceId = reader.getRunningTrackSettings().deviceId;
      const index = devices.findIndex(device => currentDeviceId === device.id);
      const newIndex = index + 1;
      selectDevice(
        newIndex >= devices.length ? devices[0].id : devices[newIndex].id,
      );
    }
  }, [reader, selectDevice, devices]);

  React.useEffect(() => {
    let alive = true;
    Html5Qrcode.getCameras().then(devices => {
      if (alive) {
        //
        const uniqueDevices = devices.reduce<CameraDevice[]>((acc, device) => {
          if (!acc.find(d => d.id === device.id)) {
            acc.push(device);
          }
          return acc;
        }, []);
        setDevices(uniqueDevices);
        setState('IDLE');
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  // each time the div which contains the reader changed
  const initReader = React.useCallback((divRef: HTMLDivElement | null) => {
    if (divRef === null) {
      // no reader any longer
      setReader(undefined);
    } else {
      // hack: since qrCode scanner requires an id, let's generate one
      if (!divRef.id) {
        let id = '';
        let counter = 1;
        do {
          id = `qrScanner-${counter}`;
          counter++;
        } while (document.getElementById(id));
        divRef.id = id;
      }
      setReader(new Html5Qrcode(divRef.id));
    }
  }, []);

  React.useEffect(() => {
    if (reader) {
      // prefer back camera, user will be allowed to switch later
      reader.start(
        selectedDevice ? selectedDevice : { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: 512,
        },
        decodedText => {
          onScan(decodedText);
          setState('IDLE');
        },
        () => {
          //wlog('QR Scan Error: ', errorMessage);
        },
      );
    }
    return () => {
      if (reader) {
        reader.stop();
      }
    };
  }, [selectedDevice, reader, onScan]);

  return (
    <div className={containerStyle}>
      {state === 'IDLE' && (
        <FontAwesomeIcon
          className={cx(clickableStyle, 'fa-4x')}
          icon={faCamera}
          onClick={initScanCb}
          size="4x"
        />
      )}
      {state === 'SCAN' && (
        <>
          <div ref={initReader}></div>
          <div className={toolbarStyle}>
            {devices.length > 1 && (
              <span
                className={cx(clickableStyle, 'fa-layers', 'fa-fw', 'fa-4x')}
                onClick={switchCameraCb}
              >
                <FontAwesomeIcon icon={faCamera} transform="shrink-5 up-5" />
                <FontAwesomeIcon
                  icon={faArrowsAltH}
                  transform="shrink-5 down-5"
                />
              </span>
            )}
            <FontAwesomeIcon
              className={cx(clickableStyle, 'fa-4x')}
              icon={faArrowLeft}
              onClick={cancelCb}
              size="4x"
            />
          </div>
        </>
      )}
      {state === 'LOADING' && <TumbleLoader />}
    </div>
  );
}
