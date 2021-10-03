import {expect} from 'chai';
import {meters} from '@buge/ts-units/length';
import {pascals} from '@buge/ts-units/pressure';
import {pressureAt} from './pressure';

describe('pressure', () => {
  const tests = [
    {meters: -500, pascals: 107514.01},
    {meters: 0, pascals: 101325.0},
    {meters: 500, pascals: 95492.26},
    {meters: 1000, pascals: 89995.28},
  ];

  for (const test of tests) {
    it(`pressureAt(${test.meters} m) == ${test.pascals} pa`, () => {
      const pressure = pressureAt(meters(test.meters)).in(pascals);
      expect(pressure.amount).to.be.closeTo(test.pascals, 1e-2);
    });
  }
});
