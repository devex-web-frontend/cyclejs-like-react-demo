import { constant, Endomorphism, pipe as fptsPipe, Predicate, Refinement } from 'fp-ts/lib/function';
import { Scheduler, Sink, Stream } from '@most/types';
import { ComponentType, KeyboardEvent, memo, ReactElement, useEffect, useMemo, useState } from 'react';
import {
	combineArray,
	filter as mostFilter,
	map,
	merge,
	mergeArray,
	skipRepeats,
	snapshot,
	startWith,
	tap,
} from '@most/core';
import {
	ProductMap,
	ProjectMany,
} from '@devexperts/utils/dist/typeclasses/product-left-coproduct-left/product-left-coproduct-left.utils';
import { createAdapter } from '@most/adapter/dist';
import { hold } from '@most/hold';
import { Lens } from 'monocle-ts';
import { isSome, Option } from 'fp-ts/lib/Option';
import { newDefaultScheduler } from '@most/scheduler';

export type Streamify<O extends object> = { [K in keyof O]: Stream<O[K]> };
type Output = {
	vdom: Stream<ReactElement>;
};
export type Empty = Record<string, never>;

export type Component<Inputs extends object = Empty, Outputs extends object = Empty> = Inputs extends Empty
	? () => Outputs extends Empty ? Output : Output & Streamify<Outputs>
	: (inputs: Streamify<Inputs>) => Outputs extends Empty ? Output : Output & Streamify<Outputs>;

export const voidSink: Sink<void> = {
	event: () => undefined,
	end: () => undefined,
	error: (time, err) => {
		throw err;
	},
};
const runStream = (stream: Stream<unknown>, scheduler: Scheduler) => stream.run(voidSink, scheduler);

export type MostOperator<A, B> = (fa: Stream<A>) => Stream<B>;
export type MonotypeMostOperator<A> = MostOperator<A, A>;

export const log = (...args: unknown[]) => <A>(fa: Stream<A>): Stream<A> => tap(a => console.log(a, ...args))(fa);
export const reduce = <A>(a: Stream<A>, ...reducers: Stream<Endomorphism<A>>[]): Stream<A> =>
	snapshot((a, reducer) => reducer(a), a, mergeArray(reducers));
export const mapTo = <A>(a: A): MostOperator<unknown, A> => map(constant(a));
export function filter<A, B extends A>(r: Refinement<A, B>): MostOperator<A, B>;
export function filter<A>(r: Predicate<A>): MonotypeMostOperator<A>;
export function filter<A>(r: Predicate<A>): MonotypeMostOperator<A> {
	return fa => mostFilter(r, fa) as any;
}
export const filterMap = <A, B>(f: (a: A) => Option<B>): MostOperator<A, B> => fa =>
	pipe(
		fa,
		map(f),
		filter(isSome),
		map(option => option.value),
	);

export function toReactComponent(
	component: Component<Empty, { effect: void }>,
): ComponentType<{ scheduler: Scheduler }> {
	return memo(props => {
		const c = useMemo(() => component(), []);
		const [state, setState] = useState<ReactElement>();
		useEffect(() => {
			const disposable = runStream(merge(tap(setState, c.vdom), c.effect), props.scheduler);
			return () => disposable.dispose();
		}, [props.scheduler, c]);
		return state || null;
	});
}

declare module 'fp-ts/lib/HKT' {
	interface URI2HKT2<L, A> {
		Stream: Stream<A>;
	}
}

export const K: ProductMap<'Stream'> = <A, R>(...args: Array<Stream<A> | ProjectMany<A, R>>): Stream<R> => {
	const streams = args.slice(0, -1) as Stream<A>[];
	const project = args[args.length - 1] as ProjectMany<A, R>;
	return skipRepeats(combineArray(project, streams));
};

export const createValue = <A>(initial: A): [(a: A) => void, Stream<A>] => {
	const [next, local] = createAdapter<A>();
	return [next, hold(skipRepeats(startWith(initial, local)))];
};

export function pipe<A, B>(fa: A, ab: (a: A) => B): B;
export function pipe<A, B, C>(fa: A, ab: (a: A) => B, bc: (b: B) => C): C;
export function pipe<A, B, C, D>(fa: A, ab: (a: A) => B, bc: (b: B) => C, cd: (c: C) => D): D;
export function pipe<A, B, C, D, E>(fa: A, ab: (a: A) => B, bc: (b: B) => C, cd: (c: C) => D, de: (d: D) => E): E;
export function pipe<A, B, C, D, E, F>(
	fa: A,
	ab: (a: A) => B,
	bc: (b: B) => C,
	cd: (c: C) => D,
	de: (d: D) => E,
	ef: (e: E) => F,
): F;
export function pipe<A, B, C, D, E, F, G>(
	fa: A,
	ab: (a: A) => B,
	bc: (b: B) => C,
	cd: (c: C) => D,
	de: (d: D) => E,
	ef: (e: E) => F,
	fg: (f: F) => G,
): G;
export function pipe<A, B, C, D, E, F, G, H>(
	fa: A,
	ab: (a: A) => B,
	bc: (b: B) => C,
	cd: (c: C) => D,
	de: (d: D) => E,
	ef: (e: E) => F,
	fg: (f: F) => G,
	gh: (g: G) => H,
): H;
export function pipe<A, B, C, D, E, F, G, H, I>(
	fa: A,
	ab: (a: A) => B,
	bc: (b: B) => C,
	cd: (c: C) => D,
	de: (d: D) => E,
	ef: (e: E) => F,
	fg: (f: F) => G,
	gh: (g: G) => H,
	hi: (h: H) => I,
): I;
export function pipe<A, B, C, D, E, F, G, H, I, J>(
	fa: A,
	ab: (a: A) => B,
	bc: (b: B) => C,
	cd: (c: C) => D,
	de: (d: D) => E,
	ef: (e: E) => F,
	fg: (f: F) => G,
	gh: (g: G) => H,
	hi: (h: H) => I,
	ij: (i: I) => J,
): J;
export function pipe<A>(fa: A, ...operators: Array<(a: any) => any>): any {
	switch (operators.length) {
		case 0: {
			return fa;
		}
		case 1: {
			return operators[0](fa);
		}
	}
	return fptsPipe.apply(null, operators as any)(fa);
}

type Lensed<S, A> = {
	value: A;
	set: (s: A) => S;
};
export const view = <S, A>(a: Stream<S>, lens: Lens<S, A>): Lensed<Stream<S>, Stream<A>> => ({
	value: K(a, lens.get),
	set: snapshot((a, b) => lens.set(b)(a), a),
});

export interface TargetKeyboardEvent<T = Element> extends KeyboardEvent<T> {
	target: EventTarget & T;
}
