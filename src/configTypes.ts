import { PlatformIdentifier, PlatformName } from 'homebridge';

export type SmtpMotionPlatformConfig = {
  platform: PlatformName | PlatformIdentifier;
  name?: string;
  smtp_port?: number;
  override_http?: number;
  space_replace?: string;
  log_emails?: boolean;
};