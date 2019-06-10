import { Endomorphism } from 'fp-ts/lib/function';
import { ComponentType, KeyboardEvent, memo, ReactElement, useEffect, useMemo, useState } from 'react';

import {
	ProductMap,
	ProjectMany,
} from '@devexperts/utils/dist/typeclasses/product-left-coproduct-left/product-left-coproduct-left.utils';
import { isSome, Option } from 'fp-ts/lib/Option';
import { Stream } from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
import sampleCombine from 'xstream/extra/sampleCombine';

export type Operator<A, B> = (source: Stream<A>) => Stream<B>;

export type Streamify<O extends object> = { [K in keyof O]: Stream<O[K]> };
type Output = Streamify<{
	vdom: ReactElement;
}>;
export type Empty = Record<string, never>;

export type Component<Inputs extends object = Empty, Outputs extends object = Empty> = Inputs extends Empty
	? () => Outputs extends Empty ? Output : Output & Streamify<Outputs>
	: (inputs: Streamify<Inputs>) => Outputs extends Empty ? Output : Output & Streamify<Outputs>;

export const reduce = <A>(a: Stream<A>, ...reducers: Stream<Endomorphism<A>>[]): Stream<A> =>
	Stream.merge(...reducers)
		.compose(sampleCombine(a))
		.map(([reducer, a]) => reducer(a));

export const filterMap = <A, B>(f: (a: A) => Option<B>): Operator<A, B> => fa =>
	fa
		.map(f)
		.filter(isSome)
		.map(o => o.value);

export function toReactComponent(component: Component<Empty, { effect: void }>): ComponentType {
	return memo(() => {
		const c = useMemo(() => component(), []);
		const [state, setState] = useState<ReactElement>();
		useEffect(() => {
			const subscription = Stream.merge(c.vdom.map(setState), c.effect).subscribe({});
			return () => subscription.unsubscribe();
		}, [c]);
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
