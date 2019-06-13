import { memo, ReactElement, useEffect, useMemo, useState, ComponentType } from 'react';
import xs from 'xstream';
import { combineReader } from '@devexperts/utils/dist/adt/reader.utils';
import { TaskListContainer } from '../../../tasks/containers/task-list.container';

export const App = combineReader(
	TaskListContainer,
	(TaskListContainer): ComponentType =>
		memo(() => {
			const [state, setState] = useState<ReactElement>();
			const taskListContainer = useMemo(() => TaskListContainer({}), [TaskListContainer]);
			useEffect(() => {
				const subscription = xs
					.merge(taskListContainer.vdom.map(setState), taskListContainer.effect)
					.subscribe({});
				return () => subscription.unsubscribe();
			}, []);
			return state || null;
		}),
);
