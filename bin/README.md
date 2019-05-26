# Galois
Arithmetic and polynomial operations in finite fields.

## Install
```bash
$ npm install @guildofweavers/galois --save
```

## Example
```TypeScript
import { PrimeField } from '@guildofweavers/galois';

// create a prime field with a large modulus
const field = new PrimeField(2n ** 256n - 351n * 2n ** 32n + 1n);

const a = field.rand();     // generate a random field element
const b = field.rand();     // generate another random element
const c = field.exp(a, b);  // do some math
```

## API

You can find complete API definitions in [galois.d.ts](/galois.d.ts). Here is a quick overview of the provided functionality:

### Creating Finite Fields
To perform operations in a finite field, you'll need to instantiate a class that implements `FiniteField` interface. Currently, the only class that does this is `PrimeField`. You can create a prime field like so:

* new `PrimeField`(modulus: `bigint`)<br />
  `modulus` must be a prime number.

Once you have an instance of a class implementing `FiniteField`, you can use the methods described below to do math.

### Basic arithmetics
These methods are self-explanatory. `inv` computes a modular inverse using the [Extended Euclidean algorithm](https://en.wikipedia.org/wiki/Extended_Euclidean_algorithm).

* **add**(a: `bigint`, b: `bigint`): `bigint`
* **sub**(a: `bigint`, b: `bigint`): `bigint`
* **mul**(a: `bigint`, b: `bigint`): `bigint`
* **div**(a: `bigint`, b: `bigint`): `bigint`
* **exp**(b: `bigint`, p: `bigint`): `bigint`
* **inv**(a: `bigint`): `bigint`

### Batch operations
Optimized versions of basic arithmetic methods to provide more efficiency when working with large sets of values:

* **invMany**(values: `bigint[]`): `bigint[]`<br />
  Computes modular inverses for all passed in values using Montgomery batch inversion.

* **mulMany**(values: `bigint[][]`, m1: `bigint[]`, m2: `bigint[]?`): `bigint[][]`<br />
  Multiplies values in the matrix by the corresponding values from `m1` and `m2` (when provided). More specifically: `values[column][row] * m1[row] * m2[row]` for all columns.

* **combine**(values: `bigint[]`, coefficients: `bigint[]`): `bigint`<br />
  Computes a linear combination of values with the specified coefficients. More specifically: `sum(values[i] * coefficients[i])`.

* **combineMany**(values: `bigint[][]`, coefficients: `bigint[]`): `bigint[]`<br />
  Computes linear combinations for each row in the passed in `values` matrix. More specifically: `sum(values[column][row] * coefficients[column])` for all columns and rows.

### Basic polynomial operations
Polynomials are represented by a `Polynom` type which is really just an array of `bigint`s encoding coefficients of the polynomial in reverse order. For example, a polynomial `x^3 + 2x^2 + 3x + 4` would be encoded as `[4n, 3n, 2n, 1n]`.

The methods can be used to perform basic polynomial arithmetic:

* **addPolys**(a: `Polynom`, b: `Polynom`): `Polynom`
* **subPolys**(a: `Polynom`, b: `Polynom`): `Polynom`
* **mulPolys**(a: `Polynom`, b: `Polynom`): `Polynom`
* **divPolys**(a: `Polynom`, b: `Polynom`): `Polynom`
* **mulPolyByConstant**(p: `Polynom`, c: `bigint`): `Polynom`

### Polynomial evaluation and interpolation

* **evaluatePolyAt**(p: `Polynom`, x: `bigint`): `bigint`<br />
  Evaluates a polynomial at the provided x-coordinate.

* **evaluatePolyAtRoots**(p: `Polynom`, rootsOfUnity: `bigint[]`): `bigint[]`<br />
  Uses Fast Fourier Transform to evaluate a polynomial at all provided roots of unity.

* **interpolate**(xs: `bigint[]`, ys: `bigint[]`): `Polynom`<br />
  Uses Lagrange Interpolation to compute a polynomial from the provided points (x and y coordinates).

* **interpolateRoots**(rootsOfUnity: `bigint[]`, ys:`bigint[]`): `Polynom`<br />
  Uses Fast Fourier Transform to compute a polynomial from the provided points (roots of unity are as x coordinates).

* **interpolateQuarticBatch**(xSets: `bigint[][]`, ySets: `bigint[][]`): `Polynom[]`<br />
  Uses an optimized version of Lagrange Interpolation for degree 3 polynomials. x and y coordinates should be provided in matrix with outer array representing "columns" and inner array representing "rows". The rows should have 4 values each.

### Other miscellaneous operations

* **rand**(): `bigint`<br />
  Generate a cryptographically-secure random field element.

* **prng**(seed: `bigint` | `Buffer`, length?: `number`): `bigint[]` | `bigint`<br />
  Generates pseudorandom field elements from the provided seed. If the `length` parameter is provided, a sequence of elements is returned; otherwise, the returned value is a single field element.

* **getRootOfUnity**(order: `number`): `bigint`<br />
  Computes a primitive root of unity such that `root**order = 1`.

* **getPowerCycle**(rootOfUnity: `bigint`): `bigint[]`<br />
  Computes a complete set of roots of unity for the provided primitive root. More specifically: `[1n, rootOfUnity**1, rootOfUnity**2, ..., rootOfUnity**(order - 1)]`.

* **getPowerSeries**(base: `bigint`, length: `number`): `bigint[]`<br />
  Computes a series of powers for the provided base element. More specifically: `[1n, base**1, base**2, ..., base**(length - 1)]`.

## References

* Wikipedia article on [finite fields](https://en.wikipedia.org/wiki/Finite_field).
* Many algorithms in this library have been copied (with minimal changes) from Vitalik Buterin's [MIMC STARK project](https://github.com/ethereum/research/tree/master/mimc_stark), including: Fast Fourier Transform, Lagrange Interpolation, and Montgomery batch inversion.