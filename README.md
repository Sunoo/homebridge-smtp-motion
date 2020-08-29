# homebridge-smtp-motion

[![npm](https://img.shields.io/npm/v/homebridge-smtp-motion) ![npm](https://img.shields.io/npm/dt/homebridge-smtp-motion)](https://www.npmjs.com/package/homebridge-smtp-motion) [![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)

This plugin converts SMTP messages into HTTP motion alerts [homebridge-camera-ffmpeg](https://github.com/homebridge-plugins/homebridge-camera-ffmpeg) understands.

Note that this plugin itself does not expose any devices to HomeKit.

This is in an extremely early state, and currently only triggers alerts after uploading an image into the folder with the same name as your camera. The image is not currently stored anywhere.

## Installation

1. Install Homebridge using the [official instructions](https://github.com/homebridge/homebridge/wiki).
2. Install homebridge-camera-ffmpeg using `sudo npm install -g homebridge-camera-ffmpeg --unsafe-perm`.
3. Install this plugin using `sudo npm install -g homebridge-smtp-motion`.
4. Update your configuration file. See configuration sample below.

### Configuration

Edit your `config.json` accordingly. Configuration sample:

 ```json
"platforms": [
    {
        "platform": "smtpMotion",
        "smtp_port": "2525",
        "http_port": 8080
    }
]
```

- platform: _(Required)_ Must always be `smtpMotion`.
- smtp_port: The port to run the SMTP server on. (Default: `5000`)
- http_port: The HTTP port used by homebridge-camera-ffmpeg. (Default: `8080`)
- space_replace: The character to replace a space with in the camera name portion of the email address. (Default: `+`)

### Camera Configuration

To use this plugin, you'll need to configure the SMTP settings on your camera as listed below. Your camera may use slightly different terms for some of these options.

- `Server Address`: The host name or IP address of the computer running Homebridge
- `Port`: The value you used for `smtp_port` in the plugin configuration.
- `Username` and `Password`: Any value can currently be used, as authentication is not currently supported in this plugin. That will likely be added in future versions.
- `From Address`: Any value can be used, this is not checked.
- `To Address`: This needs to be your camera's name, exactly as configured in homebridge-camera-ffmpeg but with + instead of space, followed by an @ and any domain you want. Example: `Camera+Name@example.com`
