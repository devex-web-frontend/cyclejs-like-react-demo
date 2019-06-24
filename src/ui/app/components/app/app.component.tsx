import { memo, ReactElement, useEffect, useMemo, useState, ComponentType } from 'react';
import { combineReader } from '@devexperts/utils/dist/adt/reader.utils';
import { TaskListContainer } from '../../../tasks/containers/task-list.container';
import { run } from '../../../../utils/utils';
import { merge, tap } from '@most/core';
import { pipe } from '../../../../utils/pipe.utils';

export const App = combineReader(
	TaskListContainer,
	(TaskListContainer): ComponentType =>
		memo(() => {
			const [state, setState] = useState<ReactElement>();
			const taskListContainer = useMemo(() => TaskListContainer({}), []);
			useEffect(
				() =>
					run(
						merge(
							pipe(
								taskListContainer.vdom,
								tap(setState),
							),
							taskListContainer.effect,
						),
					),
				[taskListContainer.effect, taskListContainer.vdom],
			);
			return state || null;
		}),
);
