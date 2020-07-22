const SMTPServer = require("smtp-server").SMTPServer;
const http = require('http');

module.exports = function(homebridge) {
    homebridge.registerPlatform("homebridge-smtp-motion", "smtpMotion", smtpMotion, true);
}

function smtpMotion(log, config, api) {
    this.log = log;
    this.config = config;

    api.on('didFinishLaunching', this.startSmtp.bind(this));
}

smtpMotion.prototype.startSmtp = function() {
    const smtpPort = this.config.smtp_port || 2525;
    const log = this.log;
    const httpPort = this.config.http_port || 8080;
    const server = new SMTPServer({authOptional: true,
        onData(stream, session, callback) {
            stream.on('data', () => {});
            stream.on('end', callback);
            session.envelope.rcptTo.forEach((rcptTo) => {
                const name = rcptTo.address.split('@')[0].replace(/\+/g, ' ');
                log.debug(name + ' Motion Detected!');
                try {
                    http.get('http://127.0.0.1:' + httpPort + '/motion?' + name);
                } catch (ex) {
                    this.log.console.error(name + ': Error making HTTP call: ' + ex);
                }
            });
        }
    });
    server.listen(smtpPort);
}