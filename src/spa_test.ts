import {Params, Result, calculate, julianDate} from './spa';
import {DateTime} from 'luxon';
import {expect} from 'chai';

describe('spa', () => {
  describe('julianDay', () => {
    const tests = [
      {date: DateTime.utc(2000, 1, 1, 12), JD: 2451545.0},
      {date: DateTime.utc(1999, 1, 1, 0), JD: 2451179.5},
      {date: DateTime.utc(1987, 1, 27, 0), JD: 2446822.5},
      {date: DateTime.utc(1987, 6, 19, 12), JD: 2446966.0},
      {date: DateTime.utc(1988, 1, 27, 0), JD: 2447187.5},
      {date: DateTime.utc(1988, 6, 19, 12), JD: 2447332.0},
      {date: DateTime.utc(1900, 1, 1, 0), JD: 2415020.5},
      {date: DateTime.utc(1600, 1, 1, 0), JD: 2305447.5},
      {date: DateTime.utc(1600, 12, 31, 0), JD: 2305812.5},
    ];

    for (const test of tests) {
      it(test.date.toISO(), () => {
        expect(julianDate(test.date.toJSDate())).to.be.closeTo(test.JD, 1e-6);
      });
    }
  });

  describe('example', () => {
    const params: Params = {
      date: DateTime.fromISO('2003-10-17T12:30:30-07:00').toJSDate(),
      ΔT: 67,
      ΔUT1: 0,
      σ: -105.1786,
      φ: 39.742476,
      E: 1830.14,
      P: 820,
      T: 11,
    };

    const want: Result = {
      JD: 2452930.312847,
      L: 24.0182616917,
      B: -0.0001011219,
      R: 0.9965422974,
      Θ: 204.0182616917,
      β: 0.0001011219,
      Δψ: -0.0039984,
      Δε: 0.00166657,
      ε: 23.440465,
      λ: 204.0085519281,
      α: 202.227408,
      δ: -9.31434,
      H: 11.105902,
      αʹ: 202.22704,
      δʹ: -9.316179,
      Hʹ: 11.10627, // 11.10629
      θ: 50.111622,
      Φ: 194.34024,
      // I: 25.18700,
      // M: 205.8971722516,
      // E: 14.641503,
      // transit: Date.UTC(2003, 11, 17, 18, 46, 4, 970),
      // sunrise: Date.UTC(2003, 11, 17, 13, 12, 43, 460),
      // sunset: Date.UTC(2003, 11, 18, 0, 20, 19, 190),
    };

    const got = calculate(params);

    for (const key of Object.keys(want) as (keyof Result)[]) {
      it(key, () => {
        expect(got[key]).to.be.closeTo(want[key], 1e-6);
      });
    }
  });
});
