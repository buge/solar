import {Position} from './solar';
import {degrees} from 'ts-units/angle';
import {expect} from 'chai';
import {kilometers} from 'ts-units/length';

const BERN = {lat: degrees(46.94806), lon: degrees(7.45264)};

const EPSILON_ANGLE = 0.05;
const EPSILON_KM = 2000;

describe('Position', () => {
  const tests = [
    {
      obs: BERN,
      date: UTCDate(2020, 9, 2, 2, 31),
      distance: 150936130,
      declination: 7.783,
      rightAscension: 161.62,
      altitude: -22.18,
      azimuth: 49.48,
    },
    {
      obs: BERN,
      date: UTCDate(2021, 3, 29, 13, 21),
      distance: 149372698,
      declination: 3.6,
      rightAscension: 8.33,
      altitude: 40.97,
      azimuth: 216.18,
    },
  ];

  for (const test of tests) {
    describe(`lat = ${test.obs.lat}, lon = ${
      test.obs.lon
    }, date = ${test.date.toString()}`, () => {
      const pos = new Position(test.date, test.obs.lat, test.obs.lon);

      it('returns the correct distance', () => {
        expect(pos.distance.in(kilometers).amount).closeTo(
          test.distance,
          EPSILON_KM
        );
      });

      it('returns the correct rightAscension', () => {
        expect(pos.rightAscension.in(degrees).amount).closeTo(
          test.rightAscension,
          EPSILON_ANGLE
        );
      });

      it('returns the correct declination', () => {
        expect(pos.declination.in(degrees).amount).closeTo(
          test.declination,
          EPSILON_ANGLE
        );
      });

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

/**
 * Returns a JavaScript Date object representing the given UTC date and time.
 * Note that month [1, 12] as any sane person would describe it.
 */
function UTCDate(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
) {
  return new Date(Date.UTC(year, month - 1, day, hour, minute));
}
