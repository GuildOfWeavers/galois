# Galois
Arithmetic and polynomial operations in finite fields.

## Install
```bash
$ npm install @guildofweavers/galois --save
```

## Example
```TypeScript
import * as galois from '@guildofweavers/galois';

// create a prime field with a large modulus
const field = galois.createPrimeField(2n ** 256n - 351n * 2n ** 32n + 1n);

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
These methods are self-explanatory. `inv` computes a multiplicative inverse using the [Extended Euclidean algorithm](https://en.wikipedia.org/wiki/Extended_Euclidean_algorithm), `neg` computes an additive inverse.

* **add**(a: `bigint`, b: `bigint`): `bigint`
* **sub**(a: `bigint`, b: `bigint`): `bigint`
* **mul**(a: `bigint`, b: `bigint`): `bigint`
* **div**(a: `bigint`, b: `bigint`): `bigint`
* **exp**(b: `bigint`, p: `bigint`): `bigint`
* **inv**(a: `bigint`): `bigint`
* **neg**(a: `bigint`): `bigint`

### Vectors
Vectors are 1-dimensional data structures similar to arrays. Vectors are immutable: once created, their contents cannot be modified. To read a value from a vector you can use `vector.getValue()` method which has the following signature:

* **getValue**(index: `number`): `bigint`

* **toValues**(): `bigint[]`

#### Creating vectors
A `FiniteField` object exposes two methods which you can use to create new vectors:

* **newVector**(length: `number`): `Vector`<br />
  Creates a new vector with the specified length.

* **newVectorFrom**(values: `bigint[]`): `Vector`<br />
  Creates a new vector and populates it with the provided values.

You can also create new vectors by transforming existing vectors using the following methods:

* **pluckVector**(v: `Vector`, skip: `number`, times: `number`): `Vector`<br />
  Creates a new vector by selecting values from the source vector by skipping over the specified number of elements.

* **truncateVector**(v: `Vector`, newLength: `number`): `Vector`<br />
  TODO

* **duplicateVector**(v: `Vector`, times?: `number`): `Vector`<br />
  TODO

#### Vector operations
Element-wise operations on vectors. For example, `addVectorElements` computes a new vectors `v` such that `v[i] = a[i] + b[i]` for all elements. When the second argument is a scalar, uses that scalar as the second operand in the operation.

* **addVectorElements**(a: `Vector`, b: `bigint` | `Vector`): `Vector`
* **subVectorElements**(a: `Vector`, b: `bigint` | `Vector`): `Vector`
* **mulVectorElements**(a: `Vector`, b: `bigint` | `Vector`): `Vector`
* **divVectorElements**(a: `Vector`, b: `bigint` | `Vector`): `Vector`
* **expVectorElements**(a: `Vector`, b: `bigint` | `Vector`): `Vector`

* **invVectorElements**(v: `Vector`): `Vector`<br />
  Computes modular inverses of all vector elements using Montgomery batch inversion.

* **negVectorElements**(v: `Vector`): `Vector`<br />
  TODO

* **combineVectors**(a: `Vector`, b: `Vector`): `bigint`<br />
  Computes a linear combination of two vectors.

* **combineManyVectors**(v: `Vector[]`, k: `Vector`): `Vector`<br />
  Computes a linear combination of two vectors.

### Matrixes
Matrixes are 2-dimensional data structures similar to 2-dimensional arrays. Matrixes are immutable: once created, their contents cannot be modified. To read a value from a matrix you can use `vector.getValue()` method which has the following signature:

* **getValue**(row: `number`, column: `number`): `bigint`

* **toValues**(): `bigint[][]`

**Note**: matrixes are assumed to be in row-major form.

#### Creating matrixes
A `FiniteField` object exposes two methods which you can use to create new matrixes:

* **newMatrix**(rows: `number`, columns: `number`): `Matrix`<br />
  Creates a new matrix with the specified number of rows and columns.

* **newMatrixFrom**(values: `bigint[][]`): `Matrix`<br />
  TODO

You can also create new vectors by transforming existing vectors using the following methods:

* **vectorToMatrix**(v: `Vector`, columns: `number`): `Matrix`<br />
  TODO

#### Matrix operations
Element-wise operations on matrixes. For example, `addMatrixElements` computes a new matrix `m` such that `m[i][j] = a[i][j] + b[i][j]` for all elements. When the second argument is a scalar, uses that scalar as the second operand in the operation.

* **addMatrixElements**(a: `Matrix`, b: `bigint` | `Matrix`): `Matrix`
* **subMatrixElements**(a: `Matrix`, b: `bigint` | `Matrix`): `Matrix`
* **mulMatrixElements**(a: `Matrix`, b: `bigint` | `Matrix`): `Matrix`
* **divMatrixElements**(a: `Matrix`, b: `bigint` | `Matrix`): `Matrix`
* **expMatrixElements**(a: `Matrix`, b: `bigint` | `Matrix`): `Matrix`

* **invMatrixElements**(m: `Matrix`): `Matrix`<br />
  Computes modular inverses of all matrix elements using Montgomery batch inversion.

* **negMatrixElements**(m: `Matrix`): `Matrix`<br />
  TODO

* **mulMatrixes**(a: `Matrix`, b: `Matrix`): `Matrix`<br />
  Computes a [product of two matrixes](https://en.wikipedia.org/wiki/Matrix_multiplication) such that given input matrix dimensions [*m*,*p*] and [*p*,*n*], the output matrix will have dimensions of [*m*,*n*].

* **mulMatrixByVector**(m: `Matrix`, v: `Vector`): `Vector`<br />
  Similar to matrix multiplication but the second parameter is a vector. Given a matrix with dimensions [*m*,*n*] and a vector with length *n*, the output vector will have length *m*.

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

* **evaluatePolyAtRoots**(p: `Polynom`, rootsOfUnity: `Vector`): `Vector`<br />
  Uses Fast Fourier Transform to evaluate a polynomial at all provided roots of unity.

* **interpolate**(xs: `Vector`, ys: `Vector`): `Polynom`<br />
  Uses Lagrange Interpolation to compute a polynomial from the provided points (x and y coordinates).

* **interpolateRoots**(rootsOfUnity: `Vector`, ys:`Vector`): `Polynom`<br />
  Uses Fast Fourier Transform to compute a polynomial from the provided points (roots of unity are as x coordinates).

* **interpolateQuarticBatch**(xSets: `Matrix`, ySets: `Matrix`): `Polynom[]`<br />
  Uses an optimized version of Lagrange Interpolation for degree 3 polynomials. x and y coordinates should be provided in matrix with outer array representing "columns" and inner array representing "rows". The rows should have 4 values each.

### Other miscellaneous operations

* **rand**(): `bigint`<br />
  Generate a cryptographically-secure random field element.

* **prng**(seed: `bigint` | `Buffer`, length?: `number`): `Vector` | `bigint`<br />
  Generates pseudorandom field elements from the provided seed. If the `length` parameter is provided, a sequence of elements is returned; otherwise, the returned value is a single field element.

* **getRootOfUnity**(order: `number`): `bigint`<br />
  Computes a primitive root of unity such that `root**order = 1`.

* **getPowerSeries**(base: `bigint`, length: `number`): `Vector`<br />
  Computes a series of powers for the provided base element. More specifically: `[1n, base**1, base**2, ..., base**(length - 1)]`.

## References

* Wikipedia article on [finite fields](https://en.wikipedia.org/wiki/Finite_field).
* Many algorithms in this library have been copied (with minimal changes) from Vitalik Buterin's [MIMC STARK project](https://github.com/ethereum/research/tree/master/mimc_stark), including: Fast Fourier Transform, Lagrange Interpolation, and Montgomery batch inversion.

# License
[MIT](/LICENSE) © 2019 Guild of Weavers