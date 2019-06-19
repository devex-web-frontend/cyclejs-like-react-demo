import { Endomorphism } from 'fp-ts/lib/function';
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
import pipe from 'callbag-pipe';
import merge from 'callbag-merge';
import latest from 'callbag-latest';
import sampleCombine from 'callbag-sample-combine';
import { Source, START as Start, END as End, DATA as Data, Sink, Callbag } from 'callbag';
import map from 'callbag-map';
import filter from 'callbag-filter';
import combine from 'callbag-combine';
import dropRepeats from 'callbag-drop-repeats';
import makeSubject from 'callbag-subject';
import startWith from 'callbag-start-with';
import scan from 'callbag-scan';
import flatten from 'callbag-flatten';
import { History, Location } from 'history';
import tap from 'callbag-tap';
import makeBehaviorSubject from 'callbag-behavior-subject';

export const of = <A>(a: A): Source<A> => makeBehaviorSubject(a);

export type Operator<A, B> = (source: Source<A>) => Source<B>;

export type Streamify<O extends object> = { [K in keyof O]: Source<O[K]> };
export const streamify = <O extends object>(obj: O): Streamify<O> => recordMap(obj, a => store(of(a))) as any;

export const reduce = <A>(a: Source<A>, ...reducers: Source<Endomorphism<A>>[]): Source<A> =>
	pipe(
		merge(...reducers),
		sampleCombine(latest(a)),
		map(([reducer, a]) => reducer(a)),
		store,
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
					map(args => {
						return project(...args);
					}),
			  ),
		dropRepeats(),
	);
};

export interface Handler<A> {
	(a: A): void;
	readonly source: Source<A>;
}

export const createHandler = <A = never>(): Handler<A> => {
	const source = makeSubject<A>();
	const next = (a: A) => source(1, a);
	(next as any)['source'] = store(source);
	return next as any;
};

export const createValue = <A>(initial: A): [(a: A) => void, Source<A>] => {
	const subject = makeBehaviorSubject(initial);
	const next = (a: A) => subject(1, a);
	return [
		next,
		pipe(
			subject,
			dropRepeats(),
		),
	];
};

export interface TargetKeyboardEvent<T = Element> extends KeyboardEvent<T> {
	target: EventTarget & T;
}

type ChildInput<A> = {
	value: Source<A>;
};

type ChildOutput<A> = {
	vdom: Source<ReactElement>;
	value?: Source<A>;
	destroy?: Source<void>;
};

type CollectionOutput<A> = {
	vdom: Source<ReactElement[]>;
	reducers: Source<Endomorphism<A[]>>;
};

/**
 * Inspired by @cyclejs/state
 * @see https://github.com/cyclejs/cyclejs/blob/master/state/src/Collection.ts
 */
