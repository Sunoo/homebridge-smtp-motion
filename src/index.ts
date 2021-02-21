import {
  API,
  APIEvent,
  DynamicPlatformPlugin,
  HomebridgeConfig,
  Logging,
  PlatformAccessory,
  PlatformConfig
} from 'homebridge';
import Bunyan from 'bunyan';
import { readFileSync } from 'fs';
import http from 'http';
import { FfmpegPlatformConfig } from 'homebridge-camera-ffmpeg/dist/configTypes';
import EscapeRegExp from 'lodash.escaperegexp';
import { Logger } from './logger';
import { SMTPServer } from 'smtp-server';
import Stream from 'stream';
import { SmtpMotionPlatformConfig } from './configTypes';

const PLUGIN_NAME = 'homebridge-smtp-motion';
const PLATFORM_NAME = 'smtpMotion';

class SmtpMotionPlatform implements DynamicPlatformPlugin {
  private readonly log: Logger;
  private readonly api: API;
  private readonly config: SmtpMotionPlatformConfig;
  private readonly porthttp?: number;

  constructor(log: Logging, config: PlatformConfig, api: API) {
    this.log = new Logger(log);
    this.api = api;
    this.config = config as SmtpMotionPlatformConfig;

    if (!this.config.override_http) {
      const fullConfig = JSON.parse(readFileSync(this.api.user.configPath(), 'utf8')) as HomebridgeConfig;
      const ffmpegConfig = fullConfig.platforms.find((config: { platform: string }) => config.platform === 'Camera-ffmpeg') as FfmpegPlatformConfig;
      if (!ffmpegConfig) {
        this.log.error('The homebridge-camera-ffmpeg plugin must be installed and configured.');
        return;
      } else {
        this.porthttp = ffmpegConfig?.porthttp;
        if (!this.porthttp) {
          this.log.error('You must have "porthttp" configured in the homebridge-camera-ffmpeg plugin.');
          return;
        }
      }
    } else {
      this.porthttp = this.config.override_http;
    }

    api.on(APIEvent.DID_FINISH_LAUNCHING, this.startSmtp.bind(this));
  }

  configureAccessory(accessory: PlatformAccessory): void { // eslint-disable-line @typescript-eslint/no-unused-vars
    return;
  }

  startSmtp(): void {
    const smtpPort = this.config.smtp_port || 2525;
    const httpPort = this.porthttp;
    const regex = new RegExp(EscapeRegExp(this.config.space_replace || '+'), 'g');
    const logEmails = this.config.log_emails;
    const log = this.log;
    const bunyan = Bunyan.createLogger({
      name: 'smtp',
      streams: [{
        stream: new Stream.Writable({
          write: (chunk: string, _encoding: BufferEncoding, callback): void => {
            const data = JSON.parse(chunk);
            this.log.debug(data.msg, 'SMTP Server');
            callback();
          }
        })
      }]
    });
    const server = new SMTPServer({authOptional: true,
      disabledCommands: ['STARTTLS'],
      logger: bunyan,
      onAuth(_auth, _session, callback): void {
        callback(null, { user: true });
      },
      onData(stream, session, callback): void {
        stream.on('data', () => {}); // eslint-disable-line @typescript-eslint/no-empty-function
        stream.on('end', callback);
        session.envelope.rcptTo.forEach((rcptTo) => {
          const name = rcptTo.address.split('@')[0].replace(regex, ' ');
          log.debug('Email received.', name, logEmails);
          try {
            http.get('http://127.0.0.1:' + httpPort + '/motion?' + name);
          } catch (ex) {
            log.error('Error making HTTP call: ' + ex, name);
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
