import { Form, FormValue } from './form.component';
import { Component, createValue, Empty, K, pipe } from '../utils';
import { snapshot } from '@most/core';

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

	const form = Form({
		value: K(state, state => state.formValue),
	});

	const effect = pipe(
		form.value,
		snapshot((state, formValue) => setState({ ...state, formValue }), state),
	);

	return {
		vdom: form.vdom,
		effect,
	};
};
