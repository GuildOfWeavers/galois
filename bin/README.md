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
To perform operations in a finite field, you'll first need to create a `FiniteField` object. Currently, only prime fields are supported. To create a prime field you can use the `createPrimeField` function. The function has the following signature:

* `createPrimeField`(modulus: `bigint`, wasmOptions?: `WasmOptions`)

where, `modulus` must be a prime number, and `wasmOptions` is an optional parameter for WASM-optimized fields. When provided, `wasmOptions` object must have the following form:

| Property      | Description |
| ------------- | ----------- |
| initialMemory | Amount of memory (in bytes) with which the WASM module will be instantiated. |

Once you've created a `FiniteField` object, you can use the methods described in the following sections to do math.

#### WASM optimization
Vector, matrix, and polynomial operations for certain types of fields have been optimized to make use of WebAssembly. This can speed up such operations by a factor of 6x - 10x (depending on the operation, see [performance](#Performance) for more details). The optimization is currently available for the following fields:

* Prime fields with modulus of the form 2<sup>128</sup>-k, where k < 2<sup>64</sup>

When available, the optimization is enabled automatically. To turn the optimization off, pass `null` as the second parameter when creating `FiniteField` objects.

**Note:** there is currently no way to free the memory consumed by WASM modules, so, you might have to periodically re-create `FiniteField` objects to avoid memory leaks. This will be addressed in the future versions of this library by relying on [finalizers](https://v8.dev/features/weak-references), which should be available in major JS engines soon.

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
Vectors are 1-dimensional data structures similar to arrays. Vectors are immutable: once created, their contents cannot be modified. To read values from a vector you can use the following methods:

* **getValue**(index: `number`): `bigint`
* **toValues**(): `bigint[]`

**Note:** for WASM-optimized fields `toValues()` is a relatively expensive operation since all vector elements have to be copied out of WASM memory into a new JavaScript array.

#### Creating vectors
A `FiniteField` object exposes two methods which you can use to create new vectors:

* **newVector**(length: `number`): `Vector`<br />
  Creates a new vector with the specified length (all values initialized to `0`).

* **newVectorFrom**(values: `bigint[]`): `Vector`<br />
  Creates a new vector and populates it with the provided values.

You can also create new vectors by transforming existing vectors using the following methods:

* **pluckVector**(v: `Vector`, skip: `number`, times: `number`): `Vector`<br />
  Creates a new vector by selecting values from the source vector by skipping over the specified number of elements.

* **truncateVector**(v: `Vector`, newLength: `number`): `Vector`<br />
  Creates a new vector by selecting the number of elements specified by `newLength` parameter from the head of the source vector.

* **duplicateVector**(v: `Vector`, times?: `number`): `Vector`<br />
  Creates a new vector by duplicating the existing vector the specified number of times.

#### Vector operations
Basic operations can be applied to vectors in the _element-wise_ fashion. For example, `addVectorElements` computes a new vectors `v` such that `v[i] = a[i] + b[i]` for all elements. When the second argument is a scalar, uses that scalar as the second operand in the operation.

* **addVectorElements**(a: `Vector`, b: `bigint` | `Vector`): `Vector`
* **subVectorElements**(a: `Vector`, b: `bigint` | `Vector`): `Vector`
* **mulVectorElements**(a: `Vector`, b: `bigint` | `Vector`): `Vector`
* **divVectorElements**(a: `Vector`, b: `bigint` | `Vector`): `Vector`
* **expVectorElements**(a: `Vector`, b: `bigint` | `Vector`): `Vector`

* **invVectorElements**(v: `Vector`): `Vector`<br />
  Computes multiplicative inverses of all vector elements using Montgomery batch inversion.

* **negVectorElements**(v: `Vector`): `Vector`<br />
  Computes additive inverses of all vector elements.

Besides the element-wise operations, the following operations can be applied to vectors:

* **combineVectors**(a: `Vector`, b: `Vector`): `bigint`<br />
  Computes a linear combination of two vectors.

* **combineManyVectors**(v: `Vector[]`, k: `Vector`): `Vector`<br />
  Computes linear combinations of vector rows using specified coefficients. For example, `v[0][i]*k[0] + v[1][i]*k[1]` for all `i`.

### Matrixes
Matrixes are 2-dimensional data structures similar to 2-dimensional arrays. Matrixes are immutable: once created, their contents cannot be modified. Values in matrixes are assumed to be in row-major form. To read values from a matrix you can use the following methods:

* **getValue**(row: `number`, column: `number`): `bigint`
* **toValues**(): `bigint[][]`

**Note:** for WASM-optimized fields `toValues()` is a relatively expensive operation since all matrix elements have to be copied out of WASM memory into new JavaScript arrays.

#### Creating matrixes
A `FiniteField` object exposes two methods which you can use to create new matrixes:

* **newMatrix**(rows: `number`, columns: `number`): `Matrix`<br />
  Creates a new matrix with the specified number of rows and columns.

* **newMatrixFrom**(values: `bigint[][]`): `Matrix`<br />
  Creates a new matrix with the same dimensions as `values` and populates it with the provided values.

You can also create new matrixes by transforming existing vectors using the following methods:

* **vectorToMatrix**(v: `Vector`, columns: `number`): `Matrix`<br />
  Transposes the provided vector into a matrix with the specified number of columns.

#### Matrix operations
Basic operations can be applied to matrixes in the _element-wise_ fashion. For example, `addMatrixElements` computes a new matrix `m` such that `m[i][j] = a[i][j] + b[i][j]` for all elements. When the second argument is a scalar, uses that scalar as the second operand in the operation.

* **addMatrixElements**(a: `Matrix`, b: `bigint` | `Matrix`): `Matrix`
* **subMatrixElements**(a: `Matrix`, b: `bigint` | `Matrix`): `Matrix`
* **mulMatrixElements**(a: `Matrix`, b: `bigint` | `Matrix`): `Matrix`
* **divMatrixElements**(a: `Matrix`, b: `bigint` | `Matrix`): `Matrix`
* **expMatrixElements**(a: `Matrix`, b: `bigint` | `Matrix`): `Matrix`

* **invMatrixElements**(m: `Matrix`): `Matrix`<br />
  Computes multiplicative inverses of all matrix elements using Montgomery batch inversion.

* **negMatrixElements**(m: `Matrix`): `Matrix`<br />
  Computes additive inverse of all matrix elements.

Besides the element-wise operations, the following operations can be applied to matrixes:

* **mulMatrixes**(a: `Matrix`, b: `Matrix`): `Matrix`<br />
  Computes a [product of two matrixes](https://en.wikipedia.org/wiki/Matrix_multiplication) such that given input matrix dimensions [*m*,*p*] and [*p*,*n*], the output matrix will have dimensions of [*m*,*n*].

* **mulMatrixByVector**(m: `Matrix`, v: `Vector`): `Vector`<br />
  Similar to matrix multiplication but the second parameter is a vector. Given a matrix with dimensions [*m*,*n*] and a vector with length *n*, the output vector will have length *m*.

* **mulMatrixRows**(m: `Matrix`, v: `Vector`): `Matrix`<br />
  Performs an *element-wise* multiplication of the vector with each row of the matrix.

* **matrixRowsToVectors**(m: `Matrix`): `Vector[]`<br />
  Creates an array of vectors corresponding to rows of the source matrix.

### Basic polynomial operations
Polynomials are `Vectors` with coefficients of the polynomial encoded in reverse order. For example, a polynomial `x^3 + 2x^2 + 3x + 4` would be encoded as `[4n, 3n, 2n, 1n]`.

These methods can be used to perform basic polynomial arithmetic:

* **addPolys**(a: `Vector`, b: `Vector`): `Vector`
* **subPolys**(a: `Vector`, b: `Vector`): `Vector`
* **mulPolys**(a: `Vector`, b: `Vector`): `Vector`
* **divPolys**(a: `Vector`, b: `Vector`): `Vector`
* **mulPolyByConstant**(p: `Vector`, c: `bigint`): `Vector`

### Polynomial evaluation and interpolation

* **evaluatePolyAt**(p: `Vector`, x: `bigint`): `bigint`<br />
  Evaluates a polynomial at the provided x-coordinate.

* **evaluatePolyAtRoots**(p: `Vector` | `Matrix`, rootsOfUnity: `Vector`): `Vector` | `Matrix`<br />
  Uses Fast Fourier Transform to evaluate polynomials at all provided roots of unity. If the first parameter is a matrix, each row of the matrix is assumed to be a polynomial, and the result will be a matrix of values.

* **interpolate**(xs: `Vector`, ys: `Vector`): `Vector`<br />
  Uses Lagrange Interpolation to compute a polynomial from the provided points (x and y coordinates).

* **interpolateRoots**(rootsOfUnity: `Vector`, ys: `Vector` | `Matrix`): `Vector` | `Matrix`<br />
  Uses Fast Fourier Transform to compute polynomials from the provided points (roots of unity are as x coordinates). If the second parameter is a matrix, each row of the matrix is assumed to be a separate set of y coordinates. In this case, a matrix will be returned with each row representing a separate polynomial.

* **interpolateQuarticBatch**(xSets: `Matrix`, ySets: `Matrix`): `Matrix`<br />
  Uses an optimized version of Lagrange Interpolation for degree 3 polynomials. x and y coordinates should be provided in matrixes with 4 values per row.

### Other miscellaneous operations

* **rand**(): `bigint`<br />
  Generate a cryptographically-secure random field element.

* **prng**(seed: `bigint` | `Buffer`, length?: `number`): `Vector` | `bigint`<br />
  Generates pseudorandom field elements from the provided seed. If the `length` parameter is provided, a sequence of elements is returned; otherwise, the returned value is a single field element.

* **getRootOfUnity**(order: `number`): `bigint`<br />
  Computes a primitive root of unity such that `root**order = 1`.

* **getPowerSeries**(base: `bigint`, length: `number`): `Vector`<br />
  Computes a series of powers for the provided base element. More specifically: `[1n, base**1, base**2, ..., base**(length - 1)]`.

## Performance
Some very informal benchmarks run on Intel Core i5-7300U @ 2.60GHz (single thread). These show approximate number of **operations/second**:

| Operation      | JS BigInt (256-bit) | JS BigInt (128-bit) | WASM (128-bit) |
| -------------- | ------------------: | ------------------: | -------------: |
| Addition       | 3,200,000           | 5,000,000           | 44,000,000     |
| Multiplication | 950,000             | 1,850,000           | 16,300,000     |
| Exponentiation | 3,200               | 10,500              | 97,000

## References

* Wikipedia article on [finite fields](https://en.wikipedia.org/wiki/Finite_field).
* Many algorithms in this library have been copied (with minimal changes) from Vitalik Buterin's [MIMC STARK project](https://github.com/ethereum/research/tree/master/mimc_stark), including: Fast Fourier Transform, Lagrange Interpolation, and Montgomery batch inversion.

# License
[MIT](/LICENSE) © 2019 Guild of Weavers