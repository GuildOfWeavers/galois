import { createPrimeField } from "../index";

const modulus128 = 2n**128n - 9n * 2n**32n + 1n; // 2n**128n - 159n
const elements = 2**4;
const f1 = createPrimeField(modulus128, false);
const f2 = createPrimeField(modulus128, true);

const v1 = f1.prng(42n, elements);
const v2 = f2.prng(42n, elements);

const b1 = v1.toBuffer(1, 2);
const b2 = v2.toBuffer(1, 2);

console.log(b1.equals(b2));