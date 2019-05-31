import { Form, FormValue } from '../../../../components/form.component';
import { Component, createValue, Empty, K, log, pipe, view, voidSink } from '../../../../utils';
import { map, merge, mergeArray, now } from '@most/core';
import { Lens } from 'monocle-ts';

/**
 *     <link rel="stylesheet" href="../node_modules/todomvc-common/base.css">
 <link rel="stylesheet" href="../node_modules/todomvc-app-css/index.css">
 */
import 'todomvc-common/base.css';
import 'todomvc-app-css/index.css';
import * as React from 'react';
import { Header } from '../header/header.component';
import { Main } from '../main/main.component';
import { Footer } from '../footer/footer.component';
import { TaskValue } from '../../../task/components/task/task.component';
import { constVoid } from 'fp-ts/lib/function';
import { newDefaultScheduler } from '@most/scheduler';
import { hold } from '@most/hold';

type State = {
	formValue: FormValue;
};

type Sink = {
	effect: void;
};

const tasks: TaskValue[] = [
	{
		completed: false,
		editing: false,
		title: 'foo',
	},
	{
		completed: false,
		editing: false,
		title: 'bla',
	},
];

export const App: Component<Empty, Sink> = () => {
	const [setState, state] = createValue<State>({
		formValue: {
			firstName: '',
			lastName: '',
		},
	});
	const [setTasks, tasksValue] = createValue(tasks);

	const formValueView = view(state, Lens.fromProp('formValue'));

	const form = Form({
		value: formValueView.value,
	});

	const header = Header();

	const main = Main({
		tasks: tasksValue,
	});
	const footer = Footer();
	const vdom = K(header.vdom, main.vdom, footer.vdom, (header, main, footer) => (
		<div>
			{header}
			{main}
			{footer}
		</div>
	));

	const stateEffect = pipe(
		formValueView.set(form.value),
		map(setState),
	);

	const tasksEffect = pipe(
		main.value,
		map(setTasks),
	);

	const effect = mergeArray([stateEffect, tasksEffect]);

	return {
		vdom,
		effect,
	};
};
