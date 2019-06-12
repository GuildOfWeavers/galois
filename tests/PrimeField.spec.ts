import { expect } from 'chai';
import { PrimeField } from '../lib/PrimeField';

let F: PrimeField;

(BigInt.prototype as any).toJSON = function () {
    return String(this) + 'n';
};

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
                    modulus: 2n,
                    tests: [
                        [1n, 1n, 1n], [2n, 2n, 0n], [5n, 5n, 1n],
                        [5n, 6n, 0n], [3n, 0n, 0n], [9n, 9n, 1n]
                    ]
                },
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
                    modulus: 2n,
                    tests: [
                        [1n, 1n, 1n]
                    ]
                },
                {
                    modulus: 11n,
                    tests: [
                        [1n,   1n,   1n], [2n, 2n, 1n], [4n,  2n, 2n],  // TODO: test more complicated divisions - e.g. 5/6, 7/3
                        [6n,   3n,   2n], [9n, 3n, 3n], [10n, 1n, 10n],
                        [100n, 100n, 1n]
                    ]
                },
                {
                    modulus: 101n,
                    tests: [
                        [1n,   1n,  1n], [2n,  2n,  1n],
                        [20n,  5n,  4n], [20n, 4n,  5n],
                        [25n,  5n,  5n], [36n, 6n,  6n],
                        [30n,  5n,  6n], [30n, 6n,  5n],
                        [10n,  10n, 1n], [60n, 20n, 3n],
                        [120n, 20n, 6n], [90n, 30n, 3n]
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
                            [1n,  1n,  1n],                                                 // TODO: test when base is 0; also test 0 exponent
                            [2n,  1n,  2n], [2n, 2n, 4n], [2n, 3n, 8n], [2n,  4n,  5n],
                            [3n,  1n,  3n], [3n, 2n, 9n], [3n, 3n, 5n],
                            [6n,  1n,  6n], [6n, 2n, 3n],
                            [10n, 1n, 10n]
                        ]
                    },
                    {
                        modulus: 101n,
                        tests: [
                            [1n, 1n, 1n],  [2n,  2n, 4n], [3n, 3n, 27n], [4n, 4n, 54n],
                            [6n, 2n, 36n], [10n, 2n, 100n]
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

    describe('Polynomial tests;', () => {
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
                            expect(F.addPolys(p1, p2)).to.deep.equal(pr.map(n => F.mod(n)));
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
                            expect(F.subPolys(p1, p2)).to.deep.equal(pr.map(n => F.mod(n)));
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
                            expect(F.mulPolys(p1, p2)).to.deep.equal(pr.map(n => F.mod(n)));
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
                        it('should correctly multiply two polynomials', () => {
                            expect(F.divPolys(p1, p2)).to.deep.equal(pr.map(n => F.mod(n)));
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
                                expect(F.evalPolyAt(poly, x)).to.equal(F.mod(fn(x)));
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
                            expect(F.interpolate(xs, ys)).to.deep.equal(poly.map(n => F.mod(n)));
                        });
                    });
                });
        });

        describe('interpolateRoots();', () => {
            const modulus = 2n**32n - 3n * 2n**25n + 1n;
            let root: bigint;
            let xs: bigint[];
            let ys: bigint[];

            [
                [2n,  1n,  2n, 3n],
                [-2n, 1n, -2n, 3n],

                [5n,   70n, 2n,  1n,  2n, 3n, 5n, 0n],
                [-13n, 18n, -2n, 1n, -2n, 3n, 5n, 12n]
            ].forEach(poly => {
                describe(`for polynom [${poly.map(n => n.toString() + 'n').join(', ')}];`, () => {
                    beforeEach(() => {
                        F = new PrimeField(modulus);

                        root = F.getRootOfUnity(poly.length);

                        xs = F.getPowerCycle(root);
                        ys = F.evalPolyAtRoots(poly, xs);
                    });

                    it(`should return correctly polynom by interpolateRoots()`, () => {
                        expect(F.interpolateRoots(xs, ys)).to.deep.equal(poly.map(n => F.mod(n)));
                    });

                    it(`should return correctly polynom by interpolate()`, () => {
                        expect(F.interpolate(xs, ys)).to.deep.equal(poly.map(n => F.mod(n)));
                    });

                    it('should evaluate polynom in point x0', () => {
                        expect(F.evalPolyAt(poly, xs[0])).to.equal(ys[0]);
                    });
                });
            });
        });
    });
});
