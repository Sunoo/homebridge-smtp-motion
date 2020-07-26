import {
  API,
  APIEvent,
  DynamicPlatformPlugin,
  Logging,
  PlatformAccessory,
  PlatformConfig
} from 'homebridge';
import { SMTPServer, SMTPServerDataStream, SMTPServerSession } from 'smtp-server';
import http from 'http';
import { SmtpMotionPlatformConfig } from './configTypes';

const PLUGIN_NAME = 'homebridge-smtp-motion';
const PLATFORM_NAME = 'smtpMotion';

class SmtpMotionPlatform implements DynamicPlatformPlugin {
  private readonly log: Logging;
  private readonly config: SmtpMotionPlatformConfig;

  constructor(log: Logging, config: PlatformConfig, api: API) {
    this.log = log;
    this.config = config as unknown as SmtpMotionPlatformConfig;

    api.on(APIEvent.DID_FINISH_LAUNCHING, this.startSmtp.bind(this));
  }

  configureAccessory(accessory: PlatformAccessory): void { // eslint-disable-line @typescript-eslint/no-unused-vars
    return;
  }

  startSmtp(): void {
    const smtpPort = this.config.smtp_port || 2525;
    const httpPort = this.config.http_port || 8080;
    const log = this.log;
    const server = new SMTPServer({authOptional: true,
      onData(stream: SMTPServerDataStream, session: SMTPServerSession, callback: (err?: Error | null) => void): void {
        stream.on('data', () => {}); // eslint-disable-line @typescript-eslint/no-empty-function
        stream.on('end', callback);
        session.envelope.rcptTo.forEach((rcptTo) => {
          const name = rcptTo.address.split('@')[0].replace(/\+/g, ' ');
          log.debug(name + ' Motion Detected!');
          try {
            http.get('http://127.0.0.1:' + httpPort + '/motion?' + name);
          } catch (ex) {
            log.error(name + ': Error making HTTP call: ' + ex);
          }
        });
      }
    });
    server.listen(smtpPort);
  }
}

export = (api: API): void => {
  api.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, SmtpMotionPlatform);
};
