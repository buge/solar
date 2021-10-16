# Solar Positioning

TypeScript library that computes the position of the sun as seen by a local
observer on earth.

It uses a custom implementation of the Sun Position Algorithm (SPA) for Solar
Radiation Applications by the National Renewable Energy Laboratory (NREL) as
described in https://midcdmz.nrel.gov/spa/.

To install:

```sh
npm install @buge/solar
```

Example usage:

```ts
import {calculate} from '@buge/solar';
import {degrees} from '@buge/ts-units/angle';
import {meters} from '@buge/ts-units/length';

const pos = calculate(
  new Date(Date.UTC(2020, 8, 2, 2, 31)),
  degrees(46.94806), // latitude
  degrees(7.45264), // longitude
  meters(540) // altitude above sea level
);
```

The altitude argument is optional as are the pressure and temperature
argumentes not shown in the example above. The latter two are used to compute
the atmospheric refraction at low solar altitudes. If the observer altitude is
not specified, sea level is assumed. If the temperature is not specified, 21ºC
is assumed. If the pressure is not specified, it is estimated from the observer
altitude.
