import { Endomorphism } from 'fp-ts/lib/function';
import { createElement, Fragment, KeyboardEvent, ReactElement } from 'react';

import {
	ProductMap,
	ProjectMany,
} from '@devexperts/utils/dist/typeclasses/product-left-coproduct-left/product-left-coproduct-left.utils';
import { isSome, Option, some, none } from 'fp-ts/lib/Option';
import xs, { MemoryStream, Stream } from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
import sampleCombine from 'xstream/extra/sampleCombine';

export type Operator<A, B> = (source: Stream<A>) => Stream<B>;

export type Streamify<O extends object> = { [K in keyof O]: Stream<O[K]> };
type Output = Streamify<{
	vdom: ReactElement;
}>;
export type Empty = Record<string, never>;

export const reduce = <A>(a: Stream<A>, ...reducers: Stream<Endomorphism<A>>[]): Stream<A> =>
	Stream.merge(...reducers)
		.compose(sampleCombine(a))
		.map(([reducer, a]) => reducer(a));

export const filterMap = <A, B>(f: (a: A) => Option<B>): Operator<A, B> => fa =>
	fa
		.map(f)
		.filter(isSome)
		.map(o => o.value);

declare module 'fp-ts/lib/HKT' {
	interface URI2HKT2<L, A> {
		Stream: Stream<A>;
	}
}

export const K: ProductMap<'Stream'> = <A, R>(...args: Array<Stream<A> | ProjectMany<A, R>>): Stream<R> => {
	const streams = args.slice(0, -1) as Stream<A>[];
	const project = args[args.length - 1] as ProjectMany<A, R>;
	return Stream.combine(...streams)
		.map(args => project(...args))
		.compose(dropRepeats());
};

export const createHandler = <A = never>(): [(a: A) => void, Stream<A>] => {
	const s = Stream.create<A>();
	const next = (a: A) => s.shamefullySendNext(a);
	return [next, s];
};

export const createValue = <A>(initial: A): [(a: A) => void, Stream<A>] => {
	const [next, s] = createHandler<A>();
	return [
		next,
		s
			.startWith(initial)
			.compose(dropRepeats())
			.remember(),
	];
};

export interface TargetKeyboardEvent<T = Element> extends KeyboardEvent<T> {
	target: EventTarget & T;
}

/**
 * Inspired by @cyclejs/state
 * @see https://github.com/cyclejs/cyclejs/blob/master/state/src/Collection.ts
 */
export const collection = <A, IR extends Output, R>(
	source: Stream<A[]>,
	Item: (props: Streamify<{ value: A }>) => IR,
	itemKey: (a: A, i: number) => string,
	collect: (outs: Stream<IR[]>) => R,
): R => {
	type State = {
		dict: Map<string, IR>;
		arr: IR[];
	};
	const state = source.fold<State>(
		(acc, nextState) => {
			const { dict } = acc;
			const nextChildren = Array<IR>(nextState.length);
			const nextKeys = new Set<string>();

			// add
			for (let i = 0, n = nextState.length; i < n; i++) {
				const key = itemKey(nextState[i], i);
				nextKeys.add(key);
				const existing = dict.get(key);
				if (typeof existing === 'undefined') {
					const child = Item({
						value: source
							.compose(
								filterMap(tasks => {
									for (let i = 0, n = tasks.length; i < n; i++) {
										const task = tasks[i];
										if (itemKey(task, i) === key) {
											return some(task);
										}
									}
									return none;
								}),
							)
							.remember(),
					});
					const vdom = child.vdom.map(vdom => createElement(Fragment, { key }, vdom));
					const result = {
						...child,
						vdom,
					};
					dict.set(key, result);
					nextChildren[i] = result;
				} else {
					nextChildren[i] = existing;
				}
			}

			// remove
			dict.forEach((_, key) => {
				if (!nextKeys.has(key)) {
					dict.delete(key);
				}
			});

			nextKeys.clear();

			return { dict, arr: nextChildren };
		},
		{ dict: new Map(), arr: [] },
	);

	return collect(state.map(state => state.arr));
};

export const pickCombine = <A, K extends keyof O, O extends { [P in K]: Stream<A> }>(key: K, empty: A) => (
	source: Stream<O[]>,
): MemoryStream<A[]> =>
	source
		.map(os => (os.length === 0 ? xs.of([empty]) : xs.combine(...os.map(o => o[key]))))
		.flatten()
		.remember();

export const pickMergeMap = <B, K extends keyof O, O extends { [P in K]: Stream<any> }>(
	key: K,
	f: (a: O[K] extends Stream<infer A> ? A : never, i: number) => B,
) => (source: Stream<O[]>): Stream<B> =>
	source.map(os => xs.merge(...os.map((o, i) => o[key].map(a => f(a, i))))).flatten();
