import { constVoid, Endomorphism } from 'fp-ts/lib/function';
import { createElement, Fragment, KeyboardEvent, ReactElement } from 'react';

import {
	ProductMap,
	ProjectMany,
} from '@devexperts/utils/dist/typeclasses/product-left-coproduct-left/product-left-coproduct-left.utils';
import { isSome, Option } from 'fp-ts/lib/Option';
import xs, { Stream, MemoryStream } from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
import sampleCombine from 'xstream/extra/sampleCombine';
import { map } from 'fp-ts/lib/Record';
import { Reader } from 'fp-ts/lib/Reader';
import { JSONFromString as IOTSJSONFromString, JSONType } from 'io-ts-types/lib/JSON/JSONFromString';
import { Type } from 'io-ts';

export type Operator<A, B> = (source: Stream<A>) => Stream<B>;

export type Streamify<O extends object> = { [K in keyof O]: Stream<O[K]> };
export const streamify = <O extends object>(obj: O): Streamify<O> => map(obj, xs.of) as any;

export const reduce = <A>(a: Stream<A>, ...reducers: Stream<Endomorphism<A>>[]): Stream<A> =>
	xs
		.merge(...reducers)
		.compose(sampleCombine(a))
		.map(([reducer, a]) => reducer(a));

export const filterMap = <A, B>(f: (a: A) => Option<B>): Operator<A, B> => fa =>
	fa
		.map(f)
		.filter(isSome)
		.map(o => o.value);

export const tap = <A>(f: (a: A) => void): Operator<A, A> => fa =>
	fa.map(a => {
		f(a);
		return a;
	});

declare module 'fp-ts/lib/HKT' {
	interface URI2HKT2<L, A> {
		Stream: Stream<A>;
	}
}

export const K: ProductMap<'Stream'> = <A, R>(...args: Array<Stream<A> | ProjectMany<A, R>>): MemoryStream<R> => {
	const streams = args.slice(0, -1) as Stream<A>[];
	const project = args[args.length - 1] as ProjectMany<A, R>;
	return xs
		.combine(...streams)
		.map(args => project(...args))
		.compose(dropRepeats())
		.remember();
};

export interface Handler<A> extends Stream<A> {
	(a: A): void;
}

const functionKeys: PropertyKey[] = Object.getOwnPropertyNames(Object.getPrototypeOf(constVoid));
export const createHandler = <A = never>(): Handler<A> => {
	const source = xs.create<A>();
	const next = (a: A) => source.shamefullySendNext(a);
	return new Proxy(next, {
		get(target, key) {
			return ((functionKeys.includes(key) ? next : source) as any)[key];
		},
	}) as any;
};

export const createValue = <A>(initial: A): [(a: A) => void, Stream<A>] => {
	const handler = createHandler<A>();
	return [
		handler,
		handler
			.startWith(initial)
			.compose(dropRepeats())
			.remember(),
	];
};

export interface TargetKeyboardEvent<T = Element> extends KeyboardEvent<T> {
	target: EventTarget & T;
}

type ChildInputs<A> = {
	value: Stream<A>;
};

type ChildOutput<A> = {
	vdom: Stream<ReactElement>;
	value?: Stream<A>;
	destroy?: Stream<void>;
};

type CollectionOutput<A> = {
	vdom: Stream<ReactElement[]>;
	reducers: Stream<Endomorphism<A[]>>;
};

/**
 * Inspired by @cyclejs/state
 * @see https://github.com/cyclejs/cyclejs/blob/master/state/src/Collection.ts
 */
export const collection = <A, O extends ChildOutput<A>, R>(
	source: Stream<A[]>,
	Item: (props: ChildInputs<A>) => O,
	itemKey: (a: A, i: number) => string,
): CollectionOutput<A> => {
	type Stored = {
		nextValue: (a: A) => void;
		child: O;
		reducers: Stream<Endomorphism<A[]>>;
	};
	type State = {
		storage: Map<string, Stored>;
		result: O[];
	};
	const state = source.fold<State>(
		(acc, nextState) => {
			const { storage } = acc;
			acc.result = Array<O>(nextState.length);
			const nextKeys = new Set<string>();

			// add
			for (let i = 0, n = nextState.length; i < n; i++) {
				const nextValue = nextState[i];
				const key = itemKey(nextValue, i);
				nextKeys.add(key);
				const existing = storage.get(key);
				if (typeof existing === 'undefined') {
					const [setChildValue, value] = createValue<A>(nextValue);
					const child = Item({ value });
					const vdom = child.vdom.map(vdom => createElement(Fragment, { key }, vdom));
					const reducers: Stream<Endomorphism<A[]>>[] = [];
					if (child.destroy) {
						reducers.push(child.destroy.map(() => (as: A[]) => as.filter((a, i) => itemKey(a, i) !== key)));
					}
					if (child.value) {
						reducers.push(
							child.value.map(value => (as: A[]) =>
								as.map((a, i) => (itemKey(a, i) === key ? value : a)),
							),
						);
					}
					const result = {
						child: {
							...child,
							vdom,
						},
						nextValue: setChildValue,
						reducers: xs.merge(...reducers),
					};
					storage.set(key, result);
					acc.result[i] = result.child;
				} else {
					existing.nextValue(nextValue);
					acc.result[i] = existing.child;
				}
			}

			// remove
			storage.forEach((_, key) => {
				if (!nextKeys.has(key)) {
					storage.delete(key);
				}
			});

			nextKeys.clear();

			return acc;
		},
		{ storage: new Map(), result: [] },
	);

	const vdom = state
		.map(state =>
			state.result.length === 0 ? xs.of<ReactElement[]>([]) : xs.combine(...state.result.map(o => o.vdom)),
		)
		.flatten();

	const reducers = state
		.map(state => {
			const entries = Array.from(state.storage);
			return xs.merge(...entries.map(([id, entry]) => entry.reducers));
		})
		.flatten();

	return {
		vdom,
		reducers,
	};
};

export type First<A extends [any, ...any[]]> = A extends [infer F, ...any[]] ? F : never;
export type ReaderValueType<R extends Reader<any, any>> = R extends Reader<any, infer A> ? A : never;

export const JSONFromString: Type<JSONType, string, string> = IOTSJSONFromString as any;
