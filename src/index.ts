import {
  API,
  APIEvent,
  DynamicPlatformPlugin,
  Logging,
  PlatformAccessory,
  PlatformConfig
} from 'homebridge';
import Bunyan from 'bunyan';
import http from 'http';
import EscapeRegExp from 'lodash.escaperegexp';
import { SMTPServer } from 'smtp-server';
import Stream from 'stream';
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
    const regex = new RegExp(EscapeRegExp(this.config.space_replace || '+'), 'g');
    const log = this.log;
    const logStream = new Stream.Writable({
      write: (chunk: string, encoding: BufferEncoding, callback): void => {
        const data = JSON.parse(chunk);
        this.log.debug('[SMTP Server] ' + data.msg);
        callback();
      }
    });
    const bunyanLog = Bunyan.createLogger({
      name: 'smtp',
      streams: [{
        stream: logStream
      }]
    });
    const server = new SMTPServer({authOptional: true,
      disabledCommands: ['STARTTLS'],
      logger: bunyanLog,
      onAuth(auth, session, callback): void {
        callback(null, { user: true });
      },
      onData(stream, session, callback): void {
        stream.on('data', () => {}); // eslint-disable-line @typescript-eslint/no-empty-function
        stream.on('end', callback);
        session.envelope.rcptTo.forEach((rcptTo) => {
          const name = rcptTo.address.split('@')[0].replace(regex, ' ');
          log('[' + name + '] Email received.');
          try {
            http.get('http://127.0.0.1:' + httpPort + '/motion?' + name);
          } catch (ex) {
            log.error('[' + name + '] Error making HTTP call: ' + ex);
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