export const collection = <A, R>(
	source: Source<A[]>,
	Item: (props: ChildInput<A>) => ChildOutput<A>,
	itemKey: (a: A, i: number) => string,
): CollectionOutput<A> => {
	type Stored = {
		nextValue: (a: A) => void;
		child: ChildOutput<A>;
		reducers: Source<Endomorphism<A[]>>;
	};

	type State = {
		storage: Map<string, Stored>;
		result: ChildOutput<A>[];
	};

	const initial: State = {
		storage: new Map(),
		result: [],
	};
	const state: Source<State> = pipe(
		source,
		scan((acc, nextState) => {
			const { storage } = acc;
			acc.result = Array<ChildOutput<A>>(nextState.length);
			const nextKeys = new Set<string>();

			// add
			for (let i = 0, n = nextState.length; i < n; i++) {
				const nextValue = nextState[i];
				const key = itemKey(nextValue, i);
				nextKeys.add(key);
				const existing = storage.get(key);
				if (typeof existing === 'undefined') {
					const [setChildValue, value] = createValue(nextValue);
					const child = Item({ value });
					const vdom = pipe(
						child.vdom,
						map(vdom => createElement(Fragment, { key }, vdom)),
						store,
					);
					const reducers: Source<Endomorphism<A[]>>[] = [];
					if (child.destroy) {
						reducers.push(
							pipe(
								child.destroy,
								map(() => (as: A[]) => as.filter((a, i) => itemKey(a, i) !== key)),
							),
						);
					}
					if (child.value) {
						reducers.push(
							pipe(
								child.value,
								map(value => (as: A[]) => as.map((a, i) => (itemKey(a, i) === key ? value : a))),
							),
						);
					}
					const result = {
						child: {
							...child,
							vdom,
						},
						nextValue: setChildValue,
						reducers: merge(...reducers),
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
		}, initial),
		store,
	);

	const vdom = pipe(
		state,
		map(state => (state.result.length === 0 ? of<ReactElement[]>([]) : combine(...state.result.map(o => o.vdom)))),
		flatten,
		store,
	);

	const reducers = pipe(
		state,
		map(state => {
			const entries = Array.from(state.storage.entries());
			return merge(...entries.map(([id, entry]) => entry.reducers));
		}),
		flatten,
		store,
	);

	return {
		vdom,
		reducers,
	};
};

export type First<A extends [any, ...any[]]> = A extends [infer F, ...any[]] ? F : never;
export type ReaderValueType<R extends Reader<any, any>> = R extends Reader<any, infer A> ? A : never;

export const JSONFromString: Type<JSONType, string, string> = IOTSJSONFromString as any;

export const START: Start = 0;
export const DATA: Data = 1;
export const END: End = 2;
type Action = Start | Data | End;

export const fromHistory = (history: History): Source<Location<unknown>> =>
	store((start: Start | Data | End, sink: Sink<Location<unknown>>) => {
		if (start !== START) {
			return;
		}
		let disposed = false;

		sink(START, (action: Action) => {
			if (action !== END) {
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
	});

export const debug = <A>(source: Source<A>, ...args: any[]): (() => void) =>
	run(
		pipe(
			source,
			tap(a => console.log(...args, a)),
		),
	);

export const run = <A>(source: Source<A>): (() => void) => {
	let talkback: Source<A> | undefined = undefined;
	source(START, (t: Action, d?: Source<A> | A) => {
		if (isStart(t, d)) {
			talkback = d;
		}
		if (isEnd(t, d)) {
			talkback = undefined;
		}
	});
	return () => {
		if (talkback) {
			talkback(END);
			talkback = undefined;
		}
	};
};

export const log = (...args: any[]) => <A>(source: Source<A>): Source<A> => tap(a => console.log(...args, a))(source);

function isStart<I, O>(action: Action, data?: I | Callbag<O, I>): data is Callbag<O, I> {
	return action === START && typeof data !== 'undefined';
}

function isData<I, O>(action: Action, data?: I | Callbag<O, I>): data is I {
	return action === DATA;
}

function isEnd<I, O>(action: Action, data?: I | Callbag<O, I>): data is I | undefined {
	return action === END;
}

export const store = <A>(source: Source<A>): Source<A> => {
	const sinks: Sink<A>[] = [];
	let value: A | undefined = undefined;
	let hasValue = false;
	let sourceTalkback: Source<A> | undefined = undefined;
	return (t: Action, d: Sink<A>) => {
		if (isStart(t, d)) {
			const sink = d;

			const sinkTalkback = (t: Action, d?: Sink<A>) => {
				if (isEnd(t, d)) {
					// sink unsubscribed - remove it from storage
					const index = sinks.indexOf(sink);
					if (index > -1) {
						sinks.splice(index, 1);
					}
					if (sinks.length === 0) {
						// no sinks left - unsubscribe from source
						sourceTalkback && sourceTalkback(END, d);
					}
					return;
				} else {
					sourceTalkback && sourceTalkback(t as any, d);
				}
			};

			// store new sink
			sinks.push(sink);

			if (sinks.length === 1) {
				// start listening to the source
				source(START, (t: Action, d?: A | Source<A>) => {
					if (isStart(t, d)) {
						// source initialized
						sourceTalkback = d;
						// listen to the sink
						sink(START, sinkTalkback);
						// immediately send stored value to sink
						if (hasValue) {
							sink(DATA, value!);
						}
					} else if (isData(t, d)) {
						// source pushed data
						value = d;
						hasValue = true;
						// broadcast data to sinks
						for (const sink of sinks.slice()) {
							sink(DATA, d);
						}
					} else if (isEnd(t, d)) {
						// source terminated
						// broadcast termination to sinks
						for (const sink of sinks.slice()) {
							sink(END, d);
						}
						// cleanup
						sourceTalkback = undefined;
						value = undefined;
						hasValue = false;
						// remove all store sinks
						sinks.length = 0;
					}
				});
			} else {
				// source should be already initialized
				// just listen to new sink
				sink(START, sinkTalkback);
				// immediately send stored value to new sink
				if (hasValue) {
					sink(DATA, value!);
				}
			}
		}
	};
};
