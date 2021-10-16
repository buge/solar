import {DateTime} from 'luxon';
import {calculate} from './index';
import {degrees} from '@buge/ts-units/angle';
import {expect} from 'chai';

const BERN = {lat: degrees(46.94806), lon: degrees(7.45264)};

const EPSILON_ANGLE = 0.01;

describe('Position', () => {
  const tests = [
    {
      obs: BERN,
      date: DateTime.utc(2020, 9, 2, 2, 31).toJSDate(),
      altitude: -22.18,
      azimuth: 49.48,
    },
    {
      obs: BERN,
      date: DateTime.utc(2021, 3, 29, 13, 21).toJSDate(),
      altitude: 40.97,
      azimuth: 216.18,
    },
  ];

  for (const test of tests) {
    describe(`lat = ${test.obs.lat}, lon = ${
      test.obs.lon
    }, date = ${test.date.toString()}`, () => {
      const pos = calculate(test.date, test.obs.lat, test.obs.lon);

      it('returns the correct altitude', () => {
        expect(pos.altitude.in(degrees).amount).closeTo(
          test.altitude,
          EPSILON_ANGLE
        );
      });

      it('returns the correct azimuth', () => {
        expect(pos.azimuth.in(degrees).amount).to.be.closeTo(
          test.azimuth,
          EPSILON_ANGLE
        );
      });
    });
  }
});
