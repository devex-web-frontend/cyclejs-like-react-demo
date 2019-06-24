import { constVoid, Endomorphism } from 'fp-ts/lib/function';
import { createElement, Fragment, KeyboardEvent, ReactElement } from 'react';

import {
	ProductMap,
	ProjectMany,
} from '@devexperts/utils/dist/typeclasses/product-left-coproduct-left/product-left-coproduct-left.utils';
import { isSome, Option } from 'fp-ts/lib/Option';
import { map as recordMap } from 'fp-ts/lib/Record';
import { Reader } from 'fp-ts/lib/Reader';
import { JSONFromString as IOTSJSONFromString, JSONType } from 'io-ts-types/lib/JSON/JSONFromString';
import { Type } from 'io-ts';
import { Stream } from '@most/types';
import {
	map,
	mergeArray,
	now,
	snapshot,
	filter,
	combineArray,
	skipRepeats,
	startWith,
	scan,
	multicast,
	switchLatest,
	tap,
	runEffects,
	until,
} from '@most/core';
import { pipe } from './pipe.utils';
import { createAdapter } from '@most/adapter/dist';
import { newDefaultScheduler } from '@most/scheduler';
import { hold } from './hold.utils';

export type Operator<A, B> = (source: Stream<A>) => Stream<B>;

export type Streamify<O extends object> = { [K in keyof O]: Stream<O[K]> };
export const streamify = <O extends object>(obj: O): Streamify<O> => recordMap(obj, now) as any;

export const reduce = <A>(a: Stream<A>, ...reducers: Stream<Endomorphism<A>>[]): Stream<A> =>
	pipe(
		mergeArray(reducers),
		snapshot((a, reducer) => reducer(a), a),
		multicast,
	);

export const filterMap = <A, B>(f: (a: A) => Option<B>): Operator<A, B> => fa =>
	pipe(
		fa,
		map(f),
		filter(isSome), // lacks signature for refinement
		map(o => (o as any).value),
		multicast,
	);

declare module 'fp-ts/lib/HKT' {
	interface URI2HKT2<L, A> {
		Stream: Stream<A>;
	}
}

export const K: ProductMap<'Stream'> = <A, R>(...args: Array<Stream<A> | ProjectMany<A, R>>): Stream<R> => {
	const streams = args.slice(0, -1) as Stream<A>[];
	const project = args[args.length - 1] as ProjectMany<A, R>;
	return pipe(
		combineArray(project, streams),
		skipRepeats,
		hold,
	);
};

export interface Handler<A> extends Stream<A> {
	(a: A): void;
}

const functionKeys: PropertyKey[] = Object.getOwnPropertyNames(Object.getPrototypeOf(constVoid));
export const createHandler = <A = never>(): Handler<A> => {
	const [next, source] = createAdapter<A>();
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
		pipe(
			handler,
			startWith(initial),
			skipRepeats,
			hold,
		),
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
	const state = pipe(
		source,
		scan<A[], State>(
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
						const vdom = pipe(
							child.vdom,
							map(vdom => createElement(Fragment, { key }, vdom)),
							multicast,
						);
						const reducers: Stream<Endomorphism<A[]>>[] = [];
						if (child.destroy) {
							reducers.push(
								pipe(
									child.destroy,
									map(() => (as: A[]) => as.filter((a, i) => itemKey(a, i) !== key)),
									multicast,
								),
							);
						}
						if (child.value) {
							reducers.push(
								pipe(
									child.value,
									map(value => (as: A[]) => as.map((a, i) => (itemKey(a, i) === key ? value : a))),
									multicast,
								),
							);
						}
						const result = {
							child: {
								...child,
								vdom,
							},
							nextValue: setChildValue,
							reducers: mergeArray(reducers),
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
		),
	);

	const vdom = pipe(
		state,
		map(state =>
			state.result.length === 0
				? now<ReactElement[]>([])
				: combineArray((...args) => args, state.result.map(o => o.vdom)),
		),
		switchLatest,
		multicast,
	);

	const reducers = pipe(
		state,
		map(state => {
			const entries = Array.from(state.storage);
			return mergeArray(entries.map(([id, entry]) => entry.reducers));
		}),
		switchLatest,
		multicast,
	);

	return {
		vdom,
		reducers,
	};
};

export type First<A extends [any, ...any[]]> = A extends [infer F, ...any[]] ? F : never;
export type ReaderValueType<R extends Reader<any, any>> = R extends Reader<any, infer A> ? A : never;

export const JSONFromString: Type<JSONType, string, string> = IOTSJSONFromString as any;

const scheduler = newDefaultScheduler();
export const run = <A>(source: Stream<A>): (() => void) => {
	const [dispose, disposed] = createAdapter<void>();
	runEffects(
		pipe(
			source,
			until(disposed),
		),
		scheduler,
	);
	return () => dispose();
};

export const debug = <A>(source: Stream<A>, ...args: any[]) =>
	run(
		pipe(
			source,
			tap(a => console.log(...args, a)),
			multicast,
		),
	);
