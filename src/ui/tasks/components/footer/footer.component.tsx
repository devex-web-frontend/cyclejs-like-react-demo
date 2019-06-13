import * as React from 'react';
import { createHandler, K, reduce, streamify, Streamify } from '../../../../utils/utils';
import { MouseEvent } from 'react';
import { Location } from 'history';
import { combineReader } from '@devexperts/utils/dist/adt/reader.utils';
import { LinkContainer } from '../../../ui-kit/containers/link.container';
import { Tasks } from '../../model/tasks.model';

type Props = {
	tasks: Tasks;
	location: Location;
};

const Filters = combineReader(LinkContainer, LinkContainer => () => {
	const all = LinkContainer(
		streamify({
			label: 'All',
			path: '/',
		}),
	);
	const active = LinkContainer(
		streamify({
			label: 'Active',
			path: '/active',
		}),
	);
	const completed = LinkContainer(
		streamify({
			label: 'Completed',
			path: '/completed',
		}),
	);
	const vdom = K(all.vdom, active.vdom, completed.vdom, (all, active, completed) => (
		<ul className="filters">
			<li>{all}</li>
			<li>{active}</li>
			<li>{completed}</li>
		</ul>
	));
	return { vdom };
});

export const Footer = combineReader(Filters, Filters => (props: Streamify<Props>) => {
	const active = K(props.tasks, tasks => tasks.filter(task => !task.completed).length);
	const completed = K(props.tasks, tasks => tasks.filter(task => task.completed).length);

	const handleClearCompletedClick = createHandler<MouseEvent<HTMLButtonElement>>();

	const pathname = K(props.location, location => location.pathname);
	const filters = Filters();

	const vdom = K(active, completed, pathname, filters.vdom, (active, completed, pathname, filters) => (
		<footer className="footer">
			<span className="todo-count">
				<strong>{active}</strong> item{active !== 1 ? 's' : ''} left
			</span>
			{filters}
			{completed > 0 && (
				<button className="clear-completed" onClick={handleClearCompletedClick}>
					Clear completed
				</button>
			)}
		</footer>
	));

	const value = reduce(props.tasks, handleClearCompletedClick.mapTo(tasks => tasks.filter(s => !s.completed)));

	return {
		vdom,
		value,
	};
});
