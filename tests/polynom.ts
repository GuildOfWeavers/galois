// IMPORTS
// ================================================================================================
import { PrimeField } from '../lib/PrimeField';

// MODULE VARIABLES
// ================================================================================================
//const F = new PrimeField(96769n);
const F = new PrimeField(2n ** 256n - 351n * 2n ** 32n + 1n);
const runs = 1;

// TESTS
// ================================================================================================
(function testPolynomialEvaluation(){

    let t0 = 0, t1 = 0;

    const degree = 128;
    const extension = 8;

    console.log('Testing polynomial evaluation');

    for (let r = 0; r < runs; r++) {
        // generate a random polynomial
        const p = F.newVector(degree);
        for (let i = 0; i < p.length; i++) {
            p.values[i] = F.rand();
        }

        // find root of unity
        const G = F.getRootOfUnity(degree * extension);
        const domain = F.getPowerSeries(G, degree * extension);

        // evaluate the polynomial using FFT
        let start = Date.now();
        const results = F.evalPolyAtRoots(p, domain);
        t0 += (Date.now() - start);

        // evaluate the polynomial using direct evaluation
        start = Date.now();
        const values2 = new Array(domain.length);
        for (let i = 0; i < results.length; i++) {
            values2[i] = F.evalPolyAt(p, domain.values[i]);
        }
        t1 += (Date.now() - start);

        // compare results
        for (let i = 0; i < results.length; i++) {
            if (results.getValue(i) !== values2[i]) {
                console.log('Error');
                return;
            }
        }
    }
    console.log(`\tPerformed FFT evaluation in ${Math.round(t0 / runs)} ms`);
    console.log(`\tPerformed direct evaluation in ${Math.round(t1 / runs)} ms`);

})();

(function testPolynomialInterpolation() {

    let t0 = 0, t1 = 0;

    const degree = 128;
    const extension = 8;

    console.log('Testing polynomial interpolation');

    for (let r = 0; r < runs; r++) {
        // generate a random polynomial
        const p = F.newVector(degree);
        for (let i = 0; i < p.length; i++) {
            p.values[i] = F.rand();
        }

        // find root of unity
        const G = F.getRootOfUnity(degree * extension);
        const domain = F.getPowerSeries(G, degree * extension);

        // evaluate the polynomial over the domain
        const values = F.evalPolyAtRoots(p, domain);

        // interpolate values using FFT
        let start = Date.now();
        const p1 = F.interpolateRoots(domain, values);
        t0 += (Date.now() - start);

        // interpolate values using lagrange
        start = Date.now();
        const p2 = F.interpolate(domain, values);
        t1 += (Date.now() - start);

        // compare results
        for (let i = 0; i < p.length; i++) {
            if (p.values[i] !== p1.values[i]) {
                console.log('Error1');
                return;
            }

            if (p.values[i] !== p2.values[i]) {
                console.log('Error2');
                return;
            }
        }
    }
    console.log(`\tPerformed FFT interpolation in ${Math.round(t0 / runs)} ms`);
    console.log(`\tPerformed Lagrange interpolation in ${Math.round(t1 / runs)} ms`);
})();

(function testFftEvaluationAndInterpolation() {
    let t0 = 0, t1 = 0;

    const degree = 2**12;
    const extension = 2**4;

    console.log('Testing FFT evaluation and interpolation');

    for (let r = 0; r < runs; r++) {
        // generate a random polynomial
        const p = F.newVector(degree);
        for (let i = 0; i < p.length; i++) {
            p.values[i] = F.rand();
        }

        // find root of unity
        const G = F.getRootOfUnity(degree * extension);
        const domain = F.getPowerSeries(G, degree * extension);

        // evaluate the polynomial over the domain
        let start = Date.now();
        const values = F.evalPolyAtRoots(p, domain);
        t0 += (Date.now() - start);

        // interpolate values using FFT
        start = Date.now();
        const p1 = F.interpolateRoots(domain, values);
        t1 += (Date.now() - start);

        // compare results
        for (let i = 0; i < p.length; i++) {
            if (p.values[i] !== p1.values[i]) {
                console.log('Error1');
                return;
            }
        }
    }
    console.log(`\tPerformed FFT evaluation in ${Math.round(t0 / runs)} ms`);
    console.log(`\tPerformed FFT interpolation in ${Math.round(t1 / runs)} ms`);
})();

(function testQuarticBatchInterpolation() {

    const samples = 1000;
    let t0 = 0, t1 = 0, t2 = 0;

    console.log('Testing quartic batch interpolation');
    for (let r = 0; r < runs; r++) {
        // generate random polynomials of degree 4
        let start = Date.now();
        const p = F.newMatrix(samples, 4);
        for (let i = 0; i < p.rowCount; i++) {
            for (let j = 0; j < 4; j++) {
                p.setValue(i, j, F.rand());
            }
        }
        t0 += (Date.now() - start);

        // evaluate each polynomial at 4 random places
        start = Date.now();
        const xs = F.newMatrix(samples, 4);
        const ys = F.newMatrix(samples, 4);
        for (let i = 0; i < samples; i++) {
            for (let j = 0; j < 4; j++) {
                let r = F.rand();
                xs.setValue(i, j, r);
                ys.setValue(i, j, F.evalPolyAt(F.newVectorFrom(p.values[i]), r));
            }
        }
        t1 += (Date.now() - start);

        // interpolate polynomials
        start = Date.now();
        const ip = F.interpolateQuarticBatch(xs, ys);
        t2 += (Date.now() - start);

        // compare polynomials
        for (let i = 0; i < p.rowCount; i++) {
            for (let j = 0; j < p.colCount; j++) {
                if (p.getValue(i, j) !== ip.getValue(i, j)) {
                    console.log('Error'!);
                    console.log('P:\t' + p.values[i]);
                    console.log('IP\t' + ip.values[i]);
                    return;
                }
            }
        }
    }

    console.log(`\tGenerated polynomials in ${Math.round(t0 / runs)} ms`);
    console.log(`\tEvaluated polynomials in ${Math.round(t1 / runs)} ms`);
    console.log(`\tInterpolated polynomials in ${Math.round(t2 / runs)} ms`);

    console.log('done!');
})();