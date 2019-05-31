import { Endomorphism, pipe as fptsPipe } from 'fp-ts/lib/function';
import { ComponentType, KeyboardEvent, memo, ReactElement, useEffect, useMemo, useState } from 'react';

import {
	ProductMap,
	ProjectMany,
} from '@devexperts/utils/dist/typeclasses/product-left-coproduct-left/product-left-coproduct-left.utils';
import { Lens } from 'monocle-ts';
import { isSome, Option } from 'fp-ts/lib/Option';
import { BehaviorSubject, combineLatest, merge, Observable, OperatorFunction, Subject } from 'rxjs';
import { distinctUntilChanged, filter, map, tap, withLatestFrom } from 'rxjs/operators';

export type Observify<O extends object> = { [K in keyof O]: Observable<O[K]> };
type Output = Observify<{
	vdom: ReactElement;
}>;
export type Empty = Record<string, never>;

export type Component<Inputs extends object = Empty, Outputs extends object = Empty> = Inputs extends Empty
	? () => Outputs extends Empty ? Output : Output & Observify<Outputs>
	: (inputs: Observify<Inputs>) => Outputs extends Empty ? Output : Output & Observify<Outputs>;

export const log = (...args: unknown[]) => <A>(fa: Observable<A>): Observable<A> =>
	fa.pipe(tap(a => console.log(a, ...args)));
export const reduce = <A>(a: Observable<A>, ...reducers: Observable<Endomorphism<A>>[]): Observable<A> =>
	merge(...reducers).pipe(
		withLatestFrom(a),
		map(([reducer, a]) => reducer(a)),
	);

export const filterMap = <A, B>(f: (a: A) => Option<B>): OperatorFunction<A, B> => fa =>
	fa.pipe(
		map(f),
		filter(isSome),
		map(option => option.value),
	);

export function toReactComponent(component: Component<Empty, { effect: void }>): ComponentType {
	return memo(() => {
		const c = useMemo(() => component(), []);
		const [state, setState] = useState<ReactElement>();
		useEffect(() => {
			const subscription = merge(c.vdom.pipe(tap(setState)), c.effect).subscribe();
			return () => subscription.unsubscribe();
		}, [c]);
		return state || null;
	});
}

declare module 'fp-ts/lib/HKT' {
	interface URI2HKT2<L, A> {
		Observable: Observable<A>;
	}
}

export const K: ProductMap<'Observable'> = <A, R>(...args: Array<Observable<A> | ProjectMany<A, R>>): Observable<R> => {
	const streams = args.slice(0, -1) as Observable<A>[];
	const project = args[args.length - 1] as ProjectMany<A, R>;
	return combineLatest(streams).pipe(
		map(args => project(...args)),
		distinctUntilChanged(),
	);
};

export const createHandler = <A = never>(): [(a: A) => void, Observable<A>] => {
	const s = new Subject<A>();
	const next = (a: A) => s.next(a);
	const a = s.asObservable();
	return [next, a];
};

export const createValue = <A>(initial: A): [(a: A) => void, Observable<A>] => {
	const s = new BehaviorSubject(initial);
	const next = (a: A) => s.next(a);
	const a = s.pipe(distinctUntilChanged());
	return [next, a];
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
export const view = <S, A>(s: Observable<S>, lens: Lens<S, A>): Lensed<Observable<S>, Observable<A>> => ({
	value: K(s, lens.get),
	set: a =>
		a.pipe(
			withLatestFrom(s),
			map(([a, s]) => lens.set(a)(s)),
			distinctUntilChanged(),
		),
});

export interface TargetKeyboardEvent<T = Element> extends KeyboardEvent<T> {
	target: EventTarget & T;
}
