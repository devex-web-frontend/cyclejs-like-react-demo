import { Component, K, view } from '../utils';
import { Input } from './input.component';
import * as React from 'react';
import { merge } from '@most/core';
import { Lens } from 'monocle-ts';

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
	const firstNameView = view(props.value, Lens.fromProp('firstName'));
	const lastNameView = view(props.value, Lens.fromProp('lastName'));

	const firstName = Input({
		value: firstNameView.value,
	});
	const lastName = Input({
		value: lastNameView.value,
	});

	const vdom = K(firstName.vdom, lastName.vdom, (firstName, lastName) => (
		<div>
			<div>First name: {firstName}</div>
			<div>Last name: {lastName}</div>
		</div>
	));

	const value = merge(firstNameView.set(firstName.value), lastNameView.set(lastName.value));

	return {
		vdom,
		value,
	};
};
