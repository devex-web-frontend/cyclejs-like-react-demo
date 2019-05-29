import { Component, K, pipe } from '../utils';
import { Input } from './input.component';
import * as React from 'react';
import { merge, snapshot } from '@most/core';

export type FormValue = {
	firstName: string;
	lastName: string;
};

type Props = {
	value: FormValue;
};

type Sink = {
	value: FormValue;
};

export const Form: Component<Props, Sink> = props => {
	const firstName = Input({
		value: K(props.value, v => v.firstName),
	});
	const lastName = Input({
		value: K(props.value, v => v.lastName),
	});

	const vdom = K(firstName.vdom, lastName.vdom, (firstName, lastName) => (
		<div>
			<div>First name: {firstName}</div>
			<div>Last name: {lastName}</div>
		</div>
	));

	const value = merge(
		pipe(
			firstName.value,
			snapshot((value, firstName) => ({ ...value, firstName }), props.value),
		),
		pipe(
			lastName.value,
			snapshot((value, lastName) => ({ ...value, lastName }), props.value),
		),
	);

	return {
		vdom,
		value,
	};
};
