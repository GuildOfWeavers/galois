import { expect } from 'chai';
import { PrimeField } from '../lib/PrimeField';
import { JsVector } from '../lib/structures';

let F: PrimeField;

(BigInt.prototype as any).toJSON = function () {
    return String(this) + 'n';
};

const strVector = (v: bigint[]): string => JSON.stringify(v).replace(/"/g, '');
const strMatrix = (m: bigint[][]): string => JSON.stringify(m).replace(/"/g, '');

describe('PrimeField;', () => {
    describe('Basic arithmetic;', () => {
        describe('add();', () => {
            [
                {
                    modulus: 3n,
                    tests: [
                        [1n, 1n, 2n], [2n, 2n, 1n], [5n, 5n, 1n],
                        [5n, 6n, 2n], [3n, 0n, 0n], [9n, 9n, 0n]
                    ]
                },
                {
                    modulus: 11n,
                    tests: [
                        [1n,  1n,  2n],  [2n,  2n, 4n], [5n,  4n, 9n],
                        [5n,  5n,  10n], [5n,  6n, 0n], [10n, 0n, 10n],
                        [11n, 11n, 0n],  [10n, 1n, 0n]
                    ]
                },
                {
                    modulus: 101n,
                    tests: [
                        [1n,   1n,   2n],  [2n,   2n,   4n],   [5n,  5n,  10n],
                        [50n,  23n,  73n], [50n,  50n,  100n], [50n, 60n, 9n],
                        [100n, 100n, 99n]
                    ]
                }
            ].forEach(({modulus, tests}) => {
                describe(`modulus ${modulus}n;`, () => {
                    beforeEach(() => {
                        F = new PrimeField(modulus);
                    });

                    tests.forEach(([a, b, result]) => {
                        it(`${a}n + ${b}n should return ${result}n`, () => {
                            expect(F.add(a, b)).to.equal(result);
                        });
                    });
                });
            });
        });

        describe('sub();', () => {
            [
                {
                    modulus: 3n,
                    tests: [
                        [1n, 1n, 0n], [2n, 1n, 1n], [5n, 1n, 1n],
                        [5n, 6n, 2n], [3n, 0n, 0n], [9n, 0n, 0n],
                        [0n, 1n, 2n], [0n, 2n, 1n], [1n, 2n, 2n]
                    ]
                },
                {
                    modulus: 11n,
                    tests: [
                        [1n,  1n,  0n], [5n, 2n, 3n],  [5n,  4n, 1n],
                        [5n,  5n,  0n], [5n, 6n, 10n], [10n, 0n, 10n],
                        [10n, 10n, 0n]
                    ]
                },
                {
                    modulus: 101n,
                    tests: [
                        [1n,   1n,   0n], [5n,  2n,  3n],  [5n,   4n, 1n],
                        [5n,   5n,   0n], [50n, 60n, 91n], [100n, 0n, 100n],
                        [100n, 100n, 0n]
                    ]
                }
            ].forEach(({modulus, tests}) => {
                describe(`modulus ${modulus}n;`, () => {
                    beforeEach(() => {
                        F = new PrimeField(modulus);
                    });

                    tests.forEach(([a, b, result]) => {
                        it(`${a}n - ${b}n should return ${result}n`, () => {
                            expect(F.sub(a, b)).to.equal(result);
                        });
                    });
                });
            });
        });

        describe('mul();', () => {
            [
                {
                    modulus: 11n,
                    tests: [
                        [1n,  1n,  1n], [2n, 2n, 4n], [5n,  4n, 9n],
                        [5n,  5n,  3n], [5n, 6n, 8n], [10n, 0n, 0n],
                        [10n, 10n, 1n]
                    ]
                },
                {
                    modulus: 101n,
                    tests: [
                        [1n,  1n,  1n],   [2n,  2n,  4n],  [5n,  4n, 20n],
                        [5n,  5n,  25n],  [5n,  6n,  30n], [10n, 0n, 0n],
                        [10n, 10n, 100n], [20n, 50n, 91n]
                    ]
                }
            ].forEach(({modulus, tests}) => {
                describe(`modulus ${modulus}n;`, () => {
                    beforeEach(() => {
                        F = new PrimeField(modulus);
                    });

                    tests.forEach(([a, b, result]) => {
                        it(`${a}n * ${b}n should return ${result}n`, () => {
                            expect(F.mul(a, b)).to.equal(result);
                        });
                    });
                });
            });
        });

        describe('div();', () => {
            [
                {
                    modulus: 11n,
                    tests: [
                        [1n, 1n, 1n], [2n, 1n, 2n], [6n, 1n, 6n], [10n, 1n, 10n], [11n, 1n, 0n],                          // * 1n
                        [1n, 2n, 6n], [2n, 2n, 1n], [3n, 2n, 7n], [4n, 2n, 2n],                                           // * 6n
                        [1n, 3n, 4n], [2n, 3n, 8n], [3n, 3n, 1n], [4n, 3n, 5n], [5n, 3n, 9n], [6n, 3n, 2n], [7n, 3n, 6n], // * 4n
                        [4n, 6n, 8n], [5n, 6n, 10n],                                                                      // * 2n
                        [1n, 100n, 1n], [2n, 100n, 2n], [7n, 100n, 7n], [100n, 100n, 1n]                                  // * 1n
                    ]
                },
                {
                    modulus: 101n,
                    tests: [
                        [1n, 1n, 1n],   [5n, 1n, 5n],   [100n, 1n, 100n], [101n, 1n, 0n],                  // * 1n
                        [1n, 2n, 51n],  [2n, 2n, 1n],   [3n, 2n, 52n],    [5n, 2n, 53n],                   // * 51n
                        [1n, 4n, 76n],  [2n, 4n, 51n],  [3n, 4n, 26n],    [4n, 4n, 1n],  [20n, 4n, 5n],    // * 76n
                        [1n, 5n, 81n],  [2n, 5n, 61n],  [20n, 5n, 4n],    [25n, 5n, 5n], [30n, 5n, 6n],    // * 81n
                        [1n, 6n, 17n],  [2n, 6n, 34n],  [3n, 6n, 51n],    [30n, 6n, 5n], [36n, 6n, 6n],    // * 17n
                        [1n, 10n, 91n], [2n, 10n, 81n], [5n, 10n, 51n],   [10n, 10n, 1n],                  // * 91n
                        [1n, 20n, 96n], [2n, 20n, 91n], [7n, 20n, 66n],   [60n, 20n, 3n], [120n, 20n, 6n], // * 96n
                        [1n, 30n, 64n], [3n, 30n, 91n], [29n, 30n, 38n],  [90n, 30n, 3n]                   // * 64n
                    ]
                }
            ].forEach(({modulus, tests}) => {
                describe(`modulus ${modulus}n;`, () => {
                    beforeEach(() => {
                        F = new PrimeField(modulus);
                    });

                    tests.forEach(([a, b, result]) => {
                        it(`${a}n / ${b}n should return ${result}n`, () => {
                            expect(F.div(a, b)).to.equal(result);
                        });
                    });
                });
            });
        });

        describe('exp();', () => {
            describe('positive exponent;', () => {
                [
                    {
                        modulus: 11n,
                        tests: [
                            [1n,  0n,  1n], [2n,  0n,  1n], [5n,  0n,  1n], [10n,  0n,  1n],
                            [0n,  1n,  0n], [0n,  2n,  0n], [0n,  5n,  0n], [0n,  10n,  0n],
                            [1n,  1n,  1n],
                            [2n,  1n,  2n], [2n, 2n, 4n], [2n, 3n, 8n], [2n,  4n,  5n],
                            [3n,  1n,  3n], [3n, 2n, 9n], [3n, 3n, 5n],
                            [6n,  1n,  6n], [6n, 2n, 3n],
                            [10n, 1n, 10n]
                        ]
                    },
                    {
                        modulus: 101n,
                        tests: [
                            [1n,  0n,  1n], [2n,  0n,  1n], [5n,  0n,  1n], [10n,  0n,  1n],
                            [0n,  1n,  0n], [0n,  2n,  0n], [0n,  5n,  0n], [0n,  10n,  0n],
                            [1n, 1n, 1n],   [2n,  2n, 4n], [3n, 3n, 27n], [4n, 4n, 54n],
                            [6n, 2n, 36n],  [10n, 2n, 100n]
                        ]
                    }
                ].forEach(({modulus, tests}) => {
                    describe(`modulus ${modulus}n;`, () => {
                        beforeEach(() => {
                            F = new PrimeField(modulus);
                        });

                        tests.forEach(([a, b, result]) => {
                            it(`${a}n ** ${b}n should return ${result}n`, () => {
                                expect(F.exp(a, b)).to.equal(result);
                            });
                        });
                    });
                });
            });

            describe('negative exponent;', () => {
                [
                    {
                        modulus: 11n,
                        tests: [
                            [1n,  -1n,  1n],
                            [2n,  -1n,  6n], // 6 ** 1
                            [2n,  -2n,  3n], // 6 ** 2
                            [2n,  -3n,  7n], // 6 ** 3
                            [3n,  -1n,  4n], // 4 ** 1
                            [3n,  -2n,  5n], // 4 ** 2
                            [3n,  -3n,  9n], // 4 ** 3
                            [6n,  -1n,  2n], // 2 ** 1
                            [6n,  -2n,  4n], // 2 ** 2
                            [10n, -1n, 10n]  // 10 ** 1
                        ]
                    },
                    {
                        modulus: 101n,
                        tests: [
                            [1n,  -1n, 1n],  // 1 ** 1
                            [2n,  -2n, 76n], // 51 ** 2
                            [3n,  -3n, 15n], // 34 ** 3
                            [4n,  -4n, 58n], // 76 ** 4
                            [6n,  -2n, 87n], // 17 ** 2
                            [10n, -2n, 100n] // 91 ** 2
                        ]
                    }
                ].forEach(({modulus, tests}) => {
                    describe(`modulus ${modulus}n;`, () => {
                        beforeEach(() => {
                            F = new PrimeField(modulus);
                        });

                        tests.forEach(([a, b, result]) => {
                            it(`${a}n ** ${b}n should return ${result}n`, () => {
                                expect(F.exp(a, b)).to.equal(result);
                            });
                        });
                    });
                });
            });
        });

        describe('inv();', () => {
            [
                {
                    modulus: 11n,
                    tests: [1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n, 10n, 21n]
                },
                {
                    modulus: 101n,
                    tests: [5n, 20n, 50n, 99n, 100n, 150n]
                }
            ].forEach(({modulus, tests}) => {
                describe(`modulus ${modulus}n;`, () => {
                    beforeEach(() => {
                        F = new PrimeField(modulus);
                    });

                    tests.forEach(num => {
                        it(`should calculate correctly modular inverse for ${num}n`, () => {
                            const inverse = F.inv(num);

                            expect(F.mul(num, inverse)).to.equal(1n);
                        });
                    });
                });
            });
        });
    });

    describe('Vector operations;', () => {
        describe('addVectorElements();', () => {
            const vTests = [
                { v1: [1n],                 v2: [2n],                 vr: [3n] },
                { v1: [1n, 0n, 5n],         v2: [2n, 5n, 25n],        vr: [3n, 5n, 30n] },
                { v1: [0n, 4n, 3n, 0n],     v2: [1n, 0n, 1n, 5n],     vr: [1n, 4n, 4n, 5n] },
                { v1: [0n, 0n, 1n, 0n, 0n], v2: [1n, 0n, 1n, 7n, 8n], vr: [1n, 0n, 2n, 7n, 8n] }
            ];

            const nTests = [
                { v1: [1n],                 n: 2n, vr: [3n] },
                { v1: [1n, 0n, 5n],         n: 3n, vr: [4n, 3n, 8n] },
                { v1: [0n, 4n, 3n, 0n],     n: 5n, vr: [5n, 9n, 8n, 5n] },
                { v1: [0n, 0n, 1n, 0n, 0n], n: 0n, vr: [0n, 0n, 1n, 0n, 0n] }
            ];

            [3n, 11n, 101n].forEach(modulus => {
                describe(`modulus ${modulus}n;`, () => {
                    beforeEach(() => {
                        F = new PrimeField(modulus);
                    });

                    vTests.forEach(({v1, v2, vr}) => {
                        it(`should correctly add vectors ${strVector(v1)} and ${strVector(v2)}`, () => {
                            let fv1 = F.newVectorFrom(v1);
                            let fv2 = F.newVectorFrom(v2);
                            expect(F.addVectorElements(fv1, fv2).values).to.deep.equal(vr.map(n => F.mod(n)));
                        });
                    });

                    nTests.forEach(({v1, n, vr}) => {
                        it(`should correctly add vector ${strVector(v1)} and number ${n}`, () => {
                            let fv1 = F.newVectorFrom(v1);
                            expect(F.addVectorElements(fv1, n).values).to.deep.equal(vr.map(n => F.mod(n)));
                        });
                    });
                });
            });
        });

        describe('subVectorElements();', () => {
            const vTests = [
                { v1: [1n],                 v2: [2n],                 vr: [-1n] },
                { v1: [1n, 0n, 5n],         v2: [2n, 5n, 25n],        vr: [-1n, -5n, -20n] },
                { v1: [0n, 4n, 3n, 0n],     v2: [1n, 0n, 1n, 5n],     vr: [-1n, 4n, 2n, -5n] },
                { v1: [0n, 0n, 1n, 0n, 0n], v2: [1n, 0n, 1n, 7n, 8n], vr: [-1n, 0n, 0n, -7n, -8n] }
            ];

            const nTests = [
                { v1: [1n],                 n: 2n, vr: [-1n] },
                { v1: [1n, 0n, 5n],         n: 3n, vr: [-2n, -3n, 2n] },
                { v1: [0n, 4n, 3n, 0n],     n: 5n, vr: [-5n, -1n, -2n, -5n] },
                { v1: [0n, 0n, 1n, 0n, 0n], n: 0n, vr: [0n, 0n, 1n, 0n, 0n] }
            ];

            [3n, 11n, 101n].forEach(modulus => {
                describe(`modulus ${modulus}n;`, () => {
                    beforeEach(() => {
                        F = new PrimeField(modulus);
                    });

                    vTests.forEach(({v1, v2, vr}) => {
                        it(`should correctly subtract vectors ${strVector(v1)} and ${strVector(v2)}`, () => {
                            let fv1 = F.newVectorFrom(v1);
                            let fv2 = F.newVectorFrom(v2);
                            expect(F.subVectorElements(fv1, fv2).values).to.deep.equal(vr.map(n => F.mod(n)));
                        });
                    });

                    nTests.forEach(({v1, n, vr}) => {
                        it(`should correctly subtract number ${n} from vector ${strVector(v1)}`, () => {
                            let fv1 = F.newVectorFrom(v1);
                            expect(F.subVectorElements(fv1, n).values).to.deep.equal(vr.map(n => F.mod(n)));
                        });
                    });
                });
            });
        });

        describe('mulVectorElements();', () => {
            const vTests = [
                { v1: [1n],                 v2: [2n],                 vr: [2n] },
                { v1: [1n, 0n, 5n],         v2: [2n, 5n, 25n],        vr: [2n, 0n, 125n] },
                { v1: [0n, 4n, 3n, 0n],     v2: [1n, 0n, 1n, 5n],     vr: [0n, 0n, 3n, 0n] },
                { v1: [0n, 0n, 1n, 0n, 0n], v2: [1n, 0n, 1n, 7n, 8n], vr: [0n, 0n, 1n, 0n, 0n] }
            ];

            const nTests = [
                { v1: [1n],                 n: 2n, vr: [2n] },
                { v1: [1n, 0n, 5n],         n: 3n, vr: [3n, 0n, 15n] },
                { v1: [0n, 4n, 3n, 0n],     n: 5n, vr: [0n, 20n, 15n, 0n] },
                { v1: [0n, 0n, 1n, 0n, 0n], n: 0n, vr: [0n, 0n, 0n, 0n, 0n] }
            ];

            [3n, 11n, 101n].forEach(modulus => {
                describe(`modulus ${modulus}n;`, () => {
                    beforeEach(() => {
                        F = new PrimeField(modulus);
                    });

                    vTests.forEach(({v1, v2, vr}) => {
                        it(`should correctly multiply vectors ${strVector(v1)} and ${strVector(v2)}`, () => {
                            let fv1 = F.newVectorFrom(v1);
                            let fv2 = F.newVectorFrom(v2);
                            expect(F.mulVectorElements(fv1, fv2).values).to.deep.equal(vr.map(n => F.mod(n)));
                        });
                    });

                    nTests.forEach(({v1, n, vr}) => {
                        it(`should correctly multiply vector ${strVector(v1)} and number ${n}`, () => {
                            let fv1 = F.newVectorFrom(v1);
                            expect(F.mulVectorElements(fv1, n).values).to.deep.equal(vr.map(n => F.mod(n)));
                        });
                    });
                });
            });
        });

        describe('divVectorElements();', () => {
            const vTests = [
                {
                    v1: [1n],
                    v2: [2n],
                    vr: {
                        3  : [2n], // * [2n]
                        11 : [6n], // * [6n]
                        101: [51n] // * [51n]
                    }
                },
                {
                    v1: [1n, 0n, 5n],
                    v2: [2n, 5n, 25n],
                    vr: {
                        3  : [2n, 0n, 5n],   // * [2n, 2n, 1n]
                        11 : [6n, 0n, 20n],  // * [6n, 9n, 4n]
                        101: [51n, 0n, 485n] // * [51n, 81n, 97n]
                    }
                },
                {
                    v1: [0n, 4n, 3n, 0n],
                    v2: [1n, 0n, 1n, 5n],
                    vr: {
                        3  : [0n, 0n, 3n, 0n], // * [1n, 0n, 1n, 2n]
                        11 : [0n, 0n, 3n, 0n], // * [1n, 0n, 1n, 9n]
                        101: [0n, 0n, 3n, 0n]  // * [1n, 0n, 1n, 81n]
                    }
                },
                {
                    v1: [0n, 0n, 1n, 0n, 0n],
                    v2: [1n, 0n, 1n, 7n, 8n],
                    vr: {
                        3  : [0n, 0n, 1n, 0n, 0n], // * [1n, 0n, 1n, 1n, 2n]
                        11 : [0n, 0n, 1n, 0n, 0n], // * [1n, 0n, 1n, 8n, 7n]
                        101: [0n, 0n, 1n, 0n, 0n]  // * [1n, 0n, 1n, 29n, 38n]
                    }
                }
            ];
            const nTests = [
                {
                    v1: [1n],
                    n: 2n,
                    vr: {
                        3  : [2n], // * 2n
                        11 : [6n], // * 6n
                        101: [51n] // * 51n
                    }
                },
                {
                    v1: [1n, 0n, 5n],
                    n : 3n,
                    vr: {
                        3  : [0n, 0n, 0n],   // * 0n
                        11 : [4n, 0n, 20n],  // * 4n
                        101: [34n, 0n, 170n] // * 34n
                    },
                },
                {
                    v1: [0n, 4n, 3n, 0n],
                    n: 5n,
                    vr: {
                        3  : [0n, 8n, 6n, 0n],    // * 2n
                        11 : [0n, 36n, 27n, 0n],  // * 9n
                        101: [0n, 324n, 243n, 0n] // * 81n
                    }
                },
                {
                    v1: [0n, 0n, 1n, 0n, 0n],
                    n: 0n,
                    vr: {
                        3  : [0n, 0n, 0n, 0n, 0n], // * 0n
                        11 : [0n, 0n, 0n, 0n, 0n], // * 0n
                        101: [0n, 0n, 0n, 0n, 0n]  // * 0n
                    }
                }
            ];

            [3n, 11n, 101n].forEach(modulus => {
                const resultKey = String(modulus);

                describe(`modulus ${modulus}n;`, () => {
                    beforeEach(() => {
                        F = new PrimeField(modulus);
                    });

                    vTests.forEach(({v1, v2, vr}) => {
                        it(`should correctly divide vectors ${strVector(v1)} and ${strVector(v2)}`, () => {
                            let fv1 = F.newVectorFrom(v1);
                            let fv2 = F.newVectorFrom(v2);
                            expect(F.divVectorElements(fv1, fv2).values).to.deep.equal((vr as any)[resultKey].map((n: any) => F.mod(n)));
                        });
                    });

                    nTests.forEach(({v1, n, vr}) => {
                        it(`should correctly divide vector ${strVector(v1)} by number ${n}`, () => {
                            let fv1 = F.newVectorFrom(v1);
                            expect(F.divVectorElements(fv1, n).values).to.deep.equal((vr as any)[resultKey].map((n: any) => F.mod(n)));
                        });
                    });
                });
            });
        });

        describe('expVectorElements();', () => {
            const vTests = [
                { v1: [1n],                 v2: [2n],                 vr: [1n] },
                { v1: [1n, 0n, 5n],         v2: [2n, 5n, 3n],         vr: [1n, 0n, 125n] },
                { v1: [0n, 4n, 3n, 0n],     v2: [1n, 0n, 1n, 5n],     vr: [0n, 1n, 3n, 0n] },
                { v1: [0n, 1n, 1n, 0n, 0n], v2: [1n, 0n, 1n, 7n, 8n], vr: [0n, 1n, 1n, 0n, 0n] }
            ];
            const nTests = [
                { v1: [1n],                 n: 2n, vr: [1n] },
                { v1: [1n, 0n, 5n],         n: 3n, vr: [1n, 0n, 125n] },
                { v1: [0n, 4n, 3n, 0n],     n: 5n, vr: [0n, 1024n, 243n, 0n] },
                { v1: [0n, 0n, 2n, 0n, 0n], n: 3n, vr: [0n, 0n, 8n, 0n, 0n] }
            ];

            [3n, 11n, 101n].forEach(modulus => {
                describe(`modulus ${modulus}n;`, () => {
                    beforeEach(() => {
                        F = new PrimeField(modulus);
                    });

                    vTests.forEach(({v1, v2, vr}) => {
                        it(`should correctly raise vector ${strVector(v1)} to a power ${strVector(v2)}`, () => {
                            let fv1 = F.newVectorFrom(v1);
                            let fv2 = F.newVectorFrom(v2);
                            expect(F.expVectorElements(fv1, fv2).values).to.deep.equal(vr.map(n => F.mod(n)));
                        });
                    });

                    nTests.forEach(({v1, n, vr}) => {
                        it(`should correctly raise vector ${strVector(v1)} to a power ${n}`, () => {
                            let fv1 = F.newVectorFrom(v1);
                            expect(F.expVectorElements(fv1, n).values).to.deep.equal(vr.map(n => F.mod(n)));
                        });
                    });
                });
            });
        });

        describe('combineVectors();', () => {
            const tests = [
                { v1: [1n],                 v2: [2n],                 r: 2n },
                { v1: [1n, 0n, 5n],         v2: [2n, 5n, 3n],         r: 17n },
                { v1: [0n, 4n, 3n, 0n],     v2: [1n, 0n, 1n, 5n],     r: 3n },
                { v1: [0n, 1n, 1n, 0n, 0n], v2: [1n, 0n, 1n, 7n, 8n], r: 1n }
            ];

            [3n, 11n, 101n].forEach(modulus => {
                describe(`modulus ${modulus}n;`, () => {
                    beforeEach(() => {
                        F = new PrimeField(modulus);
                    });

                    tests.forEach(({v1, v2, r}) => {
                        it(`should correctly combine vectors ${strVector(v1)} and ${strVector(v2)}`, () => {
                            let fv1 = F.newVectorFrom(v1);
                            let fv2 = F.newVectorFrom(v2);
                            expect(F.combineVectors(fv1, fv2)).to.equal(F.mod(r));
                        });
                    });
                });
            });
        });
    });

    describe('Matrix operations;', () => {
        const normalize = (F: PrimeField): (m: bigint[][]) => bigint[][] => (m: bigint[][]): bigint[][] => m.map(n1 => n1.map(n2 => F.mod(n2)));
        let normF: (m: bigint[][]) => bigint[][];

        describe('addMatrixElements();', () => {
            const mTests = [
                {
                    m1: [[1n]],
                    m2: [[2n]],
                    mr: [[3n]]
                },
                {
                    m1: [[1n, 2n], [2n, 5n]],
                    m2: [[2n, 5n], [3n, 7n]],
                    mr: [[3n, 7n], [5n, 12n]] },
                {
                    m1: [[1n, 2n, 3n], [3n, 0n, 0n],  [3n, 2n, 1n]],
                    m2: [[5n, 0n, 1n], [7n, 3n, 1n],  [2n, 9n, 0n]],
                    mr: [[6n, 2n, 4n], [10n, 3n, 1n], [5n, 11n, 1n]]
                }
            ];

            const nTests = [
                {
                    m1: [[1n]],
                    n : 2n,
                    mr: [[3n]] },
                {
                    m1: [[1n, 2n], [2n, 5n]],
                    n : 3n,
                    mr: [[4n, 5n], [5n, 8n]]
                },
                {
                    m1: [[1n, 2n, 3n], [3n, 0n, 0n],  [3n, 2n, 1n]],
                    n : 2n,
                    mr: [[3n, 4n, 5n], [5n, 2n, 2n],  [5n, 4n, 3n]]
                }
            ];

            [3n, 11n, 101n].forEach(modulus => {
                describe(`modulus ${modulus}n;`, () => {
                    beforeEach(() => {
                        F = new PrimeField(modulus);
                        normF = normalize(F);
                    });

                    mTests.forEach(({m1, m2, mr}) => {
                        it(`should correctly add matrices ${strMatrix(m1)} and ${strMatrix(m2)}`, () => {
                            let fm1 = F.newMatrixFrom(m1);
                            let fm2 = F.newMatrixFrom(m2);
                            expect(F.addMatrixElements(fm1, fm2).values).to.deep.equal(normF(mr));
                        });
                    });

                    nTests.forEach(({m1, n, mr}) => {
                        it(`should correctly add matrix ${strMatrix(m1)} and number ${n}`, () => {
                            let fm1 = F.newMatrixFrom(m1);
                            expect(F.addMatrixElements(fm1, n).values).to.deep.equal(normF(mr));
                        });
                    });
                });
            });
        });

        describe('subMatrixElements();', () => {
            const mTests = [
                {
                    m1: [[1n]],
                    m2: [[2n]],
                    mr: [[-1n]]
                },
                {
                    m1: [[1n, 2n], [2n, 5n]],
                    m2: [[2n, 5n], [3n, 7n]],
                    mr: [[-1n, -3n], [-1n, -2n]] },
                {
                    m1: [[1n, 2n, 3n],  [3n, 0n, 0n],    [3n, 2n, 1n]],
                    m2: [[5n, 0n, 1n],  [7n, 3n, 1n],    [2n, 9n, 0n]],
                    mr: [[-4n, 2n, 2n], [-4n, -3n, -1n], [1n, -7n, 1n]]
                }
            ];

            const nTests = [
                {
                    m1: [[1n]],
                    n : 2n,
                    mr: [[-1n]] },
                {
                    m1: [[1n, 2n], [2n, 5n]],
                    n : 3n,
                    mr: [[-2n, -1n], [-1n, 2n]]
                },
                {
                    m1: [[1n, 2n, 3n], [3n, 0n, 0n], [3n, 2n, 1n]],
                    n : 2n,
                    mr: [[-1n, 0n, 1n], [1n, -2n, -2n], [1n, 0n, -1n]]
                }
            ];

            [3n, 11n, 101n].forEach(modulus => {
                describe(`modulus ${modulus}n;`, () => {
                    beforeEach(() => {
                        F = new PrimeField(modulus);
                        normF = normalize(F);
                    });

                    mTests.forEach(({m1, m2, mr}) => {
                        it(`should correctly subtract matrices ${strMatrix(m1)} and ${strMatrix(m2)}`, () => {
                            let fm1 = F.newMatrixFrom(m1);
                            let fm2 = F.newMatrixFrom(m2);
                            expect(F.subMatrixElements(fm1, fm2).values).to.deep.equal(normF(mr));
                        });
                    });

                    nTests.forEach(({m1, n, mr}) => {
                        it(`should correctly subtract number ${n} from matrix ${strMatrix(m1)}`, () => {
                            let fm1 = F.newMatrixFrom(m1);
                            expect(F.subMatrixElements(fm1, n).values).to.deep.equal(normF(mr));
                        });
                    });
                });
            });
        });

        describe('mulMatrixElements();', () => {
            const mTests = [
                {
                    m1: [[1n]],
                    m2: [[2n]],
                    mr: [[2n]]
                },
                {
                    m1: [[1n, 2n],  [2n, 5n]],
                    m2: [[2n, 5n],  [3n, 7n]],
                    mr: [[2n, 10n], [6n, 35n]] },
                {
                    m1: [[1n, 2n, 3n], [3n, 0n, 0n],  [3n, 2n, 1n]],
                    m2: [[5n, 0n, 1n], [7n, 3n, 1n],  [2n, 9n, 0n]],
                    mr: [[5n, 0n, 3n], [21n, 0n, 0n], [6n, 18n, 0n]]
                }
            ];

            const nTests = [
                {
                    m1: [[1n]],
                    n : 2n,
                    mr: [[2n]] },
                {
                    m1: [[1n, 2n], [2n, 5n]],
                    n : 3n,
                    mr: [[3n, 6n], [6n, 15n]]
                },
                {
                    m1: [[1n, 2n, 3n], [3n, 0n, 0n],  [3n, 2n, 1n]],
                    n : 2n,
                    mr: [[2n, 4n, 6n], [6n, 0n, 0n],  [6n, 4n, 2n]]
                }
            ];

            [3n, 11n, 101n].forEach(modulus => {
                describe(`modulus ${modulus}n;`, () => {
                    beforeEach(() => {
                        F = new PrimeField(modulus);
                        normF = normalize(F);
                    });

                    mTests.forEach(({m1, m2, mr}) => {
                        it(`should correctly multiply matrices ${strMatrix(m1)} and ${strMatrix(m2)}`, () => {
                            let fm1 = F.newMatrixFrom(m1);
                            let fm2 = F.newMatrixFrom(m2);
                            expect(F.mulMatrixElements(fm1, fm2).values).to.deep.equal(normF(mr));
                        });
                    });

                    nTests.forEach(({m1, n, mr}) => {
                        it(`should correctly multiply matrix ${strMatrix(m1)} and number ${n}`, () => {
                            let fm1 = F.newMatrixFrom(m1);
                            expect(F.mulMatrixElements(fm1, n).values).to.deep.equal(normF(mr));
                        });
                    });
                });
            });
        });

        describe('divMatrixElements();', () => {
            const mTests = [
                {
                    m1: [[1n]],
                    m2: [[2n]],
                    mr: {
                        3  : [[2n]], // * [2n]
                        11 : [[6n]], // * [6n]
                        101: [[51n]] // * [51n]
                    }
                },
                {
                    m1: [[1n, 0n], [5n, 2n]],
                    m2: [[2n, 5n], [25n, 2n]],
                    mr: {
                        3  : [[2n, 0n], [5n, 4n]],     // * [[2n, 2n], [1n, 2n]]
                        11 : [[6n, 0n], [20n, 12n]],   // * [[6n, 9n], [4n, 6n]]
                        101: [[51n, 0n], [485n, 102n]] // * [[51n, 81n], [97n, 51n]]
                    }
                },
                {
                    m1: [[0n, 4n, 3n], [0n, 5n, 2n], [1n, 2n, 4n]],
                    m2: [[1n, 5n, 2n], [4n, 7n, 3n], [1n, 0n, 3n]],
                    mr: {
                        3  : [[0n, 2n, 0n],     [0n, 2n, 0n],    [1n, 0n, 0n]],  // * [[0n, 2n, 0n], [0n, 2n, 0n], [1n, 0n, 0n]]
                        11 : [[0n, 36n, 18n],   [0n, 40n, 8n],   [1n, 0n, 16n]], // * [[1n, 9n, 6n], [3n, 8n, 4n], [1n, 0n, 4n]]
                        101: [[0n, 324n, 153n], [0n, 145n, 68n], [1n, 0n, 136n]] // * [[1n, 81n, 51n], [76n, 29n, 34n], [1n, 0n, 34n]]
                    }
                }
            ];
            const nTests = [
                {
                    m1: [[1n]],
                    n: 2n,
                    mr: {
                        3  : [[2n]], // * 2n
                        11 : [[6n]], // * 6n
                        101: [[51n]] // * 51n
                    }
                },
                {
                    m1: [[1n, 0n], [5n, 2n]],
                    n : 3n,
                    mr: {
                        3  : [[0n, 0n],  [0n, 0n]],   // * 0n
                        11 : [[4n, 0n],  [20n, 8n]],  // * 4n
                        101: [[34n, 0n], [170n, 68n]] // * 34n
                    }
                },
                {
                    m1: [[0n, 4n, 3n], [0n, 5n, 2n], [1n, 2n, 4n]],
                    n: 5n,
                    mr: {
                        3  : [[0n, 8n, 6n],     [0n, 10n, 4n],    [2n, 4n, 8n]],     // * 2n
                        11 : [[0n, 36n, 27n],   [0n, 45n, 18n],   [9n, 18n, 36n]],   // * 9n
                        101: [[0n, 324n, 243n], [0n, 405n, 162n], [81n, 162n, 324n]] // * 81n
                    }
                }
            ];

            [3n, 11n, 101n].forEach(modulus => {
                const resultKey = String(modulus);

                describe(`modulus ${modulus}n;`, () => {
                    beforeEach(() => {
                        F = new PrimeField(modulus);
                        normF = normalize(F);
                    });

                    mTests.forEach(({m1, m2, mr}) => {
                        it(`should correctly divide matrices ${strMatrix(m1)} and ${strMatrix(m2)}`, () => {
                            let fm1 = F.newMatrixFrom(m1);
                            let fm2 = F.newMatrixFrom(m2);
                            expect(F.divMatrixElements(fm1, fm2).values).to.deep.equal(normF((mr as any)[resultKey]));
                        });
                    });

                    nTests.forEach(({m1, n, mr}) => {
                        it(`should correctly divide matrix ${strMatrix(m1)} by number ${n}`, () => {
                            let fm1 = F.newMatrixFrom(m1);
                            expect(F.divMatrixElements(fm1, n).values).to.deep.equal(normF((mr as any)[resultKey]));
                        });
                    });
                });
            });
        });

        describe('expMatrixElements();', () => {
            const mTests = [
                {
                    m1: [[1n]],
                    m2: [[2n]],
                    mr: [[1n]]
                },
                {
                    m1: [[1n, 2n],  [2n, 5n]],
                    m2: [[2n, 5n],  [3n, 7n]],
                    mr: [[1n, 32n], [8n, 78125n]] },
                {
                    m1: [[1n, 2n, 3n], [3n, 0n, 0n],    [3n, 2n, 1n]],
                    m2: [[5n, 0n, 1n], [7n, 3n, 1n],    [2n, 9n, 0n]],
                    mr: [[1n, 1n, 3n], [2187n, 0n, 0n], [9n, 512n, 1n]]
                }
            ];

            const nTests = [
                {
                    m1: [[1n]],
                    n : 2n,
                    mr: [[1n]]
                },
                {
                    m1: [[1n, 2n], [2n, 5n]],
                    n : 3n,
                    mr: [[1n, 8n], [8n, 125n]]
                },
                {
                    m1: [[1n, 2n, 3n], [3n, 0n, 0n], [3n, 2n, 1n]],
                    n : 2n,
                    mr: [[1n, 4n, 9n], [9n, 0n, 0n], [9n, 4n, 1n]]
                }
            ];

            [3n, 11n, 101n].forEach(modulus => {
                describe(`modulus ${modulus}n;`, () => {
                    beforeEach(() => {
                        F = new PrimeField(modulus);
                        normF = normalize(F);
                    });

                    mTests.forEach(({m1, m2, mr}) => {
                        it(`should correctly raise matrix ${strMatrix(m1)} to a power ${strMatrix(m2)}`, () => {
                            let fm1 = F.newMatrixFrom(m1);
                            let fm2 = F.newMatrixFrom(m2);
                            expect(F.expMatrixElements(fm1, fm2).values).to.deep.equal(normF(mr));
                        });
                    });

                    nTests.forEach(({m1, n, mr}) => {
                        it(`should correctly raise matrix ${strMatrix(m1)} to a power ${n}`, () => {
                            let fm1 = F.newMatrixFrom(m1);
                            expect(F.expMatrixElements(fm1, n).values).to.deep.equal(normF(mr));
                        });
                    });
                });
            });
        });

        describe('mulMatrixes();', () => {
            const tests = [
                {
                    m1: [[1n]],
                    m2: [[2n]],
                    mr: [[2n]]
                },
                {
                    m1: [
                        [1n, 2n],
                        [2n, 5n]
                    ],
                    m2: [
                        [2n, 5n],
                        [3n, 7n]
                    ],
                    mr: [
                        [1n * 2n + 2n * 3n, 1n * 5n + 2n * 7n],
                        [2n * 2n + 5n * 3n, 2n * 5n + 5n * 7n]
                    ]
                },
                {
                    m1: [
                        [1n, 2n, 3n],
                        [3n, 0n, 0n],
                        [3n, 2n, 1n]
                    ],
                    m2: [
                        [5n, 0n, 1n],
                        [7n, 3n, 1n],
                        [2n, 9n, 0n]
                    ],
                    mr: [
                        [1n * 5n + 2n * 7n + 3n * 2n, 1n * 0n + 2n * 3n + 3n * 9n, 1n * 1n + 2n * 1n + 3n * 0n],
                        [3n * 5n + 0n * 7n + 0n * 2n, 3n * 0n + 0n * 3n + 0n * 9n, 3n * 1n + 0n * 1n + 0n * 0n],
                        [3n * 5n + 2n * 7n + 1n * 2n, 3n * 0n + 2n * 3n + 1n * 9n, 3n * 1n + 2n * 1n + 1n * 0n]
                    ]
                }
            ];

            [3n, 11n, 101n].forEach(modulus => {
                describe(`modulus ${modulus}n;`, () => {
                    beforeEach(() => {
                        F = new PrimeField(modulus);
                        normF = normalize(F);
                    });

                    tests.forEach(({m1, m2, mr}) => {
                        it(`should correctly multiple matrices ${strMatrix(m1)} and ${strMatrix(m2)}`, () => {
                            let fm1 = F.newMatrixFrom(m1);
                            let fm2 = F.newMatrixFrom(m2);
                            expect(F.mulMatrixes(fm1, fm2).values).to.deep.equal(normF(mr));
                        });
                    });
                });
            });
        });

        describe('mulMatrixByVector();', () => {
            const tests = [
                {
                    m: [[1n]],
                    v: [2n],
                    r: [2n]
                },
                {
                    m: [
                        [1n, 2n],
                        [2n, 5n]
                    ],
                    v: [1n, 3n],
                    r: [
                        1n * 1n + 2n * 3n,
                        2n * 1n + 5n * 3n
                    ]
                },
                {
                    m: [
                        [1n, 2n, 3n],
                        [3n, 0n, 0n],
                        [3n, 2n, 1n]
                    ],
                    v: [5n, 3n, 0n],
                    r: [
                        1n * 5n + 2n * 3n + 3n * 0n,
                        3n * 5n + 0n * 3n + 0n * 0n,
                        3n * 5n + 2n * 3n + 1n * 0n
                    ]
                }
            ];

            [3n, 11n, 101n].forEach(modulus => {
                describe(`modulus ${modulus}n;`, () => {
                    beforeEach(() => {
                        F = new PrimeField(modulus);
                        normF = normalize(F);
                    });

                    tests.forEach(({m, v, r}) => {
                        it(`should correctly multiple matrix ${strMatrix(m)} and vector${strVector(v)}`, () => {
                            let fm = F.newMatrixFrom(m);
                            let fv = F.newVectorFrom(v);
                            expect(F.mulMatrixByVector(fm, fv).values).to.deep.equal(r.map(n => F.mod(n)));
                        });
                    });
                });
            });
        });
    });

    describe('Basic polynomial operations;', () => {
        const poly: bigint[] = [3n, -2n, 1n, -2n, 3n];

        const fn = (x: bigint): bigint => {
            return (
                poly[4] * x ** 4n +
                poly[3] * x ** 3n +
                poly[2] * x ** 2n +
                poly[1] * x ** 1n +
                poly[0]
            );
        };

        describe('addPolys();', () => {
            const tests = [
                {
                    p1: [0n, 4n, 3n, 0n, 1n],
                    p2: [1n, 0n, 1n, 5n, 0n],
                    pr: [1n, 4n, 4n, 5n, 1n]
                },
                {
                    p1: [0n, 0n, 1n, 0n, 0n],
                    p2: [1n, 0n, 1n, 7n, 8n],
                    pr: [1n, 0n, 2n, 7n, 8n]
                }
            ];

            [3n, 11n, 101n].forEach(modulus => {
                describe(`modulus ${modulus}n;`, () => {
                    beforeEach(() => {
                        F = new PrimeField(modulus);
                    });

                    tests.forEach(({p1, p2, pr}) => {
                        it('should correctly add two polynomials', () => {
                            let fp1 = F.newVectorFrom(p1);
                            let fp2 = F.newVectorFrom(p2);
                            expect(F.addPolys(fp1, fp2).values).to.deep.equal(pr.map(n => F.mod(n)));
                        });
                    });
                });
            });
        });

        describe('subPolys();', () => {
            const tests = [
                {
                    p1: [0n,  4n, 3n, 0n,  1n],
                    p2: [1n,  0n, 1n, 5n,  0n],
                    pr: [-1n, 4n, 2n, -5n, 1n]
                },
                {
                    p1: [0n,  0n, 1n, 0n,   0n],
                    p2: [1n,  0n, 1n, 7n,   8n],
                    pr: [-1n, 0n, 0n, -7n, -8n]
                }
            ];

            [3n, 11n, 101n].forEach(modulus => {
                describe(`modulus ${modulus}n;`, () => {
                    beforeEach(() => {
                        F = new PrimeField(modulus);
                    });

                    tests.forEach(({p1, p2, pr}) => {
                        it('should correctly subtract two polynomials', () => {
                            let fp1 = F.newVectorFrom(p1);
                            let fp2 = F.newVectorFrom(p2);
                            expect(F.subPolys(fp1, fp2).values).to.deep.equal(pr.map(n => F.mod(n)));
                        });
                    });
                });
            });
        });

        describe('mulPolys();', () => {
            const tests = [
                {
                    p1: [0n, 0n, 1n],
                    p2: [1n, 0n, 0n],
                    pr: [0n, 0n, 1n, 0n, 0n]
                },
                {
                    p1: [1n,  1n, 0n],
                    p2: [-1n, 1n, 0n],
                    pr: [-1n, 0n, 1n, 0n, 0n]
                },
                {
                    p1: [0n, 0n, 3n],
                    p2: [2n, 0n, 0n],
                    pr: [0n, 0n, 6n, 0n, 0n]
                },
                {
                    p1: [1n,  2n,  3n],
                    p2: [-4n, 5n, -6n],
                    pr: [-4n, -3n, -8n, 3n, -18n]
                }
            ];

            [3n, 11n, 101n].forEach(modulus => {
                describe(`modulus ${modulus}n;`, () => {
                    beforeEach(() => {
                        F = new PrimeField(modulus);
                    });

                    tests.forEach(({p1, p2, pr}) => {
                        it('should correctly multiply two polynomials', () => {
                            let fp1 = F.newVectorFrom(p1);
                            let fp2 = F.newVectorFrom(p2);
                            expect(F.mulPolys(fp1, fp2).values).to.deep.equal(pr.map(n => F.mod(n)));
                        });
                    });
                });
            });
        });

        describe('divPolys();', () => {
            const tests = [
                {
                    p1: [2n],
                    p2: [1n],
                    pr: [2n]
                },
                {
                    p1: [-1n, 0n, 1n],
                    p2: [ 1n, 1n, 0n],
                    pr: [-1n, 1n]
                },
                {
                    p1: [-1n, 0n, 1n],
                    p2: [-1n, 1n, 0n],
                    pr: [ 1n, 1n]
                }
            ];

            [3n, 11n, 101n].forEach(modulus => {
                describe(`modulus ${modulus}n;`, () => {
                    beforeEach(() => {
                        F = new PrimeField(modulus);
                    });

                    tests.forEach(({p1, p2, pr}) => {
                        it('should correctly divide two polynomials', () => {
                            let fp1 = F.newVectorFrom(p1);
                            let fp2 = F.newVectorFrom(p2);
                            expect(F.divPolys(fp1, fp2).values).to.deep.equal(pr.map(n => F.mod(n)));
                        });
                    });
                });
            });
        });

        describe('evalPolyAt();', () => {
            const points: bigint[] = Array(8)
                .fill(0)
                .map((n, i) => BigInt(i * 5));

            [7n, 11n, 101n]
                .forEach(modulus => {
                    describe(`modulus ${modulus}n;`, () => {
                        beforeEach(() => {
                            F = new PrimeField(modulus);
                        });

                        points.forEach(x => {
                            it(`should evaluate polynom in point x=${x}n`, () => {
                                let fp = F.newVectorFrom(poly);
                                expect(F.evalPolyAt(fp, x)).to.equal(F.mod(fn(x)));
                            });
                        });
                    });
                });
        });

        describe('interpolate();', () => {
            let xs: bigint[];
            let ys: bigint[];

            [7n, 11n, 101n]
                .forEach(modulus => {
                    describe(`modulus ${modulus}n;`, () => {
                        beforeEach(() => {
                            F = new PrimeField(modulus);

                            xs = Array(poly.length)
                                .fill(0)
                                .map((n, i) => F.mod((BigInt(i * 10))));

                            ys = xs.map(x => F.mod(fn(x)));
                        });

                        it(`should return correctly polynom`, () => {
                            let fxs = F.newVectorFrom(xs);
                            let fys = F.newVectorFrom(ys);
                            expect(F.interpolate(fxs, fys).values).to.deep.equal(poly.map(n => F.mod(n)));
                        });
                    });
                });
        });

        describe('interpolateRoots();', () => {
            const modulus = 2n**32n - 3n * 2n**25n + 1n;
            let root: bigint;
            let xs: JsVector;
            let ys: JsVector;
            let fp: JsVector;

            [
                [2n,  1n,  2n, 3n],
                [-2n, 1n, -2n, 3n],

                [5n,   70n, 2n,  1n,  2n, 3n, 5n, 0n],
                [-13n, 18n, -2n, 1n, -2n, 3n, 5n, 12n]
            ].forEach(poly => {
                describe(`for polynom ${JSON.stringify(poly).replace(/"/g, '')};`, () => {
                    beforeEach(() => {
                        F = new PrimeField(modulus);
                        fp = F.newVectorFrom(poly);

                        root = F.getRootOfUnity(poly.length);

                        xs = F.getPowerSeries(root, poly.length);
                        ys = F.evalPolyAtRoots(fp, xs);
                    });

                    it(`should return correctly polynom by interpolateRoots()`, () => {
                        expect(F.interpolateRoots(xs, ys).values).to.deep.equal(poly.map(n => F.mod(n)));
                    });

                    it(`should return correctly polynom by interpolate()`, () => {
                        expect(F.interpolate(xs, ys).values).to.deep.equal(poly.map(n => F.mod(n)));
                    });

                    it('should evaluate polynom in point x0', () => {
                        expect(F.evalPolyAt(fp, xs.values[0])).to.equal(ys.values[0]);
                    });
                });
            });
        });
    });
});
