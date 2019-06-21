import { Endomorphism, Predicate, Refinement } from 'fp-ts/lib/function';

export function filter<A, B extends A>(p: Refinement<A, B>): (as: A[]) => B[];
export function filter<A>(p: Predicate<A>): Endomorphism<A[]>;
export function filter<A>(p: Predicate<A>): Endomorphism<A[]> {
	return as => {
		let changed = false;
		const n = as.length;
		const result = [];
		let j = 0;
		for (let i = 0; i < n; i++) {
			const a = as[i];
			if (p(a)) {
				result[j++] = a;
			} else {
				changed = true;
			}
		}
		return changed ? result : as;
	};
}
