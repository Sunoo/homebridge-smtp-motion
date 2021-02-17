import { PlatformIdentifier, PlatformName } from 'homebridge';

export type SmtpMotionPlatformConfig = {
  platform: PlatformName | PlatformIdentifier;
  name?: string;
  smtp_port?: number;
  space_replace?: string;
  log_emails?: boolean;
};