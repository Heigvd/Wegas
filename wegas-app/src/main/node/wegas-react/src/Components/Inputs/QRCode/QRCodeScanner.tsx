import * as React from 'react';

import { css, cx } from '@emotion/css';
import {
  faArrowLeft,
  faRedo,
  faCamera,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { Html5Qrcode } from 'html5-qrcode';
import { CameraDevice } from 'html5-qrcode/core';
import { TumbleLoader } from '../../Loader';

import CameraRotate from './camera-rotate.svg';

import { getLogger } from '../../../Helper/wegaslog';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { commonTranslations } from '../../../i18n/common/common';

const logger = getLogger('QRScanner');

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

type Navigator = 'Firefox' | 'Chrome' | 'Safari' | '';

type System = 'MacOS' | 'Linux' | 'Windows' | 'Android' | 'iOS' | '';

function guessSystem(): System {
  const ua = navigator.userAgent;

  if (/iPad|iPod|iPhone/i.test(ua)) {
    return 'iOS';
  }

  if (/Android/i.test(ua)) {
    return 'Android';
  }

  if (/Macintosh/i.test(ua)) {
    return 'MacOS';
  }

  if (/Linux/i.test(ua)) {
    return 'Linux';
  }

  if (/Windows/i.test(ua)) {
    return 'Windows';
  }

  return '';
}

function guessNavigator(): Navigator {
  const ua = navigator.userAgent;

  if (/Firefox/i.test(ua) && !/Seamonkey/i.test(ua)) {
    return 'Firefox';
  }

  if (/Chrome|Chromium/i.test(ua)) {
    return 'Chrome';
  }

  if (/Safari/.test(ua)) {
    return 'Safari';
  }

  return '';
}

function Hint(): JSX.Element {
  const nav = guessNavigator();
  const system = guessSystem();

  const i18n = useInternalTranslate(commonTranslations);

  let specificHint = '';

  if (system === 'iOS') {
    specificHint = i18n.qrCode.iOSSettingsHint(nav);
  } else if (system === 'Android') {
    specificHint = i18n.qrCode.androidSettingsHint(nav);
  }

  return (
    <div>
      <h4>{i18n.qrCode.notAuthorizedToUseCamera}</h4>
      <div>
        <em>{i18n.qrCode.tabSetting}</em>
      </div>
      <div>
        <em>{specificHint}</em>
      </div>
    </div>
  );
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

  const [state, setState] = React.useState<
    'UNDEF' | 'LOADING' | 'IDLE' | 'SCAN' | 'ERROR'
  >('UNDEF');

  const cancelCb = React.useCallback(() => {
    setState('IDLE');
  }, []);

  const initScanCb = React.useCallback(() => {
    setState('SCAN');
  }, []);

  const restartCb = React.useCallback(() => {
    setState('UNDEF');
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
    if (state === 'UNDEF') {
      setState('LOADING');
      Html5Qrcode.getCameras()
        .then(devices => {
          const uniqueDevices = devices.reduce<CameraDevice[]>(
            (acc, device) => {
              if (!acc.find(d => d.id === device.id)) {
                acc.push(device);
              }
              return acc;
            },
            [],
          );
          setDevices(uniqueDevices);
          setState('IDLE');
        })
        .catch(error => {
          logger.warn('Get Cameras error:', error);
          setState('ERROR');
        });
    }
  }, [state]);

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
        error => {
          logger.warn('QR Scan Error: ', error);
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
          <div className="qrCodeScanne__scanner" ref={initReader}></div>
          <div className={toolbarStyle}>
            {devices.length > 1 && (
              <span
                className={cx(clickableStyle, 'fa-layers', 'fa-4x')}
                onClick={switchCameraCb}
              >
                <CameraRotate />
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
      {(state === 'LOADING' || state === 'UNDEF') && <TumbleLoader />}
      {state === 'ERROR' && (
        <div>
          <Hint />
          <FontAwesomeIcon
            className={cx(clickableStyle, 'fa-4x', css({ paddingTop: '20px' }))}
            icon={faRedo}
            onClick={restartCb}
            size="4x"
          />
        </div>
      )}
    </div>
  );
}
