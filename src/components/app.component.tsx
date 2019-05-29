import { Form, FormValue } from './form.component';
import { Component, createValue, Empty, K, pipe, view } from '../utils';
import { map } from '@most/core';
import { Lens } from 'monocle-ts';

type State = {
	formValue: FormValue;
};

type Sink = {
	effect: void;
};

export const App: Component<Empty, Sink> = () => {
	const [setState, state] = createValue<State>({
		formValue: {
			firstName: '',
			lastName: '',
		},
	});

	const formValueView = view(state, Lens.fromProp('formValue'));

	const form = Form({
		value: formValueView.source,
	});

	const effect = pipe(
		formValueView.set(form.value),
		map(setState),
	);

	return {
		vdom: form.vdom,
		effect,
	};
};
