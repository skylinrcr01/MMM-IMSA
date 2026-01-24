# MMM-IMSA

IMSA WeatherTech SportsCar Championship 2026 race calendar module for MagicMirror.

## Install

Place the `MMM-IMSA` folder in your MagicMirror `modules` directory.

## Config

```js
{
  module: "MMM-IMSA",
  position: "top_left",
  config: {
    logoUrl: "modules/MMM-IMSA/imsa-logo.png",
    logoWidth: 90
  }
}
```

## Options

- `header` (string): Title shown above the list.
- `logoUrl` (string): Path or URL for an IMSA logo. When set, it replaces the text header.
- `logoAlt` (string): Alt text for the logo. Default `"IMSA"`.
- `logoWidth` (number): Logo width in pixels. Default `90`.
- `showPast` (bool): Show races that already ended. Default `true`.
- `dateFormat` (string): Moment.js format for dates. Default `"MMM D"`.
- `highlightNext` (bool): Highlight the next race in the list. Default `true`.
- `races` (array): Override the default 2026 race list.
