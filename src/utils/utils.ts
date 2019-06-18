import { Endomorphism } from 'fp-ts/lib/function';
import { createElement, Fragment, KeyboardEvent, ReactElement } from 'react';

import {
	ProductMap,
	ProjectMany,
} from '@devexperts/utils/dist/typeclasses/product-left-coproduct-left/product-left-coproduct-left.utils';
import { isSome, Option, some, none } from 'fp-ts/lib/Option';
import { map as recordMap } from 'fp-ts/lib/Record';
import { Reader } from 'fp-ts/lib/Reader';
import { JSONFromString as IOTSJSONFromString, JSONType } from 'io-ts-types/lib/JSON/JSONFromString';
import { Type } from 'io-ts';
import of from 'callbag-of';
import pipe from 'callbag-pipe';
import merge from 'callbag-merge';
import latest from 'callbag-latest';
import sampleCombine from 'callbag-sample-combine';
import { Source, START as Start, END as End, DATA as Data } from 'callbag';
import map from 'callbag-map';
import filter from 'callbag-filter';
import combine from 'callbag-combine';
import dropRepeats from 'callbag-drop-repeats';
import makeSubject from 'callbag-subject';
import startWith from 'callbag-start-with';
import remember from 'callbag-remember';
import scan from 'callbag-scan';
import flatten from 'callbag-flatten';
import { History, Location } from 'history';
import share from 'callbag-share';

export type Operator<A, B> = (source: Source<A>) => Source<B>;

export type Streamify<O extends object> = { [K in keyof O]: Source<O[K]> };
export const streamify = <O extends object>(obj: O): Streamify<O> => recordMap(obj, a => remember(of(a))) as any;

type Output = Streamify<{
	vdom: ReactElement;
}>;

export const reduce = <A>(a: Source<A>, ...reducers: Source<Endomorphism<A>>[]): Source<A> =>
	pipe(
		merge(...reducers),
		sampleCombine(latest(a)),
		map(([reducer, a]) => reducer(a)),
		remember,
	);

export const filterMap = <A, B>(f: (a: A) => Option<B>): Operator<A, B> => fa =>
	pipe(
		fa,
		map(f),
		filter(isSome),
		map(o => o.value),
	);

declare module 'fp-ts/lib/HKT' {
	interface URI2HKT2<L, A> {
		Source: Source<A>;
	}
}

export const K: ProductMap<'Source'> = <A, R>(...args: Array<Source<A> | ProjectMany<A, R>>): Source<R> => {
	const streams = args.slice(0, -1) as Source<A>[];
	const project = args[args.length - 1] as ProjectMany<A, R>;

	return pipe(
		streams.length === 1
			? pipe(
					streams[0],
					map(project),
			  )
			: pipe(
					combine(...streams),
					map(args => project(...args)),
			  ),
		dropRepeats(),
		remember,
	);
};

export interface Handler<A> {
	(a: A): void;
	readonly source: Source<A>;
}

export const createHandler = <A = never>(): Handler<A> => {
	const source = makeSubject<A>();
	const next = (a: A) => source(1, a);
	(next as any)['source'] = share(source);
	return next as any;
};

export const createValue = <A>(initial: A): [(a: A) => void, Source<A>] => {
	const subject = makeSubject<A>();
	const next = (a: A) => subject(1, a);
	return [
		next,
		pipe(
			subject as any,
			startWith(initial),
			dropRepeats(),
			remember,
		),
	];
};

export interface TargetKeyboardEvent<T = Element> extends KeyboardEvent<T> {
	target: EventTarget & T;
}

/**
 * Inspired by @cyclejs/state
 * @see https://github.com/cyclejs/cyclejs/blob/master/state/src/Collection.ts
 */
export const collection = <A, O extends Output, R>(
	source: Source<A[]>,
	Item: (props: Streamify<{ value: A }>) => O,
	itemKey: (a: A, i: number) => string,
	collect: (outs: Source<O[]>) => R,
): R => {
	type State = {
		storage: Map<string, O>;
		result: O[];
	};
	const initial: State = {
		storage: new Map(),
		result: [],
	};
	const state: Source<State> = pipe(
		source,
		scan((acc, nextState) => {
			const { storage } = acc;
			acc.result = Array<O>(nextState.length);
			const nextKeys = new Set<string>();

			// add
			for (let i = 0, n = nextState.length; i < n; i++) {
				const key = itemKey(nextState[i], i);
				nextKeys.add(key);
				const existing = storage.get(key);
				if (typeof existing === 'undefined') {
					const child = Item({
						value: pipe(
							source,
							filterMap(tasks => {
								for (let i = 0, n = tasks.length; i < n; i++) {
									const task = tasks[i];
									if (itemKey(task, i) === key) {
										return some(task);
									}
								}
								return none;
							}),
							remember,
						),
					});
					const vdom = pipe(
						child.vdom,
						map(vdom => createElement(Fragment, { key }, vdom)),
					);
					const result = {
						...child,
						vdom,
					};
					storage.set(key, result);
					acc.result[i] = result;
				} else {
					acc.result[i] = existing;
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
		}, initial),
	);

	return collect(
		pipe(
			state,
			map(state => state.result),
		),
	);
};

export type StreamValueType<S extends Source<any>> = S extends Source<infer A> ? A : never;

export const pickCombineAll = <K extends keyof O, O extends { [P in K]: Source<any> }>(key: K) => (
	source: Source<O[]>,
): Source<StreamValueType<O[K]>[]> =>
	pipe(
		source,
		map(os => (os.length === 0 ? of<[StreamValueType<O[K]>[]]>([]) : combine(...os.map(o => o[key])))),
		flatten,
	);

export const pickMergeMapAll = <B, K extends keyof O, O extends { [P in K]: Source<any> }>(
	key: K,
	f: (a: StreamValueType<O[K]>, i: number) => B,
) => (source: Source<O[]>): Source<B> =>
	pipe(
		source,
		map(os =>
			merge(
				...os.map((o, i) =>
					pipe(
						o[key],
						map(a => f(a, i)),
					),
				),
			),
		),
		flatten,
	);

export type First<A extends [any, ...any[]]> = A extends [infer F, ...any[]] ? F : never;
export type ReaderValueType<R extends Reader<any, any>> = R extends Reader<any, infer A> ? A : never;

export const JSONFromString: Type<JSONType, string, string> = IOTSJSONFromString as any;

export const START: Start = 0;
export const DATA: Data = 1;
export const END: End = 2;

export const fromHistory = (history: History): Source<Location<unknown>> => (start: Start | Data | End, sink: any) => {
	if (start !== START) {
		return;
	}
	let disposed = false;

	sink(START, (t: End | Start | Data) => {
		if (t !== END) {
			return;
		}
		disposed = true;
		teardown();
	});

	if (disposed) {
		return;
	}

	const teardown = history.listen(location => sink(DATA, location));

	sink(DATA, history.location);
};

export const debug = <A>(source: Source<A>, ...args: any[]): (() => void) => {
	source(START, (t: number, data: unknown) => t === DATA && console.log(data, ...args));
	return () => source(END);
};
