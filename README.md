# MMM-IMSA

IMSA WeatherTech SportsCar Championship race calendar module for MagicMirror.

## Screenshots
<img width="241" height="228" alt="Screenshot 2026-01-26 at 1 12 34 AM" src="https://github.com/user-attachments/assets/0b9a3199-e57f-43e2-b34d-aac8327d99d9" />


## Install

Place the `MMM-IMSA` folder in your MagicMirror `modules` directory.

## Config

```js
{
  module: "MMM-IMSA",
  position: "top_left",
  config: {
    logoUrl: "modules/MMM-IMSA/imsa-logo.png",
    logoWidth: 130
  }
}
```

## Options

- `header` (string): Title shown above the list.
- `logoUrl` (string): Path or URL for an IMSA logo. When set, it replaces the text header.
- `logoAlt` (string): Alt text for the logo. Default `"IMSA"`.
- `logoWidth` (number): Logo width in pixels. Default `130`.
- `logoGrayscale` (bool): Render the logo in grayscale. Default `true`. The logo switches to full color during a current race.
- `showPast` (bool): Show races that already ended. Default `false`.
- `dateFormat` (string): Moment.js format for dates. Default `"MMM D"`.
- `highlightNext` (bool): Highlight the next race in the list. Default `true`.
- `maxRaces` (number): Limit the list to this many races. Default `3`.
- `races` (array): Override the default 2026 race list.
- `useEventInfo` (bool): Fetch the current season from the IMSA event information page. Default `true`.
- `eventInfoYear` (number): Override the season year used for the event info URL. Default uses the current year.
- `eventInfoUrl` (string): Override the event info URL directly (useful if IMSA changes the slug). Default `""`.

## Event Info Mode

By default, the module now fetches the event information page and parses the current season. If the fetch fails,
the module falls back to the static `races` list. To opt out, set `useEventInfo: false`.
