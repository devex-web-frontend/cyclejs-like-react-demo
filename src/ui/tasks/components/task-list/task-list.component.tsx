import { debug, K, Streamify } from '../../../../utils/utils';

import 'todomvc-common/base.css';
import 'todomvc-app-css/index.css';
import * as React from 'react';
import { Header } from '../header/header.component';
import { Main } from '../main/main.component';
import { Footer } from '../footer/footer.component';
import { Location } from 'history';
import { combineReader } from '@devexperts/utils/dist/adt/reader.utils';
import { getActive, getCompleted, Tasks } from '../../model/tasks.model';
import merge from 'callbag-merge';

type Props = {
	location: Location;
	tasks: Tasks;
};

export const TaskList = combineReader(Footer, Footer => (props: Streamify<Props>) => {
	const { location, tasks } = props;

	const active = K(tasks, getActive);
	const completed = K(tasks, getCompleted);

	const filtered = K(tasks, active, completed, location, (tasks, active, completed, location) => {
		switch (location.pathname) {
			case '/active': {
				return active;
			}
			case '/completed': {
				return completed;
			}
			default: {
				return tasks;
			}
		}
	});
	const header = Header({ tasks });

	const main = Main({ tasks, filtered });

	const activeCount = K(active, active => active.length);
	const completedCount = K(completed, completed => completed.length);
	const footer = Footer({ tasks, location, activeCount, completedCount });

	const vdom = K(header.vdom, main.vdom, footer.vdom, (header, main, footer) => (
		<div className={'todoapp'}>
			{header}
			{main}
			{footer}
		</div>
	));

	const value = merge(main.value, header.value, footer.value);

	return {
		vdom,
		value,
	};
});
